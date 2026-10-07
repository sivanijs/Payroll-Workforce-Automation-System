import { prisma } from "./prisma";

function getTodayBounds(dateValue) {
  const base = dateValue ? new Date(dateValue) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function parseDateValue(dateValue) {
  if (!dateValue) {
    return null;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function buildDateWindow(filters) {
  const date = parseDateValue(filters?.date);
  const startDate = parseDateValue(filters?.startDate);
  const endDate = parseDateValue(filters?.endDate);

  if (!date && !startDate && !endDate) {
    return null;
  }

  const start = startDate || date || endDate;
  const end = endDate || date || startDate || start;

  if (!start || !end) {
    return null;
  }

  if (start > end) {
    return { start: end, end: start };
  }

  return { start, end };
}

function getDateKey(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDatesInWindow(start, end) {
  const dates = [];

  for (
    const current = new Date(start);
    current <= end;
    current.setDate(current.getDate() + 1)
  ) {
    dates.push(new Date(current));
  }

  return dates;
}

function formatDisplayDate(value) {
  return value.toLocaleDateString("en-IN");
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function buildAttendanceBadgeClass(status) {
  switch (normalizeStatus(status)) {
    case "present":
    case "completed":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
    case "late":
      return "border-amber-400/30 bg-amber-400/10 text-amber-100";
    case "absent":
      return "border-rose-400/30 bg-rose-400/10 text-rose-100";
    default:
      return "border-sage/30 bg-sage/10 text-lavender";
  }
}

function formatStatusLabel(status) {
  const normalized = normalizeStatus(status);

  if (!normalized) {
    return "-";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

async function getScopedEmployees(user, employeeName) {
  const normalizedEmployeeName = employeeName?.trim();
  const where = {};

  if (normalizedEmployeeName) {
    where.name = {
      contains: normalizedEmployeeName,
    };
  }

  if (user?.role === "manager") {
    where.managerId = user.id;
  } else if (user?.role === "employee") {
    where.id = user.id;
  } else if (user?.role !== "admin") {
    return [];
  }

  return prisma.employee.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      managerId: true,
      role: true,
    },
  });
}

function buildAttendanceRows({ employees, attendanceRecords, dates }) {
  const attendanceByKey = new Map(
    attendanceRecords.map((record) => [
      `${record.employeeId}-${getDateKey(new Date(record.date))}`,
      record,
    ])
  );

  const rows = [];

  for (const date of dates) {
    const dateKey = getDateKey(date);

    for (const employee of employees) {
      const record = attendanceByKey.get(`${employee.id}-${dateKey}`);

      if (record) {
        rows.push({
          ...record,
          employee,
        });
        continue;
      }

      rows.push({
        id: `absent-${employee.id}-${dateKey}`,
        employeeId: employee.id,
        date: new Date(date),
        checkIn: null,
        checkOut: null,
        workingHours: null,
        status: "absent",
        employee,
      });
    }
  }

  rows.sort((left, right) => {
    const dateDiff = right.date.getTime() - left.date.getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }

    return left.employee.name.localeCompare(right.employee.name);
  });

  return rows;
}

export async function getAttendanceRecordsForUser(user, filters = {}) {
  const { employeeName, status } = filters;
  const normalizedStatus = normalizeStatus(status);
  const dateWindow = buildDateWindow(filters);

  if (!dateWindow) {
    const where = {};
    const normalizedEmployeeName = employeeName?.trim();
    const dateFilter = buildDateFilter(filters.date);

    if (dateFilter) {
      where.date = dateFilter;
    }

    if (normalizedStatus) {
      where.status = status?.trim();
    }

    if (normalizedEmployeeName) {
      where.employee = {
        name: {
          contains: normalizedEmployeeName,
        },
      };
    }

    if (user?.role === "admin") {
      // no extra restriction
    } else if (user?.role === "manager") {
      where.employee = {
        ...(where.employee || {}),
        managerId: user.id,
      };
    } else if (user?.role === "employee") {
      where.employeeId = user.id;
    } else {
      return [];
    }

    return prisma.attendance.findMany({
      where,
      orderBy: [{ date: "desc" }, { checkIn: "desc" }],
      select: {
        id: true,
        employeeId: true,
        date: true,
        checkIn: true,
        checkOut: true,
        workingHours: true,
        status: true,
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            managerId: true,
          },
        },
      },
    });
  }

  const employees = await getScopedEmployees(user, employeeName);
  if (!employees.length) {
    return [];
  }

  const startExclusive = new Date(dateWindow.end);
  startExclusive.setDate(startExclusive.getDate() + 1);

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      employeeId: {
        in: employees.map((employee) => employee.id),
      },
      date: {
        gte: dateWindow.start,
        lt: startExclusive,
      },
    },
    orderBy: [{ date: "asc" }, { checkIn: "asc" }],
    select: {
      id: true,
      employeeId: true,
      date: true,
      checkIn: true,
      checkOut: true,
      workingHours: true,
      status: true,
    },
  });

  const dates = getDatesInWindow(dateWindow.start, dateWindow.end);
  let rows = buildAttendanceRows({
    employees,
    attendanceRecords,
    dates,
  });

  if (normalizedStatus) {
    rows = rows.filter(
      (record) => normalizeStatus(record.status) === normalizedStatus
    );
  }

  return rows;
}

function buildDateFilter(dateValue) {
  if (!dateValue) {
    return null;
  }

  const { start, end } = getTodayBounds(dateValue);
  return {
    gte: start,
    lt: end,
  };
}

export function formatDateOnly(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : formatDisplayDate(date);
}

export function formatTimeOnly(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
}

export function getAttendanceStatusBadgeClass(status) {
  return buildAttendanceBadgeClass(status);
}

export function formatAttendanceStatusLabel(status) {
  return formatStatusLabel(status);
}
