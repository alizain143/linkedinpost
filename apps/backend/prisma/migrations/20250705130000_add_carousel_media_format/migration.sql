-- CreateEnum
CREATE TYPE "MediaFormat" AS ENUM ('single', 'carousel');

-- AlterTable
ALTER TABLE "post_packages" ADD COLUMN "mediaFormat" "MediaFormat" NOT NULL DEFAULT 'single';
ALTER TABLE "post_packages" ADD COLUMN "carouselSlideCount" INTEGER;
