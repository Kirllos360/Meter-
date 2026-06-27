-- CreateTable
CREATE TABLE "sim_system"."idempotency_records" (
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

CREATE UNIQUE INDEX "idempotency_records_scoped_key_key" ON "sim_system"."idempotency_records"("scoped_key");
