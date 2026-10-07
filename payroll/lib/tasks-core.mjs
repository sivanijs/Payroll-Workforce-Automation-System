export const TASK_STATUSES = new Set(["pending", "in_progress", "submitted", "confirmed"]);

function parseDateValue(dateValue) {
  if (!dateValue) {
    return null;
  }

  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDayRange(dateValue) {
  const base = parseDateValue(dateValue);
  if (!base) {
    return null;
  }

  const start = new Date(base);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

export function normalizeTaskStatusValue(status) {
  return normalizeStatus(status);
}

export function buildTaskSelect() {
  return {
    id: true,
    title: true,
    description: true,
    assignedToId: true,
    assignedById: true,
    dueDate: true,
    status: true,
    completedAt: true,
    confirmedAt: true,
    reviewedAt: true,
    reviewedById: true,
    reviewAction: true,
    reviewComment: true,
    createdAt: true,
    updatedAt: true,
    assignedTo: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        managerId: true,
      },
    },
    assignedBy: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
    reviewedBy: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
  };
}

export function buildTaskWhere(user, filters = {}) {
  const where = {};

  if (user?.role === "employee") {
    where.assignedToId = user.id;
  } else if (user?.role === "manager") {
    // Managers need to see both tasks assigned to them and tasks they created
    // for their team, so the list stays inclusive when an admin assigns work.
    where.OR = [{ assignedToId: user.id }, { assignedById: user.id }];
  } else if (user?.role !== "admin") {
    return null;
  }

  const employeeId = Number(filters.employeeId);
  if (Number.isInteger(employeeId) && employeeId > 0) {
    where.assignedToId = employeeId;
  }

  const managerId = Number(filters.managerId);
  if (Number.isInteger(managerId) && managerId > 0) {
    where.assignedById = managerId;
  }

  const normalizedStatus = normalizeStatus(filters.status);
  if (normalizedStatus && TASK_STATUSES.has(normalizedStatus)) {
    where.status = normalizedStatus;
  }

  const dueDateRange = getDayRange(filters.dueDate);
  if (dueDateRange) {
    where.dueDate = {
      gte: dueDateRange.start,
      lt: dueDateRange.end,
    };
  }

  return where;
}

export function isValidTaskStatus(status) {
  return TASK_STATUSES.has(normalizeStatus(status));
}

export async function getTasksForUserWithClient(client, user, filters = {}) {
  const where = buildTaskWhere(user, filters);
  if (!where) {
    return [];
  }

  return client.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    select: buildTaskSelect(),
  });
}
