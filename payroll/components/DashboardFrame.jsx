import { cookies } from "next/headers";
import Sidebar from "./Sidebar";
import WorkspaceHeader from "./WorkspaceHeader";
import { getAuthProfile } from "../lib/auth";

export default async function DashboardFrame({
  role,
  eyebrow,
  title,
  description,
  children,
}) {
  const cookieStore = await cookies();
  const user = await getAuthProfile({
    cookies: {
      get: (name) => cookieStore.get(name),
    },
  });

  return (
    <main className="min-h-screen bg-pakistan-green text-lavender lg:grid lg:grid-cols-[300px_1fr]">
      <Sidebar role={role} />
      <section className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <WorkspaceHeader
            displayName={user?.name}
            role={role}
            variant="light"
          />
          <header className="overflow-hidden rounded-[1.75rem] border border-sage/35 bg-pakistan-green/92 shadow-xl shadow-black/10 backdrop-blur">
            <div className="p-6 lg:p-8">
              <p className="text-xs uppercase tracking-[0.35em] text-sage">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-lavender">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray">
                {description}
              </p>
            </div>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}
