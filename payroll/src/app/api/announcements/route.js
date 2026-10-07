import { NextResponse } from "next/server";
import { getAuthUser, isAdmin, isManager } from "../../../../lib/auth";
import { getVisibleAnnouncementsForUser } from "../../../../lib/announcements";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const announcements = await getVisibleAnnouncementsForUser(user);
  return NextResponse.json({ announcements });
}

export async function POST(request) {
  const user = getAuthUser(request);
  if (!user || (!isAdmin(user) && !isManager(user))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { message: "Announcement message is required." },
        { status: 400 }
      );
    }

    const scope = isAdmin(user) ? "company" : "team";

    const announcement = await prisma.announcement.create({
      data: {
        message,
        postedById: user.id,
        scope,
      },
      select: {
        id: true,
        message: true,
        scope: true,
        createdAt: true,
        postedBy: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Unable to post announcement." },
      { status: 500 }
    );
  }
}
