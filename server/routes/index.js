const router = require("express").Router();
 
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const roadmapRoutes = require("./roadmapRoutes");
 
router.use("/auth", authRoutes);
router.use("/api/users", userRoutes);
router.use("/api/roadmaps", roadmapRoutes);
 
module.exports = router;
