import { prisma } from "./prisma";

const leaveRequestSelect = {
  id: true,
  employeeId: true,
  fromDate: true,
  toDate: true,
  reason: true,
  status: true,
  approvedById: true,
  employee: {
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      managerId: true,
    },
  },
  approvedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
};

function withActionedBy(leaveRequest) {
  if (!leaveRequest) {
    return leaveRequest;
  }

  return {
    ...leaveRequest,
    actionedBy: leaveRequest.approvedBy
      ? {
          id: leaveRequest.approvedBy.id,
          name: leaveRequest.approvedBy.name,
          role: leaveRequest.approvedBy.role,
        }
      : null,
  };
}

function getDateRange(dateValue) {
  const base = dateValue ? new Date(dateValue) : null;
  if (!base || Number.isNaN(base.getTime())) {
    return null;
  }

  const start = new Date(base);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN");
}

export async function getLeaveRequestsForUser(user) {
  if (!user?.role) {
    return [];
  }

  if (user.role === "admin") {
    return getAllLeaveRequests();
  }

  const where = {};

  if (user.role === "employee") {
    where.employeeId = user.id;
  } else if (user.role === "manager") {
    where.employee = {
      managerId: user.id,
    };
  }

  const leaveRequests = await prisma.leaveRequest.findMany({
    where,
    orderBy: { id: "desc" },
    select: leaveRequestSelect,
  });

  return leaveRequests.map(withActionedBy);
}

export async function getAllLeaveRequests() {
  const leaveRequests = await prisma.leaveRequest.findMany({
    orderBy: { id: "desc" },
    select: leaveRequestSelect,
  });

  return leaveRequests.map(withActionedBy);
}

export async function createLeaveRequest(employeeId, fromDate, toDate, reason) {
  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      employeeId,
      fromDate,
      toDate,
      reason,
      status: "pending",
    },
    select: leaveRequestSelect,
  });

  return withActionedBy(leaveRequest);
}

export async function getLeaveRequestById(id) {
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    select: leaveRequestSelect,
  });

  return withActionedBy(leaveRequest);
}

export function parseLeaveDateRange(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return null;
  }

  return { from, to };
}
