import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

function readToken(request) {
  const cookieToken = request?.cookies?.get?.("token")?.value;
  if (cookieToken) {
    return cookieToken;
  }

  const cookieHeader = request?.headers?.get?.("cookie");
  if (!cookieHeader) {
    return null;
  }

  const tokenPair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));

  return tokenPair ? decodeURIComponent(tokenPair.slice(6)) : null;
}

export function getAuthUser(request) {
  const token = readToken(request);
  const jwtSecret = process.env.JWT_SECRET;
  if (!token || !jwtSecret) {
    return null;
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    if (
      typeof payload === "object" &&
      payload !== null &&
      typeof payload.id === "number" &&
      typeof payload.role === "string"
    ) {
      return {
        id: payload.id,
        role: payload.role,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function getAuthProfile(request) {
  const user = getAuthUser(request);
  if (!user) {
    return null;
  }

  const employee = await prisma.employee.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  if (!employee) {
    return null;
  }

  return employee;
}

export function isAdmin(user) {
  return user?.role === "admin";
}

export function isManager(user) {
  return user?.role === "manager";
}
