/*
  Warnings:

  - You are about to drop the column `medianSalary` on the `CareerRole` table. All the data in the column will be lost.
  - You are about to drop the column `salaryArea` on the `CareerRole` table. All the data in the column will be lost.
  - You are about to drop the column `salaryYear` on the `CareerRole` table. All the data in the column will be lost.

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
    "annual10thPercentileSeriesId" TEXT,
    "annual90thPercentileSeriesId" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "occupationSource" TEXT NOT NULL DEFAULT 'ONET',
    "wageSource" TEXT,
    "sourceUpdatedAt" DATETIME,
    "targetScore" INTEGER NOT NULL DEFAULT 70,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CareerRole" ("blsOccupationCode", "createdAt", "description", "id", "lucideIcon", "occupationSource", "onetSocCode", "salaryMax", "salaryMin", "sourceUpdatedAt", "targetScore", "title", "updatedAt", "wageSource") SELECT "blsOccupationCode", "createdAt", "description", "id", "lucideIcon", "occupationSource", "onetSocCode", "salaryMax", "salaryMin", "sourceUpdatedAt", "targetScore", "title", "updatedAt", "wageSource" FROM "CareerRole";
DROP TABLE "CareerRole";
ALTER TABLE "new_CareerRole" RENAME TO "CareerRole";
CREATE UNIQUE INDEX "CareerRole_onetSocCode_key" ON "CareerRole"("onetSocCode");
CREATE INDEX "CareerRole_title_idx" ON "CareerRole"("title");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
