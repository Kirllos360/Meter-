-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('cash', 'bank_transfer', 'card', 'online', 'cheque', 'wallet');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'confirmed', 'reversed', 'cancelled');

-- CreateEnum
CREATE TYPE "ledger_entry_type" AS ENUM ('invoice_charge', 'adjustment_debit', 'adjustment_credit', 'payment_credit', 'payment_reversal');

-- CreateEnum
CREATE TYPE "reference_type" AS ENUM ('invoice', 'payment', 'adjustment');

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "payment_number" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "method" "payment_method" NOT NULL,
    "amount" DECIMAL(12,3) NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'pending',
    "collected_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "allocated_amount" DECIMAL(12,3) NOT NULL,
    "allocation_order" INTEGER NOT NULL,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_ledger_entries" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "entry_type" "ledger_entry_type" NOT NULL,
    "reference_type" "reference_type" NOT NULL,
    "reference_id" TEXT NOT NULL,
    "amount_delta" DECIMAL(12,3) NOT NULL,
    "running_balance" DECIMAL(12,3) NOT NULL,
    "entry_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_number_key" ON "payments"("payment_number");

-- Append-Only Protection: Block UPDATE and DELETE on ledger entries
CREATE OR REPLACE FUNCTION block_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'customer_ledger_entries is append-only: UPDATE and DELETE are not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customer_ledger_append_only
  BEFORE UPDATE OR DELETE ON customer_ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION block_ledger_modification();
