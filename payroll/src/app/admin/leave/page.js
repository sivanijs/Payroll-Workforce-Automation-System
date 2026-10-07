import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthProfile, getAuthUser, isAdmin } from "../../../../lib/auth";
import { getAllLeaveRequests } from "../../../../lib/leave";
import LeaveRequestsClient from "../../employee/leave/leave-requests-client";

export const dynamic = "force-dynamic";

export default async function AdminLeavePage() {
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

  const leaveRequests = await getAllLeaveRequests();

  return (
    <LeaveRequestsClient
      role="admin"
      title="All Leave Requests"
      description="Review every leave request across the company."
      leaveRequests={leaveRequests}
      approvalScope="all"
      headerDisplayName={currentUser?.name || null}
      headerRole={currentUser?.role || "admin"}
    />
  );
}

