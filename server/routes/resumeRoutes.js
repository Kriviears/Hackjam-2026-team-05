// DEPENDENCIES
const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { PrismaClient } = require("@prisma/client");
const {
  PrismaBetterSqlite3,
} = require("@prisma/adapter-better-sqlite3");

const { authMiddleware } = require("../utils/auth");

const {
  extractResumeText,
} = require("../services/resumeTextExtractor");

const {
  analyzeResume,
} = require("../services/ai/resumeAnalyzer");

const {
  getJobOutlook,
} = require("../services/blsService");

const {
  selectCareerCandidates,
  generateCareerRecommendations,
} = require("../services/ai/careerRecommendationService");

const {
  generateResumeOptimization,
} = require("../services/ai/resumeOptimizationService");

// DATABASE
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

// UPLOAD DIRECTORY
const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "resumes"
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

// FILE STORAGE
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    callback(null, `${uniqueSuffix}${extension}`);
  },
});

// FILE VALIDATION
const allowedExtensions = [".pdf", ".docx"];

const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
];

const fileFilter = (req, file, callback) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  console.log("Uploaded file:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    extension,
  });

  const validExtension =
    allowedExtensions.includes(extension);

  const validMimeType =
    allowedMimeTypes.includes(file.mimetype);

  if (!validExtension || !validMimeType) {
    return callback(
      new Error(
        "Only PDF and DOCX résumé files are supported."
      )
    );
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// POST /api/resumes/upload
router.post(
  "/upload",
  authMiddleware,
  upload.single("resume"),
  async (req, res) => {
    let resume;

    try {
      if (!req.file) {
        return res.status(400).json({
          message: "A résumé file is required.",
        });
      }

      // Create the résumé record before processing begins.
      resume = await prisma.resume.create({
        data: {
          userId: req.user.id,
          originalFileName: req.file.originalname,
          storedFileName: req.file.filename,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          filePath: req.file.path,
          processingStatus: "PROCESSING",
        },
      });

      // Extract readable text from the uploaded document.
      const extractedText = await extractResumeText(
        req.file.path,
        req.file.mimetype
      );

      if (!extractedText) {
        throw new Error(
          "No readable text could be extracted from the résumé."
        );
      }

      // Store the extracted text for later AI analysis.
      const analysis =
        await prisma.resumeAnalysis.create({
          data: {
            resumeId: resume.id,
            rawExtractedText: extractedText,
            analysisStatus: "COMPLETED",
            analyzedAt: new Date(),
          },
        });

      // Mark the résumé processing as complete.
      const completedResume =
        await prisma.resume.update({
          where: {
            id: resume.id,
          },
          data: {
            processingStatus: "COMPLETED",
            processingError: null,
          },
        });

      return res.status(201).json({
        message:
          "Résumé uploaded and text extracted successfully.",

        resume: {
          id: completedResume.id,
          originalFileName:
            completedResume.originalFileName,
          mimeType: completedResume.mimeType,
          fileSize: completedResume.fileSize,
          processingStatus:
            completedResume.processingStatus,
          uploadedAt: completedResume.uploadedAt,
        },

        analysis: {
          id: analysis.id,
          status: analysis.analysisStatus,
          textLength: extractedText.length,
          rawExtractedText: extractedText,
        },
      });
    } catch (error) {
      console.error(
        "Résumé processing error:",
        error
      );

      // Update the existing résumé record if it was already created.
      if (resume) {
        try {
          await prisma.resume.update({
            where: {
              id: resume.id,
            },
            data: {
              processingStatus: "FAILED",
              processingError: error.message,
            },
          });

          await prisma.resumeAnalysis.upsert({
            where: {
              resumeId: resume.id,
            },
            update: {
              analysisStatus: "FAILED",
              analysisError: error.message,
            },
            create: {
              resumeId: resume.id,
              analysisStatus: "FAILED",
              analysisError: error.message,
            },
          });
        } catch (databaseError) {
          console.error(
            "Unable to record résumé processing failure:",
            databaseError
          );
        }
      } else if (
        req.file?.path &&
        fs.existsSync(req.file.path)
      ) {
        // Remove the file if the database record was never created.
        fs.unlinkSync(req.file.path);
      }

      return res.status(422).json({
        message:
          "Résumé upload completed, but text extraction failed.",
        resumeId: resume?.id || null,
        error: error.message,
      });
    }
  }
);

// POST /api/resumes/:resumeId/analyze
router.post(
  "/:resumeId/analyze",
  authMiddleware,
  async (req, res) => {
    const resumeId = Number(req.params.resumeId);

    if (!Number.isInteger(resumeId)) {
      return res.status(400).json({
        message: "A valid résumé ID is required.",
      });
    }

    try {
      const resume = await prisma.resume.findFirst({
        where: {
          id: resumeId,
          userId: req.user.id,
        },
        include: {
          analysis: true,
        },
      });

      if (!resume) {
        return res.status(404).json({
          message: "Résumé not found.",
        });
      }

      const rawResumeText =
        resume.analysis?.rawExtractedText;

      if (!rawResumeText) {
        return res.status(409).json({
          message:
            "Résumé text has not been extracted yet.",
        });
      }

      await prisma.resumeAnalysis.update({
        where: {
          resumeId,
        },
        data: {
          analysisStatus: "PROCESSING",
          analysisError: null,
        },
      });

      const structuredAnalysis =
        await analyzeResume(rawResumeText);

      const savedResult = await prisma.$transaction(
        async (transaction) => {
          // Remove previous extracted records if the résumé is re-analyzed.
          await transaction.skill.deleteMany({
            where: {
              resumeId,
              source: "RESUME",
            },
          });

          await transaction.employmentHistory.deleteMany({
            where: {
              resumeId,
            },
          });

          await transaction.education.deleteMany({
            where: {
              resumeId,
            },
          });

          if (structuredAnalysis.skills.length > 0) {
            await transaction.skill.createMany({
              data: structuredAnalysis.skills.map(
                (skill) => ({
                  userId: req.user.id,
                  resumeId,
                  name: skill.name,
                  category: skill.category || null,
                  level: skill.level || null,
                  source: "RESUME",
                  confidence:
                    typeof skill.confidence === "number"
                      ? skill.confidence
                      : null,
                  confirmedByUser: false,
                })
              ),
            });
          }

          if (
            structuredAnalysis.employmentHistory.length >
            0
          ) {
            await transaction.employmentHistory.createMany({
              data:
                structuredAnalysis.employmentHistory.map(
                  (job) => ({
                    userId: req.user.id,
                    resumeId,
                    company: job.company,
                    jobTitle: job.jobTitle,
                    location: job.location || null,
                    startDate: job.startDate || null,
                    endDate: job.endDate || null,
                    isCurrentRole: Boolean(
                      job.isCurrentRole
                    ),
                    description:
                      job.description || null,
                    confirmedByUser: false,
                  })
                ),
            });
          }

          if (
            structuredAnalysis.education.length > 0
          ) {
            await transaction.education.createMany({
              data: structuredAnalysis.education.map(
                (education) => ({
                  userId: req.user.id,
                  resumeId,
                  institution:
                    education.institution,
                  degree: education.degree || null,
                  fieldOfStudy:
                    education.fieldOfStudy || null,
                  startDate:
                    education.startDate || null,
                  endDate:
                    education.endDate || null,
                  description:
                    education.description || null,
                  confirmedByUser: false,
                })
              ),
            });
          }

          await transaction.resumeAnalysis.update({
            where: {
              resumeId,
            },
            data: {
              professionalSummary:
                structuredAnalysis.professionalSummary,
              analysisStatus: "COMPLETED",
              analysisError: null,
              analyzedAt: new Date(),
            },
          });

          return transaction.resume.findUnique({
            where: {
              id: resumeId,
            },
            include: {
              analysis: true,
              skills: true,
              employmentHistory: true,
              education: true,
            },
          });
        }
      );

      return res.json({
        message: "Résumé analyzed successfully.",
        resumeId,

        analysis: {
          status:
            savedResult.analysis.analysisStatus,

          professionalSummary:
            savedResult.analysis
              .professionalSummary,

          skills: savedResult.skills,

          employmentHistory:
            savedResult.employmentHistory,

          education: savedResult.education,
        },
      });
    } catch (error) {
      console.error(
        "Résumé AI analysis failed:",
        error
      );

      try {
        await prisma.resumeAnalysis.update({
          where: {
            resumeId,
          },
          data: {
            analysisStatus: "FAILED",
            analysisError: error.message,
          },
        });
      } catch (statusError) {
        console.error(
          "Unable to save failed analysis status:",
          statusError
        );
      }

      return res.status(500).json({
        message: "Unable to analyze résumé.",
        error: error.message,
      });
    }
  }
);

// GET /api/resumes/:resumeId/analysis
router.get(
  "/:resumeId/analysis",
  authMiddleware,
  async (req, res) => {
    try {
      const resumeId = Number(
        req.params.resumeId
      );

      if (!Number.isInteger(resumeId)) {
        return res.status(400).json({
          message: "A valid résumé ID is required.",
        });
      }

      const resume =
        await prisma.resume.findFirst({
          where: {
            id: resumeId,
            userId: req.user.id,
          },

          include: {
            analysis: true,

            skills: {
              orderBy: {
                name: "asc",
              },
            },

            employmentHistory: {
              orderBy: {
                id: "asc",
              },
            },

            education: {
              orderBy: {
                id: "asc",
              },
            },
          },
        });

      if (!resume) {
        return res.status(404).json({
          message: "Résumé not found.",
        });
      }

      return res.json({
        resume: {
          id: resume.id,
          originalFileName:
            resume.originalFileName,
          mimeType: resume.mimeType,
          fileSize: resume.fileSize,
          processingStatus:
            resume.processingStatus,
          processingError:
            resume.processingError,
          uploadedAt: resume.uploadedAt,
        },

        analysis: resume.analysis
          ? {
              id: resume.analysis.id,
              analysisStatus:
                resume.analysis.analysisStatus,

              professionalSummary:
                resume.analysis
                  .professionalSummary,

              analysisError:
                resume.analysis.analysisError,

              analyzedAt:
                resume.analysis.analyzedAt,
            }
          : null,

        skills: resume.skills.map((skill) => ({
          id: skill.id,
          name: skill.name,
          category: skill.category,
          level: skill.level,
          source: skill.source,
          confidence: skill.confidence,
          confirmedByUser:
            skill.confirmedByUser,
        })),

        employmentHistory:
          resume.employmentHistory.map((job) => ({
            id: job.id,
            company: job.company,
            jobTitle: job.jobTitle,
            location: job.location,
            startDate: job.startDate,
            endDate: job.endDate,
            isCurrentRole: job.isCurrentRole,
            description: job.description,
            confirmedByUser:
              job.confirmedByUser,
          })),

        education: resume.education.map(
          (item) => ({
            id: item.id,
            institution: item.institution,
            degree: item.degree,
            fieldOfStudy: item.fieldOfStudy,
            startDate: item.startDate,
            endDate: item.endDate,
            description: item.description,
            confirmedByUser:
              item.confirmedByUser,
          })
        ),
      });
    } catch (error) {
      console.error(
        "Unable to retrieve résumé analysis:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve résumé analysis.",
      });
    }
  }
);

// POST /api/resumes/:resumeId/recommendations
router.post(
  "/:resumeId/recommendations",
  authMiddleware,
  async (req, res) => {
    try {
      const resumeId = Number(
        req.params.resumeId
      );

      if (!Number.isInteger(resumeId)) {
        return res.status(400).json({
          message: "A valid résumé ID is required.",
        });
      }

      // Load the résumé and all structured résumé data.
      const resume =
        await prisma.resume.findFirst({
          where: {
            id: resumeId,
            userId: req.user.id,
          },

          include: {
            analysis: true,
            skills: true,
            employmentHistory: true,
            education: true,
          },
        });

      if (!resume) {
        return res.status(404).json({
          message: "Résumé not found.",
        });
      }

      if (
        resume.analysis?.analysisStatus !==
        "COMPLETED"
      ) {
        return res.status(409).json({
          message:
            "The résumé must be analyzed before career recommendations can be generated.",
        });
      }

      if (resume.skills.length === 0) {
        return res.status(409).json({
          message:
            "No résumé skills are available for career matching.",
        });
      }

      // Load the O*NET-backed career catalog.
      const careerRoles =
        await prisma.careerRole.findMany({
          select: {
            id: true,
            onetSocCode: true,
            title: true,
            description: true,
          },

          orderBy: {
            id: "asc",
          },
        });

      if (careerRoles.length === 0) {
        return res.status(409).json({
          message:
            "The career catalog has not been loaded.",
        });
      }

      const resumeProfile = {
        professionalSummary:
          resume.analysis.professionalSummary,

        skills: resume.skills,

        employmentHistory:
          resume.employmentHistory,

        education: resume.education,
      };

      // Narrow the full career catalog before asking AI
      // to perform the final ranking.
      const careerCandidates =
        selectCareerCandidates(
          careerRoles,
          resumeProfile,
          60
        );

      const generatedRecommendations =
        await generateCareerRecommendations(
          resumeProfile,
          careerCandidates,
          5
        );

      const recommendedCareerIds =
        generatedRecommendations.map(
          (recommendation) =>
            recommendation.careerRoleId
        );

      const savedRecommendations =
        await prisma.$transaction(
          async (transaction) => {
            // Re-running recommendation generation replaces
            // the previous recommendation set for this résumé.
            await transaction.roleRecommendation.deleteMany(
              {
                where: {
                  resumeId,
                },
              }
            );

            for (
              const recommendation of
              generatedRecommendations
            ) {
              await transaction.roleRecommendation.create(
                {
                  data: {
                    resumeId,

                    careerRoleId:
                      recommendation.careerRoleId,

                    matchScore:
                      recommendation.matchScore,

                    reason:
                      recommendation.reason,

                    rank:
                      recommendation.rank,

                    selected: false,

                    matchedSkillsJson:
                      JSON.stringify(
                        recommendation.matchedSkills
                      ),

                    missingSkillsJson:
                      JSON.stringify(
                        recommendation.missingSkills
                      ),
                  },
                }
              );
            }

            return transaction.roleRecommendation.findMany(
              {
                where: {
                  resumeId,

                  careerRoleId: {
                    in: recommendedCareerIds,
                  },
                },

                orderBy: {
                  rank: "asc",
                },

                include: {
                  careerRole: true,
                },
              }
            );
          }
        );

      const formattedRecommendations =
        savedRecommendations.map(
          (recommendation) => ({
            recommendationId:
              recommendation.id,

            rank: recommendation.rank,

            matchScore:
              recommendation.matchScore,

            reason: recommendation.reason,

            selected:
              recommendation.selected,

            matchedSkills: JSON.parse(
              recommendation.matchedSkillsJson ||
                "[]"
            ),

            missingSkills: JSON.parse(
              recommendation.missingSkillsJson ||
                "[]"
            ),

            career: {
              id: recommendation.careerRole.id,

              onetSocCode:
                recommendation.careerRole
                  .onetSocCode,

              blsOccupationCode:
                recommendation.careerRole
                  .blsOccupationCode,

              title:
                recommendation.careerRole.title,

              description:
                recommendation.careerRole
                  .description,

              lucideIcon:
                recommendation.careerRole
                  .lucideIcon,

              salary: {
                minimum:
                  recommendation.careerRole
                    .salaryMin,

                maximum:
                  recommendation.careerRole
                    .salaryMax,

                source:
                  recommendation.careerRole
                    .wageSource,

                updatedAt:
                  recommendation.careerRole
                    .blsDataUpdatedAt,
              },

              employmentGrowthPercent:
                recommendation.careerRole
                  .employmentGrowthPercent,

              jobOutlook:
                recommendation.careerRole
                  .jobOutlook ||
                getJobOutlook(
                  recommendation.careerRole
                    .employmentGrowthPercent
                ),

              targetScore:
                recommendation.careerRole
                  .targetScore,

              bls: {
                occupationCodeAvailable:
                  Boolean(
                    recommendation.careerRole
                      .blsOccupationCode
                  ),

                salaryAvailable:
                  recommendation.careerRole
                    .salaryMin !== null &&
                  recommendation.careerRole
                    .salaryMax !== null,

                employmentProjectionAvailable:
                  recommendation.careerRole
                    .employmentGrowthPercent !== null,

                lookupAttempted:
                  recommendation.careerRole
                    .blsLookupAttempted,

                lookupAttemptedAt:
                  recommendation.careerRole
                    .blsLookupAttemptedAt,

                lookupError:
                  recommendation.careerRole
                    .blsLookupError,
              },

              sources: {
                occupation:
                  recommendation.careerRole
                    .occupationSource,

                wages:
                  recommendation.careerRole
                    .wageSource,
              },
            },
          })
        );

      return res.status(201).json({
        message:
          "Career recommendations generated successfully.",

        resume: {
          id: resume.id,
          originalFileName:
            resume.originalFileName,
        },

        candidateCount:
          careerCandidates.length,

        count:
          formattedRecommendations.length,

        recommendations:
          formattedRecommendations,
      });
    } catch (error) {
      console.error(
        "Unable to generate career recommendations:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to generate career recommendations.",

        error: error.message,
      });
    }
  }
);

// PATCH /api/resumes/:resumeId/recommendations/:recommendationId/select
router.patch(
  "/:resumeId/recommendations/:recommendationId/select",
  authMiddleware,
  async (req, res) => {
    const resumeId = Number(req.params.resumeId);
    const recommendationId = Number(
      req.params.recommendationId
    );

    if (!Number.isInteger(resumeId) || resumeId <= 0) {
      return res.status(400).json({
        message: "A valid résumé ID is required.",
      });
    }

    if (
      !Number.isInteger(recommendationId) ||
      recommendationId <= 0
    ) {
      return res.status(400).json({
        message:
          "A valid recommendation ID is required.",
      });
    }

    try {
      // Confirm that the résumé belongs to the logged-in user.
      const resume = await prisma.resume.findFirst({
        where: {
          id: resumeId,
          userId: req.user.id,
        },

        select: {
          id: true,
          originalFileName: true,
        },
      });

      if (!resume) {
        return res.status(404).json({
          message: "Résumé not found.",
        });
      }

      // Confirm that the recommendation belongs to this résumé.
      const recommendation =
        await prisma.roleRecommendation.findFirst({
          where: {
            id: recommendationId,
            resumeId,
          },

          include: {
            careerRole: true,
          },
        });

      if (!recommendation) {
        return res.status(404).json({
          message:
            "Career recommendation not found for this résumé.",
        });
      }

      const selectedRecommendation =
        await prisma.$transaction(
          async (transaction) => {
            // Clear any previously selected recommendation
            // for this résumé.
            await transaction.roleRecommendation.updateMany({
              where: {
                resumeId,
                selected: true,
              },

              data: {
                selected: false,
              },
            });

            // Select the requested recommendation.
            return transaction.roleRecommendation.update({
              where: {
                id: recommendationId,
              },

              data: {
                selected: true,
              },

              include: {
                careerRole: true,
              },
            });
          }
        );

      return res.json({
        message: "Career selected successfully.",

        resume: {
          id: resume.id,
          originalFileName: resume.originalFileName,
        },

        recommendation: {
          recommendationId:
            selectedRecommendation.id,

          rank: selectedRecommendation.rank,

          matchScore:
            selectedRecommendation.matchScore,

          reason: selectedRecommendation.reason,

          selected: selectedRecommendation.selected,

          matchedSkills: JSON.parse(
            selectedRecommendation.matchedSkillsJson ||
              "[]"
          ),

          missingSkills: JSON.parse(
            selectedRecommendation.missingSkillsJson ||
              "[]"
          ),

          career: {
            id: selectedRecommendation.careerRole.id,

            onetSocCode:
              selectedRecommendation.careerRole
                .onetSocCode,

            blsOccupationCode:
              selectedRecommendation.careerRole
                .blsOccupationCode,

            title:
              selectedRecommendation.careerRole.title,

            description:
              selectedRecommendation.careerRole
                .description,

            lucideIcon:
              selectedRecommendation.careerRole
                .lucideIcon,

            salary: {
              minimum:
                selectedRecommendation.careerRole
                  .salaryMin,

              maximum:
                selectedRecommendation.careerRole
                  .salaryMax,

              source:
                selectedRecommendation.careerRole
                  .wageSource,

              updatedAt:
                selectedRecommendation.careerRole
                  .blsDataUpdatedAt,
            },

            employmentGrowthPercent:
              selectedRecommendation.careerRole
                .employmentGrowthPercent,

            jobOutlook:
              selectedRecommendation.careerRole
                .jobOutlook ||
              getJobOutlook(
                selectedRecommendation.careerRole
                  .employmentGrowthPercent
              ),

            targetScore:
              selectedRecommendation.careerRole
                .targetScore,

            sources: {
              occupation:
                selectedRecommendation.careerRole
                  .occupationSource,

              wages:
                selectedRecommendation.careerRole
                  .wageSource,
            },
          },
        },
      });
    } catch (error) {
      console.error(
        "Unable to select career recommendation:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to select career recommendation.",
        error: error.message,
      });
    }
  }
);

// GET /api/resumes/:resumeId/recommendations
router.get(
  "/:resumeId/recommendations",
  authMiddleware,
  async (req, res) => {
    try {
      const resumeId = Number(
        req.params.resumeId
      );

      if (!Number.isInteger(resumeId)) {
        return res.status(400).json({
          message: "A valid résumé ID is required.",
        });
      }

      // Confirm that the résumé belongs to the logged-in user.
      const resume =
        await prisma.resume.findFirst({
          where: {
            id: resumeId,
            userId: req.user.id,
          },

          select: {
            id: true,
            originalFileName: true,
          },
        });

      if (!resume) {
        return res.status(404).json({
          message: "Résumé not found.",
        });
      }

      // Retrieve the saved, résumé-specific career recommendations.
      const recommendations =
        await prisma.roleRecommendation.findMany({
          where: {
            resumeId,
          },

          orderBy: [
            {
              rank: "asc",
            },
            {
              matchScore: "desc",
            },
          ],

          include: {
            careerRole: {
              select: {
                id: true,
                onetSocCode: true,
                blsOccupationCode: true,
                title: true,
                description: true,
                lucideIcon: true,
                salaryMin: true,
                salaryMax: true,
                employmentGrowthPercent: true,
                jobOutlook: true,
                targetScore: true,
                occupationSource: true,
                wageSource: true,
                blsDataUpdatedAt: true,

                blsLookupAttempted: true,
                blsLookupAttemptedAt: true,
                blsLookupError: true,
              },
            },
          },
        });

      const formattedRecommendations =
        recommendations.map(
          (recommendation) => ({
            recommendationId:
              recommendation.id,

            rank: recommendation.rank,

            matchScore:
              recommendation.matchScore,

            reason: recommendation.reason,

            selected:
              recommendation.selected,

            matchedSkills: JSON.parse(
              recommendation.matchedSkillsJson ||
                "[]"
            ),

            missingSkills: JSON.parse(
              recommendation.missingSkillsJson ||
                "[]"
            ),

            career: {
              id: recommendation.careerRole.id,

              onetSocCode:
                recommendation.careerRole
                  .onetSocCode,

              blsOccupationCode:
                recommendation.careerRole
                  .blsOccupationCode,

              title:
                recommendation.careerRole.title,

              description:
                recommendation.careerRole
                  .description,

              lucideIcon:
                recommendation.careerRole
                  .lucideIcon,

              salary: {
                minimum:
                  recommendation.careerRole
                    .salaryMin,

                maximum:
                  recommendation.careerRole
                    .salaryMax,

                source:
                  recommendation.careerRole
                    .wageSource,

                updatedAt:
                  recommendation.careerRole
                    .blsDataUpdatedAt,
              },

              employmentGrowthPercent:
                recommendation.careerRole
                  .employmentGrowthPercent,

              jobOutlook:
                recommendation.careerRole
                  .jobOutlook ||
                getJobOutlook(
                  recommendation.careerRole
                    .employmentGrowthPercent
                ),

              targetScore:
                recommendation.careerRole
                  .targetScore,

              bls: {
                occupationCodeAvailable:
                  Boolean(
                    recommendation.careerRole
                      .blsOccupationCode
                  ),

                salaryAvailable:
                  recommendation.careerRole
                    .salaryMin !== null &&
                  recommendation.careerRole
                    .salaryMax !== null,

                employmentProjectionAvailable:
                  recommendation.careerRole
                    .employmentGrowthPercent !== null,

                lookupAttempted:
                  recommendation.careerRole
                    .blsLookupAttempted,

                lookupAttemptedAt:
                  recommendation.careerRole
                    .blsLookupAttemptedAt,

                lookupError:
                  recommendation.careerRole
                    .blsLookupError,
              },

              sources: {
                occupation:
                  recommendation.careerRole
                    .occupationSource,

                wages:
                  recommendation.careerRole
                    .wageSource,
              },
            },
          })
        );

      return res.json({
        resume: {
          id: resume.id,
          originalFileName:
            resume.originalFileName,
        },

        count:
          formattedRecommendations.length,

        recommendations:
          formattedRecommendations,
      });
    } catch (error) {
      console.error(
        "Unable to retrieve career recommendations:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve career recommendations.",
      });
    }
  }
);

// POST /api/resumes/:resumeId/optimization
router.post(
  "/:resumeId/optimization",
  authMiddleware,
  async (req, res) => {
    const resumeId = Number(req.params.resumeId);

    if (!Number.isInteger(resumeId) || resumeId <= 0) {
      return res.status(400).json({
        message: "A valid résumé ID is required.",
      });
    }

    try {
      // Load the résumé and confirm that it belongs
      // to the authenticated user.
      const resume = await prisma.resume.findFirst({
        where: {
          id: resumeId,
          userId: req.user.id,
        },

        include: {
          analysis: true,
          skills: true,
          employmentHistory: true,
          education: true,
        },
      });

      if (!resume) {
        return res.status(404).json({
          message: "Résumé not found.",
        });
      }

      if (
        resume.analysis?.analysisStatus !==
        "COMPLETED"
      ) {
        return res.status(409).json({
          message:
            "The résumé must be analyzed before it can be optimized.",
        });
      }

      // Load the career selected for this résumé.
      const selectedRecommendation =
        await prisma.roleRecommendation.findFirst({
          where: {
            resumeId,
            selected: true,
          },

          include: {
            careerRole: true,
          },
        });

      if (!selectedRecommendation) {
        return res.status(409).json({
          message:
            "A career recommendation must be selected before résumé optimization can be generated.",
        });
      }

      const resumeProfile = {
        professionalSummary:
          resume.analysis.professionalSummary,

        skills: resume.skills,

        employmentHistory:
          resume.employmentHistory,

        education: resume.education,
      };

      const generatedOptimization =
        await generateResumeOptimization(
          resumeProfile,
          selectedRecommendation.careerRole
        );

      // Remove exact and case-insensitive duplicate keywords.
      // A matched keyword takes priority if Gemini returns
      // the same keyword in both arrays.
      const matchedKeywordMap = new Map();

      for (const keyword of
        generatedOptimization.matchedKeywords) {
        const cleanedKeyword = String(
          keyword || ""
        ).trim();

        if (cleanedKeyword) {
          matchedKeywordMap.set(
            cleanedKeyword.toLowerCase(),
            cleanedKeyword
          );
        }
      }

      const missingKeywordMap = new Map();

      for (const keyword of
        generatedOptimization.missingKeywords) {
        const cleanedKeyword = String(
          keyword || ""
        ).trim();

        const normalizedKeyword =
          cleanedKeyword.toLowerCase();

        if (
          cleanedKeyword &&
          !matchedKeywordMap.has(normalizedKeyword)
        ) {
          missingKeywordMap.set(
            normalizedKeyword,
            cleanedKeyword
          );
        }
      }

      const cleanedSuggestions =
        generatedOptimization.suggestedActions
          .map((suggestion) => {
            const title = String(
              suggestion.title || ""
            ).trim();

            const description = String(
              suggestion.description || ""
            ).trim();

            if (!title && !description) {
              return null;
            }

            return {
              action:
                title && description
                  ? `${title}: ${description}`
                  : title || description,
            };
          })
          .filter(Boolean);

      const savedOptimization =
        await prisma.$transaction(
          async (transaction) => {
            const existingOptimization =
              await transaction.resumeOptimization.findUnique(
                {
                  where: {
                    resumeId_careerRoleId: {
                      resumeId,
                      careerRoleId:
                        selectedRecommendation
                          .careerRoleId,
                    },
                  },
                }
              );

            const optimization =
              await transaction.resumeOptimization.upsert({
                where: {
                  resumeId_careerRoleId: {
                    resumeId,
                    careerRoleId:
                      selectedRecommendation
                        .careerRoleId,
                  },
                },

                update: {
                  previousMatchScore:
                    existingOptimization?.matchScore ??
                    null,

                  matchScore:
                    generatedOptimization.matchScore,

                  targetScore:
                    selectedRecommendation.careerRole
                      .targetScore ?? 70,

                  status: "COMPLETED",
                },

                create: {
                  resumeId,

                  careerRoleId:
                    selectedRecommendation
                      .careerRoleId,

                  matchScore:
                    generatedOptimization.matchScore,

                  previousMatchScore: null,

                  targetScore:
                    selectedRecommendation.careerRole
                      .targetScore ?? 70,

                  status: "COMPLETED",
                },
              });

            // Regenerating optimization replaces the
            // previous keywords and suggestions.
            await transaction.optimizationKeyword.deleteMany(
              {
                where: {
                  optimizationId: optimization.id,
                },
              }
            );

            await transaction.optimizationSuggestion.deleteMany(
              {
                where: {
                  optimizationId: optimization.id,
                },
              }
            );

            const keywordRecords = [
              ...Array.from(
                matchedKeywordMap.values()
              ).map((keyword) => ({
                optimizationId: optimization.id,
                keyword,
                status: "MATCHED",
              })),

              ...Array.from(
                missingKeywordMap.values()
              ).map((keyword) => ({
                optimizationId: optimization.id,
                keyword,
                status: "MISSING",
              })),
            ];

            if (keywordRecords.length > 0) {
              await transaction.optimizationKeyword.createMany(
                {
                  data: keywordRecords,
                }
              );
            }

            if (cleanedSuggestions.length > 0) {
              await transaction.optimizationSuggestion.createMany(
                {
                  data: cleanedSuggestions.map(
                    (suggestion, index) => ({
                      optimizationId:
                        optimization.id,

                      action: suggestion.action,

                      completed: false,

                      order: index + 1,
                    })
                  ),
                }
              );
            }

            return transaction.resumeOptimization.findUnique({
              where: {
                id: optimization.id,
              },

              include: {
                careerRole: true,

                keywords: {
                  orderBy: {
                    id: "asc",
                  },
                },

                suggestions: {
                  orderBy: {
                    order: "asc",
                  },
                },
              },
            });
          }
        );

      return res.status(201).json({
        message:
          "Résumé optimization generated successfully.",

        optimization: {
          optimizationId:
            savedOptimization.id,

          resumeId: resume.id,

          resumeTitle:
            resume.originalFileName,

          resumeUploadDate:
            resume.uploadedAt,

          matchScore:
            savedOptimization.matchScore,

          previousMatchScore:
            savedOptimization.previousMatchScore,

          targetScore:
            savedOptimization.targetScore,

          status:
            savedOptimization.status,

          careerChoice: {
            careerRoleId:
              savedOptimization.careerRole.id,

            title:
              savedOptimization.careerRole.title,

            onetSocCode:
              savedOptimization.careerRole
                .onetSocCode,

            lucideIcon:
              savedOptimization.careerRole
                .lucideIcon,
          },

          skills: resume.skills.map(
            (skill) => skill.name
          ),

          matchedKeywords:
            savedOptimization.keywords
              .filter(
                (keyword) =>
                  keyword.status === "MATCHED"
              )
              .map(
                (keyword) => keyword.keyword
              ),

          missingKeywords:
            savedOptimization.keywords
              .filter(
                (keyword) =>
                  keyword.status === "MISSING"
              )
              .map(
                (keyword) => keyword.keyword
              ),

          suggestedActions:
            savedOptimization.suggestions.map(
              (suggestion) => ({
                suggestionId:
                  suggestion.id,

                action:
                  suggestion.action,

                completed:
                  suggestion.completed,

                order:
                  suggestion.order,
              })
            ),
        },
      });
    } catch (error) {
      console.error(
        "Unable to generate résumé optimization:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to generate résumé optimization.",

        error: error.message,
      });
    }
  }
);

// GET /api/resumes/:resumeId/raw-text
router.get(
  "/:resumeId/raw-text",
  authMiddleware,
  async (req, res) => {
    try {
      const resumeId = Number(
        req.params.resumeId
      );

      if (!Number.isInteger(resumeId)) {
        return res.status(400).json({
          message: "A valid résumé ID is required.",
        });
      }

      const resume =
        await prisma.resume.findFirst({
          where: {
            id: resumeId,
            userId: req.user.id,
          },

          include: {
            analysis: {
              select: {
                rawExtractedText: true,
              },
            },
          },
        });

      if (!resume) {
        return res.status(404).json({
          message: "Résumé not found.",
        });
      }

      return res.json({
        resumeId: resume.id,

        originalFileName:
          resume.originalFileName,

        rawExtractedText:
          resume.analysis
            ?.rawExtractedText || null,
      });
    } catch (error) {
      console.error(
        "Unable to retrieve raw résumé text:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to retrieve raw résumé text.",
      });
    }
  }
);

// MULTER ERROR HANDLER
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message:
          "Résumé must be 5 MB or smaller.",
      });
    }

    return res.status(400).json({
      message: error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  next();
});

module.exports = router;