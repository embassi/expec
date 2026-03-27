-- Replace partial unique index with a proper unique constraint on users.email
-- Prisma's upsert (ON CONFLICT) requires a constraint, not a partial index.
-- PostgreSQL allows multiple NULLs in a UNIQUE constraint, so nullable email is fine.
DROP INDEX IF EXISTS "users_email_key";
ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");
