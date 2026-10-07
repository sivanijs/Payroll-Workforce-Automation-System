import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import {
  getAbsenceDeductionFromPayslip,
  getMonthLabel,
} from "../lib/payslipUtils";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  header: {
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  company: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    color: "#6B7280",
  },
  section: {
    marginBottom: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    color: "#6B7280",
  },
  value: {
    fontWeight: 700,
  },
  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  cellHeader: {
    backgroundColor: "#F3F4F6",
    fontWeight: 700,
  },
  footer: {
    marginTop: 18,
    color: "#6B7280",
    fontSize: 10,
  },
});

export default function PayslipPDF({ payslip }) {
  const absenceDeduction = getAbsenceDeductionFromPayslip(payslip);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.company}>Workora</Text>
          <Text style={styles.title}>Payslip</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Employee Name</Text>
            <Text style={styles.value}>{payslip.employee?.name || "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Designation</Text>
            <Text style={styles.value}>{payslip.employee?.designation || "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Month / Year</Text>
            <Text style={styles.value}>{getMonthLabel(payslip.month, payslip.year)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Generated Date</Text>
            <Text style={styles.value}>{new Date(payslip.createdAt).toLocaleDateString("en-IN")}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.cellHeader]}>Component</Text>
            <Text style={[styles.cell, styles.cellHeader]}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cell}>Gross Salary</Text>
            <Text style={styles.cell}>{Number(payslip.grossSalary).toFixed(2)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cell}>PF</Text>
            <Text style={styles.cell}>{Number(payslip.pf).toFixed(2)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cell}>Tax</Text>
            <Text style={styles.cell}>{Number(payslip.tax).toFixed(2)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cell}>Absence Deduction</Text>
            <Text style={styles.cell}>{absenceDeduction.toFixed(2)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cell}>Net Salary</Text>
            <Text style={styles.cell}>{Number(payslip.netSalary).toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          This document was generated electronically for Workora.
        </Text>
      </Page>
    </Document>
  );
}

