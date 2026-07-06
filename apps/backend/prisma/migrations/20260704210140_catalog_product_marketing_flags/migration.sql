-- RenameColumn (preserves existing data, unlike a drop+recreate)
ALTER TABLE "products" RENAME COLUMN "availableOnline" TO "bestSeller";
ALTER TABLE "products" RENAME COLUMN "featured" TO "dailyDeal";
ALTER TABLE "products" RENAME COLUMN "allowsPreOrder" TO "lastUnits";
