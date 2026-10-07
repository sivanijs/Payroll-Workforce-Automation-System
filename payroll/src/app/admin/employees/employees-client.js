"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../../../components/Sidebar";
import WorkspaceHeader from "../../../../components/WorkspaceHeader";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Edit3,
  EyeOff,
  LockKeyhole,
  Mail,
  Plus,
  X,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "employee",
  designation: "",
  basicSalary: "",
  hra: "",
  allowance: "",
  managerId: "",
  dateOfJoining: "",
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN");
}

function toInputDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function normalizeEmployee(employee) {
  return {
    ...employee,
    dateOfJoining: toInputDate(employee.dateOfJoining),
  };
}

const roleBadgeClasses = {
  admin: "border-royal-purple/30 bg-royal-purple/10 text-lavender",
  manager: "border-sage/30 bg-sage/10 text-royal-purple",
  employee: "border-sage/25 bg-pakistan-green/50 text-slate-200",
};

export default function EmployeesClient({
  initialEmployees,
  initialManagers,
  initialRole,
  initialDisplayName,
}) {
  const router = useRouter();
  const [authRole, setAuthRole] = useState(initialRole);
  const [employees, setEmployees] = useState(
    initialEmployees.map(normalizeEmployee)
  );
  const [managers, setManagers] = useState(initialManagers);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function verifyRole() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        const role = data?.user?.role || null;

        if (ignore) {
          return;
        }

        setAuthRole(role);
        if (role !== "admin") {
          router.replace("/login");
        }
      } catch {
        if (!ignore) {
          router.replace("/login");
        }
      }
    }

    verifyRole();

    return () => {
      ignore = true;
    };
  }, [router]);

  const managerOptions = useMemo(() => managers, [managers]);

  function openCreateForm() {
    setEditingId(null);
    setMessage("");
    setError("");
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function startEdit(employee) {
    setEditingId(employee.id);
    setMessage("");
    setError("");
    setForm({
      name: employee.name || "",
      email: employee.email || "",
      password: "",
      role: employee.role || "employee",
      designation: employee.designation || "",
      basicSalary: employee.basicSalary?.toString() || "",
      hra: employee.hra?.toString() || "",
      allowance: employee.allowance?.toString() || "",
      managerId: employee.managerId ? String(employee.managerId) : "",
      dateOfJoining: employee.dateOfJoining || "",
    });
    setIsFormOpen(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(false);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const payload = {
        ...form,
        managerId: form.managerId ? Number(form.managerId) : null,
      };

      const response = await fetch(
        editingId ? `/api/employees/${editingId}` : "/api/employees",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to save employee.");
      }

      const savedEmployee = normalizeEmployee(data.employee);

      if (editingId) {
        setEmployees((current) =>
          current.map((employee) =>
            employee.id === editingId ? savedEmployee : employee
          )
        );
      } else {
        setEmployees((current) => [savedEmployee, ...current]);
      }

      if (savedEmployee.role === "manager") {
        setManagers((current) => {
          const exists = current.some(
            (manager) => manager.id === savedEmployee.id
          );
          return exists
            ? current.map((manager) =>
                manager.id === savedEmployee.id ? savedEmployee : manager
              )
            : [savedEmployee, ...current];
        });
      } else {
        setManagers((current) =>
          current.filter((manager) => manager.id !== savedEmployee.id)
        );
      }

      setMessage(
        editingId
          ? "Employee updated successfully."
          : "Employee created successfully."
      );
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to save employee.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(employeeId) {
    const confirmed = window.confirm("Delete this employee?");
    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to delete employee.");
      }

      setEmployees((current) =>
        current.filter((employee) => employee.id !== employeeId)
      );
      setManagers((current) =>
        current.filter((manager) => manager.id !== employeeId)
      );

      if (editingId === employeeId) {
        resetForm();
      }

      setMessage("Employee deleted successfully.");
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to delete employee.");
    }
  }

  if (authRole !== "admin") {
    return (
      <main className="min-h-screen bg-pakistan-green px-4 py-12 text-lavender">
        <div className="mx-auto max-w-4xl rounded-3xl border border-sage/35 bg-pakistan-green/92 p-8 shadow-[0_24px_70px_rgba(30,18,18,0.28)]">
          <p className="text-lg">Checking access...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pakistan-green text-lavender lg:grid lg:grid-cols-[300px_1fr]">
      <Sidebar role="admin" />
      <section className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <WorkspaceHeader
            displayName={initialDisplayName}
            role={initialRole || "admin"}
            variant="dark"
          />
          <header className="rounded-[1.75rem] border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_70px_rgba(30,18,18,0.28)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.35em] text-sage">
              Admin panel
            </p>
            <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-lavender">Employees</h1>
                <p className="text-sm text-gray">
                  Create, update, and manage the employee directory.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-2xl border border-sage/35 bg-royal-purple px-4 py-2.5 text-sm font-semibold text-lavender transition hover:bg-royal-purple/20"
              >
                <Plus size={16} />
                New employee
              </button>
            </div>
          </header>

          <section className="space-y-8">
            {isFormOpen ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-pakistan-green/75 px-4 py-6 backdrop-blur-sm">
                <form
                  onSubmit={handleSubmit}
                  className="max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-y-auto space-y-5 rounded-[1.75rem] border border-sage/35 bg-pakistan-green/96 p-6 shadow-[0_24px_70px_rgba(30,18,18,0.42)] backdrop-blur"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-lavender">
                        {editingId ? "Edit employee" : "Add employee"}
                      </h2>
                      {editingId ? (
                        <span className="mt-2 inline-flex rounded-full border border-sage/35 bg-royal-purple px-3 py-1 text-xs font-medium text-lavender">
                          Editing #{editingId}
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={resetForm}
                      aria-label="Close form"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sage/35 bg-royal-purple text-lavender transition hover:bg-royal-purple/20"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Name"
                      icon={UserRound}
                      value={form.name}
                      onChange={(value) => setForm({ ...form, name: value })}
                    />
                    <Field
                      label="Email"
                      type="email"
                      icon={Mail}
                      value={form.email}
                      onChange={(value) => setForm({ ...form, email: value })}
                    />
                    <Field
                      label="Password"
                      type="password"
                      icon={LockKeyhole}
                      value={form.password}
                      onChange={(value) => setForm({ ...form, password: value })}
                      placeholder={editingId ? "Leave blank to keep current" : ""}
                    />
                    <SelectField
                      label="Role"
                      icon={UsersRound}
                      value={form.role}
                      onChange={(value) => setForm({ ...form, role: value })}
                      options={[
                        { label: "Admin", value: "admin" },
                        { label: "Manager", value: "manager" },
                        { label: "Employee", value: "employee" },
                      ]}
                    />
                    <Field
                      label="Designation"
                      icon={BriefcaseBusiness}
                      value={form.designation}
                      onChange={(value) =>
                        setForm({ ...form, designation: value })
                      }
                    />
                    <SelectField
                      label="Manager"
                      icon={UsersRound}
                      value={form.managerId}
                      onChange={(value) => setForm({ ...form, managerId: value })}
                      options={[
                        { label: "No manager", value: "" },
                        ...managerOptions.map((manager) => ({
                          label: `${manager.name} (${manager.email})`,
                          value: String(manager.id),
                        })),
                      ]}
                    />
                    <Field
                      label="Basic Salary"
                      type="number"
                      icon={BadgeDollarSign}
                      value={form.basicSalary}
                      onChange={(value) => setForm({ ...form, basicSalary: value })}
                    />
                    <Field
                      label="HRA"
                      type="number"
                      icon={CircleDollarSign}
                      value={form.hra}
                      onChange={(value) => setForm({ ...form, hra: value })}
                    />
                    <Field
                      label="Allowance"
                      type="number"
                      icon={CircleDollarSign}
                      value={form.allowance}
                      onChange={(value) => setForm({ ...form, allowance: value })}
                    />
                    <Field
                      label="Date of joining"
                      type="date"
                      icon={CalendarDays}
                      value={form.dateOfJoining}
                      onChange={(value) => setForm({ ...form, dateOfJoining: value })}
                    />
                  </div>

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

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-2xl bg-sage px-4 py-2.5 font-semibold text-lavender shadow-lg shadow-black/20 transition hover:bg-eminence disabled:opacity-70"
                    >
                      <Plus size={16} />
                      {isSaving
                        ? "Saving..."
                        : editingId
                        ? "Update employee"
                        : "Create employee"}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-2xl border border-sage/35 bg-royal-purple px-4 py-2.5 font-medium text-lavender transition hover:bg-royal-purple/20"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            <div className="w-full overflow-hidden rounded-[1.75rem] border border-sage/35 bg-pakistan-green/92 shadow-[0_24px_70px_rgba(30,18,18,0.28)] backdrop-blur">
              <div className="border-b border-sage/25 bg-eminence/80 px-6 py-4">
                <h2 className="text-xl font-semibold text-lavender">All employees</h2>
                <p className="text-sm text-gray">
                  {employees.length} employee{employees.length === 1 ? "" : "s"} total
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sage/20 text-left text-sm">
                  <thead className="bg-eminence text-lavender">
                    <tr>
                      <Th>Name</Th>
                      <Th>Email</Th>
                      <Th>Designation</Th>
                      <Th>Salary</Th>
                      <Th>QR Code</Th>
                      <Th>Joined</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage/15">
                    {employees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="group align-top transition hover:bg-pakistan-green/88"
                      >
                        <Td>{employee.name}</Td>
                        <Td>{employee.email}</Td>
                        <Td>
                          <div className="space-y-2">
                            <div className="font-medium text-lavender">
                              {employee.designation}
                            </div>
                            <div className="inline-flex rounded-full border border-sage/35 bg-royal-purple px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-lavender">
                              {employee.role}
                            </div>
                          </div>
                        </Td>
                        <Td>
                          {Number(employee.basicSalary || 0).toLocaleString("en-IN")}
                        </Td>
                        <Td>
                          {employee.qrCode ? (
                            <div className="flex flex-col items-start gap-2">
                              <Image
                                src={employee.qrCode}
                                alt={`QR code for ${employee.name}`}
                                width={80}
                                height={80}
                                unoptimized
                                className="h-20 w-20 rounded-2xl border border-sage/35 bg-pakistan-green p-1 shadow-lg"
                              />
                              <span className="text-xs text-gray">
                                ID QR generated
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex rounded-full border border-sage/35 bg-royal-purple px-2.5 py-1 text-xs text-gray">
                              Not generated yet
                            </span>
                          )}
                        </Td>
                        <Td>{formatDate(employee.dateOfJoining)}</Td>
                        <Td>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(employee)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-sage/35 bg-royal-purple px-3 py-1.5 text-xs font-semibold text-lavender transition hover:bg-royal-purple/20"
                            >
                              <Edit3 size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(employee.id)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-coral/30 bg-coral/10 px-3 py-1.5 text-xs font-semibold text-lavender transition hover:bg-coral/20"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </Td>
                      </tr>
                    ))}
                    {employees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-gray"
                        >
                          No employees yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  icon: Icon,
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-lavender">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray">
          <Icon size={16} strokeWidth={2} />
        </span>
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 pl-11 text-lavender outline-none transition placeholder:text-gray focus:border-sage focus:ring-2 focus:ring-sage/30"
        />
      </div>
    </label>
  );
}

function SelectField({ label, value, onChange, options, icon: Icon }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-lavender">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray">
          <Icon size={16} strokeWidth={2} />
        </span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 pl-11 text-lavender outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/30"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function Th({ children }) {
  return <th className="px-6 py-4 font-semibold tracking-wide">{children}</th>;
}

function Td({ children }) {
  return <td className="px-6 py-4 text-lavender">{children}</td>;
}


