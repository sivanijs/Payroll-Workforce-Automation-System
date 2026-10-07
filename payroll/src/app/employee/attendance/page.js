import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DateField from "../../../../components/DateField";
import WorkspaceHeader from "../../../../components/WorkspaceHeader";
import { getAuthProfile, getAuthUser, isManager, isAdmin } from "../../../../lib/auth";
import {
  formatAttendanceStatusLabel,
  formatDateOnly,
  formatTimeOnly,
  getAttendanceStatusBadgeClass,
  getAttendanceRecordsForUser,
} from "../../../../lib/attendance";

export const dynamic = "force-dynamic";

export default async function EmployeeAttendancePage({ searchParams }) {
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

  const currentUser = await getAuthProfile({
    cookies: {
      get: (name) => cookieStore.get(name),
    },
  });

  const date = searchParams?.date || "";
  const attendance = await getAttendanceRecordsForUser(user, { date });

  return (
    <main className="min-h-screen bg-pakistan-green px-4 py-10 text-lavender">
      <div className="mx-auto max-w-6xl space-y-6">
        <WorkspaceHeader
          displayName={currentUser?.name || null}
          role={currentUser?.role || "employee"}
          variant="dark"
        />
        <header className="rounded-3xl border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_70px_rgba(20,49,9,0.28)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-sage">
            Employee
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-lavender">Attendance History</h1>
          <p className="mt-2 text-sm text-gray">
            View your own attendance records.
          </p>
        </header>

        <form className="rounded-3xl border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_70px_rgba(20,49,9,0.28)]">
          <DateField label="Date" name="date" defaultValue={date} />
          <div className="mt-4 flex gap-3">
            <button className="rounded-2xl bg-royal-purple px-4 py-2.5 font-semibold text-lavender shadow-lg shadow-black/20 transition hover:bg-eminence">
              Filter
            </button>
            <Link
              href="/employee/attendance"
              className="rounded-2xl border border-sage/35 bg-pakistan-green px-4 py-2.5 font-medium text-lavender"
            >
              Clear
            </Link>
          </div>
        </form>

        <AttendanceTable attendance={attendance} />
      </div>
    </main>
  );
}

function AttendanceTable({ attendance }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-sage/35 bg-pakistan-green/92 shadow-[0_24px_70px_rgba(20,49,9,0.28)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-sage/20 text-left text-sm">
          <thead className="bg-royal-purple/10 text-lavender">
            <tr>
              <Th>Date</Th>
              <Th>Check In</Th>
              <Th>Check Out</Th>
              <Th>Working Hours</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage/15">
            {attendance.map((record) => (
              <tr key={record.id} className="hover:bg-white/5">
                <Td>{formatDateOnly(record.date)}</Td>
                <Td>{formatTimeOnly(record.checkIn)}</Td>
                <Td>{formatTimeOnly(record.checkOut)}</Td>
                <Td>{record.workingHours ?? "-"}</Td>
                <Td>
                  <StatusBadge status={record.status} />
                </Td>
              </tr>
            ))}
            {attendance.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray">
                  No attendance records found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th className="px-6 py-4 font-semibold tracking-wide">{children}</th>;
}

function Td({ children }) {
  return <td className="px-6 py-4 text-lavender">{children}</td>;
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getAttendanceStatusBadgeClass(
        status
      )}`}
    >
      {formatAttendanceStatusLabel(status)}
    </span>
  );
}
