import { prisma } from "./prisma";
import { calculateNetSalary } from "./payrollMath";

function getMonthBounds(month, year) {
  const start = new Date(year, month - 1, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(year, month, 1);
  end.setHours(0, 0, 0, 0);

  return { start, end };
}

function countExpectedWorkingDays(month, year) {
  const { start, end } = getMonthBounds(month, year);
  let days = 0;

  for (let current = new Date(start); current < end; current.setDate(current.getDate() + 1)) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      days += 1;
    }
  }

  return days;
}

async function getTaxRateForAnnualIncome(annualIncome) {
  const slab = await prisma.taxSlab.findFirst({
    where: {
      minIncome: {
        lte: annualIncome,
      },
      OR: [
        {
          maxIncome: {
            gte: annualIncome,
          },
        },
        {
          maxIncome: {
            equals: 999999999,
          },
        },
      ],
    },
    orderBy: {
      minIncome: "desc",
    },
    select: {
      taxRate: true,
    },
  });

  return slab?.taxRate ?? 0;
}

export async function calculatePayroll(employee, month, year) {
  const grossSalary = Number(
    (employee.basicSalary + employee.hra + employee.allowance).toFixed(2)
  );
  const expectedWorkingDays = countExpectedWorkingDays(month, year);
  const { start, end } = getMonthBounds(month, year);

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      employeeId: employee.id,
      date: {
        gte: start,
        lt: end,
      },
      checkIn: {
        not: null,
      },
      checkOut: {
        not: null,
      },
    },
    select: {
      workingHours: true,
    },
  });

  const accountedDays = attendanceRecords.filter((record) => {
    const workingHours = Number(record.workingHours || 0);
    return workingHours >= 0.0166;
  }).length;

  const absentDays = Math.max(expectedWorkingDays - accountedDays, 0);
  const annualIncome = grossSalary * 12;
  const taxRate = await getTaxRateForAnnualIncome(annualIncome);
  const annualTax = annualIncome * (taxRate / 100);
  const tax = Number((annualTax / 12).toFixed(2));
  const pf = Number((employee.basicSalary * 0.12).toFixed(2));
  const absenceDeduction =
    expectedWorkingDays > 0
      ? Number(((grossSalary / expectedWorkingDays) * absentDays).toFixed(2))
      : 0;
  const netSalary = calculateNetSalary(grossSalary, pf, tax);

  return {
    grossSalary,
    expectedWorkingDays,
    accountedDays,
    absentDays,
    taxRate,
    pf,
    tax,
    absenceDeduction,
    netSalary,
  };
}

export function getMonthRange(month, year) {
  return getMonthBounds(month, year);
}
