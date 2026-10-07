"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const themeStyles = {
  light: {
    shell:
      "border-sage/35 bg-pakistan-green/90 text-lavender shadow-[0_24px_70px_rgba(20,49,9,0.28)]",
    eyebrow: "text-sage",
    title: "text-lavender",
    subtitle: "text-gray",
    badge: "border-sage/30 bg-royal-purple/10 text-sage",
    button:
      "border-royal-purple bg-royal-purple text-lavender hover:bg-eminence",
  },
  dark: {
    shell:
      "border-sage/35 bg-pakistan-green/92 text-lavender shadow-[0_24px_70px_rgba(20,49,9,0.28)]",
    eyebrow: "text-sage/85",
    title: "text-lavender",
    subtitle: "text-gray",
    badge: "border-sage/35 bg-royal-purple/15 text-lavender",
    button:
      "border-royal-purple/40 bg-royal-purple text-lavender hover:bg-eminence",
  },
};

function formatRoleLabel(role) {
  if (!role) {
    return "User";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function WorkspaceHeader({
  displayName,
  role,
  variant = "light",
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const styles = themeStyles[variant] || themeStyles.light;
  const roleLabel = formatRoleLabel(role);
  const title = displayName || `Workora ${roleLabel}`;

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <header
      className={`overflow-hidden rounded-[1.75rem] border backdrop-blur ${styles.shell}`}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className={`text-xs uppercase tracking-[0.35em] ${styles.eyebrow}`}>
            Workora
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className={`text-2xl font-semibold ${styles.title}`}>{title}</h2>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${styles.badge}`}
            >
              {roleLabel}
            </span>
          </div>
          <p className={`mt-2 text-sm ${styles.subtitle}`}>
            Signed in as {title}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:shadow-none ${styles.button}`}
        >
          <LogOut size={16} />
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </header>
  );
}
