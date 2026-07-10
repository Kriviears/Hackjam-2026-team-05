const router = require("express").Router();
const { authMiddleware } = require("../utils/auth");
 
router.get("/demo", authMiddleware, (req, res) => {
  res.json({
    title: "Your Future Journey",
    currentStage: "Current Learner",
    goal: "Software Developer",
    milestones: [
      "Complete core technical training",
      "Build portfolio project",
      "Improve GitHub profile",
      "Practice technical interviews",
      "Apply to aligned employer opportunities",
      "Return as a mentor",
    ],
  });
});
 
module.exports = router;
