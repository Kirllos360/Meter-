-- CreateEnum
CREATE TYPE "sim_system"."report_job_status" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "sim_system"."report_format" AS ENUM ('pdf', 'excel', 'csv');

-- CreateTable: AuditLog (append-only, T010)
CREATE TABLE "sim_system"."audit_log" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "before_state" JSONB,
    "after_state" JSONB,
    "reason" TEXT,
    "correlation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON "sim_system"."audit_log"("created_at");

-- CreateTable
CREATE TABLE "sim_system"."report_jobs" (
    "id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "status" "sim_system"."report_job_status" NOT NULL DEFAULT 'pending',
    "format" "sim_system"."report_format" NOT NULL,
    "filters" JSONB,
    "file_url" TEXT,
    "requested_by" TEXT NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "report_jobs_pkey" PRIMARY KEY ("id")
);
