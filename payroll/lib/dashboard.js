import { prisma } from "./prisma";
import { getOwnPayslips } from "./payslip";
import { calculateNetSalary } from "./payrollMath";

const DEFAULT_ANNUAL_LEAVE_DAYS = 12;

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function getTodayRange(date = new Date()) {
  const start = startOfDay(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function toDateFilter(range) {
  return {
    gte: range.start,
    lt: range.end,
  };
}

function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

function getYearRange(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear() + 1, 0, 1);
  return { start, end };
}

function getDateOverlapDays(fromDate, toDate, rangeStart, rangeEnd) {
  const start = new Date(Math.max(new Date(fromDate).getTime(), rangeStart.getTime()));
  const end = new Date(Math.min(new Date(toDate).getTime(), new Date(rangeEnd.getTime() - 1).getTime()));

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  const startDay = startOfDay(start);
  const endDay = startOfDay(end);
  return Math.floor((endDay.getTime() - startDay.getTime()) / 86400000) + 1;
}

export function formatMonthYear(month, year) {
  if (!month || !year) {
    return "-";
  }

  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

export async function groupPayslipBatches() {
  const payslips = await prisma.payslip.findMany({
    select: {
      month: true,
      year: true,
      employeeId: true,
      grossSalary: true,
      pf: true,
      tax: true,
      netSalary: true,
      createdAt: true,
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
  });

  const grouped = new Map();

  for (const payslip of payslips) {
    const key = `${payslip.year}-${payslip.month}`;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        month: payslip.month,
        year: payslip.year,
        employeeIds: new Set([payslip.employeeId]),
        totalNetSalary: calculateNetSalary(
          payslip.grossSalary,
          payslip.pf,
          payslip.tax
        ),
        latestCreatedAt: payslip.createdAt,
      });
      continue;
    }

    existing.employeeIds.add(payslip.employeeId);
    existing.totalNetSalary += calculateNetSalary(
      payslip.grossSalary,
      payslip.pf,
      payslip.tax
    );
    if (payslip.createdAt > existing.latestCreatedAt) {
      existing.latestCreatedAt = payslip.createdAt;
    }
  }

  return Array.from(grouped.values()).map((batch) => ({
    month: batch.month,
    year: batch.year,
    employeeCount: batch.employeeIds.size,
    totalNetSalary: batch.totalNetSalary,
    latestCreatedAt: batch.latestCreatedAt,
  }));
}

export async function getLatestPayrollBatch() {
  const batches = await groupPayslipBatches();
  return batches[0] || null;
}

export async function getAdminDashboardData() {
  const todayRange = getTodayRange();
  const [totalEmployees, todaysAttendanceCount, pendingFallbackLeaves, latestPayrollBatch] =
    await Promise.all([
      prisma.employee.count(),
      prisma.attendance.count({
        where: {
          date: toDateFilter(todayRange),
        },
      }),
      prisma.leaveRequest.count({
        where: {
          status: "pending",
          employee: {
            managerId: null,
          },
        },
      }),
      getLatestPayrollBatch(),
    ]);

  return {
    totalEmployees,
    todaysAttendanceCount,
    pendingFallbackLeaves,
    latestPayrollBatch,
  };
}

export async function getManagerDashboardData(managerId) {
  const todayRange = getTodayRange();
  const [teamSize, todaysTeamAttendanceCount, pendingTeamLeaves] = await Promise.all([
    prisma.employee.count({
      where: {
        managerId,
      },
    }),
    prisma.attendance.count({
      where: {
        date: toDateFilter(todayRange),
        employee: {
          managerId,
        },
      },
    }),
    prisma.leaveRequest.count({
      where: {
        status: "pending",
        employee: {
          managerId,
        },
      },
    }),
  ]);

  return {
    teamSize,
    todaysTeamAttendanceCount,
    pendingTeamLeaves,
  };
}

export async function getEmployeeDashboardData(employeeId) {
  const now = new Date();
  const todayRange = getTodayRange(now);
  const monthRange = getMonthRange(now);
  const yearRange = getYearRange(now);

  const [employee, todayAttendance, monthAttendanceCount, approvedLeaves, payslips] =
    await Promise.all([
      prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
          role: true,
          managerId: true,
        },
      }),
      prisma.attendance.findFirst({
        where: {
          employeeId,
          date: toDateFilter(todayRange),
        },
        select: {
          status: true,
          checkIn: true,
          checkOut: true,
        },
        orderBy: { date: "desc" },
      }),
      prisma.attendance.count({
        where: {
          employeeId,
          date: toDateFilter(monthRange),
          status: {
            in: ["present", "completed"],
          },
        },
      }),
      prisma.leaveRequest.findMany({
        where: {
          employeeId,
          status: "approved",
          fromDate: {
            lt: yearRange.end,
          },
          toDate: {
            gte: yearRange.start,
          },
        },
        select: {
          fromDate: true,
          toDate: true,
        },
      }),
      getOwnPayslips({ id: employeeId }),
    ]);

  const leaveDaysUsed = approvedLeaves.reduce(
    (total, leave) =>
      total +
      getDateOverlapDays(leave.fromDate, leave.toDate, yearRange.start, yearRange.end),
    0
  );

  const latestPayslip = payslips[0] || null;

  return {
    employee,
    todayAttendance,
    monthAttendanceCount,
    leaveBalance: Math.max(0, DEFAULT_ANNUAL_LEAVE_DAYS - leaveDaysUsed),
    latestPayslip,
  };
}
