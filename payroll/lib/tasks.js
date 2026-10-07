import { prisma } from "./prisma";
import {
  buildTaskSelect,
  getTasksForUserWithClient,
  isValidTaskStatus as isValidTaskStatusValue,
  normalizeTaskStatusValue as normalizeTaskStatusValueValue,
} from "./tasks-core.mjs";

function buildAssignableEmployeesWhere(user) {
  if (user?.role === "admin") {
    return {
      role: {
        not: "admin",
      },
    };
  }

  if (user?.role === "manager") {
    return {
      managerId: user.id,
      role: {
        not: "admin",
      },
    };
  }

  return null;
}

export async function getAssignableEmployees(user) {
  const where = buildAssignableEmployeesWhere(user);
  if (!where) {
    return [];
  }

  return prisma.employee.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      designation: true,
      managerId: true,
    },
  });
}

export async function getTasksForUser(user, filters = {}, client = prisma) {
  return getTasksForUserWithClient(client, user, filters);
}

export async function getTaskById(id) {
  return prisma.task.findUnique({
    where: { id },
    select: buildTaskSelect(),
  });
}

export function parseTaskDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeTaskStatusValue(status) {
  return normalizeTaskStatusValueValue(status);
}

export function isTaskOverdue(task, referenceDate = new Date()) {
  if (!task?.dueDate) {
    return false;
  }

  if (normalizeTaskStatusValue(task.status) === "confirmed") {
    return false;
  }

  const dueDate = new Date(task.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  const endOfDay = new Date(dueDate);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime() < referenceDate.getTime();
}

export function formatTaskStatusLabel(status) {
  const normalized = normalizeTaskStatusValue(status);

  if (!normalized) {
    return "-";
  }

  return normalized
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getTaskStatusBadgeClass(status) {
  switch (normalizeTaskStatusValue(status)) {
    case "pending":
      return "border-sage/30 bg-sage/10 text-lavender";
    case "in_progress":
      return "border-royal-purple/30 bg-royal-purple/10 text-lavender";
    case "submitted":
      return "border-eminence/30 bg-eminence/10 text-lavender";
    case "confirmed":
      return "border-royal-purple/35 bg-royal-purple/15 text-lavender";
    default:
      return "border-sage/30 bg-sage/10 text-lavender";
  }
}

export function isValidTaskStatus(status) {
  return isValidTaskStatusValue(status);
}

export function taskSelect() {
  return buildTaskSelect();
}
