import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthProfile, getAuthUser, isManager } from "../../../../lib/auth";
import { getAssignableEmployees, getTasksForUser } from "../../../../lib/tasks";
import TaskManagementClient from "../../../../components/TaskManagementClient";

export const dynamic = "force-dynamic";

export default async function ManagerTasksPage() {
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

  const [tasks, assignableEmployees] = await Promise.all([
    getTasksForUser(user),
    getAssignableEmployees(user),
  ]);

  return (
    <TaskManagementClient
      role="manager"
      title="Team Tasks"
      description="Assign tasks to your team and review their progress."
      headerDisplayName={currentUser?.name || null}
      headerRole={currentUser?.role || "manager"}
      currentUserId={currentUser?.id || null}
      initialTasks={tasks}
      initialAssignableEmployees={assignableEmployees}
    />
  );
}

