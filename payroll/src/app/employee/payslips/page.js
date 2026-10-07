"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PayslipsClient from "./payslips-client";

export default function EmployeePayslipsPage() {
  const router = useRouter();
  const [payslips, setPayslips] = useState(null);
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [meResponse, payslipsResponse] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/payslips"),
        ]);

        if (meResponse.status === 401 || payslipsResponse.status === 401) {
          router.replace("/login");
          return;
        }

        const [meData, payslipsData] = await Promise.all([
          meResponse.json(),
          payslipsResponse.json(),
        ]);

        if (!meResponse.ok) {
          throw new Error(meData?.message || "Unable to load account data.");
        }

        if (!payslipsResponse.ok) {
          throw new Error(payslipsData?.message || "Unable to load payslips.");
        }

        if (!ignore) {
          setSession(meData?.user || null);
          setPayslips(payslipsData?.payslips || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Unable to load payslips.");
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [router]);

  if (error) {
    return (
      <main className="min-h-screen bg-pakistan-green px-4 py-10 text-lavender">
        <div className="mx-auto max-w-4xl rounded-3xl border border-sage/25 bg-pakistan-green/88 p-6">
          {error}
        </div>
      </main>
    );
  }

  if (payslips === null) {
    return (
      <main className="min-h-screen bg-pakistan-green px-4 py-10 text-lavender">
        <div className="mx-auto max-w-4xl rounded-3xl border border-sage/25 bg-pakistan-green/88 p-6">
          Loading payslips...
        </div>
      </main>
    );
  }

  return (
    <PayslipsClient
      payslips={payslips}
      headerDisplayName={session?.name || null}
      headerRole={session?.role || "employee"}
    />
  );
}
