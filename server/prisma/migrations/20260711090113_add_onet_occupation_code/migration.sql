/*
  Warnings:

  - Added the required column `onetSocCode` to the `CareerRole` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CareerRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lucideIcon" TEXT NOT NULL DEFAULT 'Briefcase',
    "onetSocCode" TEXT NOT NULL,
    "blsOccupationCode" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "medianSalary" INTEGER,
    "salaryArea" TEXT,
    "salaryYear" INTEGER,
    "occupationSource" TEXT NOT NULL DEFAULT 'ONET',
    "wageSource" TEXT,
    "sourceUpdatedAt" DATETIME,
    "targetScore" INTEGER NOT NULL DEFAULT 70,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CareerRole" ("createdAt", "description", "id", "lucideIcon", "salaryMax", "salaryMin", "targetScore", "title", "updatedAt") SELECT "createdAt", "description", "id", "lucideIcon", "salaryMax", "salaryMin", "targetScore", "title", "updatedAt" FROM "CareerRole";
DROP TABLE "CareerRole";
ALTER TABLE "new_CareerRole" RENAME TO "CareerRole";
CREATE UNIQUE INDEX "CareerRole_onetSocCode_key" ON "CareerRole"("onetSocCode");
CREATE INDEX "CareerRole_title_idx" ON "CareerRole"("title");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
