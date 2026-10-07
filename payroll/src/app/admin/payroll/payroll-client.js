"use client";

import { useEffect, useMemo, useState } from "react";
import WorkspaceHeader from "../../../../components/WorkspaceHeader";

const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function getDefaultMonth() {
  return new Date().getMonth() + 1;
}

function getDefaultYear() {
  return new Date().getFullYear();
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function formatMonthYear(month, year) {
  const monthLabel =
    monthOptions.find((option) => option.value === Number(month))?.label ||
    `Month ${month}`;
  return `${monthLabel} ${year}`;
}

export default function PayrollClient({ initialDisplayName, initialRole }) {
  const [month, setMonth] = useState(getDefaultMonth());
  const [year, setYear] = useState(getDefaultYear());
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [runningPayroll, setRunningPayroll] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, index) => currentYear - 3 + index);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadHistory() {
      setLoadingHistory(true);

      try {
        const response = await fetch("/api/payroll/history", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!ignore && response.ok) {
          setHistory(data.history || []);
        }
      } catch {
        if (!ignore) {
          setHistory([]);
        }
      } finally {
        if (!ignore) {
          setLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      ignore = true;
    };
  }, []);

  async function refreshHistory() {
    try {
      const response = await fetch("/api/payroll/history", {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok) {
        setHistory(data.history || []);
      }
    } catch {
      // Leave the current history list in place if the refresh fails.
    }
  }

  async function handleRunPayroll(event) {
    event.preventDefault();
    setRunningPayroll(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/payroll/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: Number(month),
          year: Number(year),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to run payroll.");
      }

      setResults(data.summary || []);
      setMessage(
        `Payroll run completed for ${formatMonthYear(data.month, data.year)}.`
      );
      await refreshHistory();
    } catch (err) {
      setError(err.message || "Unable to run payroll.");
    } finally {
      setRunningPayroll(false);
    }
  }

  return (
    <main className="min-h-screen bg-pakistan-green px-4 py-10 text-lavender">
      <div className="mx-auto max-w-7xl space-y-8">
        <WorkspaceHeader
          displayName={initialDisplayName}
          role={initialRole || "admin"}
          variant="dark"
        />
        <header className="rounded-3xl border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_80px_rgba(20,49,9,0.28)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-sage">
            Admin panel
          </p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-lavender">Payroll</h1>
              <p className="text-sm text-gray">
                Run payroll for a selected month and review past batches.
              </p>
            </div>
            <div className="rounded-2xl border border-sage/35 bg-royal-purple/10 px-4 py-3 text-sm font-medium text-lavender shadow-inner shadow-black/10">
              Selected batch: {formatMonthYear(month, year)}
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <form
            onSubmit={handleRunPayroll}
            className="space-y-5 rounded-3xl border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_70px_rgba(20,49,9,0.28)] backdrop-blur"
          >
            <h2 className="text-xl font-semibold text-lavender">Run Payroll</h2>
            <p className="text-sm text-gray">
              Choose the month and year, then generate payslips for every employee.
            </p>

            <SelectField
              label="Month"
              value={month}
              onChange={(value) => setMonth(Number(value))}
              options={monthOptions}
            />
            <SelectField
              label="Year"
              value={year}
              onChange={(value) => setYear(Number(value))}
              options={years.map((value) => ({ value, label: String(value) }))}
            />

            {error ? (
            <p className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-lavender">
              {error}
            </p>
            ) : null}

            {message ? (
            <p className="rounded-2xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-lavender">
              {message}
            </p>
            ) : null}

            <button
              type="submit"
              disabled={runningPayroll}
              className="w-full rounded-2xl bg-royal-purple px-4 py-3 font-semibold text-lavender shadow-lg shadow-black/20 transition hover:bg-eminence hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              {runningPayroll ? "Running..." : "Run Payroll"}
            </button>
          </form>

          <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-sage/35 bg-pakistan-green/92 shadow-[0_24px_70px_rgba(20,49,9,0.28)] backdrop-blur">
              <div className="border-b border-sage/25 bg-royal-purple/10 px-6 py-4">
                <h2 className="text-xl font-semibold text-lavender">Results</h2>
                <p className="text-sm text-gray">
                  Direct response from the payroll run endpoint.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sage/20 text-left text-sm">
                  <thead className="bg-royal-purple/10 text-lavender">
                    <tr>
                      <Th>Employee</Th>
                      <Th>Designation</Th>
                      <Th>Status</Th>
                      <Th>Gross Salary</Th>
                      <Th>PF</Th>
                      <Th>Tax</Th>
                      <Th>Net Salary</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage/15">
                    {results.map((result) => (
                      <tr key={`${result.employeeId}-${result.status}-${result.netSalary}`} className="align-top hover:bg-royal-purple/10">
                        <Td>{result.name}</Td>
                        <Td>{result.designation || "-"}</Td>
                        <Td>
                          <StatusPill status={result.status} />
                        </Td>
                        <Td>{formatCurrency(result.grossSalary)}</Td>
                        <Td>{formatCurrency(result.pf)}</Td>
                        <Td>{formatCurrency(result.tax)}</Td>
                        <Td>{formatCurrency(result.netSalary)}</Td>
                      </tr>
                    ))}
                    {results.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-10 text-center text-gray"
                        >
                          Run payroll to see employee-level results here.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-sage/35 bg-pakistan-green/92 shadow-[0_24px_70px_rgba(20,49,9,0.28)] backdrop-blur">
              <div className="border-b border-sage/25 bg-royal-purple/10 px-6 py-4">
                <h2 className="text-xl font-semibold text-lavender">History</h2>
                <p className="text-sm text-gray">
                  Grouped payroll batches by month and year.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sage/20 text-left text-sm">
                  <thead className="bg-royal-purple/10 text-lavender">
                    <tr>
                      <Th>Batch</Th>
                      <Th>Employees</Th>
                      <Th>Total Net Salary</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage/15">
                    {!loadingHistory && history.map((batch) => (
                      <tr key={`${batch.year}-${batch.month}`} className="align-top hover:bg-white/5">
                        <Td>{formatMonthYear(batch.month, batch.year)}</Td>
                        <Td>{batch.employeeCount}</Td>
                        <Td>{formatCurrency(batch.totalNetSalary)}</Td>
                      </tr>
                    ))}
                    {!loadingHistory && history.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-10 text-center text-gray"
                        >
                          No payroll runs found yet.
                        </td>
                      </tr>
                    ) : null}
                    {loadingHistory ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-10 text-center text-gray"
                        >
                          Loading history...
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-lavender">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 text-lavender outline-none transition placeholder:text-gray/70 focus:border-royal-purple focus:ring-2 focus:ring-royal-purple/30"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusPill({ status }) {
  const isCreated = status === "created";
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
        isCreated
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
          : "border-coral/30 bg-coral/10 text-lavender"
      }`}
    >
      {status}
    </span>
  );
}

function Th({ children }) {
  return <th className="px-6 py-4 font-semibold tracking-wide">{children}</th>;
}

function Td({ children }) {
  return <td className="px-6 py-4 text-lavender">{children}</td>;
}
