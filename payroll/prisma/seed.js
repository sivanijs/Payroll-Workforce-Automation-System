require("dotenv/config");

const { PrismaClient } = require("../node_modules/.prisma/client/default.js");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.taxSlab.deleteMany();

  await prisma.taxSlab.createMany({
    data: [
      { minIncome: 0, maxIncome: 300000, taxRate: 0 },
      { minIncome: 300000, maxIncome: 700000, taxRate: 5 },
      { minIncome: 700000, maxIncome: 1500000, taxRate: 10 },
      { minIncome: 1500000, maxIncome: 999999999, taxRate: 20 },
    ],
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
