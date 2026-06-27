-- CreateEnum
CREATE TYPE "sim_system"."project_status" AS ENUM ('active', 'inactive');
CREATE TYPE "sim_system"."water_difference_mode" AS ENUM ('billable', 'report_only');
CREATE TYPE "sim_system"."node_type" AS ENUM ('zone', 'building', 'floor', 'unit');
CREATE TYPE "sim_system"."customer_type" AS ENUM ('individual', 'company', 'tenant', 'owner');
CREATE TYPE "sim_system"."entity_status" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "sim_system"."projects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "sim_system"."project_status" NOT NULL DEFAULT 'active',
    "tax_enabled" BOOLEAN NOT NULL DEFAULT false,
    "tax_rate" DECIMAL(65,30),
    "reading_threshold_profile_id" TEXT,
    "water_difference_mode" "sim_system"."water_difference_mode" NOT NULL DEFAULT 'report_only',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sim_system"."location_nodes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "node_type" "sim_system"."node_type" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "sim_system"."entity_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "location_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sim_system"."customers" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "customer_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "customer_type" "sim_system"."customer_type" NOT NULL,
    "national_or_commercial_id" TEXT NOT NULL,
    "status" "sim_system"."entity_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sim_system"."customer_unit_assignments" (
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
CREATE UNIQUE INDEX "projects_code_key" ON "sim_system"."projects"("code");
CREATE INDEX "location_nodes_parent_id_idx" ON "sim_system"."location_nodes"("parent_id");
CREATE UNIQUE INDEX "location_nodes_project_id_node_type_code_key" ON "sim_system"."location_nodes"("project_id", "node_type", "code");
CREATE UNIQUE INDEX "customers_project_id_customer_code_key" ON "sim_system"."customers"("project_id", "customer_code");

-- AddForeignKey
ALTER TABLE "sim_system"."location_nodes" ADD CONSTRAINT "location_nodes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "sim_system"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sim_system"."location_nodes" ADD CONSTRAINT "location_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "sim_system"."location_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sim_system"."customers" ADD CONSTRAINT "customers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "sim_system"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sim_system"."customer_unit_assignments" ADD CONSTRAINT "customer_unit_assignments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "sim_system"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sim_system"."customer_unit_assignments" ADD CONSTRAINT "customer_unit_assignments_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "sim_system"."location_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "customer_unit_assignments_customer_id_unit_id_active_key" ON "sim_system"."customer_unit_assignments"("customer_id", "unit_id") WHERE "end_at" IS NULL;
