-- AlterTable
ALTER TABLE "scanners" ADD COLUMN "assigned_user_id" UUID;

-- AddForeignKey
ALTER TABLE "scanners" ADD CONSTRAINT "scanners_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
