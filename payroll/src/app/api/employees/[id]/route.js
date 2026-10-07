import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthUser, isAdmin } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

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

function buildEmployeeData(body) {
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

export async function PUT(request, context) {
  const user = getAuthUser(request);

  if (!isAdmin(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const params = await Promise.resolve(context?.params);
    const id = Number(params?.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ message: "Invalid employee id." }, { status: 400 });
    }

    const body = await request.json();
    const data = buildEmployeeData(body);

    if (!data) {
      return NextResponse.json(
        { message: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!employee) {
      return NextResponse.json(
        { message: "Employee not found." },
        { status: 404 }
      );
    }

    const existingEmail = await prisma.employee.findFirst({
      where: {
        email: data.email,
        NOT: { id },
      },
      select: { id: true },
    });

    if (existingEmail) {
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

    const updateData = {
      name: data.name,
      email: data.email,
      role: data.role,
      designation: data.designation,
      basicSalary: data.basicSalary,
      hra: data.hra,
      allowance: data.allowance,
      managerId: data.managerId,
      dateOfJoining: data.dateOfJoining,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ employee: updatedEmployee });
  } catch {
    return NextResponse.json(
      { message: "Unable to update employee." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  const user = getAuthUser(request);

  if (!isAdmin(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const params = await Promise.resolve(context?.params);
    const id = Number(params?.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ message: "Invalid employee id." }, { status: 400 });
    }

    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Employee deleted successfully." });
  } catch {
    return NextResponse.json(
      { message: "Unable to delete employee." },
      { status: 500 }
    );
  }
}
