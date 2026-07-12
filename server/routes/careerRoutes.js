// DEPENDENCIES
const router = require("express").Router();

const { PrismaClient } = require("@prisma/client");
const {
  PrismaBetterSqlite3,
} = require("@prisma/adapter-better-sqlite3");

const { authMiddleware } = require("../utils/auth");

const {
  buildBlsOccupationCode,
  fetchCareerSalaryData,
  getJobOutlook,
  isCacheFresh,
} = require("../services/blsService");

// DATABASE
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

// BLS CACHE SETTINGS (Its only updated once a year anyway!)
const BLS_CACHE_MAX_AGE_DAYS = 365;

/**
 * Determines whether a career has complete cached salary data.
 *
 * @param {{
 *   salaryMin?: number|null,
 *   salaryMax?: number|null
 * }} careerRole
 * @returns {boolean}
 */
function hasCachedSalaryData(careerRole) {
  return (
    careerRole.salaryMin !== null &&
    careerRole.salaryMin !== undefined &&
    careerRole.salaryMax !== null &&
    careerRole.salaryMax !== undefined
  );
}

/**
 * Creates the frontend response shape for one career.
 *
 * @param {object} careerRole
 * @param {{
 *   salarySource?: string,
 *   salaryRefreshed?: boolean,
 *   blsError?: string|null
 * }} options
 * @returns {object}
 */
function buildCareerResponse(
  careerRole,
  {
    salarySource = "DATABASE",
    salaryRefreshed = false,
    blsError = null,
  } = {}
) {
  const jobOutlook =
    careerRole.jobOutlook ||
    getJobOutlook(careerRole.employmentGrowthPercent);

  return {
    id: careerRole.id,
    onetSocCode: careerRole.onetSocCode,
    blsOccupationCode: careerRole.blsOccupationCode,
    title: careerRole.title,
    description: careerRole.description,
    lucideIcon: careerRole.lucideIcon,

    salary: {
      minimum: careerRole.salaryMin,
      maximum: careerRole.salaryMax,
      source: careerRole.wageSource,
      cachedAt: careerRole.blsDataUpdatedAt,
    },

    employmentGrowthPercent:
      careerRole.employmentGrowthPercent,

    jobOutlook,

    bls: {
      occupationCodeAvailable:
        Boolean(careerRole.blsOccupationCode),

      salaryAvailable:
        careerRole.salaryMin !== null &&
        careerRole.salaryMax !== null,

      employmentProjectionAvailable:
        careerRole.employmentGrowthPercent !== null,

      lookupAttempted:
        careerRole.blsLookupAttempted,

      lookupAttemptedAt:
        careerRole.blsLookupAttemptedAt,

      lookupError:
        careerRole.blsLookupError,

      salarySource,
      salaryRefreshed,
      error: blsError,
    },
  };
}

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
            {
              blsOccupationCode: {
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

        // Standard occupation identifiers
        onetSocCode: true,
        blsOccupationCode: true,

        // Display fields
        title: true,
        description: true,
        lucideIcon: true,

        // Wage data
        salaryMin: true,
        salaryMax: true,

        // Employment projection data
        employmentGrowthPercent: true,
        jobOutlook: true,

        // Matching target
        targetScore: true,

        // Source tracking
        occupationSource: true,
        wageSource: true,
        sourceUpdatedAt: true,
        blsDataUpdatedAt: true,

        // BLS lookup tracking
        blsLookupAttempted: true,
        blsLookupAttemptedAt: true,
        blsLookupError: true,
      },
    });

    const formattedRoles = roles.map((role) => ({
      id: role.id,

      onetSocCode: role.onetSocCode,
      blsOccupationCode: role.blsOccupationCode,

      title: role.title,
      description: role.description,
      lucideIcon: role.lucideIcon,

      salary: {
        minimum: role.salaryMin,
        maximum: role.salaryMax,
        source: role.wageSource,
        updatedAt: role.blsDataUpdatedAt,
      },

      bls: {
        occupationCodeAvailable:
          Boolean(role.blsOccupationCode),

        salaryAvailable:
          role.salaryMin !== null &&
          role.salaryMax !== null,

        employmentProjectionAvailable:
          role.employmentGrowthPercent !== null,

        lookupAttempted:
          role.blsLookupAttempted,

        lookupAttemptedAt:
          role.blsLookupAttemptedAt,

        lookupError:
          role.blsLookupError,
      },

      employmentGrowthPercent:
        role.employmentGrowthPercent,

      jobOutlook: role.jobOutlook,

      targetScore: role.targetScore,

      sources: {
        occupation: role.occupationSource,
        wages: role.wageSource,
      },

      sourceUpdatedAt: role.sourceUpdatedAt,
    }));

    return res.json({
      count: formattedRoles.length,
      roles: formattedRoles,
    });
  } catch (error) {
    console.error("Unable to retrieve careers:", error);

    return res.status(500).json({
      message: "Unable to retrieve careers.",
    });
  }
});

// GET /api/careers/:careerRoleId
router.get(
  "/:careerRoleId",
  authMiddleware,
  async (req, res) => {
    try {
      const careerRoleId = Number(
        req.params.careerRoleId
      );

      if (!Number.isInteger(careerRoleId)) {
        return res.status(400).json({
          message: "A valid career-role ID is required.",
        });
      }

      let careerRole =
        await prisma.careerRole.findUnique({
          where: {
            id: careerRoleId,
          },
        });

      if (!careerRole) {
        return res.status(404).json({
          message: "Career role not found.",
        });
      }

      // If the BLS occupation code has not been saved yet,
      // attempt to derive it from the O*NET-SOC code.
      if (!careerRole.blsOccupationCode) {
        const generatedBlsOccupationCode =
          buildBlsOccupationCode(
            careerRole.onetSocCode
          );

        if (generatedBlsOccupationCode) {
          careerRole =
            await prisma.careerRole.update({
              where: {
                id: careerRole.id,
              },
              data: {
                blsOccupationCode:
                  generatedBlsOccupationCode,
              },
            });
        }
      }

      // If a BLS occupation code cannot be generated,
      // return the O*NET career data without BLS salary data.
      if (!careerRole.blsOccupationCode) {
        return res.json({
          career: buildCareerResponse(careerRole, {
            salarySource: "UNAVAILABLE",
            salaryRefreshed: false,
            blsError:
              "No BLS occupation mapping is available for this career.",
          }),
        });
      }

      const cachedSalaryAvailable =
        hasCachedSalaryData(careerRole);

      const cacheIsFresh = isCacheFresh(
        careerRole.blsDataUpdatedAt,
        BLS_CACHE_MAX_AGE_DAYS
      );

      // Return the saved SQLite values when the BLS data
      // exists and is still within the cache window.
      if (cachedSalaryAvailable && cacheIsFresh) {
        // Older rows may already contain BLS salary data but were
        // created before BLS lookup tracking fields were added.
        // Backfill the tracking fields without calling BLS again.
        if (!careerRole.blsLookupAttempted) {
          careerRole = await prisma.careerRole.update({
            where: {
              id: careerRole.id,
            },
            data: {
              blsLookupAttempted: true,
              blsLookupAttemptedAt:
                careerRole.blsDataUpdatedAt || new Date(),
              blsLookupError: null,
            },
          });
        }

        return res.json({
          career: buildCareerResponse(careerRole, {
            salarySource: "DATABASE",
            salaryRefreshed: false,
          }),
        });
      }

      // Salary is missing or stale, so retrieve the latest
      // available annual wage data from the BLS API.
      try {
        const salaryData =
          await fetchCareerSalaryData(careerRole);

        careerRole =
          await prisma.careerRole.update({
            where: {
              id: careerRole.id,
            },
            data: {
              blsOccupationCode:
                salaryData.blsOccupationCode,

              salaryMin: salaryData.salaryMin,
              salaryMax: salaryData.salaryMax,

              wageSource: "BLS OEWS",
              blsDataUpdatedAt: new Date(),
              sourceUpdatedAt: new Date(),

              // Record that BLS was contacted successfully.
              blsLookupAttempted: true,
              blsLookupAttemptedAt: new Date(),
              blsLookupError: null,
            },
          });

        return res.json({
          career: buildCareerResponse(careerRole, {
            salarySource: "BLS_API",
            salaryRefreshed: true,
          }),
        });
      } catch (blsError) {
        console.error(
          "Unable to refresh BLS salary data:",
          blsError
        );

        try {
          careerRole = await prisma.careerRole.update({
            where: {
              id: careerRole.id,
            },
            data: {
              // Record the attempted lookup even when BLS fails
              // or does not provide salary data for the occupation.
              blsLookupAttempted: true,
              blsLookupAttemptedAt: new Date(),
              blsLookupError: blsError.message,
            },
          });
        } catch (trackingError) {
          console.error(
            "Unable to save BLS lookup status:",
            trackingError
          );
        }

        // If older salary data exists, return it even though
        // the attempt to refresh it failed.
        if (cachedSalaryAvailable) {
          return res.json({
            career: buildCareerResponse(careerRole, {
              salarySource: "STALE_DATABASE_CACHE",
              salaryRefreshed: false,
              blsError: blsError.message,
            }),
          });
        }

        // Return the career itself even if no BLS salary
        // information could be retrieved.
        return res.json({
          career: buildCareerResponse(careerRole, {
            salarySource: "UNAVAILABLE",
            salaryRefreshed: false,
            blsError: blsError.message,
          }),
        });
      }
    } catch (error) {
      console.error(
        "Unable to retrieve career details:",
        error
      );

      return res.status(500).json({
        message: "Unable to retrieve career details.",
      });
    }
  }
);

module.exports = router;