import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DateField from "../../../../components/DateField";
import WorkspaceHeader from "../../../../components/WorkspaceHeader";
import { getAuthProfile, getAuthUser, isManager } from "../../../../lib/auth";
import {
  formatAttendanceStatusLabel,
  formatDateOnly,
  formatTimeOnly,
  getAttendanceStatusBadgeClass,
  getAttendanceRecordsForUser,
} from "../../../../lib/attendance";

export const dynamic = "force-dynamic";

export default async function ManagerAttendancePage({ searchParams }) {
  const cookieStore = await cookies();
  const user = getAuthUser({
    cookies: {
      get: (name) => cookieStore.get(name),
    },
  });

  if (!isManager(user)) {
    redirect("/login");
  }

  const currentUser = await getAuthProfile({
    cookies: {
      get: (name) => cookieStore.get(name),
    },
  });

  const resolvedSearchParams = await searchParams;
  const date = resolvedSearchParams?.date || "";
  const employeeName = resolvedSearchParams?.employeeName || "";
  const status = resolvedSearchParams?.status || "";
  const attendance = await getAttendanceRecordsForUser(user, {
    date,
    employeeName,
    status,
  });

  return (
    <main className="min-h-screen bg-pakistan-green px-4 py-10 text-lavender">
      <div className="mx-auto max-w-7xl space-y-6">
        <WorkspaceHeader
          displayName={currentUser?.name || null}
          role={currentUser?.role || "manager"}
          variant="dark"
        />
        <header className="rounded-3xl border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_70px_rgba(20,49,9,0.28)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-sage">
            Manager
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-lavender">Team Attendance</h1>
          <p className="mt-2 text-sm text-gray">
            View attendance only for your own team.
          </p>
        </header>

        <form
          method="get"
          className="grid gap-4 rounded-3xl border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_70px_rgba(20,49,9,0.28)] md:grid-cols-4"
        >
          <DateField label="Date" name="date" defaultValue={date} />
          <Field
            label="Employee Name"
            name="employeeName"
            type="text"
            defaultValue={employeeName}
            placeholder="Search by name"
          />
          <SelectField label="Status" name="status" defaultValue={status} />
          <div className="flex items-end gap-3">
            <button className="rounded-2xl bg-royal-purple px-4 py-3 font-semibold text-lavender shadow-lg shadow-black/20 transition hover:bg-eminence">
              Filter
            </button>
            <Link
              href="/manager/attendance"
              className="rounded-2xl border border-sage/35 bg-pakistan-green px-4 py-3 font-medium text-lavender"
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

function Field({ label, name, type, defaultValue, placeholder = "" }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-lavender">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 text-lavender outline-none placeholder:text-gray/70"
      />
    </label>
  );
}

function SelectField({ label, name, defaultValue }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-lavender">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 text-lavender outline-none"
      >
        <option value="">All</option>
        <option value="present">Present</option>
        <option value="completed">Completed</option>
        <option value="Late">Late</option>
        <option value="absent">Absent</option>
      </select>
    </label>
  );
}

function AttendanceTable({ attendance }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-sage/35 bg-pakistan-green/92 shadow-[0_24px_70px_rgba(20,49,9,0.28)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-sage/20 text-left text-sm">
          <thead className="bg-royal-purple/10 text-lavender">
            <tr>
              <Th>Employee</Th>
              <Th>Designation</Th>
              <Th>Email</Th>
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
                <Td>{record.employee.name}</Td>
                <Td>{record.employee.designation}</Td>
                <Td>{record.employee.email}</Td>
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
                <td colSpan={8} className="px-6 py-10 text-center text-gray">
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
