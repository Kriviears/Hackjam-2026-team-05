const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
 
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { signToken } = require("../utils/auth");
 
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
 
const prisma = new PrismaClient({ adapter });
 
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL, // e.g., 'http://localhost:3000/auth/github/callback'
    },
    // This is the "verify" callback
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await prisma.user.upsert({
          where: {
            githubId: profile.id,
          },
          update: {
            username: profile.username,
            displayName: profile.displayName || profile.username,
            avatarUrl: profile.photos?.[0]?.value || null,
          },
          create: {
            githubId: profile.id,
            username: profile.username,
            displayName: profile.displayName || profile.username,
            avatarUrl: profile.photos?.[0]?.value || null,
            email: profile.emails?.[0]?.value || null,
            stage: "Current Learner",
            careerGoal: "Software Developer",
          },
        });
 
        const token = signToken({
          id: user.id,
          username: user.username,
          email: user.email,
        });
 
        return done(null, { user, token });
      } catch (error) {
        return done(error);
      }
    }
  )
);
 
module.exports = passport;
