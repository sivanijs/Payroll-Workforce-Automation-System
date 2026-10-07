import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import { processAttendanceScan } from "../../../../../lib/attendance-scan.mjs";

export const runtime = "nodejs";

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const employeeId = Number(body?.employeeId);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return NextResponse.json(
        { message: "A valid employeeId is required." },
        { status: 400 }
      );
    }

    if (user.id !== employeeId) {
      return NextResponse.json(
        {
          message:
            "This QR code doesn't belong to your account. Please scan your own QR code.",
        },
        { status: 403 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true },
    });

    if (!employee) {
      return NextResponse.json(
        { message: "Employee not found." },
        { status: 404 }
      );
    }

    const result = await processAttendanceScan({
      prisma,
      employeeId,
      now: new Date(),
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to process attendance scan." },
      { status: 500 }
    );
  }
}
