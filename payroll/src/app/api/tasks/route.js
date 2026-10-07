import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/auth";
import {
  getAssignableEmployees,
  getTasksForUser,
  parseTaskDate,
  taskSelect,
} from "../../../../lib/tasks";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseId(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters = {
    employeeId: searchParams.get("employeeId") || undefined,
    managerId: searchParams.get("managerId") || undefined,
    status: searchParams.get("status") || undefined,
    dueDate: searchParams.get("dueDate") || undefined,
  };

  if (user.role === "manager" && filters.employeeId) {
    const employeeId = parseId(filters.employeeId);
    if (!employeeId) {
      return NextResponse.json({ tasks: [] });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, managerId: true },
    });

    if (!employee || employee.managerId !== user.id) {
      return NextResponse.json({ tasks: [] });
    }
  }

  const tasks = await getTasksForUser(user, filters);
  return NextResponse.json({ tasks });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const title = normalizeText(body?.title);
    const description = normalizeText(body?.description);
    const assignedToId = parseId(body?.assignedToId);
    const dueDate = parseTaskDate(body?.dueDate);

    if (!title || !assignedToId) {
      return NextResponse.json(
        { message: "Title and assignee are required." },
        { status: 400 }
      );
    }

    const assignableEmployees = await getAssignableEmployees(user);
    const targetEmployee = assignableEmployees.find(
      (employee) => employee.id === assignedToId
    );

    if (!targetEmployee) {
      return NextResponse.json(
        { message: "You can only assign tasks to employees in your scope." },
        { status: 403 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        assignedToId: targetEmployee.id,
        assignedById: user.id,
        dueDate,
        status: "pending",
      },
      select: taskSelect(),
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Unable to create task." },
      { status: 500 }
    );
  }
}
