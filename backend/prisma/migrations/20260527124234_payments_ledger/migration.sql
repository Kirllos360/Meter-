CREATE TYPE "sim_system"."payment_method" AS ENUM ('cash', 'bank_transfer', 'card', 'online', 'cheque', 'wallet');
CREATE TYPE "sim_system"."payment_status" AS ENUM ('pending', 'confirmed', 'reversed', 'cancelled');
CREATE TYPE "sim_system"."ledger_entry_type" AS ENUM ('invoice_charge', 'adjustment_debit', 'adjustment_credit', 'payment_credit', 'payment_reversal');
CREATE TYPE "sim_system"."reference_type" AS ENUM ('invoice', 'payment', 'adjustment');

CREATE TABLE "sim_system"."payments" (
    "id" TEXT NOT NULL,
    "payment_number" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "method" "sim_system"."payment_method" NOT NULL,
    "amount" DECIMAL(12,3) NOT NULL,
    "status" "sim_system"."payment_status" NOT NULL DEFAULT 'pending',
    "collected_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sim_system"."payment_allocations" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "allocated_amount" DECIMAL(12,3) NOT NULL,
    "allocation_order" INTEGER NOT NULL,
    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sim_system"."customer_ledger_entries" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "entry_type" "sim_system"."ledger_entry_type" NOT NULL,
    "reference_type" "sim_system"."reference_type" NOT NULL,
    "reference_id" TEXT NOT NULL,
    "amount_delta" DECIMAL(12,3) NOT NULL,
    "running_balance" DECIMAL(12,3) NOT NULL,
    "entry_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_payment_number_key" ON "sim_system"."payments"("payment_number");

CREATE OR REPLACE FUNCTION "sim_system".block_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'customer_ledger_entries is append-only: UPDATE and DELETE are not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customer_ledger_append_only
  BEFORE UPDATE OR DELETE ON "sim_system".customer_ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION "sim_system".block_ledger_modification();
