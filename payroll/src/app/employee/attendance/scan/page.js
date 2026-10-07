import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthProfile, getAuthUser, isAdmin, isManager } from "../../../../../lib/auth";
import ScanClient from "./scan-client";

export const dynamic = "force-dynamic";

export default async function AttendanceScanPage() {
  const cookieStore = await cookies();
  const user = getAuthUser({
    cookies: {
      get: (name) => cookieStore.get(name),
    },
  });

  if (!user || (!isAdmin(user) && !isManager(user) && user.role !== "employee")) {
    redirect("/login");
  }

  const currentUser = await getAuthProfile({
    cookies: {
      get: (name) => cookieStore.get(name),
    },
  });

  return (
    <ScanClient
      headerDisplayName={currentUser?.name || null}
      headerRole={currentUser?.role || user.role}
    />
  );
}
