-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "water_difference_mode" AS ENUM ('billable', 'report_only');

-- CreateEnum
CREATE TYPE "node_type" AS ENUM ('zone', 'building', 'floor', 'unit');

-- CreateEnum
CREATE TYPE "customer_type" AS ENUM ('individual', 'company', 'tenant', 'owner');

-- CreateEnum
CREATE TYPE "entity_status" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "audit_log" (
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

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" TEXT NOT NULL,
    "scoped_key" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "request_hash" TEXT,
    "response_body" JSONB,
    "response_status" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expired_at" TIMESTAMP(3),

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "project_status" NOT NULL DEFAULT 'active',
    "tax_enabled" BOOLEAN NOT NULL DEFAULT false,
    "tax_rate" DECIMAL(65,30),
    "reading_threshold_profile_id" TEXT,
    "water_difference_mode" "water_difference_mode" NOT NULL DEFAULT 'report_only',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_nodes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "node_type" "node_type" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "entity_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "location_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "customer_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "customer_type" "customer_type" NOT NULL,
    "national_or_commercial_id" TEXT NOT NULL,
    "status" "entity_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_unit_assignments" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "customer_unit_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_scoped_key_key" ON "idempotency_records"("scoped_key");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "location_nodes_parent_id_idx" ON "location_nodes"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_nodes_project_id_node_type_code_key" ON "location_nodes"("project_id", "node_type", "code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_project_id_customer_code_key" ON "customers"("project_id", "customer_code");

-- AddForeignKey
ALTER TABLE "location_nodes" ADD CONSTRAINT "location_nodes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_nodes" ADD CONSTRAINT "location_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "location_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_unit_assignments" ADD CONSTRAINT "customer_unit_assignments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_unit_assignments" ADD CONSTRAINT "customer_unit_assignments_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "location_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PartialUniqueIndex: one active row per (customer_id, unit_id)
CREATE UNIQUE INDEX "customer_unit_assignments_customer_id_unit_id_active_key" ON "customer_unit_assignments"("customer_id", "unit_id") WHERE "end_at" IS NULL;
