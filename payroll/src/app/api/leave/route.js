import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/auth";
import {
  createLeaveRequest,
  getLeaveRequestsForUser,
  parseLeaveDateRange,
} from "../../../../lib/leave";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const leaveRequests = await getLeaveRequestsForUser(user);
  return NextResponse.json({ leaveRequests });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user || user.role !== "employee") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const ranges = parseLeaveDateRange(body?.fromDate, body?.toDate);

    if (!reason || !ranges) {
      return NextResponse.json(
        { message: "fromDate, toDate, and reason are required." },
        { status: 400 }
      );
    }

    if (ranges.to < ranges.from) {
      return NextResponse.json(
        { message: "toDate must be the same as or after fromDate." },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!employee) {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 });
    }

    const leaveRequest = await createLeaveRequest(
      user.id,
      ranges.from,
      ranges.to,
      reason
    );

    return NextResponse.json({ leaveRequest }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Unable to submit leave request." },
      { status: 500 }
    );
  }
}
