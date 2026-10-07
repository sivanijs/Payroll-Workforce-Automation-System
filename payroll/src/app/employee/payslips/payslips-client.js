"use client";

"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import PayslipPDF from "../../../../components/PayslipPDF";
import WorkspaceHeader from "../../../../components/WorkspaceHeader";
import { getMonthLabel } from "../../../../lib/payslipUtils";

export default function PayslipsClient({
  payslips,
  headerDisplayName,
  headerRole,
}) {
  return (
    <main className="min-h-screen bg-pakistan-green px-4 py-10 text-lavender">
      <div className="mx-auto max-w-6xl space-y-6">
        <WorkspaceHeader
          displayName={headerDisplayName}
          role={headerRole || "employee"}
          variant="dark"
        />
        <header className="rounded-3xl border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_70px_rgba(20,49,9,0.28)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-sage">
            Employee
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-lavender">My Payslips</h1>
          <p className="mt-2 text-sm text-gray">
            Download PDF copies of your payslips.
          </p>
        </header>

        <div className="overflow-hidden rounded-3xl border border-sage/35 bg-pakistan-green/92 shadow-[0_24px_70px_rgba(20,49,9,0.28)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-sage/20 text-left text-sm">
              <thead className="bg-royal-purple/10 text-lavender">
                <tr>
                  <Th>Month</Th>
                  <Th>Year</Th>
                  <Th>Net Salary</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/15">
                {payslips.map((payslip) => (
                  <tr key={payslip.id} className="hover:bg-royal-purple/10">
                    <Td>{getMonthLabel(payslip.month, payslip.year)}</Td>
                    <Td>{payslip.year}</Td>
                    <Td>{Number(payslip.netSalary).toLocaleString("en-IN")}</Td>
                    <Td>
                      <PDFDownloadLink
                        document={<PayslipPDF payslip={payslip} />}
                        fileName={`payslip-${payslip.month}-${payslip.year}.pdf`}
                        className="inline-flex rounded-2xl bg-royal-purple px-4 py-2.5 font-semibold text-lavender shadow-lg shadow-black/20 transition hover:bg-eminence"
                      >
                        {({ loading }) => (loading ? "Preparing PDF..." : "Download PDF")}
                      </PDFDownloadLink>
                    </Td>
                  </tr>
                ))}
                {payslips.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray">
                      No payslips found.
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

function Th({ children }) {
  return <th className="px-6 py-4 font-semibold tracking-wide">{children}</th>;
}

function Td({ children }) {
  return <td className="px-6 py-4 text-lavender">{children}</td>;
}
