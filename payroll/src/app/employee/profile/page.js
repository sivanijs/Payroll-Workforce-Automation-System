import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthUser, isAdmin, isManager } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import DashboardFrame from "../../../../components/DashboardFrame";
import { formatMoney } from "../../../../lib/dashboard";

export const dynamic = "force-dynamic";

export default async function EmployeeProfilePage() {
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

  const employee = await prisma.employee.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      role: true,
      basicSalary: true,
      hra: true,
      allowance: true,
      dateOfJoining: true,
      manager: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <DashboardFrame
      role="employee"
      eyebrow="Employee area"
      title="Profile"
      description="Your account details and compensation snapshot."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card label="Name" value={employee?.name || "-"} />
        <Card label="Email" value={employee?.email || "-"} />
        <Card label="Designation" value={employee?.designation || "-"} />
        <Card label="Role" value={employee?.role || "-"} />
        <Card label="Date of joining" value={formatDate(employee?.dateOfJoining)} />
        <Card
          label="Manager"
          value={employee?.manager ? `${employee.manager.name} (${employee.manager.email})` : "Not assigned"}
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-sage/25 bg-pakistan-green/88 shadow-xl shadow-black/10 backdrop-blur">
        <div className="border-b border-sage/20 px-6 py-4">
          <h2 className="text-xl font-semibold">Salary Breakdown</h2>
          <p className="text-sm text-gray">
            Core pay components stored in your employee record.
          </p>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-3">
          <Card label="Basic salary" value={formatMoney(employee?.basicSalary)} />
          <Card label="HRA" value={formatMoney(employee?.hra)} />
          <Card label="Allowance" value={formatMoney(employee?.allowance)} />
        </div>
      </section>
    </DashboardFrame>
  );
}

function Card({ label, value }) {
  return (
    <div className="rounded-3xl border border-sage/25 bg-pakistan-green/88 p-5 shadow-xl shadow-black/10 backdrop-blur">
      <p className="text-sm text-gray">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-lavender">{value}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN");
}
