require("dotenv/config");

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("../node_modules/.prisma/client/default.js");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  //const password = await bcrypt.hash("Admin@12345", 10);

  const admin = await prisma.employee.findFirst({
    where: { role: "admin" },
  });

  if (!admin) {
    throw new Error("No admin employee found.");
  }

  const updatedAdmin = await prisma.employee.update({
    where: { id: admin.id },
    data: {
      email: "admin@admintest.com",
      password,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log(updatedAdmin);
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
