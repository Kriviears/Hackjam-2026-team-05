const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { authMiddleware } = require("../utils/auth");

// DATABASE
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

// UPLOAD DIRECTORY
const uploadDirectory = path.join(__dirname, "..", "uploads", "resumes");

fs.mkdirSync(uploadDirectory, { recursive: true });

// FILE STORAGE
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname).toLowerCase();

    callback(null, `${uniqueSuffix}${extension}`);
  },
});

// FILE VALIDATION
const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileFilter = (req, file, callback) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
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
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "A résumé file is required.",
        });
      }

      const resume = await prisma.resume.create({
        data: {
          userId: req.user.id,
          originalFileName: req.file.originalname,
          storedFileName: req.file.filename,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          filePath: req.file.path,
          processingStatus: "UPLOADED",
        },
      });

      return res.status(201).json({
        message: "Résumé uploaded successfully.",
        resume: {
          id: resume.id,
          originalFileName: resume.originalFileName,
          mimeType: resume.mimeType,
          fileSize: resume.fileSize,
          processingStatus: resume.processingStatus,
          uploadedAt: resume.uploadedAt,
        },
      });
    } catch (error) {
      // Remove the uploaded file if the database operation fails.
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error("Résumé upload error:", error);

      return res.status(500).json({
        message: "Unable to upload résumé.",
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