import { NextResponse } from "next/server";
import { getAuthProfile } from "../../../../../lib/auth";

export const runtime = "nodejs";

export async function GET(request) {
  const user = await getAuthProfile(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
  });
}
