-- CreateEnum
CREATE TYPE "meter_type" AS ENUM ('electricity', 'water_main', 'water_child');

-- CreateEnum
CREATE TYPE "meter_status" AS ENUM ('available', 'assigned', 'active', 'offline', 'faulty', 'replaced', 'terminated', 'retired');

-- CreateEnum
CREATE TYPE "ip_type" AS ENUM ('static', 'dynamic');

-- CreateEnum
CREATE TYPE "sim_status" AS ENUM ('available', 'assigned', 'active', 'suspended', 'old', 'reusable', 'retired');

-- CreateEnum
CREATE TYPE "assignment_status" AS ENUM ('active', 'ended');

-- CreateTable
CREATE TABLE "meters" (
    "id" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "meter_type" "meter_type" NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "meter_status" NOT NULL DEFAULT 'available',
    "installation_date" TIMESTAMP(3) NOT NULL,
    "activation_date" TIMESTAMP(3) NOT NULL,
    "termination_date" TIMESTAMP(3),
    "project_id" TEXT NOT NULL,
    "location_id" TEXT,
    "parent_main_meter_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "meters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sim_cards" (
    "id" TEXT NOT NULL,
    "iccid" TEXT NOT NULL,
    "msisdn" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "ip_type" "ip_type" NOT NULL,
    "status" "sim_status" NOT NULL DEFAULT 'available',
    "cooldown_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "sim_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meter_assignments" (
    "id" TEXT NOT NULL,
    "meter_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "change_reason" TEXT NOT NULL,
    "status" "assignment_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "meter_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sim_assignments" (
    "id" TEXT NOT NULL,
    "sim_id" TEXT NOT NULL,
    "meter_id" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "change_reason" TEXT NOT NULL,
    "status" "assignment_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "sim_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meters_serial_number_key" ON "meters"("serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "sim_cards_iccid_key" ON "sim_cards"("iccid");

-- AddForeignKey
ALTER TABLE "meters" ADD CONSTRAINT "meters_parent_main_meter_id_fkey" FOREIGN KEY ("parent_main_meter_id") REFERENCES "meters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meter_assignments" ADD CONSTRAINT "meter_assignments_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sim_assignments" ADD CONSTRAINT "sim_assignments_sim_id_fkey" FOREIGN KEY ("sim_id") REFERENCES "sim_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sim_assignments" ADD CONSTRAINT "sim_assignments_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PartialUniqueIndex: FR-004 — one active assignment per meter
CREATE UNIQUE INDEX "meter_assignments_meter_id_active_key" ON "meter_assignments"("meter_id") WHERE "end_at" IS NULL;

-- PartialUniqueIndex: FR-005 — one active assignment per SIM
CREATE UNIQUE INDEX "sim_assignments_sim_id_active_key" ON "sim_assignments"("sim_id") WHERE "end_at" IS NULL;
