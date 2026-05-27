-- CreateEnum
CREATE TYPE "utility_type" AS ENUM ('electricity', 'water');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('draft', 'pending_approval', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "adjustment_type" AS ENUM ('credit', 'debit');

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "meter_id" TEXT NOT NULL,
    "utility_type" "utility_type" NOT NULL,
    "billing_period_id" TEXT NOT NULL,
    "status" "invoice_status" NOT NULL DEFAULT 'draft',
    "subtotal_amount" DECIMAL(12,3) NOT NULL,
    "tax_amount" DECIMAL(12,3) NOT NULL,
    "total_amount" DECIMAL(12,3) NOT NULL,
    "paid_amount" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "remaining_amount" DECIMAL(12,3) NOT NULL,
    "issued_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "immutable_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "reading_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit_price" DECIMAL(12,3) NOT NULL,
    "line_amount" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_adjustments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "adjustment_type" "adjustment_type" NOT NULL,
    "amount" DECIMAL(12,3) NOT NULL,
    "reason" TEXT NOT NULL,
    "approved_by" TEXT,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "invoice_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");
