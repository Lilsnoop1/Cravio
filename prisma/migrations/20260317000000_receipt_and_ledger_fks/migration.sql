-- AlterTable: add ledgerEntryId to LocalSale (FK to Ledger)
ALTER TABLE "LocalSale" ADD COLUMN IF NOT EXISTS "ledgerEntryId" INTEGER;

ALTER TABLE "LocalSale" ADD CONSTRAINT "LocalSale_ledgerEntryId_fkey"
  FOREIGN KEY ("ledgerEntryId") REFERENCES "LedgerEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: Receipt (unique barcode, FK to LocalSale)
CREATE TABLE "Receipt" (
    "id" SERIAL NOT NULL,
    "barcode" TEXT NOT NULL,
    "localSaleId" INTEGER NOT NULL,
    "netTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saleType" TEXT NOT NULL DEFAULT 'POS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Receipt_barcode_key" ON "Receipt"("barcode");
CREATE UNIQUE INDEX "Receipt_localSaleId_key" ON "Receipt"("localSaleId");

ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_localSaleId_fkey"
  FOREIGN KEY ("localSaleId") REFERENCES "LocalSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: LocalPurchase (with ledgerEntryId FK to Ledger)
CREATE TABLE "LocalPurchase" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER,
    "vendorName" TEXT,
    "ledgerEntryId" INTEGER,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocalPurchase_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LocalPurchase" ADD CONSTRAINT "LocalPurchase_ledgerEntryId_fkey"
  FOREIGN KEY ("ledgerEntryId") REFERENCES "LedgerEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: LocalPurchaseItem (FK to LocalPurchase and Product)
CREATE TABLE "LocalPurchaseItem" (
    "id" SERIAL NOT NULL,
    "localPurchaseId" INTEGER NOT NULL,
    "productId" INTEGER,
    "name" TEXT NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "lineTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "LocalPurchaseItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LocalPurchaseItem" ADD CONSTRAINT "LocalPurchaseItem_localPurchaseId_fkey"
  FOREIGN KEY ("localPurchaseId") REFERENCES "LocalPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LocalPurchaseItem" ADD CONSTRAINT "LocalPurchaseItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
