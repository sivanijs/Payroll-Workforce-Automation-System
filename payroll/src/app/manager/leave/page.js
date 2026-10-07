import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthProfile, getAuthUser, isManager } from "../../../../lib/auth";
import { getLeaveRequestsForUser } from "../../../../lib/leave";
import LeaveRequestsClient from "../../employee/leave/leave-requests-client";

export const dynamic = "force-dynamic";

export default async function ManagerLeavePage() {
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

  const leaveRequests = await getLeaveRequestsForUser(user);

  return (
    <LeaveRequestsClient
      role="manager"
      title="Team Leave Requests"
      description="Review leave requests from your own team."
      leaveRequests={leaveRequests}
      approvalScope="team"
      headerDisplayName={currentUser?.name || null}
      headerRole={currentUser?.role || "manager"}
    />
  );
}

