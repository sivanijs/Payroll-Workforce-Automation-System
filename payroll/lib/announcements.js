import { prisma } from "./prisma";

function normalizeAnnouncement(announcement) {
  return {
    ...announcement,
    postedBy: announcement.postedBy
      ? {
          name: announcement.postedBy.name,
          role: announcement.postedBy.role,
        }
      : null,
  };
}

export function formatRelativeTime(value, now = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString("en-IN");
}

export async function getVisibleAnnouncementsForUser(user) {
  if (!user) {
    return [];
  }

  if (user.role === "admin") {
    const announcements = await prisma.announcement.findMany({
      where: {
        scope: {
          in: ["company", "team"],
        },
      },
      orderBy: { createdAt: "desc" },
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

    return announcements.map(normalizeAnnouncement);
  }

  if (user.role === "manager") {
    const announcements = await prisma.announcement.findMany({
      where: {
        postedById: user.id,
      },
      orderBy: { createdAt: "desc" },
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

    return announcements.map(normalizeAnnouncement);
  }

  if (user.role === "employee") {
    const employee = await prisma.employee.findUnique({
      where: { id: user.id },
      select: { managerId: true },
    });

    const managerId = employee?.managerId;
    const where = {
      OR: [
        { scope: "company" },
        ...(managerId ? [{ scope: "team", postedById: managerId }] : []),
      ],
    };

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

    return announcements.map(normalizeAnnouncement);
  }

  return [];
}
