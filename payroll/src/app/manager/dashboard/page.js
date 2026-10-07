import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthUser, isManager } from "../../../../lib/auth";
import DashboardFrame from "../../../../components/DashboardFrame";
import { getManagerDashboardData } from "../../../../lib/dashboard";
import {
  formatRelativeTime,
  getVisibleAnnouncementsForUser,
} from "../../../../lib/announcements";
import AnnouncementComposer from "../../../../components/AnnouncementComposer";

export const dynamic = "force-dynamic";

export default async function ManagerDashboardPage() {
  const cookieStore = await cookies();
  const user = getAuthUser({
    cookies: {
      get: (name) => cookieStore.get(name),
    },
  });

  if (!isManager(user)) {
    redirect("/login");
  }

  const data = await getManagerDashboardData(user.id);
  const announcements = await getVisibleAnnouncementsForUser(user);

  return (
    <DashboardFrame
      role="manager"
      eyebrow="Manager area"
      title="Dashboard"
      description="Track your team's attendance and open leave workload."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Team size" value={data.teamSize} />
        <StatCard
          label="Today's team attendance"
          value={data.todaysTeamAttendanceCount}
        />
        <StatCard label="Pending leave requests" value={data.pendingTeamLeaves} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <QuickLinkCard
          href="/manager/attendance"
          title="Team Attendance"
          description="Review who checked in today and historical team attendance."
        />
        <QuickLinkCard
          href="/manager/tasks"
          title="Tasks"
          description="Assign tasks to your team and review submissions."
        />
        <QuickLinkCard
          href="/manager/leave"
          title="Leave Approval"
          description="Approve or reject leave requests from your team."
        />
        <QuickLinkCard
          href="/manager/team"
          title="My Team"
          description="See the employees who report directly to you."
        />
      </section>

      <section className="space-y-4 rounded-[1.75rem] border border-sage/35 bg-pakistan-green/92 p-6 shadow-xl shadow-black/10 backdrop-blur">
        <div>
          <h2 className="text-2xl font-semibold text-lavender">
            Announcements
          </h2>
          <p className="mt-1 text-sm text-gray">
            Share updates with your team.
          </p>
        </div>
        <AnnouncementComposer />
        <AnnouncementList announcements={announcements} />
      </section>
    </DashboardFrame>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-sage/25 bg-pakistan-green/88 p-6 shadow-xl shadow-black/10 backdrop-blur">
      <p className="text-sm text-gray">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-lavender">{value}</p>
    </div>
  );
}

function QuickLinkCard({ href, title, description }) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-sage/25 bg-pakistan-green/88 p-6 shadow-xl shadow-black/10 backdrop-blur transition hover:border-royal-purple/30 hover:bg-royal-purple/10"
    >
      <h2 className="text-xl font-semibold text-lavender">{title}</h2>
      <p className="mt-2 text-sm text-gray">{description}</p>
    </Link>
  );
}

function AnnouncementList({ announcements }) {
  if (!announcements.length) {
    return (
      <p className="rounded-2xl border border-sage/25 bg-royal-purple/10 px-4 py-3 text-sm text-gray">
        No announcements yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((announcement) => (
        <article
          key={announcement.id}
          className="rounded-2xl border border-sage/25 bg-pakistan-green/88 p-4"
        >
          <p className="text-base text-lavender">{announcement.message}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray">
            <span>
              {announcement.postedBy?.name || "Unknown"} ({String(announcement.postedBy?.role || "").toUpperCase()})
            </span>
            <span>•</span>
            <span>{formatRelativeTime(announcement.createdAt)}</span>
            <span>•</span>
            <span className="capitalize">{announcement.scope}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
