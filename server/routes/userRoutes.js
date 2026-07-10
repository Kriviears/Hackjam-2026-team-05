const router = require("express").Router();
const { authMiddleware } = require("../utils/auth");
 
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Welcome back, Per Scholian.",
    user: req.user,
  });
});

router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      stage: "Current Learner",
      careerGoal: "Software Developer",
    },
    progress: {
      percentage: 67,
      label: "Career Readiness",
    },
    nextSteps: [
      "Build portfolio project",
      "Improve GitHub profile",
      "Practice technical interviews",
    ],
    milestones: [
      {
        title: "Complete core technical training",
        completed: true,
      },
      {
        title: "Build portfolio project",
        completed: false,
      },
      {
        title: "Apply to aligned employer opportunities",
        completed: false,
      },
    ],
  });
});
 
module.exports = router;
