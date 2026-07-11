// DEPENDENCIES
const router = require("express").Router();

const { PrismaClient } = require("@prisma/client");
const {
  PrismaBetterSqlite3,
} = require("@prisma/adapter-better-sqlite3");

const { authMiddleware } = require("../utils/auth");

// DATABASE
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

// GET /api/careers
router.get("/", authMiddleware, async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const requestedLimit = Number(req.query.limit);
    const limit =
      Number.isInteger(requestedLimit) &&
      requestedLimit > 0
        ? Math.min(requestedLimit, 50)
        : 20;

    const roles = await prisma.careerRole.findMany({
      where: search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                },
              },
              {
                description: {
                  contains: search,
                },
              },
              {
                onetSocCode: {
                  contains: search,
                },
              },
            ],
          }
        : undefined,
      orderBy: {
        title: "asc",
      },
      take: limit,
      select: {
        id: true,
        onetSocCode: true,
        title: true,
        description: true,
        lucideIcon: true,
        salaryMin: true,
        salaryMax: true,
        targetScore: true,
      },
    });

    return res.json({
      count: roles.length,
      roles,
    });
  } catch (error) {
    console.error("Unable to retrieve careers:", error);

    return res.status(500).json({
      message: "Unable to retrieve careers.",
    });
  }
});

module.exports = router;