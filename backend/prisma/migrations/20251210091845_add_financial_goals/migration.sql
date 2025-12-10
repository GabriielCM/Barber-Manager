-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('REVENUE', 'PROFIT', 'CLIENTS');

-- CreateTable
CREATE TABLE "financial_goals" (
    "id" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "targetValue" DECIMAL(10,2) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "financial_goals_type_month_year_key" ON "financial_goals"("type", "month", "year");
