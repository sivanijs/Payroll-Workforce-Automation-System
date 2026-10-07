import assert from "node:assert/strict";
import test from "node:test";
import { getTasksForUserWithClient } from "../lib/tasks-core.mjs";

function matchesWhere(task, where) {
  if (!where || Object.keys(where).length === 0) {
    return true;
  }

  if (Array.isArray(where.OR) && !where.OR.some((entry) => matchesWhere(task, entry))) {
    return false;
  }

  if (
    Object.prototype.hasOwnProperty.call(where, "assignedToId") &&
    task.assignedToId !== where.assignedToId
  ) {
    return false;
  }

  if (
    Object.prototype.hasOwnProperty.call(where, "assignedById") &&
    task.assignedById !== where.assignedById
  ) {
    return false;
  }

  if (
    Object.prototype.hasOwnProperty.call(where, "status") &&
    task.status !== where.status
  ) {
    return false;
  }

  return true;
}

function createMockClient(tasks) {
  const calls = [];

  return {
    calls,
    task: {
      async findMany(args) {
        calls.push(args);
        return tasks.filter((task) => matchesWhere(task, args.where));
      },
    },
  };
}

test("manager task list includes tasks assigned to the manager and tasks the manager created", async () => {
  const client = createMockClient([
    { id: 1, assignedToId: 43, assignedById: 1, status: "pending" },
    { id: 2, assignedToId: 44, assignedById: 43, status: "submitted" },
    { id: 3, assignedToId: 44, assignedById: 1, status: "in_progress" },
    { id: 4, assignedToId: 45, assignedById: 1, status: "confirmed" },
  ]);

  const tasks = await getTasksForUserWithClient(client, { id: 43, role: "manager" }, {});

  assert.deepEqual(
    tasks.map((task) => task.id),
    [1, 2]
  );
  assert.deepEqual(client.calls[0].where.OR, [
    { assignedToId: 43 },
    { assignedById: 43 },
  ]);
});

test("employee task list only includes tasks assigned to that employee", async () => {
  const client = createMockClient([
    { id: 1, assignedToId: 44, assignedById: 43, status: "submitted" },
    { id: 2, assignedToId: 44, assignedById: 1, status: "pending" },
    { id: 3, assignedToId: 43, assignedById: 1, status: "pending" },
  ]);

  const tasks = await getTasksForUserWithClient(client, { id: 44, role: "employee" }, {});

  assert.deepEqual(
    tasks.map((task) => task.id),
    [1, 2]
  );
  assert.equal(client.calls[0].where.assignedToId, 44);
});

test("admin task list remains unrestricted", async () => {
  const client = createMockClient([
    { id: 1, assignedToId: 44, assignedById: 43, status: "submitted" },
    { id: 2, assignedToId: 43, assignedById: 1, status: "pending" },
  ]);

  const tasks = await getTasksForUserWithClient(client, { id: 1, role: "admin" }, {});

  assert.deepEqual(
    tasks.map((task) => task.id),
    [1, 2]
  );
  assert.deepEqual(client.calls[0].where, {});
});
