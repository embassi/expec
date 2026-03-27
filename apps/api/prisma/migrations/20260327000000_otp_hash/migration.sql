-- OTP security hardening: replace plaintext otp_code with HMAC hash,
-- add attempts counter. OTP records are short-lived so it's safe to
-- truncate before altering the column structure.

-- Clear all existing (expired/used) OTP records first
TRUNCATE TABLE "otp_verifications";

-- Add otp_hash (replaces otp_code)
ALTER TABLE "otp_verifications" ADD COLUMN "otp_hash" TEXT NOT NULL DEFAULT '';

-- Remove the default immediately — new rows must supply the hash
ALTER TABLE "otp_verifications" ALTER COLUMN "otp_hash" DROP DEFAULT;

-- Add attempts counter
ALTER TABLE "otp_verifications" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;

-- Drop the old plaintext column
ALTER TABLE "otp_verifications" DROP COLUMN "otp_code";

-- Index for fast active-OTP lookup
CREATE INDEX "otp_verifications_phone_number_used_expires_at_idx"
  ON "otp_verifications"("phone_number", "used", "expires_at");
