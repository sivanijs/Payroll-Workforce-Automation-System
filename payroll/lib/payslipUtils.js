import { calculateNetSalary } from "./payrollMath";

export function getAbsenceDeductionFromPayslip(payslip) {
  const grossSalary = Number(payslip.grossSalary || 0);
  const pf = Number(payslip.pf || 0);
  const tax = Number(payslip.tax || 0);
  const netSalary = calculateNetSalary(grossSalary, pf, tax);

  return Number((grossSalary - pf - tax - netSalary).toFixed(2));
}

export function getMonthLabel(month, year) {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}
