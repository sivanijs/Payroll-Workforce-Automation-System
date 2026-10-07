import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthProfile, getAuthUser } from "../../../../lib/auth";
import { getTasksForUser } from "../../../../lib/tasks";
import TaskManagementClient from "../../../../components/TaskManagementClient";

export const dynamic = "force-dynamic";

export default async function EmployeeTasksPage() {
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

  const tasks = await getTasksForUser(user);

  return (
    <TaskManagementClient
      role="employee"
      title="My Tasks"
      description="Review the tasks assigned to you and update their progress."
      headerDisplayName={currentUser?.name || null}
      headerRole={currentUser?.role || "employee"}
      currentUserId={currentUser?.id || null}
      initialTasks={tasks}
    />
  );
}
