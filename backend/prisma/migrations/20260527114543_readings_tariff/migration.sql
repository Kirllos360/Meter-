-- CreateEnum
CREATE TYPE "reading_source" AS ENUM ('manual', 'import', 'automatic');

-- CreateEnum
CREATE TYPE "reading_status" AS ENUM ('valid', 'pending_review', 'estimated', 'suspicious', 'corrected', 'rejected');

-- CreateEnum
CREATE TYPE "review_action" AS ENUM ('approve', 'reject', 'correct');

-- CreateEnum
CREATE TYPE "tariff_status" AS ENUM ('draft', 'active', 'retired');

-- CreateEnum
CREATE TYPE "billing_period_status" AS ENUM ('open', 'in_review', 'closed');

-- CreateTable
CREATE TABLE "readings" (
    "id" TEXT NOT NULL,
    "meter_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "customer_id_snapshot" TEXT NOT NULL,
    "unit_id_snapshot" TEXT NOT NULL,
    "reading_value" DECIMAL(12,3) NOT NULL,
    "reading_at" TIMESTAMP(3) NOT NULL,
    "source" "reading_source" NOT NULL,
    "previous_reading_value" DECIMAL(12,3),
    "consumption_value" DECIMAL(12,3),
    "status" "reading_status" NOT NULL DEFAULT 'pending_review',
    "raw_payload" JSONB,
    "entered_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_reviews" (
    "id" TEXT NOT NULL,
    "reading_id" TEXT NOT NULL,
    "review_action" "review_action" NOT NULL,
    "reviewed_by" TEXT NOT NULL,
    "reviewed_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "reading_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff_plans" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "meter_type" "meter_type" NOT NULL,
    "rate_per_unit" DECIMAL(12,3) NOT NULL,
    "currency" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "status" "tariff_status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "tariff_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_periods" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "period_code" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "billing_period_status" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "billing_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "readings_meter_id_reading_at_source_key" ON "readings"("meter_id", "reading_at", "source");

-- CreateIndex
CREATE UNIQUE INDEX "billing_periods_project_id_period_code_key" ON "billing_periods"("project_id", "period_code");
