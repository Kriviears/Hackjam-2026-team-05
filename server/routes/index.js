// DEPENDENCIES
const router = require("express").Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const roadmapRoutes = require("./roadmapRoutes");
const resumeRoutes = require("./resumeRoutes");
const careerRoutes = require("./careerRoutes");


// ROUTES
router.use("/auth", authRoutes);
router.use("/api/users", userRoutes);
router.use("/api/roadmaps", roadmapRoutes);
router.use("/api/resumes", resumeRoutes);
router.use("/api/careers", careerRoutes);

module.exports = router;