import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthUser, isAdmin, isManager } from "../../../../lib/auth";
import DashboardFrame from "../../../../components/DashboardFrame";
import {
  formatMoney,
  formatMonthYear,
  getEmployeeDashboardData,
} from "../../../../lib/dashboard";
import {
  formatRelativeTime,
  getVisibleAnnouncementsForUser,
} from "../../../../lib/announcements";

export const dynamic = "force-dynamic";

export default async function EmployeeDashboardPage() {
  const cookieStore = await cookies();
  const user = getAuthUser({
    cookies: {
      get: (name) => cookieStore.get(name),
    },
  });

  if (!user || (!isAdmin(user) && !isManager(user) && user.role !== "employee")) {
    redirect("/login");
  }

  if (user.role !== "employee") {
    redirect("/login");
  }

  const data = await getEmployeeDashboardData(user.id);
  const announcements = await getVisibleAnnouncementsForUser(user);

  return (
    <DashboardFrame
      role="employee"
      eyebrow="Employee area"
      title="Dashboard"
      description="A quick view of attendance, leave, and your latest payslip."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's attendance status"
          value={formatAttendanceStatus(data.todayAttendance)}
          detail={formatAttendanceDetail(data.todayAttendance)}
        />
        <StatCard
          label="This month's present days"
          value={data.monthAttendanceCount}
          detail={new Date().toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })}
        />
        <StatCard label="Leave balance" value={`${data.leaveBalance} days`} />
        <StatCard
          label="Latest payslip net salary"
          value={
            data.latestPayslip ? formatMoney(data.latestPayslip.netSalary) : "No payslip yet"
          }
          detail={
            data.latestPayslip
              ? formatMonthYear(data.latestPayslip.month, data.latestPayslip.year)
              : "Payroll has not been run for you yet."
          }
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <QuickLinkCard
          href="/employee/attendance"
          title="Attendance History"
          description="Review your attendance records."
        />
        <QuickLinkCard
          href="/employee/attendance/scan"
          title="Scan QR"
          description="Check in or check out using your QR code."
        />
        <QuickLinkCard
          href="/employee/tasks"
          title="Tasks"
          description="Track the tasks assigned to you."
        />
        <QuickLinkCard
          href="/employee/leave"
          title="Leave"
          description="Submit leave requests and check approval status."
        />
        <QuickLinkCard
          href="/employee/profile"
          title="Profile"
          description="See your employee details and salary breakdown."
        />
        <QuickLinkCard
          href="/employee/payslips"
          title="Payslips"
          description="Open your generated payslip history."
        />
      </section>

      <section className="space-y-4 rounded-[1.75rem] border border-sage/35 bg-pakistan-green/92 p-6 shadow-xl shadow-black/10 backdrop-blur">
        <div>
          <h2 className="text-2xl font-semibold text-lavender">
            Announcements
          </h2>
          <p className="mt-1 text-sm text-gray">
            Company updates and messages from your manager.
          </p>
        </div>
        <AnnouncementList announcements={announcements} />
      </section>
    </DashboardFrame>
  );
}

function formatAttendanceStatus(attendance) {
  if (!attendance) {
    return "Not marked";
  }

  return attendance.status;
}

function formatAttendanceDetail(attendance) {
  if (!attendance) {
    return "No attendance record exists for today.";
  }

  if (attendance.status === "completed") {
    return "Checked in and checked out today.";
  }

  if (attendance.status === "present") {
    return "Checked in today and still active.";
  }

  return "Attendance has been recorded for today.";
}

function StatCard({ label, value, detail }) {
  return (
    <div className="rounded-3xl border border-sage/25 bg-pakistan-green/88 p-6 shadow-xl shadow-black/10 backdrop-blur">
      <p className="text-sm text-gray">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-lavender">{value}</p>
      {detail ? <p className="mt-2 text-sm text-gray">{detail}</p> : null}
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
