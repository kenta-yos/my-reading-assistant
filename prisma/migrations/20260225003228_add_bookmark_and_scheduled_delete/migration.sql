-- AlterTable
ALTER TABLE "Guide" ADD COLUMN     "bookmarked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduledDeleteAt" TIMESTAMP(3);
