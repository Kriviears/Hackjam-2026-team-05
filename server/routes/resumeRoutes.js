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

  const validExtension = allowedExtensions.includes(extension);
  const validMimeType = allowedMimeTypes.includes(file.mimetype);

  if (!validExtension || !validMimeType) {
    return callback(
      new Error("Only PDF and DOCX résumé files are supported.")
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
      const analysis = await prisma.resumeAnalysis.create({
        data: {
          resumeId: resume.id,
          rawExtractedText: extractedText,
          analysisStatus: "COMPLETED",
          analyzedAt: new Date(),
        },
      });

      // Mark the résumé processing as complete.
      const completedResume = await prisma.resume.update({
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
      console.error("Résumé processing error:", error);

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
            structuredAnalysis.employmentHistory.length > 0
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
                    isCurrentRole:
                      Boolean(job.isCurrentRole),
                    description:
                      job.description || null,
                    confirmedByUser: false,
                  })
                ),
            });
          }

          if (structuredAnalysis.education.length > 0) {
            await transaction.education.createMany({
              data: structuredAnalysis.education.map(
                (education) => ({
                  userId: req.user.id,
                  resumeId,
                  institution: education.institution,
                  degree: education.degree || null,
                  fieldOfStudy:
                    education.fieldOfStudy || null,
                  startDate: education.startDate || null,
                  endDate: education.endDate || null,
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
            savedResult.analysis.professionalSummary,
          skills: savedResult.skills,
          employmentHistory:
            savedResult.employmentHistory,
          education: savedResult.education,
        },
      });
    } catch (error) {
      console.error("Résumé AI analysis failed:", error);

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
      const resumeId = Number(req.params.resumeId);

      if (!Number.isInteger(resumeId)) {
        return res.status(400).json({
          message: "A valid résumé ID is required.",
        });
      }

      const resume = await prisma.resume.findFirst({
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
          originalFileName: resume.originalFileName,
          mimeType: resume.mimeType,
          fileSize: resume.fileSize,
          processingStatus: resume.processingStatus,
          processingError: resume.processingError,
          uploadedAt: resume.uploadedAt,
        },

        analysis: resume.analysis
          ? {
              id: resume.analysis.id,
              analysisStatus: resume.analysis.analysisStatus,
              professionalSummary:
                resume.analysis.professionalSummary,
              analysisError: resume.analysis.analysisError,
              analyzedAt: resume.analysis.analyzedAt,
            }
          : null,

        skills: resume.skills.map((skill) => ({
          id: skill.id,
          name: skill.name,
          category: skill.category,
          level: skill.level,
          source: skill.source,
          confidence: skill.confidence,
          confirmedByUser: skill.confirmedByUser,
        })),

        employmentHistory: resume.employmentHistory.map(
          (job) => ({
            id: job.id,
            company: job.company,
            jobTitle: job.jobTitle,
            location: job.location,
            startDate: job.startDate,
            endDate: job.endDate,
            isCurrentRole: job.isCurrentRole,
            description: job.description,
            confirmedByUser: job.confirmedByUser,
          })
        ),

        education: resume.education.map((item) => ({
          id: item.id,
          institution: item.institution,
          degree: item.degree,
          fieldOfStudy: item.fieldOfStudy,
          startDate: item.startDate,
          endDate: item.endDate,
          description: item.description,
          confirmedByUser: item.confirmedByUser,
        })),
      });
    } catch (error) {
      console.error(
        "Unable to retrieve résumé analysis:",
        error
      );

      return res.status(500).json({
        message: "Unable to retrieve résumé analysis.",
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
      const resumeId = Number(req.params.resumeId);

      if (!Number.isInteger(resumeId)) {
        return res.status(400).json({
          message: "A valid résumé ID is required.",
        });
      }

      const resume = await prisma.resume.findFirst({
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
        originalFileName: resume.originalFileName,
        rawExtractedText:
          resume.analysis?.rawExtractedText || null,
      });
    } catch (error) {
      console.error(
        "Unable to retrieve raw résumé text:",
        error
      );

      return res.status(500).json({
        message: "Unable to retrieve raw résumé text.",
      });
    }
  }
);


// MULTER ERROR HANDLER
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Résumé must be 5 MB or smaller.",
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