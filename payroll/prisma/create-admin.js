require("dotenv/config");

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("../node_modules/.prisma/client/default.js");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("Admin@12345", 10);

  const admin = await prisma.employee.upsert({
    where: {
      email: "admin@admintest.com",
    },
    update: {
      password,
      role: "admin",
      name: "Workora Admin",
      designation: "System Admin",
      basicSalary: 0,
      hra: 0,
      allowance: 0,
      dateOfJoining: new Date(),
    },
    create: {
      name: "Workora Admin",
      email: "admin@admintest.com",
      password,
      role: "admin",
      designation: "System Admin",
      basicSalary: 0,
      hra: 0,
      allowance: 0,
      dateOfJoining: new Date(),
    },
  });

  console.log({
    email: admin.email,
    role: admin.role,
    password: "Admin@12345",
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
