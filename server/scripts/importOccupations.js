// DEPENDENCIES
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const { PrismaClient } = require("@prisma/client");
const {
  PrismaBetterSqlite3,
} = require("@prisma/adapter-better-sqlite3");

// DATABASE
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

// SOURCE FILE
const occupationFilePath = path.join(
  __dirname,
  "..",
  "data",
  "import",
  "Occupation Data.txt"
);

/**
 * Converts one O*NET occupation row into the shape expected by Prisma.
 *
 * @param {Record<string, string>} row
 * @returns {{
 *   onetSocCode: string,
 *   title: string,
 *   description: string,
 *   lucideIcon: string
 * }}
 */
function normalizeOccupation(row) {
  return {
    onetSocCode: row["O*NET-SOC Code"]?.trim(),
    title: row.Title?.trim(),
    description: row.Description?.trim(),
    lucideIcon: "Briefcase",
  };
}

/**
 * Imports O*NET occupations into CareerRole.
 */
async function importOccupations() {
  if (!fs.existsSync(occupationFilePath)) {
    throw new Error(
      `Occupation source file was not found:\n${occupationFilePath}`
    );
  }

  console.log("Reading O*NET occupation data...");

  const fileContents = fs.readFileSync(
    occupationFilePath,
    "utf8"
  );

  const rows = parse(fileContents, {
    columns: true,
    delimiter: "\t",
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  });

  console.log(`Found ${rows.length} occupation rows.`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const occupation = normalizeOccupation(row);

    if (
      !occupation.onetSocCode ||
      !occupation.title ||
      !occupation.description
    ) {
      skipped += 1;
      continue;
    }

    const existingRole = await prisma.careerRole.findUnique({
      where: {
        onetSocCode: occupation.onetSocCode,
      },
      select: {
        id: true,
      },
    });

    await prisma.careerRole.upsert({
      where: {
        onetSocCode: occupation.onetSocCode,
      },
      update: {
        title: occupation.title,
        description: occupation.description,
      },
      create: occupation,
    });

    if (existingRole) {
      updated += 1;
    } else {
      inserted += 1;
    }
  }

  const totalInDatabase = await prisma.careerRole.count();

  console.log("");
  console.log("==========================================");
  console.log("O*NET occupation import completed.");
  console.log("==========================================");
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated:  ${updated}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Database total: ${totalInDatabase}`);
}

/**
 * Runs the import and closes the database connection.
 */
async function main() {
  try {
    await importOccupations();
  } catch (error) {
    console.error("");
    console.error("Occupation import failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();