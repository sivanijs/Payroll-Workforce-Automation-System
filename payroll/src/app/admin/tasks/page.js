import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthProfile, getAuthUser, isAdmin } from "../../../../lib/auth";
import { getAssignableEmployees, getTasksForUser } from "../../../../lib/tasks";
import TaskManagementClient from "../../../../components/TaskManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminTasksPage() {
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

  const [tasks, assignableEmployees] = await Promise.all([
    getTasksForUser(user),
    getAssignableEmployees(user),
  ]);

  return (
    <TaskManagementClient
      role="admin"
      title="All Tasks"
      description="Create, review, and manage tasks across the company."
      headerDisplayName={currentUser?.name || null}
      headerRole={currentUser?.role || "admin"}
      currentUserId={currentUser?.id || null}
      initialTasks={tasks}
      initialAssignableEmployees={assignableEmployees}
    />
  );
}

