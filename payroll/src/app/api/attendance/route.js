import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/auth";
import { getAttendanceRecordsForUser } from "../../../../lib/attendance";

export const runtime = "nodejs";

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const employeeName = searchParams.get("employeeName") || undefined;
  const status = searchParams.get("status") || undefined;

  const attendance = await getAttendanceRecordsForUser(user, {
    date,
    startDate,
    endDate,
    employeeName,
    status,
  });

  return NextResponse.json({ attendance });
}
