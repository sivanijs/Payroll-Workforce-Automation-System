function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function getTodayRange(date = new Date()) {
  const start = startOfDay(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export function formatTime(date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function sortAttendanceByDateDesc(records) {
  return [...records].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
  );
}

export function pickAttendanceRecord(records) {
  const sortedRecords = sortAttendanceByDateDesc(records);

  const openRecord = sortedRecords.find(
    (record) => record.checkIn != null && record.checkOut == null
  );
  if (openRecord) {
    return openRecord;
  }

  const unstartedRecord = sortedRecords.find((record) => record.checkIn == null);
  if (unstartedRecord) {
    return unstartedRecord;
  }

  return (
    sortedRecords.find(
      (record) => record.checkIn != null && record.checkOut != null
    ) || null
  );
}

function buildWorkingHours(checkIn, checkOut) {
  return Number(((checkOut.getTime() - checkIn.getTime()) / 3600000).toFixed(2));
}

export async function processAttendanceScan({ prisma, employeeId, now = new Date() }) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, name: true },
  });

  if (!employee) {
    return {
      status: 404,
      body: { message: "Employee not found." },
    };
  }

  const { start, end } = getTodayRange(now);
  const todayAttendanceRecords = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: {
        gte: start,
        lt: end,
      },
    },
    orderBy: [{ date: "desc" }],
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

  const attendanceRecord = pickAttendanceRecord(todayAttendanceRecords);

  if (!attendanceRecord) {
    const created = await prisma.attendance.create({
      data: {
        employeeId,
        date: start,
        checkIn: now,
        status: "present",
      },
    });

    return {
      status: 200,
      body: {
        message: `${employee.name} checked in at ${formatTime(created.checkIn)}`,
        action: "check-in",
        attendance: created,
      },
    };
  }

  if (attendanceRecord.checkIn == null) {
    const updated = await prisma.attendance.update({
      where: { id: attendanceRecord.id },
      data: {
        checkIn: now,
        checkOut: null,
        workingHours: null,
        status: "present",
      },
    });

    return {
      status: 200,
      body: {
        message: `${employee.name} checked in at ${formatTime(updated.checkIn)}`,
        action: "check-in",
        attendance: updated,
      },
    };
  }

  if (attendanceRecord.checkOut == null) {
    const checkOut = now;
    const workingHours = buildWorkingHours(attendanceRecord.checkIn, checkOut);

    const updated = await prisma.attendance.update({
      where: { id: attendanceRecord.id },
      data: {
        checkOut,
        workingHours,
        status: "completed",
      },
    });

    return {
      status: 200,
      body: {
        message: `${employee.name} checked out at ${formatTime(checkOut)}. Working hours: ${workingHours}`,
        action: "check-out",
        attendance: updated,
      },
    };
  }

  return {
    status: 400,
    body: { message: "This employee has already checked out today." },
  };
}
