import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthProfile, getAuthUser } from "../../../../lib/auth";
import { getLeaveRequestsForUser } from "../../../../lib/leave";
import LeaveRequestsClient from "./leave-requests-client";

export const dynamic = "force-dynamic";

export default async function EmployeeLeavePage() {
  const cookieStore = await cookies();
  const user = getAuthUser({
    cookies: {
      get: (name) => cookieStore.get(name),
    },
  });

  if (!user || user.role !== "employee") {
    redirect("/login");
  }

  const currentUser = await getAuthProfile({
    cookies: {
      get: (name) => cookieStore.get(name),
    },
  });

  const leaveRequests = await getLeaveRequestsForUser(user);

  return (
    <LeaveRequestsClient
      role="employee"
      title="My Leave Requests"
      description="Submit a leave request and review your history."
      leaveRequests={leaveRequests}
      headerDisplayName={currentUser?.name || null}
      headerRole={currentUser?.role || "employee"}
    />
  );
}
