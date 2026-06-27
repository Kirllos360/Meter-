-- CreateEnum
CREATE TYPE "sim_system"."login_attempt_status" AS ENUM ('success', 'failure');

-- CreateTable: refresh_tokens
CREATE TABLE "sim_system"."refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable: login_attempts
CREATE TABLE "sim_system"."login_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "success" BOOLEAN NOT NULL,
    "attempted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "sim_system"."refresh_tokens"("token");
CREATE INDEX "refresh_tokens_user_id_idx" ON "sim_system"."refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_token_idx" ON "sim_system"."refresh_tokens"("token");
CREATE INDEX "login_attempts_user_id_attempted_at_idx" ON "sim_system"."login_attempts"("user_id", "attempted_at");
