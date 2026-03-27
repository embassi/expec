-- Add Supabase Auth user ID to users table
-- This links our custom users table to Supabase auth.users
-- Nullable: populated lazily on first Supabase Auth login

ALTER TABLE "users" ADD COLUMN "auth_user_id" UUID;

CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");
