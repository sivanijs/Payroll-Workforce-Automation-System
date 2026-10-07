"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import WorkspaceHeader from "../../../../../components/WorkspaceHeader";

const WRONG_QR_MESSAGE =
  "This QR code doesn't belong to your account. Please scan your own QR code.";

function parseEmployeeId(value) {
  const trimmed = String(value).trim();
  const match = trimmed.match(/\d+/);
  return match ? Number(match[0]) : Number.NaN;
}

export default function ScanClient({ headerDisplayName, headerRole }) {
  const scannerRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const [manualEmployeeId, setManualEmployeeId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  async function submitScan(employeeId) {
    if (isSubmittingRef.current) {
      return;
    }

    const parsedEmployeeId = Number(employeeId);
    if (!Number.isInteger(parsedEmployeeId) || parsedEmployeeId <= 0) {
      setError("Enter a valid employee ID.");
      setMessage("");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employeeId: parsedEmployeeId }),
      });

      const rawBody = await response.text();
      let data = null;

      if (rawBody) {
        try {
          data = JSON.parse(rawBody);
        } catch {
          data = { message: rawBody };
        }
      }

      if (!response.ok) {
        throw new Error(data?.message || "Unable to process scan.");
      }

      setMessage(data?.message || "Scan processed successfully.");
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
        setCameraReady(false);
      }
    } catch (err) {
      setError(err.message || "Unable to process scan.");
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        const employeeId = parseEmployeeId(decodedText);
        await submitScan(employeeId);
      },
      () => {}
    );

    queueMicrotask(() => {
      if (isMounted) {
        setCameraReady(true);
      }
    });

    return () => {
      isMounted = false;
      scanner.clear().catch(() => {});
      scannerRef.current = null;
    };
  }, []);

  return (
    <main className="min-h-screen bg-pakistan-green px-4 py-10 text-lavender">
      <div className="mx-auto max-w-5xl space-y-8">
        <WorkspaceHeader
          displayName={headerDisplayName}
          role={headerRole || "employee"}
          variant="dark"
        />
        <header className="rounded-3xl border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_70px_rgba(20,49,9,0.28)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-sage">
            Attendance
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-lavender">QR Scan Check-in</h1>
          <p className="mt-2 text-sm text-gray">
            Scan an employee QR code or use the manual test input below.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_70px_rgba(20,49,9,0.28)] backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-lavender">Camera scanner</h2>
              <span className="rounded-full bg-sage/15 px-3 py-1 text-xs font-medium text-sage">
                {cameraReady ? "Ready" : "Starting..."}
              </span>
            </div>
            <div id="qr-reader" className="overflow-hidden rounded-2xl" />
            <p className="mt-4 text-sm text-gray">
              Point the camera at a QR code. The QR must contain the employee ID.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_70px_rgba(20,49,9,0.28)] backdrop-blur">
              <h2 className="text-xl font-semibold text-lavender">Manual Test</h2>
              <p className="mt-2 text-sm text-gray">
                Use this if the camera is unavailable.
              </p>
              <div className="mt-4 space-y-3">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-lavender">
                    Employee ID
                  </span>
                  <input
                    type="text"
                    value={manualEmployeeId}
                    onChange={(event) => setManualEmployeeId(event.target.value)}
                    className="w-full rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 text-lavender outline-none transition placeholder:text-gray/70 focus:border-royal-purple focus:ring-2 focus:ring-royal-purple/30"
                    placeholder="Enter employee ID"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => submitScan(manualEmployeeId)}
                  disabled={loading}
                  className="w-full rounded-2xl bg-royal-purple px-4 py-3 font-semibold text-lavender shadow-lg shadow-black/20 transition hover:bg-eminence disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Processing..." : "Simulate Scan"}
                </button>
              </div>
            </div>

            {message ? (
              <div className="rounded-3xl border border-sage/30 bg-sage/10 p-6 text-lavender">
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-sage">
                  Success
                </p>
                <p className="mt-2 text-base">{message}</p>
              </div>
            ) : null}

            {error ? (
              error === WRONG_QR_MESSAGE ? (
                <div className="rounded-3xl border border-coral/30 bg-coral/10 p-6 text-lavender">
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-coral">
                    Scan blocked
                  </p>
                  <p className="mt-2 text-base">{error}</p>
                </div>
              ) : (
                <div className="rounded-3xl border border-coral/30 bg-coral/10 p-6 text-lavender">
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-coral">
                    Error
                  </p>
                  <p className="mt-2 text-base">{error}</p>
                </div>
              )
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
