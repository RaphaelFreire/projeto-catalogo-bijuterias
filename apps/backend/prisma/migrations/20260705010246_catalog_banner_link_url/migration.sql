-- DropForeignKey
ALTER TABLE "banners" DROP CONSTRAINT "banners_categoryId_fkey";

-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "linkUrl" TEXT,
ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
