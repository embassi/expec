-- Make phone_number nullable on users
ALTER TABLE "users" ALTER COLUMN "phone_number" DROP NOT NULL;

-- Add email column to users (nullable, unique on non-null)
ALTER TABLE "users" ADD COLUMN "email" TEXT;
CREATE UNIQUE INDEX "users_email_key" ON "users"("email") WHERE "email" IS NOT NULL;

-- Make phone_number nullable on otp_verifications
ALTER TABLE "otp_verifications" ALTER COLUMN "phone_number" DROP NOT NULL;

-- Add email column to otp_verifications
ALTER TABLE "otp_verifications" ADD COLUMN "email" TEXT;
CREATE INDEX "otp_verifications_email_idx" ON "otp_verifications"("email");
CREATE INDEX "otp_verifications_email_used_expires_at_idx" ON "otp_verifications"("email", "used", "expires_at");
