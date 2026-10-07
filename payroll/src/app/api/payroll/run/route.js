import { NextResponse } from "next/server";
import { getAuthUser, isAdmin } from "../../../../../lib/auth";
import { calculatePayroll } from "../../../../../lib/payrollCalculator";
import { calculateNetSalary } from "../../../../../lib/payrollMath";
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";

function parseMonthYear(body) {
  const month = Number(body?.month);
  const year = Number(body?.year);

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year) ||
    year < 2000
  ) {
    return null;
  }

  return { month, year };
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!isAdmin(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const monthYear = parseMonthYear(body);

    if (!monthYear) {
      return NextResponse.json(
        { message: "Valid month and year are required." },
        { status: 400 }
      );
    }

    const employees = await prisma.employee.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        basicSalary: true,
        hra: true,
        allowance: true,
      },
    });

    const summary = [];

    for (const employee of employees) {
      const existingPayslip = await prisma.payslip.findFirst({
        where: {
          employeeId: employee.id,
          month: monthYear.month,
          year: monthYear.year,
        },
        select: {
          grossSalary: true,
          pf: true,
          tax: true,
          netSalary: true,
        },
      });

      if (existingPayslip) {
        const correctedNetSalary = calculateNetSalary(
          existingPayslip.grossSalary,
          existingPayslip.pf,
          existingPayslip.tax
        );

        if (Number(existingPayslip.netSalary || 0) !== correctedNetSalary) {
          await prisma.payslip.update({
            where: { id: existingPayslip.id },
            data: {
              netSalary: correctedNetSalary,
            },
          });
        }

        summary.push({
          employeeId: employee.id,
          name: employee.name,
          designation: employee.designation,
          status: "skipped",
          netSalary: correctedNetSalary,
          grossSalary: existingPayslip.grossSalary,
          pf: existingPayslip.pf,
          tax: existingPayslip.tax,
        });
        continue;
      }

      const payroll = await calculatePayroll(employee, monthYear.month, monthYear.year);
      const payslip = await prisma.payslip.create({
        data: {
          employeeId: employee.id,
          month: monthYear.month,
          year: monthYear.year,
          grossSalary: payroll.grossSalary,
          pf: payroll.pf,
          tax: payroll.tax,
          netSalary: payroll.netSalary,
        },
      });

      summary.push({
        employeeId: employee.id,
        name: employee.name,
        designation: employee.designation,
        status: "created",
        netSalary: payslip.netSalary,
        grossSalary: payslip.grossSalary,
        pf: payslip.pf,
        tax: payslip.tax,
      });
    }

    return NextResponse.json({
      message: "Payroll run completed.",
      month: monthYear.month,
      year: monthYear.year,
      summary,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to run payroll." },
      { status: 500 }
    );
  }
}
