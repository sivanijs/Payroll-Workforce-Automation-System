import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthProfile, getAuthUser, isAdmin } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import EmployeesClient from "./employees-client";

export const dynamic = "force-dynamic";

export default async function AdminEmployeesPage() {
  const cookieStore = await cookies();
  const user = getAuthUser({
    cookies: {
      get: (name) => cookieStore.get(name),
    },
  });

  if (!isAdmin(user)) {
    redirect("/login");
  }

  const currentUser = await getAuthProfile({
    cookies: {
      get: (name) => cookieStore.get(name),
    },
  });

  const [employees, managers] = await Promise.all([
    prisma.employee.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        basicSalary: true,
        hra: true,
        allowance: true,
        qrCode: true,
        dateOfJoining: true,
        managerId: true,
      },
    }),
    prisma.employee.findMany({
      where: { role: "manager" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <EmployeesClient
      initialEmployees={employees}
      initialManagers={managers}
      initialRole={user?.role || null}
      initialDisplayName={currentUser?.name || null}
    />
  );
}
