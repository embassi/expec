-- Migration: Replace stringly-typed status/role columns with Postgres enum types.
--
-- Safe to re-run: DROP TYPE...CASCADE cleans up before recreating.
-- Production: psql $DIRECT_URL -f migration.sql  (use direct URL to bypass PgBouncer)

-- ─── 1. Create enum types ─────────────────────────────────────────────────────

CREATE TYPE "user_status" AS ENUM ('active', 'invited', 'suspended');
CREATE TYPE "user_role_type" AS ENUM ('user', 'super_admin');
CREATE TYPE "membership_role_type" AS ENUM ('manager', 'community_admin', 'community_manager', 'staff', 'gatekeeper', 'resident');
CREATE TYPE "membership_relationship_type" AS ENUM ('owner', 'family', 'tenant', 'staff');
CREATE TYPE "approval_status" AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE "pass_type" AS ENUM ('guest', 'delivery', 'service_provider');
CREATE TYPE "pass_status" AS ENUM ('active', 'used', 'expired', 'cancelled');
CREATE TYPE "scan_result" AS ENUM ('granted', 'denied');
CREATE TYPE "scan_type" AS ENUM ('resident', 'guest');
CREATE TYPE "announcement_status" AS ENUM ('draft', 'published');
CREATE TYPE "service_request_status" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- ─── 2. Alter users ───────────────────────────────────────────────────────────
-- Drop default → alter type → restore default with enum cast

ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" TYPE "user_status" USING "status"::"user_status";
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active'::"user_status";

ALTER TABLE "users" ALTER COLUMN "role_type" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role_type" TYPE "user_role_type" USING "role_type"::"user_role_type";
ALTER TABLE "users" ALTER COLUMN "role_type" SET DEFAULT 'user'::"user_role_type";

-- ─── 3. Alter memberships ────────────────────────────────────────────────────

ALTER TABLE "memberships" ALTER COLUMN "approval_status" DROP DEFAULT;
ALTER TABLE "memberships" ALTER COLUMN "approval_status" TYPE "approval_status" USING "approval_status"::"approval_status";
ALTER TABLE "memberships" ALTER COLUMN "approval_status" SET DEFAULT 'pending'::"approval_status";

ALTER TABLE "memberships" ALTER COLUMN "role_type" TYPE "membership_role_type" USING "role_type"::"membership_role_type";
ALTER TABLE "memberships" ALTER COLUMN "relationship_type" TYPE "membership_relationship_type" USING "relationship_type"::"membership_relationship_type";

-- ─── 4. Alter access_logs ────────────────────────────────────────────────────

ALTER TABLE "access_logs" ALTER COLUMN "result" TYPE "scan_result" USING "result"::"scan_result";
ALTER TABLE "access_logs" ALTER COLUMN "scan_type" TYPE "scan_type" USING "scan_type"::"scan_type";

-- ─── 5. Alter guest_passes ───────────────────────────────────────────────────

ALTER TABLE "guest_passes" ALTER COLUMN "pass_type" TYPE "pass_type" USING "pass_type"::"pass_type";

ALTER TABLE "guest_passes" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "guest_passes" ALTER COLUMN "status" TYPE "pass_status" USING "status"::"pass_status";
ALTER TABLE "guest_passes" ALTER COLUMN "status" SET DEFAULT 'active'::"pass_status";

-- ─── 6. Alter announcements ──────────────────────────────────────────────────

ALTER TABLE "announcements" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "announcements" ALTER COLUMN "status" TYPE "announcement_status" USING "status"::"announcement_status";
ALTER TABLE "announcements" ALTER COLUMN "status" SET DEFAULT 'draft'::"announcement_status";

-- ─── 7. Alter service_requests ───────────────────────────────────────────────

ALTER TABLE "service_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "service_requests" ALTER COLUMN "status" TYPE "service_request_status" USING "status"::"service_request_status";
ALTER TABLE "service_requests" ALTER COLUMN "status" SET DEFAULT 'open'::"service_request_status";
