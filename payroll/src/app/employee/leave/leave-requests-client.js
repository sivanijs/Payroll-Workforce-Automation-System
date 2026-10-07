"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspaceHeader from "../../../../components/WorkspaceHeader";

export default function LeaveRequestsClient({
  role,
  title,
  description,
  leaveRequests,
  approvalScope = "self",
  headerDisplayName,
  headerRole,
}) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(leaveRequests);

  useEffect(() => {
    setItems(leaveRequests);
  }, [leaveRequests]);

  async function submitRequest(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromDate, toDate, reason }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to submit leave request.");
      }

      setItems((current) => [data.leaveRequest, ...current]);
      setFromDate("");
      setToDate("");
      setReason("");
      setMessage("Leave request submitted successfully.");
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to submit leave request.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/leave/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to update leave request.");
      }

      setItems((current) =>
        current.map((item) => (item.id === id ? data.leaveRequest : item))
      );
      setMessage(`Leave request ${status} successfully.`);
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to update leave request.");
    }
  }

  return (
    <main className="min-h-screen bg-pakistan-green px-4 py-10 text-lavender">
      <div className="mx-auto max-w-6xl space-y-6">
        <WorkspaceHeader
          displayName={headerDisplayName}
          role={headerRole || role}
          variant="dark"
        />
        <header className="rounded-3xl border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_70px_rgba(20,49,9,0.28)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-sage">{role}</p>
          <h1 className="mt-2 text-3xl font-semibold text-lavender">{title}</h1>
          <p className="mt-2 text-sm text-gray">{description}</p>
        </header>

        {role === "employee" ? (
          <form
            onSubmit={submitRequest}
            className="grid gap-4 rounded-3xl border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_70px_rgba(20,49,9,0.28)] md:grid-cols-3"
          >
            <Field label="From Date" type="date" value={fromDate} onChange={setFromDate} />
            <Field label="To Date" type="date" value={toDate} onChange={setToDate} />
            <label className="space-y-2 md:col-span-3">
              <span className="text-sm font-medium text-lavender">Reason</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="min-h-28 w-full rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 text-lavender outline-none placeholder:text-gray/70"
                placeholder="Reason for leave"
              />
            </label>
            {error ? <StatusBox tone="rose" text={error} /> : null}
            {message ? <StatusBox tone="emerald" text={message} /> : null}
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-royal-purple px-4 py-3 font-semibold text-lavender shadow-lg shadow-black/20 transition hover:bg-eminence disabled:opacity-70"
              >
                {loading ? "Submitting..." : "Submit Leave"}
              </button>
            </div>
          </form>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-sage/35 bg-pakistan-green/92 shadow-[0_24px_70px_rgba(20,49,9,0.28)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-sage/20 text-left text-sm">
              <thead className="bg-royal-purple/10 text-lavender">
                <tr>
                  <Th>Employee</Th>
                  <Th>Designation</Th>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Reason</Th>
                  <Th>Status</Th>
                  <Th>Actioned By</Th>
                  {approvalScope !== "self" ? <Th>Actions</Th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/15">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-royal-purple/10">
                    <Td>{item.employee?.name || "-"}</Td>
                    <Td>{item.employee?.designation || "-"}</Td>
                    <Td>{formatDateValue(item.fromDate)}</Td>
                    <Td>{formatDateValue(item.toDate)}</Td>
                    <Td className="max-w-sm">{item.reason}</Td>
                    <Td>
                      <StatusPill status={item.status} />
                    </Td>
                    <Td>{getActionedByLabel(item)}</Td>
                    {approvalScope !== "self" ? (
                      <Td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => updateStatus(item.id, "approved")}
                            disabled={item.status !== "pending"}
                            className="rounded-full border border-sage/30 bg-sage/10 px-3 py-1.5 text-xs font-medium text-lavender transition disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(item.id, "rejected")}
                            disabled={item.status !== "pending"}
                            className="rounded-full border border-coral/30 bg-coral/10 px-3 py-1.5 text-xs font-medium text-lavender transition disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </Td>
                    ) : null}
                  </tr>
                ))}
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={approvalScope !== "self" ? 8 : 7}
                      className="px-6 py-10 text-center text-gray"
                    >
                      No leave requests found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, type, value, onChange }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-lavender">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 text-lavender outline-none placeholder:text-gray/70"
      />
    </label>
  );
}

function formatDateValue(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN");
}

function StatusBox({ tone, text }) {
  const classes =
    tone === "rose"
      ? "border-coral/30 bg-coral/10 text-lavender"
      : "border-sage/30 bg-sage/10 text-lavender";
  return <p className={`rounded-2xl border px-4 py-3 text-sm ${classes}`}>{text}</p>;
}

function StatusPill({ status }) {
  const tone =
    status === "approved"
      ? "border-sage/30 bg-sage/15 text-lavender"
      : status === "rejected"
        ? "border-coral/30 bg-coral/15 text-lavender"
        : "border-gray/30 bg-gray/15 text-lavender";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${tone}`}>
      {status}
    </span>
  );
}

function getActionedByLabel(item) {
  if (item.status === "pending") {
    return <span className="text-gray">Pending</span>;
  }

  const actionedBy = item.actionedBy || item.approvedBy;

  if (!actionedBy) {
    return "-";
  }

  return (
    <div className="space-y-1">
      <p className="font-medium text-lavender">{actionedBy.name || "-"}</p>
      <p className="text-xs uppercase tracking-[0.25em] text-gray">
        {actionedBy.role || "staff"}
      </p>
    </div>
  );
}

function Th({ children }) {
  return <th className="px-6 py-4 font-semibold tracking-wide">{children}</th>;
}

function Td({ children, className = "" }) {
  return <td className={`px-6 py-4 text-lavender ${className}`}>{children}</td>;
}
