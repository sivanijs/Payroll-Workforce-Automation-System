import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ActivitySquare,
  Banknote,
  ClipboardList,
  ListTodo,
  UsersRound,
} from "lucide-react";
import { getAuthUser, isAdmin } from "../../../../lib/auth";
import DashboardFrame from "../../../../components/DashboardFrame";
import {
  formatMoney,
  formatMonthYear,
  getAdminDashboardData,
} from "../../../../lib/dashboard";
import {
  formatRelativeTime,
  getVisibleAnnouncementsForUser,
} from "../../../../lib/announcements";
import AnnouncementComposer from "../../../../components/AnnouncementComposer";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const user = getAuthUser({
    cookies: {
      get: (name) => cookieStore.get(name),
    },
  });

  if (!isAdmin(user)) {
    redirect("/login");
  }

  const data = await getAdminDashboardData();
  const announcements = await getVisibleAnnouncementsForUser(user);

  return (
    <DashboardFrame
      role="admin"
      eyebrow="Admin area"
      title="Dashboard"
      description="Company-wide staffing, attendance, leave, and payroll visibility."
    >
      <section className="space-y-4">
        <SectionLabel>Overview</SectionLabel>
        <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total employees"
            value={data.totalEmployees}
            detail="Active headcount in the company"
            icon={UsersRound}
          />
          <StatCard
            label="Today's attendance"
            value={data.todaysAttendanceCount}
            detail="Attendance marked for today"
            icon={ActivitySquare}
          />
          <StatCard
            label="Leaves needing admin review"
            value={data.pendingFallbackLeaves}
            detail="Employees without managers"
            icon={ClipboardList}
          />
          <StatCard
            label="Latest payroll run"
            value={
              data.latestPayrollBatch
                ? formatMonthYear(
                    data.latestPayrollBatch.month,
                    data.latestPayrollBatch.year
                  )
                : "No runs yet"
            }
            detail={
              data.latestPayrollBatch
                ? `${data.latestPayrollBatch.employeeCount} employees - ${formatMoney(
                    data.latestPayrollBatch.totalNetSalary
                  )}`
                : "Run payroll to generate the first batch."
            }
            icon={Banknote}
          />
        </div>
      </section>

      <section className="space-y-4 pt-4">
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <QuickLinkCard
            href="/admin/employees"
            title="Employee Management"
            description="Create, update, and review employee records."
            icon={UsersRound}
          />
          <QuickLinkCard
            href="/admin/tasks"
            title="Tasks"
            description="Assign and review company tasks."
            icon={ListTodo}
          />
          <QuickLinkCard
            href="/admin/attendance"
            title="Attendance"
            description="Review company attendance records."
            icon={ActivitySquare}
          />
          <QuickLinkCard
            href="/admin/leave"
            title="Leave"
            description="Handle fallback leave requests."
            icon={ClipboardList}
          />
          <QuickLinkCard
            href="/admin/payroll"
            title="Payroll"
            description="Run payroll and review historical batches."
            icon={Banknote}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-[1.75rem] border border-sage/35 bg-pakistan-green/92 p-6 shadow-xl shadow-black/10 backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-lavender">
              Announcements
            </h2>
            <p className="mt-1 text-sm text-gray">
              Share company updates with everyone or your team.
            </p>
          </div>
        </div>
        <AnnouncementComposer />
        <AnnouncementList announcements={announcements} />
      </section>
    </DashboardFrame>
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

function StatCard({ label, value, detail, icon: Icon }) {
  return (
    <div className="flex h-full flex-col rounded-[1.75rem] border border-sage/35 bg-pakistan-green/92 p-6 shadow-xl shadow-black/10 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-lavender">{value}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sage/35 bg-royal-purple/10 text-sage">
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>
      {detail ? <p className="mt-3 text-sm text-gray">{detail}</p> : null}
    </div>
  );
}

function QuickLinkCard({ href, title, description, icon: Icon }) {
  return (
    <Link
      href={href}
      className="group flex h-full rounded-[1.75rem] border border-sage/35 bg-pakistan-green/92 p-6 shadow-xl shadow-black/10 backdrop-blur transition hover:-translate-y-0.5 hover:border-royal-purple hover:bg-royal-purple/10"
    >
      <div className="flex w-full items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sage/35 bg-pakistan-green text-sage transition group-hover:bg-royal-purple/15 group-hover:text-lavender">
          <Icon size={20} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-lavender">{title}</h2>
          <p className="mt-1 text-sm text-gray">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.35em] text-sage">
        {children}
      </span>
      <span className="h-px flex-1 bg-sage/30" />
    </div>
  );
}
