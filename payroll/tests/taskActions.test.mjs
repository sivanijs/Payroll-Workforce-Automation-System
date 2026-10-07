import assert from "node:assert/strict";
import test from "node:test";
import { canReviewTask, canStartOrSubmitTask } from "../lib/task-actions-core.mjs";

test("assigned managers and employees can start or submit their tasks", () => {
  const managerTask = { assignedToId: 43 };
  const employeeTask = { assignedToId: 44 };

  assert.equal(canStartOrSubmitTask({ id: 43, role: "manager" }, managerTask), true);
  assert.equal(canStartOrSubmitTask({ id: 44, role: "employee" }, employeeTask), true);
  assert.equal(canStartOrSubmitTask({ id: 1, role: "admin" }, managerTask), false);
});

test("admins and task creators can review submitted tasks", () => {
  const taskCreatedByManager = { assignedById: 43 };
  const taskCreatedByAdmin = { assignedById: 1 };

  assert.equal(canReviewTask({ id: 1, role: "admin" }, taskCreatedByManager), true);
  assert.equal(canReviewTask({ id: 43, role: "manager" }, taskCreatedByManager), true);
  assert.equal(canReviewTask({ id: 43, role: "manager" }, taskCreatedByAdmin), false);
});
