import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthProfile, getAuthUser, isAdmin } from "../../../../lib/auth";
import PayrollClient from "./payroll-client";

export const dynamic = "force-dynamic";

export default async function AdminPayrollPage() {
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

  return (
    <PayrollClient
      initialDisplayName={currentUser?.name || null}
      initialRole={currentUser?.role || user.role}
    />
  );
}
