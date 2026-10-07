"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import WorkspaceHeader from "./WorkspaceHeader";
import TaskDatePicker from "./TaskDatePicker";
import {
  CalendarDays,
  CheckCheck,
  CircleDot,
  Plus,
  UserRound,
  X,
} from "lucide-react";

const emptyForm = {
  title: "",
  description: "",
  assignedToId: "",
  dueDate: "",
};

const emptyReview = {
  comment: "",
  nextStatus: "pending",
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-IN");
}

function normalizeDateKey(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function formatTaskStatusLabel(status) {
  const normalized = normalizeStatus(status);

  if (!normalized) {
    return "-";
  }

  return normalized
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTaskStatusBadgeClass(status) {
  switch (normalizeStatus(status)) {
    case "pending":
      return "border-sage/35 bg-royal-purple text-lavender";
    case "in_progress":
      return "border-royal-purple/30 bg-royal-purple/10 text-lavender";
    case "submitted":
      return "border-eminence/35 bg-eminence/12 text-lavender";
    case "confirmed":
      return "border-sage/30 bg-sage/10 text-lavender";
    default:
      return "border-sage/35 bg-royal-purple text-lavender";
  }
}

function isTaskOverdue(task, referenceDate = new Date()) {
  if (!task?.dueDate) {
    return false;
  }

  if (normalizeStatus(task.status) === "confirmed") {
    return false;
  }

  const dueDate = new Date(task.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  const endOfDay = new Date(dueDate);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime() < referenceDate.getTime();
}

function roleAllowsTaskCreation(role) {
  return role === "admin" || role === "manager";
}

export default function TaskManagementClient({
  role,
  title,
  description,
  headerDisplayName,
  headerRole,
  currentUserId,
  initialTasks,
  initialAssignableEmployees = [],
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingTaskId, setLoadingTaskId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateSaving, setIsCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [reviewTask, setReviewTask] = useState(null);
  const [reviewForm, setReviewForm] = useState(emptyReview);
  const [filters, setFilters] = useState({
    employeeId: "",
    managerId: "",
    status: "",
    dueDate: "",
  });

  const assignableEmployees = useMemo(() => initialAssignableEmployees, [initialAssignableEmployees]);

  const creatorOptions = useMemo(() => {
    const map = new Map();

    for (const task of tasks) {
      if (!task.assignedBy) {
        continue;
      }

      map.set(task.assignedBy.id, task.assignedBy);
    }

    return Array.from(map.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.employeeId && String(task.assignedToId) !== filters.employeeId) {
        return false;
      }

      if (role === "admin" && filters.managerId && String(task.assignedById) !== filters.managerId) {
        return false;
      }

      if (filters.status && task.status !== filters.status) {
        return false;
      }

      if (filters.dueDate && normalizeDateKey(task.dueDate) !== filters.dueDate) {
        return false;
      }

      return true;
    });
  }, [filters, role, tasks]);

  function openCreateModal() {
    setError("");
    setMessage("");
    setCreateForm({
      title: "",
      description: "",
      assignedToId: assignableEmployees[0]?.id ? String(assignableEmployees[0].id) : "",
      dueDate: "",
    });
    setIsCreateOpen(true);
  }

  function closeCreateModal() {
    setIsCreateOpen(false);
    setCreateForm(emptyForm);
  }

  function closeReviewModal() {
    setReviewTask(null);
    setReviewForm(emptyReview);
  }

  async function createTask(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsCreateSaving(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to create task.");
      }

      setTasks((current) => [data.task, ...current]);
      setMessage("Task created successfully.");
      closeCreateModal();
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to create task.");
    } finally {
      setIsCreateSaving(false);
    }
  }

  async function updateTask(taskId, action, payload = {}) {
    setLoadingTaskId(taskId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to update task.");
      }

      setTasks((current) =>
        current.map((task) => (task.id === taskId ? data.task : task))
      );
      setMessage("Task updated successfully.");
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to update task.");
    } finally {
      setLoadingTaskId(null);
    }
  }

  function openReviewModal(task) {
    setReviewTask(task);
    setReviewForm({
      comment: "",
      nextStatus: "pending",
    });
  }

  async function confirmTask(taskId) {
    await updateTask(taskId, "confirm");
  }

  async function rejectTask(event) {
    event.preventDefault();

    if (!reviewTask) {
      return;
    }

    await updateTask(reviewTask.id, "reject", {
      comment: reviewForm.comment,
      nextStatus: reviewForm.nextStatus,
    });
    closeReviewModal();
  }

  function renderTaskActions(task) {
    const isCurrentAssignee = currentUserId != null && task.assignedToId === currentUserId;
    const isTaskCreator = currentUserId != null && task.assignedById === currentUserId;

    if (role === "employee") {
      if (isCurrentAssignee && task.status === "pending") {
        return (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loadingTaskId === task.id}
              onClick={() => updateTask(task.id, "start")}
              className="inline-flex items-center gap-1.5 rounded-full border border-royal-purple/30 bg-royal-purple/10 px-3 py-1.5 text-xs font-semibold text-lavender transition hover:bg-royal-purple/20 disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:hover:bg-pakistan-green/80"
            >
              <CircleDot size={14} />
              In Progress
            </button>
            <button
              type="button"
              disabled={loadingTaskId === task.id}
              onClick={() => updateTask(task.id, "submit")}
              className="inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-3 py-1.5 text-xs font-semibold text-lavender transition hover:bg-sage/20 disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:hover:bg-pakistan-green/80"
            >
              <CheckCheck size={14} />
              Mark as Done
            </button>
          </div>
        );
      }

      if (isCurrentAssignee && task.status === "in_progress") {
        return (
          <button
            type="button"
            disabled={loadingTaskId === task.id}
            onClick={() => updateTask(task.id, "submit")}
            className="inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-3 py-1.5 text-xs font-semibold text-lavender transition hover:bg-sage/20 disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:hover:bg-pakistan-green/80"
          >
            <CheckCheck size={14} />
            Mark as Done
          </button>
        );
      }

      return <span className="text-xs text-gray">No actions available.</span>;
    }

    if (role === "admin") {
      if (task.status === "submitted") {
        return (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loadingTaskId === task.id}
              onClick={() => confirmTask(task.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-3 py-1.5 text-xs font-semibold text-lavender transition hover:bg-sage/20 disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:hover:bg-pakistan-green/80"
            >
              <CheckCheck size={14} />
              Confirm
            </button>
            <button
              type="button"
              disabled={loadingTaskId === task.id}
              onClick={() => openReviewModal(task)}
              className="inline-flex items-center gap-1.5 rounded-full border border-eminence/35 bg-eminence/12 px-3 py-1.5 text-xs font-semibold text-lavender transition hover:bg-eminence/20 disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:hover:bg-pakistan-green/80"
            >
              Reject / Reopen
            </button>
          </div>
        );
      }

      return <span className="text-xs text-gray">No review actions.</span>;
    }

    if (role === "manager") {
      if (isCurrentAssignee && task.status === "pending") {
        return (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loadingTaskId === task.id}
              onClick={() => updateTask(task.id, "start")}
              className="inline-flex items-center gap-1.5 rounded-full border border-royal-purple/30 bg-royal-purple/10 px-3 py-1.5 text-xs font-semibold text-lavender transition hover:bg-royal-purple/20 disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:hover:bg-pakistan-green/80"
            >
              <CircleDot size={14} />
              In Progress
            </button>
            <button
              type="button"
              disabled={loadingTaskId === task.id}
              onClick={() => updateTask(task.id, "submit")}
              className="inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-3 py-1.5 text-xs font-semibold text-lavender transition hover:bg-sage/20 disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:hover:bg-pakistan-green/80"
            >
              <CheckCheck size={14} />
              Mark as Done
            </button>
          </div>
        );
      }

      if (isCurrentAssignee && task.status === "in_progress") {
        return (
          <button
            type="button"
            disabled={loadingTaskId === task.id}
            onClick={() => updateTask(task.id, "submit")}
            className="inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-3 py-1.5 text-xs font-semibold text-lavender transition hover:bg-sage/20 disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:hover:bg-pakistan-green/80"
          >
            <CheckCheck size={14} />
            Mark as Done
          </button>
        );
      }

      if (task.status === "submitted" && isTaskCreator) {
        return (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loadingTaskId === task.id}
              onClick={() => confirmTask(task.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-3 py-1.5 text-xs font-semibold text-lavender transition hover:bg-sage/20 disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:hover:bg-pakistan-green/80"
            >
              <CheckCheck size={14} />
              Confirm
            </button>
            <button
              type="button"
              disabled={loadingTaskId === task.id}
              onClick={() => openReviewModal(task)}
              className="inline-flex items-center gap-1.5 rounded-full border border-eminence/35 bg-eminence/12 px-3 py-1.5 text-xs font-semibold text-lavender transition hover:bg-eminence/20 disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:hover:bg-pakistan-green/80"
            >
              Reject / Reopen
            </button>
          </div>
        );
      }

      return <span className="text-xs text-gray">No actions available.</span>;
    }

    if (task.status === "submitted") {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loadingTaskId === task.id}
            onClick={() => confirmTask(task.id)}
            className="inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-3 py-1.5 text-xs font-semibold text-lavender transition hover:bg-sage/20 disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:hover:bg-pakistan-green/80"
          >
            <CheckCheck size={14} />
            Confirm
          </button>
          <button
            type="button"
            disabled={loadingTaskId === task.id}
            onClick={() => openReviewModal(task)}
            className="inline-flex items-center gap-1.5 rounded-full border border-eminence/35 bg-eminence/12 px-3 py-1.5 text-xs font-semibold text-lavender transition hover:bg-eminence/20 disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:hover:bg-pakistan-green/80"
          >
            Reject / Reopen
          </button>
        </div>
      );
    }

    return <span className="text-xs text-gray">No review actions.</span>;
  }

  function renderFilters() {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {role !== "employee" ? (
          <SelectField
            label="Employee"
            value={filters.employeeId}
            onChange={(value) => setFilters({ ...filters, employeeId: value })}
            options={[
              { label: "All employees", value: "" },
              ...assignableEmployees.map((employee) => ({
                label: `${employee.name} (${employee.email})`,
                value: String(employee.id),
              })),
            ]}
            icon={UserRound}
          />
        ) : null}
        {role === "admin" ? (
          <SelectField
            label="Created By"
            value={filters.managerId}
            onChange={(value) => setFilters({ ...filters, managerId: value })}
            options={[
              { label: "All creators", value: "" },
              ...creatorOptions.map((employee) => ({
                label: `${employee.name} (${employee.role})`,
                value: String(employee.id),
              })),
            ]}
            icon={UserRound}
          />
        ) : null}
        <SelectField
          label="Status"
          value={filters.status}
          onChange={(value) => setFilters({ ...filters, status: value })}
          options={[
            { label: "All statuses", value: "" },
            { label: "Pending", value: "pending" },
            { label: "In Progress", value: "in_progress" },
            { label: "Submitted", value: "submitted" },
            { label: "Confirmed", value: "confirmed" },
          ]}
          icon={CircleDot}
        />
        <Field
          label="Due Date"
          type="date"
          value={filters.dueDate}
          onChange={(value) => setFilters({ ...filters, dueDate: value })}
          icon={CalendarDays}
        />
      </div>
    );
  }

  return (
    <main
      className={`min-h-screen bg-[linear-gradient(180deg,#271202_0%,#491804_48%,#271202_100%)] text-lavender ${
        role === "employee" ? "" : "lg:grid lg:grid-cols-[300px_1fr]"
      }`}
    >
      {role === "employee" ? null : <Sidebar role={role} />}
      <section className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <WorkspaceHeader
            displayName={headerDisplayName}
            role={headerRole || role}
            variant="dark"
          />
          <header className="rounded-[1.75rem] border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_70px_rgba(30,18,18,0.28)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.35em] text-sage">
              {role} panel
            </p>
            <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-lavender">{title}</h1>
                <p className="text-sm text-gray">{description}</p>
              </div>
              {roleAllowsTaskCreation(role) ? (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-2xl border border-sage/35 bg-royal-purple px-4 py-2.5 text-sm font-semibold text-lavender transition hover:bg-royal-purple/20"
                >
                  <Plus size={16} />
                  New task
                </button>
              ) : null}
            </div>
          </header>

          {roleAllowsTaskCreation(role) ? (
            <section className="space-y-4 rounded-[1.75rem] border border-sage/35 bg-pakistan-green/92 p-6 shadow-[0_24px_70px_rgba(30,18,18,0.28)] backdrop-blur">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-lavender">Task filters</h2>
                  <p className="text-sm text-gray">
                    Narrow the table by employee, creator, status, or due date.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFilters({
                      employeeId: "",
                      managerId: "",
                      status: "",
                      dueDate: "",
                    })
                  }
                  className="rounded-2xl border border-sage/35 bg-royal-purple px-4 py-2.5 text-sm font-medium text-lavender transition hover:bg-royal-purple/20"
                >
                  Clear filters
                </button>
              </div>
              {renderFilters()}
            </section>
          ) : null}

          <section className="overflow-hidden rounded-[1.75rem] border border-sage/35 bg-pakistan-green/92 shadow-[0_24px_70px_rgba(30,18,18,0.28)] backdrop-blur">
            <div className="border-b border-sage/25 bg-eminence/80 px-6 py-4">
              <h2 className="text-xl font-semibold text-lavender">Tasks</h2>
              <p className="text-sm text-gray">
                {filteredTasks.length} task{filteredTasks.length === 1 ? "" : "s"} shown
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-sage/20 text-left text-sm">
                <thead className="bg-eminence text-lavender">
                  <tr>
                    <Th>Task</Th>
                    {role === "employee" ? null : <Th>Assignee</Th>}
                    {role === "admin" ? <Th>Created By</Th> : null}
                    <Th>Due Date</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage/15">
                  {filteredTasks.map((task) => {
                    const overdue = isTaskOverdue(task);

                    return (
                      <tr key={task.id} className="align-top transition hover:bg-pakistan-green/88">
                        <Td>
                          <div className="space-y-2">
                            <div className="font-semibold text-lavender">{task.title}</div>
                            {task.description ? (
                              <p className="max-w-xl text-sm text-gray">{task.description}</p>
                            ) : (
                              <p className="text-sm text-gray">No description provided.</p>
                            )}
                            {task.reviewAction ? (
                              <div className="rounded-2xl border border-eminence/25 bg-eminence/10 px-3 py-2 text-xs text-lavender">
                                <span className="font-semibold uppercase tracking-[0.2em]">
                                  {task.reviewAction === "reopened" ? "Reopened" : "Rejected"}
                                </span>
                                {task.reviewComment ? (
                                  <p className="mt-1 text-lavender">{task.reviewComment}</p>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </Td>
                        {role === "employee" ? null : <Td>{task.assignedTo?.name || "-"}</Td>}
                        {role === "admin" ? <Td>{task.assignedBy?.name || "-"}</Td> : null}
                        <Td>
                          <div className="space-y-1">
                            <div>{formatDate(task.dueDate)}</div>
                            {overdue ? (
                              <span className="inline-flex rounded-full border border-eminence/35 bg-eminence/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-lavender">
                                Overdue
                              </span>
                            ) : null}
                          </div>
                        </Td>
                        <Td>
                          <div className="space-y-2">
                            <StatusBadge status={task.status} />
                            {task.status === "submitted" ? (
                              <span className="text-xs text-coral">Awaiting review</span>
                            ) : null}
                          </div>
                        </Td>
                        <Td>{renderTaskActions(task)}</Td>
                      </tr>
                    );
                  })}
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={role === "employee" ? 4 : role === "admin" ? 6 : 5}
                        className="px-6 py-12 text-center text-gray"
                      >
                        No tasks found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      {isCreateOpen ? (
        <ModalOverlay>
          <form
            onSubmit={createTask}
            className="max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-y-auto space-y-5 rounded-[1.75rem] border border-sage/35 bg-pakistan-green/96 p-6 shadow-[0_24px_70px_rgba(30,18,18,0.42)] backdrop-blur"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-lavender">Create task</h2>
                <p className="mt-1 text-sm text-gray">
                  Assign a new task to someone in your scope.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                aria-label="Close form"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sage/35 bg-royal-purple text-lavender transition hover:bg-royal-purple/20"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Title"
                value={createForm.title}
                onChange={(value) => setCreateForm({ ...createForm, title: value })}
                icon={CheckCheck}
              />
              <SelectField
                label="Assign To"
                value={createForm.assignedToId}
                onChange={(value) =>
                  setCreateForm({ ...createForm, assignedToId: value })
                }
                options={[
                  { label: "Select employee", value: "" },
                  ...assignableEmployees.map((employee) => ({
                    label: `${employee.name} (${employee.email})`,
                    value: String(employee.id),
                  })),
                ]}
                icon={UserRound}
              />
              <TaskDatePicker
                label="Due Date"
                value={createForm.dueDate}
                onChange={(value) => setCreateForm({ ...createForm, dueDate: value })}
                placeholder="Select due date"
              />
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-lavender">Description</span>
                <textarea
                  value={createForm.description}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, description: event.target.value })
                  }
                  className="min-h-28 w-full rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 text-lavender outline-none placeholder:text-gray"
                  placeholder="Task details"
                />
              </label>
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
                disabled={isCreateSaving}
                className="inline-flex items-center gap-2 rounded-2xl bg-sage px-4 py-2.5 font-semibold text-lavender shadow-lg shadow-black/20 transition hover:bg-eminence disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:shadow-none disabled:hover:bg-pakistan-green/80"
              >
                <Plus size={16} />
                {isCreateSaving ? "Creating..." : "Create task"}
              </button>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-2xl border border-sage/35 bg-royal-purple px-4 py-2.5 font-medium text-lavender transition hover:bg-royal-purple/20"
              >
                Cancel
              </button>
            </div>
          </form>
        </ModalOverlay>
      ) : null}

      {reviewTask ? (
        <ModalOverlay>
          <form
            onSubmit={rejectTask}
            className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto space-y-5 rounded-[1.75rem] border border-sage/35 bg-pakistan-green/96 p-6 shadow-[0_24px_70px_rgba(30,18,18,0.42)] backdrop-blur"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-lavender">
                  Reject / Reopen Task
                </h2>
                <p className="mt-1 text-sm text-gray">
                  Add feedback and optionally reopen the task as pending or in progress.
                </p>
              </div>
              <button
                type="button"
                onClick={closeReviewModal}
                aria-label="Close review"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sage/35 bg-royal-purple text-lavender transition hover:bg-royal-purple/20"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-sage/25 bg-royal-purple px-4 py-3 text-sm text-gray">
              <p className="font-semibold text-lavender">{reviewTask.title}</p>
              <p className="mt-1">{reviewTask.assignedTo?.name || "-"}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Return To"
                value={reviewForm.nextStatus}
                onChange={(value) => setReviewForm({ ...reviewForm, nextStatus: value })}
                options={[
                  { label: "Pending", value: "pending" },
                  { label: "In Progress", value: "in_progress" },
                ]}
                icon={CircleDot}
              />
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-lavender">
                  Comment
                </span>
                <textarea
                  value={reviewForm.comment}
                  onChange={(event) =>
                    setReviewForm({ ...reviewForm, comment: event.target.value })
                  }
                  className="min-h-28 w-full rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 text-lavender outline-none placeholder:text-gray"
                  placeholder="Optional feedback for the employee"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loadingTaskId === reviewTask.id}
                className="inline-flex items-center gap-2 rounded-2xl bg-sage px-4 py-2.5 font-semibold text-lavender shadow-lg shadow-black/20 transition hover:bg-eminence disabled:cursor-not-allowed disabled:border-gray/30 disabled:bg-pakistan-green/80 disabled:text-gray disabled:shadow-none disabled:hover:bg-pakistan-green/80"
              >
                Reject / Reopen
              </button>
              <button
                type="button"
                onClick={closeReviewModal}
                className="rounded-2xl border border-sage/35 bg-royal-purple px-4 py-2.5 font-medium text-lavender transition hover:bg-royal-purple/20"
              >
                Cancel
              </button>
            </div>
          </form>
        </ModalOverlay>
      ) : null}
    </main>
  );
}

function ModalOverlay({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pakistan-green/75 px-4 py-6 backdrop-blur-sm">
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", icon: Icon }) {
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

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getTaskStatusBadgeClass(
        status
      )}`}
    >
      {formatTaskStatusLabel(status)}
    </span>
  );
}

function Th({ children }) {
  return <th className="px-6 py-4 font-semibold tracking-wide">{children}</th>;
}

function Td({ children }) {
  return <td className="px-6 py-4 text-lavender">{children}</td>;
}


