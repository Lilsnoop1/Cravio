-- AlterTable: LocalSale.receiptId (FK to Receipt)
ALTER TABLE "LocalSale" ADD COLUMN IF NOT EXISTS "receiptId" INTEGER;

ALTER TABLE "LocalSale" ADD CONSTRAINT "LocalSale_receiptId_fkey"
  FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: LocalSaleItem.receiptId (FK to Receipt)
ALTER TABLE "LocalSaleItem" ADD COLUMN IF NOT EXISTS "receiptId" INTEGER;

ALTER TABLE "LocalSaleItem" ADD CONSTRAINT "LocalSaleItem_receiptId_fkey"
  FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
