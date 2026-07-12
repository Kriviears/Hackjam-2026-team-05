const router = require("express").Router();
const passport = require("passport");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { signToken } = require("../utils/auth");

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

// Remove sensitive fields before returning user data.
function sanitizeUser(user) {
  return {
    id: user.id,
    githubId: user.githubId,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    stage: user.stage,
    careerGoal: user.careerGoal,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed.", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username || "" },
          { email: email || "" },
        ],
      },
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = signToken(user);

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed.", error: error.message });
  }
});

router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/auth/failure",
  }),
  (req, res) => {
    const token = req.user.token;
    const redirectUrl = process.env.FRONTEND_REDIRECT_URL || "http://localhost:3000";
    res.redirect(`${redirectUrl}?token=${token}`);
  }
);

router.get("/failure", (req, res) => {
  res.status(401).json({ message: "GitHub authentication failed." });
});

module.exports = router;
