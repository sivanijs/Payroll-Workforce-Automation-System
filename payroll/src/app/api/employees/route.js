import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthUser, isAdmin } from "../../../../lib/auth";
import { generateEmployeeQrCode } from "../../../../lib/qrGenerator";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

const validRoles = new Set(["admin", "manager", "employee"]);

function parseNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function buildEmployeeData(body, { requirePassword = true } = {}) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";
  const role = typeof body?.role === "string" ? body.role : "";
  const designation =
    typeof body?.designation === "string" ? body.designation.trim() : "";
  const basicSalary = parseNumber(body?.basicSalary);
  const hra = parseNumber(body?.hra);
  const allowance = parseNumber(body?.allowance);
  const managerId = parseNumber(body?.managerId);
  const dateOfJoining = body?.dateOfJoining
    ? new Date(body.dateOfJoining)
    : null;

  if (
    !name ||
    !email ||
    (!password && requirePassword) ||
    !role ||
    !validRoles.has(role) ||
    !designation ||
    basicSalary === null ||
    hra === null ||
    allowance === null ||
    !dateOfJoining ||
    Number.isNaN(dateOfJoining.getTime())
  ) {
    return null;
  }

  return {
    name,
    email,
    password: password || null,
    role,
    designation,
    basicSalary,
    hra,
    allowance,
    managerId: Number.isFinite(managerId) ? managerId : null,
    dateOfJoining,
  };
}

export async function GET(request) {
  const user = getAuthUser(request);

  if (!isAdmin(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const employees = await prisma.employee.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      designation: true,
      basicSalary: true,
      hra: true,
      allowance: true,
      qrCode: true,
      dateOfJoining: true,
      managerId: true,
    },
  });

  return NextResponse.json({ employees });
}

export async function POST(request) {
  const user = getAuthUser(request);

  if (!isAdmin(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = buildEmployeeData(body);

    if (!data) {
      return NextResponse.json(
        { message: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const existingEmployee = await prisma.employee.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { message: "An employee with this email already exists." },
        { status: 409 }
      );
    }

    if (data.managerId !== null) {
      const manager = await prisma.employee.findUnique({
        where: { id: data.managerId },
        select: { id: true, role: true },
      });

      if (!manager || manager.role !== "manager") {
        return NextResponse.json(
          { message: "Manager must be an existing manager employee." },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        designation: data.designation,
        basicSalary: data.basicSalary,
        hra: data.hra,
        allowance: data.allowance,
        managerId: data.managerId,
        dateOfJoining: data.dateOfJoining,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        basicSalary: true,
        hra: true,
        allowance: true,
        qrCode: true,
        dateOfJoining: true,
        managerId: true,
      },
    });

    const qrCode = await generateEmployeeQrCode(employee.id);
    const employeeWithQr = await prisma.employee.update({
      where: { id: employee.id },
      data: { qrCode },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        basicSalary: true,
        hra: true,
        allowance: true,
        qrCode: true,
        dateOfJoining: true,
        managerId: true,
      },
    });

    return NextResponse.json({ employee: employeeWithQr }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Unable to create employee." },
      { status: 500 }
    );
  }
}
