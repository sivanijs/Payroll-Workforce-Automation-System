import { prisma } from "./prisma";
import { calculateNetSalary } from "./payrollMath";

export async function getOwnPayslips(user) {
  if (!user?.id) {
    return [];
  }

  const payslips = await prisma.payslip.findMany({
    where: {
      employeeId: user.id,
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { id: "desc" }],
    select: {
      id: true,
      employeeId: true,
      month: true,
      year: true,
      grossSalary: true,
      pf: true,
      tax: true,
      netSalary: true,
      createdAt: true,
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
          role: true,
        },
      },
    },
  });

  return payslips.map((payslip) => ({
    ...payslip,
    netSalary: calculateNetSalary(payslip.grossSalary, payslip.pf, payslip.tax),
  }));
}

export function getAbsenceDeductionFromPayslip(payslip) {
  const grossSalary = Number(payslip.grossSalary || 0);
  const pf = Number(payslip.pf || 0);
  const tax = Number(payslip.tax || 0);
  const netSalary = calculateNetSalary(grossSalary, pf, tax);

  return Number((grossSalary - pf - tax - netSalary).toFixed(2));
}

export function getMonthLabel(month, year) {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}
