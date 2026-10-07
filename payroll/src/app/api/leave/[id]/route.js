import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../../lib/auth";
import { getLeaveRequestById } from "../../../../../lib/leave";
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";

export async function PUT(request, context) {
  const user = getAuthUser(request);
  if (!user || (user.role !== "manager" && user.role !== "admin")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const params = await Promise.resolve(context?.params);
    const id = Number(params?.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ message: "Invalid leave id." }, { status: 400 });
    }

    const body = await request.json();
    const status = typeof body?.status === "string" ? body.status : "";

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { message: "Status must be approved or rejected." },
        { status: 400 }
      );
    }

  const leaveRequest = await getLeaveRequestById(id);
  if (!leaveRequest) {
    return NextResponse.json(
      { message: "Leave request not found." },
      { status: 404 }
    );
  }

  if (leaveRequest.status !== "pending") {
    return NextResponse.json(
      { message: "This leave request has already been actioned." },
      { status: 409 }
    );
  }

  if (user.role === "manager") {
    if (leaveRequest.employee.managerId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }

  const result = await prisma.leaveRequest.updateMany({
    where: {
      id,
      status: "pending",
    },
    data: {
      status,
      approvedById: user.id,
    },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { message: "This leave request has already been actioned." },
      { status: 409 }
    );
  }

  const updated = await getLeaveRequestById(id);

  return NextResponse.json({ leaveRequest: updated });
  } catch {
    return NextResponse.json(
      { message: "Unable to update leave request." },
      { status: 500 }
    );
  }
}
