require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const {
  PrismaBetterSqlite3,
} = require("@prisma/adapter-better-sqlite3");

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {

  const result = await prisma.careerRole.updateMany({
    data: {
      annual10thPercentileSeriesId: "11",
      annual90thPercentileSeriesId: "15",
    },
  });

  console.log(
    `Updated ${result.count} CareerRole records.`
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });