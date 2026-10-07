import { NextResponse } from "next/server";
import { getAuthUser, isAdmin } from "../../../../../lib/auth";
import { groupPayslipBatches } from "../../../../../lib/dashboard";

export const runtime = "nodejs";

export async function GET(request) {
  const user = getAuthUser(request);
  if (!isAdmin(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const history = await groupPayslipBatches();
    return NextResponse.json({ history });
  } catch {
    return NextResponse.json(
      { message: "Unable to load payroll history." },
      { status: 500 }
    );
  }
}
