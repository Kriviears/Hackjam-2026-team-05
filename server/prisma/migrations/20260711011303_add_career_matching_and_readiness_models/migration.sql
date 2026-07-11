-- CreateTable
CREATE TABLE "CareerRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lucideIcon" TEXT NOT NULL,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "targetScore" INTEGER NOT NULL DEFAULT 70,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RoleSkill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "careerRoleId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "weight" REAL NOT NULL DEFAULT 1,
    CONSTRAINT "RoleSkill_careerRoleId_fkey" FOREIGN KEY ("careerRoleId") REFERENCES "CareerRole" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoleRecommendation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "resumeId" INTEGER NOT NULL,
    "careerRoleId" INTEGER NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "reason" TEXT,
    "rank" INTEGER,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoleRecommendation_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoleRecommendation_careerRoleId_fkey" FOREIGN KEY ("careerRoleId") REFERENCES "CareerRole" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResumeOptimization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "resumeId" INTEGER NOT NULL,
    "careerRoleId" INTEGER NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "previousMatchScore" INTEGER,
    "targetScore" INTEGER NOT NULL DEFAULT 70,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResumeOptimization_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResumeOptimization_careerRoleId_fkey" FOREIGN KEY ("careerRoleId") REFERENCES "CareerRole" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OptimizationKeyword" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "optimizationId" INTEGER NOT NULL,
    "keyword" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OptimizationKeyword_optimizationId_fkey" FOREIGN KEY ("optimizationId") REFERENCES "ResumeOptimization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OptimizationSuggestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "optimizationId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OptimizationSuggestion_optimizationId_fkey" FOREIGN KEY ("optimizationId") REFERENCES "ResumeOptimization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadinessReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "careerRoleId" INTEGER NOT NULL,
    "resumeOptimizationId" INTEGER,
    "readinessScore" INTEGER NOT NULL,
    "previousScore" INTEGER,
    "targetScore" INTEGER NOT NULL DEFAULT 60,
    "percentile" INTEGER,
    "nextStepTitle" TEXT,
    "nextStepDescription" TEXT,
    "nextStepActionLabel" TEXT,
    "nextStepActionRoute" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReadinessReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReadinessReport_careerRoleId_fkey" FOREIGN KEY ("careerRoleId") REFERENCES "CareerRole" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReadinessReport_resumeOptimizationId_fkey" FOREIGN KEY ("resumeOptimizationId") REFERENCES "ResumeOptimization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reportId" INTEGER NOT NULL,
    "lucideIcon" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actionRoute" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActionItem_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ReadinessReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Milestone" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "order" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "reportId" INTEGER,
    CONSTRAINT "Milestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Milestone_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ReadinessReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Milestone" ("completed", "id", "title", "userId") SELECT "completed", "id", "title", "userId" FROM "Milestone";
DROP TABLE "Milestone";
ALTER TABLE "new_Milestone" RENAME TO "Milestone";
CREATE TABLE "new_Skill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "resumeId" INTEGER,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "level" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "confidence" REAL,
    "confirmedByUser" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Skill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Skill_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Skill" ("category", "confidence", "confirmedByUser", "createdAt", "id", "level", "name", "resumeId", "source", "updatedAt", "userId") SELECT "category", "confidence", "confirmedByUser", "createdAt", "id", "level", "name", "resumeId", "source", "updatedAt", "userId" FROM "Skill";
DROP TABLE "Skill";
ALTER TABLE "new_Skill" RENAME TO "Skill";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CareerRole_title_key" ON "CareerRole"("title");

-- CreateIndex
CREATE UNIQUE INDEX "RoleSkill_careerRoleId_name_key" ON "RoleSkill"("careerRoleId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "RoleRecommendation_resumeId_careerRoleId_key" ON "RoleRecommendation"("resumeId", "careerRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeOptimization_resumeId_careerRoleId_key" ON "ResumeOptimization"("resumeId", "careerRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "OptimizationKeyword_optimizationId_keyword_key" ON "OptimizationKeyword"("optimizationId", "keyword");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessReport_resumeOptimizationId_key" ON "ReadinessReport"("resumeOptimizationId");
