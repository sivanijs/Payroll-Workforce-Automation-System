"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  Banknote,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  QrCode,
  ListTodo,
  UsersRound,
  UserRound,
} from "lucide-react";

const navItems = {
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/employees", label: "Employee Management", icon: UsersRound },
    { href: "/admin/tasks", label: "Tasks", icon: ListTodo },
    { href: "/admin/attendance", label: "Attendance", icon: Clock3 },
    { href: "/admin/leave", label: "Leave", icon: ClipboardList },
    { href: "/admin/payroll", label: "Payroll", icon: Banknote },
  ],
  manager: [
    { href: "/manager/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/manager/tasks", label: "Tasks", icon: ListTodo },
    { href: "/manager/attendance", label: "Team Attendance", icon: Clock3 },
    { href: "/employee/attendance/scan", label: "Scan QR", icon: QrCode },
    { href: "/manager/leave", label: "Leave Approval", icon: ClipboardList },
    { href: "/manager/team", label: "My Team", icon: UsersRound },
  ],
  employee: [
    { href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employee/tasks", label: "Tasks", icon: ListTodo },
    { href: "/employee/attendance", label: "Attendance History", icon: Clock3 },
    { href: "/employee/attendance/scan", label: "Scan QR", icon: QrCode },
    { href: "/employee/leave", label: "Leave", icon: ClipboardList },
    { href: "/employee/profile", label: "Profile", icon: UserRound },
    { href: "/employee/payslips", label: "Payslips", icon: Banknote },
  ],
};

const roleLabels = {
  admin: "Admin User",
  manager: "Manager User",
  employee: "Employee User",
};

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const items = navItems[role] || [];
  const userName = roleLabels[role] || "Workora User";
  const avatarLetter = useMemo(() => (role?.[0] || "E").toUpperCase(), [role]);

  return (
    <aside className="border-b border-sage/25 bg-pakistan-green p-4 text-lavender lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-6">
        <div className="rounded-[1.75rem] border border-sage/30 bg-royal-purple/15 p-5 shadow-xl shadow-black/10 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-sage">
            Workora
          </p>
          <h2 className="mt-2 text-2xl font-semibold capitalize">{role} area</h2>
          <p className="mt-2 text-sm text-gray">
            Role-aware navigation and quick access to your workspace.
          </p>
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "border-royal-purple bg-royal-purple text-lavender shadow-lg shadow-black/10"
                    : "border-sage/20 bg-pakistan-green/85 text-sage hover:border-sage/50 hover:bg-royal-purple/15"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                    active
                      ? "border-sage/30 bg-sage/15 text-lavender"
                      : "border-sage/20 bg-pakistan-green text-sage group-hover:text-lavender"
                  }`}
                >
                  <Icon size={17} strokeWidth={2} />
                </span>
                <span className="flex-1">{item.label}</span>
                {active ? <span className="text-sage">•</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4 rounded-[1.75rem] border border-sage/25 bg-royal-purple/15 p-4 shadow-xl shadow-black/10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-sage/30 bg-royal-purple text-sm font-semibold text-lavender">
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-lavender">
                {userName}
              </p>
              <p className="text-xs uppercase tracking-[0.25em] text-gray">
                {role || "user"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
