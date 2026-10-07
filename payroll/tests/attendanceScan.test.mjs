import assert from "node:assert/strict";
import test from "node:test";
import { pickAttendanceRecord, processAttendanceScan } from "../lib/attendance-scan.mjs";

function createMockPrisma({ employee, attendanceRecords }) {
  let records = attendanceRecords.map((record) => ({ ...record }));
  let nextId = records.reduce((max, record) => Math.max(max, record.id || 0), 0) + 1;

  return {
    employee: {
      async findUnique() {
        return employee ? { ...employee } : null;
      },
    },
    attendance: {
      async findMany() {
        return records.map((record) => ({ ...record }));
      },
      async create({ data }) {
        const created = {
          id: nextId++,
          ...data,
        };
        records.push(created);
        return { ...created };
      },
      async update({ where, data }) {
        const index = records.findIndex((record) => record.id === where.id);
        if (index === -1) {
          throw new Error("Record not found.");
        }

        records[index] = {
          ...records[index],
          ...data,
        };

        return { ...records[index] };
      },
    },
    getRecords() {
      return records.map((record) => ({ ...record }));
    },
  };
}

test("nija can check in, then check out, then gets already checked out", async () => {
  const prisma = createMockPrisma({
    employee: { id: 40, name: "nija" },
    attendanceRecords: [],
  });

  const checkInResult = await processAttendanceScan({
    prisma,
    employeeId: 40,
    now: new Date("2026-08-14T05:37:54.810Z"),
  });

  assert.equal(checkInResult.status, 200);
  assert.equal(checkInResult.body.action, "check-in");
  assert.equal(checkInResult.body.attendance.checkIn.toISOString(), "2026-08-14T05:37:54.810Z");
  assert.equal(checkInResult.body.attendance.status, "present");

  const checkOutResult = await processAttendanceScan({
    prisma,
    employeeId: 40,
    now: new Date("2026-08-14T05:38:47.254Z"),
  });

  assert.equal(checkOutResult.status, 200);
  assert.equal(checkOutResult.body.action, "check-out");
  assert.equal(checkOutResult.body.attendance.checkOut.toISOString(), "2026-08-14T05:38:47.254Z");
  assert.equal(checkOutResult.body.attendance.status, "completed");

  const alreadyCheckedOutResult = await processAttendanceScan({
    prisma,
    employeeId: 40,
    now: new Date("2026-08-14T06:00:00.000Z"),
  });

  assert.equal(alreadyCheckedOutResult.status, 400);
  assert.equal(
    alreadyCheckedOutResult.body.message,
    "This employee has already checked out today."
  );
});

test("an open record wins over a completed duplicate for the same day", async () => {
  const prisma = createMockPrisma({
    employee: { id: 40, name: "nija" },
    attendanceRecords: [
      {
        id: 1,
        employeeId: 40,
        date: new Date("2026-08-13T18:30:00.000Z"),
        checkIn: new Date("2026-08-14T03:00:00.000Z"),
        checkOut: new Date("2026-08-14T04:00:00.000Z"),
        workingHours: 1,
        status: "completed",
      },
      {
        id: 2,
        employeeId: 40,
        date: new Date("2026-08-13T19:30:00.000Z"),
        checkIn: new Date("2026-08-14T05:00:00.000Z"),
        checkOut: null,
        workingHours: null,
        status: "present",
      },
    ],
  });

  const result = await processAttendanceScan({
    prisma,
    employeeId: 40,
    now: new Date("2026-08-14T05:45:00.000Z"),
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.action, "check-out");
  assert.equal(result.body.attendance.id, 2);
  assert.equal(result.body.attendance.status, "completed");
});

test("pickAttendanceRecord prefers open rows, then empty rows, then completed rows", () => {
  const record = pickAttendanceRecord([
    {
      id: 1,
      date: new Date("2026-08-14T00:00:00.000Z"),
      checkIn: new Date("2026-08-14T01:00:00.000Z"),
      checkOut: new Date("2026-08-14T02:00:00.000Z"),
    },
    {
      id: 2,
      date: new Date("2026-08-14T00:00:00.000Z"),
      checkIn: new Date("2026-08-14T03:00:00.000Z"),
      checkOut: null,
    },
  ]);

  assert.equal(record.id, 2);
});
