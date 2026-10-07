import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../../lib/auth";
import { canReviewTask, canStartOrSubmitTask } from "../../../../../lib/task-actions-core.mjs";
import { getTaskById, parseTaskDate, taskSelect } from "../../../../../lib/tasks";
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseId(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildTaskResponse(task) {
  return {
    task,
  };
}

export async function PATCH(request, context) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const params = await Promise.resolve(context?.params);
    const id = parseId(params?.id);
    if (!id) {
      return NextResponse.json({ message: "Invalid task id." }, { status: 400 });
    }

    const task = await getTaskById(id);
    if (!task) {
      return NextResponse.json({ message: "Task not found." }, { status: 404 });
    }

    const body = await request.json();
    const action = normalizeText(body?.action);
    const comment = normalizeText(body?.comment);
    const nextStatus = normalizeText(body?.nextStatus);

    if (!action) {
      return NextResponse.json(
        { message: "An action is required." },
        { status: 400 }
      );
    }

    const isTaskCreator = task.assignedById === user.id;
    const isAdminUser = user.role === "admin";

    if (action === "start" || action === "submit") {
      if (!canStartOrSubmitTask(user, task)) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }

      if (action === "start") {
        if (task.status !== "pending") {
          return NextResponse.json(
            { message: "Only pending tasks can be marked in progress." },
            { status: 400 }
          );
        }
      } else if (!["pending", "in_progress"].includes(task.status)) {
        return NextResponse.json(
          { message: "Only pending or in-progress tasks can be submitted." },
          { status: 400 }
        );
      }

      const updated = await prisma.task.update({
        where: { id },
        data: {
          status: action === "start" ? "in_progress" : "submitted",
          completedAt: action === "submit" ? new Date() : null,
          confirmedAt: null,
          reviewedAt: null,
          reviewedById: null,
          reviewAction: null,
          reviewComment: null,
        },
        select: taskSelect(),
      });

      return NextResponse.json(buildTaskResponse(updated));
    }

    if (action === "confirm" || action === "reject") {
      if (!canReviewTask(user, task)) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }

      if (task.status !== "submitted") {
        return NextResponse.json(
          { message: "Only submitted tasks can be reviewed." },
          { status: 400 }
        );
      }

      if (action === "confirm") {
        const updated = await prisma.task.update({
          where: { id },
          data: {
            status: "confirmed",
            confirmedAt: new Date(),
            reviewedAt: new Date(),
            reviewedById: user.id,
            reviewAction: null,
            reviewComment: null,
          },
          select: taskSelect(),
        });

        return NextResponse.json(buildTaskResponse(updated));
      }

      const reopenedStatus = nextStatus === "in_progress" ? "in_progress" : "pending";
      const updated = await prisma.task.update({
        where: { id },
        data: {
          status: reopenedStatus,
          completedAt: null,
          confirmedAt: null,
          reviewedAt: new Date(),
          reviewedById: user.id,
          reviewAction: reopenedStatus === "in_progress" ? "reopened" : "rejected",
          reviewComment: comment || null,
        },
        select: taskSelect(),
      });

      return NextResponse.json(buildTaskResponse(updated));
    }

    if (action === "update_due_date") {
      if (!canReviewTask(user, task)) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }

      const dueDate = parseTaskDate(body?.dueDate);
      const updated = await prisma.task.update({
        where: { id },
        data: {
          dueDate,
        },
        select: taskSelect(),
      });

      return NextResponse.json(buildTaskResponse(updated));
    }

    return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { message: "Unable to update task." },
      { status: 500 }
    );
  }
}
