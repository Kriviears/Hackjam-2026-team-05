const {
  generateReadinessReport,
} = require("../services/ai/readinessReportService");


// POST /api/resumes/:resumeId/readiness-report
router.post(
  "/:resumeId/readiness-report",
  authMiddleware,
  async (req, res) => {
    return res.json({
      message: "Readiness report endpoint coming soon.",
    });
  }
);