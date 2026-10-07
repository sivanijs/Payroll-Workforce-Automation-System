import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/auth";
import { getOwnPayslips } from "../../../../lib/payslip";

export const runtime = "nodejs";

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payslips = await getOwnPayslips(user);
  return NextResponse.json({ payslips });
}
