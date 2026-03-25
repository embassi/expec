-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "phone_number" TEXT NOT NULL,
    "full_name" TEXT,
    "profile_photo_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "phone_number" TEXT NOT NULL,
    "otp_code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "type" TEXT NOT NULL DEFAULT 'residential',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "community_id" UUID NOT NULL,
    "unit_code" TEXT NOT NULL,
    "unit_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "unit_id" UUID,
    "relationship_type" TEXT,
    "role_type" TEXT,
    "approval_status" TEXT NOT NULL DEFAULT 'pending',
    "invited_by_user_id" UUID,
    "created_by_manager_id" UUID,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scanners" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "community_id" UUID NOT NULL,
    "scanner_name" TEXT,
    "scanner_code" TEXT NOT NULL,
    "location_label" TEXT,
    "device_key" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scanners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "community_id" UUID,
    "scanner_id" UUID,
    "scanner_code" TEXT,
    "scan_type" TEXT,
    "user_id" UUID,
    "membership_id" UUID,
    "guest_pass_id" UUID,
    "resident_name" TEXT,
    "resident_phone" TEXT,
    "unit_id" UUID,
    "unit_code" TEXT,
    "result" TEXT NOT NULL,
    "denial_reason" TEXT,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_passes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "community_id" UUID NOT NULL,
    "host_user_id" UUID NOT NULL,
    "host_membership_id" UUID NOT NULL,
    "guest_name" TEXT NOT NULL,
    "guest_phone" TEXT NOT NULL,
    "pass_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "usage_limit" INTEGER NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "qr_token_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "community_id" UUID NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "image_url" TEXT,
    "published_by" UUID,
    "published_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "community_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "membership_id" UUID,
    "category" TEXT,
    "subject" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "assigned_to" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_policies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "community_id" UUID NOT NULL,
    "owner_added_members_require_approval" BOOLEAN NOT NULL DEFAULT true,
    "max_family_members_per_unit" INTEGER NOT NULL DEFAULT 6,
    "max_staff_members_per_unit" INTEGER NOT NULL DEFAULT 3,
    "allow_tenants" BOOLEAN NOT NULL DEFAULT true,
    "tenant_requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "max_active_guest_passes_per_host" INTEGER NOT NULL DEFAULT 5,
    "max_guest_passes_per_day" INTEGER NOT NULL DEFAULT 10,
    "guest_pass_guest_duration_hours" INTEGER NOT NULL DEFAULT 24,
    "guest_pass_guest_usage_limit" INTEGER NOT NULL DEFAULT 5,
    "guest_pass_delivery_duration_hours" INTEGER NOT NULL DEFAULT 6,
    "guest_pass_delivery_usage_limit" INTEGER NOT NULL DEFAULT 1,
    "guest_pass_service_duration_hours" INTEGER NOT NULL DEFAULT 6,
    "guest_pass_service_usage_limit" INTEGER NOT NULL DEFAULT 1,
    "family_can_generate_guest_passes" BOOLEAN NOT NULL DEFAULT true,
    "tenant_can_generate_guest_passes" BOOLEAN NOT NULL DEFAULT true,
    "staff_can_generate_guest_passes" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "otp_verifications_phone_number_idx" ON "otp_verifications"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "communities_slug_key" ON "communities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "units_community_id_unit_code_key" ON "units"("community_id", "unit_code");

-- CreateIndex
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

-- CreateIndex
CREATE INDEX "memberships_community_id_idx" ON "memberships"("community_id");

-- CreateIndex
CREATE UNIQUE INDEX "scanners_scanner_code_key" ON "scanners"("scanner_code");

-- CreateIndex
CREATE INDEX "access_logs_scanner_id_idx" ON "access_logs"("scanner_id");

-- CreateIndex
CREATE INDEX "access_logs_user_id_idx" ON "access_logs"("user_id");

-- CreateIndex
CREATE INDEX "guest_passes_host_user_id_idx" ON "guest_passes"("host_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_policies_community_id_key" ON "community_policies"("community_id");

-- AddForeignKey
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_phone_number_fkey" FOREIGN KEY ("phone_number") REFERENCES "users"("phone_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scanners" ADD CONSTRAINT "scanners_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_scanner_id_fkey" FOREIGN KEY ("scanner_id") REFERENCES "scanners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_passes" ADD CONSTRAINT "guest_passes_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_passes" ADD CONSTRAINT "guest_passes_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_passes" ADD CONSTRAINT "guest_passes_host_membership_id_fkey" FOREIGN KEY ("host_membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_policies" ADD CONSTRAINT "community_policies_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
