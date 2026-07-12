// DEPENDENCIES
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const {
  PrismaBetterSqlite3,
} = require("@prisma/adapter-better-sqlite3");

// DATABASE
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./data/dev.db",
});

const prisma = new PrismaClient({ adapter });

// DEFAULT ICON
const DEFAULT_ICON = "Briefcase";

// ICONS BY O*NET MAJOR OCCUPATION GROUP
//
// The first two digits of an O*NET-SOC code identify the
// occupation's broad major group.
//
// Example:
// 15-1252.00 -> major group 15 -> Computer and Mathematical
const iconByMajorGroup = {
  "11": "BriefcaseBusiness",
  "13": "ChartNoAxesCombined",
  "15": "Code2",
  "17": "DraftingCompass",
  "19": "FlaskConical",
  "21": "HeartHandshake",
  "23": "Scale",
  "25": "GraduationCap",
  "27": "Palette",
  "29": "Stethoscope",
  "31": "HeartPulse",
  "33": "Shield",
  "35": "CookingPot",
  "37": "Trees",
  "39": "HandHeart",
  "41": "BadgeDollarSign",
  "43": "ClipboardList",
  "45": "Tractor",
  "47": "HardHat",
  "49": "Wrench",
  "51": "Factory",
  "53": "Truck",
};

// SPECIFIC CAREER OVERRIDES
//
// These rules are checked before the broad occupation-group rule.
// More specific terms should appear before broader terms.
const titleIconOverrides = [
  {
    terms: ["database administrator", "database architect"],
    icon: "Database",
  },
  {
    terms: ["computer network architect", "network administrator"],
    icon: "Network",
  },
  {
    terms: ["information security analyst", "cybersecurity"],
    icon: "ShieldCheck",
  },
  {
    terms: ["data scientist"],
    icon: "BrainCircuit",
  },
  {
    terms: ["web developer", "web and digital interface designer"],
    icon: "PanelsTopLeft",
  },
  {
    terms: ["software developer", "software engineer"],
    icon: "CodeXml",
  },
  {
    terms: ["computer programmer"],
    icon: "FileCode2",
  },
  {
    terms: ["computer systems analyst"],
    icon: "MonitorCog",
  },
  {
    terms: ["computer support specialist"],
    icon: "Headset",
  },
  {
    terms: ["project management specialist", "project manager"],
    icon: "ListChecks",
  },
  {
    terms: ["financial analyst"],
    icon: "ChartCandlestick",
  },
  {
    terms: ["accountant", "auditor"],
    icon: "Calculator",
  },
  {
    terms: ["teacher", "instructor", "professor"],
    icon: "GraduationCap",
  },
  {
    terms: ["registered nurse", "nurse practitioner"],
    icon: "HeartPulse",
  },
  {
    terms: ["physician", "surgeon"],
    icon: "Stethoscope",
  },
  {
    terms: ["lawyer", "judge"],
    icon: "Scale",
  },
  {
    terms: ["graphic designer", "artist", "art director"],
    icon: "Palette",
  },
  {
    terms: ["writer", "editor"],
    icon: "PenLine",
  },
  {
    terms: ["marketing manager", "advertising manager"],
    icon: "Megaphone",
  },
  {
    terms: ["human resources"],
    icon: "Users",
  },
  {
    terms: ["construction manager"],
    icon: "HardHat",
  },
  {
    terms: ["mechanic", "repairer"],
    icon: "Wrench",
  },
];

/**
 * Returns a specific icon when the career title matches
 * one of the configured override rules.
 *
 * @param {string} title
 * @returns {string|null}
 */
function getTitleOverrideIcon(title) {
  const normalizedTitle = String(title || "")
    .trim()
    .toLowerCase();

  for (const rule of titleIconOverrides) {
    const matches = rule.terms.some((term) =>
      normalizedTitle.includes(term)
    );

    if (matches) {
      return rule.icon;
    }
  }

  return null;
}

/**
 * Returns the first two digits from an O*NET-SOC code.
 *
 * Example:
 * 15-1252.00 -> 15
 *
 * @param {string} onetSocCode
 * @returns {string|null}
 */
function getMajorGroup(onetSocCode) {
  if (typeof onetSocCode !== "string") {
    return null;
  }

  const match = onetSocCode.trim().match(/^(\d{2})-/);

  return match ? match[1] : null;
}

/**
 * Determines which Lucide icon should be assigned to a career.
 *
 * Priority:
 * 1. Specific title override
 * 2. O*NET major occupation group
 * 3. Default Briefcase icon
 *
 * @param {{
 *   title: string,
 *   onetSocCode: string
 * }} careerRole
 * @returns {string}
 */
function determineCareerIcon(careerRole) {
  const overrideIcon = getTitleOverrideIcon(
    careerRole.title
  );

  if (overrideIcon) {
    return overrideIcon;
  }

  const majorGroup = getMajorGroup(
    careerRole.onetSocCode
  );

  return iconByMajorGroup[majorGroup] || DEFAULT_ICON;
}

/**
 * Assigns a deterministic Lucide icon to every CareerRole record.
 */
async function assignCareerIcons() {
  const careerRoles = await prisma.careerRole.findMany({
    select: {
      id: true,
      title: true,
      onetSocCode: true,
      lucideIcon: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(
    `Found ${careerRoles.length} career roles.`
  );

  let updated = 0;
  let unchanged = 0;

  for (const careerRole of careerRoles) {
    const lucideIcon =
      determineCareerIcon(careerRole);

    if (careerRole.lucideIcon === lucideIcon) {
      unchanged += 1;
      continue;
    }

    await prisma.careerRole.update({
      where: {
        id: careerRole.id,
      },
      data: {
        lucideIcon,
      },
    });

    updated += 1;

    console.log(
      `${careerRole.onetSocCode} | ${careerRole.title} -> ${lucideIcon}`
    );
  }

  console.log("");
  console.log("==========================================");
  console.log("Career icon assignment completed.");
  console.log("==========================================");
  console.log(`Updated:   ${updated}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Total:     ${careerRoles.length}`);
}

/**
 * Runs the icon assignment and closes the database connection.
 */
async function main() {
  try {
    await assignCareerIcons();
  } catch (error) {
    console.error("");
    console.error(
      "Career icon assignment failed:"
    );
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();