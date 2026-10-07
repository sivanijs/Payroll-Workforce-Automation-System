import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthUser, isManager } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import DashboardFrame from "../../../../components/DashboardFrame";
import { formatMoney } from "../../../../lib/dashboard";

export const dynamic = "force-dynamic";

export default async function ManagerTeamPage() {
  const cookieStore = await cookies();
  const user = getAuthUser({
    cookies: {
      get: (name) => cookieStore.get(name),
    },
  });

  if (!isManager(user)) {
    redirect("/login");
  }

  const teamMembers = await prisma.employee.findMany({
    where: { managerId: user.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      basicSalary: true,
      role: true,
    },
  });

  return (
    <DashboardFrame
      role="manager"
      eyebrow="Manager area"
      title="My Team"
      description="View the employees who report directly to you."
    >
      <section className="overflow-hidden rounded-3xl border border-sage/25 bg-pakistan-green/88 shadow-xl backdrop-blur">
        <div className="border-b border-sage/25 px-6 py-4">
          <h2 className="text-xl font-semibold">Direct Reports</h2>
          <p className="text-sm text-gray">
            {teamMembers.length} team member{teamMembers.length === 1 ? "" : "s"} assigned
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-pakistan-green/88 text-gray">
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Designation</Th>
                <Th>Salary</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <Td>{member.name}</Td>
                  <Td>{member.email}</Td>
                  <Td>{member.designation}</Td>
                  <Td>{formatMoney(member.basicSalary)}</Td>
                </tr>
              ))}
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray">
                    No team members found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardFrame>
  );
}

function Th({ children }) {
  return <th className="px-6 py-4 font-medium">{children}</th>;
}

function Td({ children }) {
  return <td className="px-6 py-4 text-lavender">{children}</td>;
}

