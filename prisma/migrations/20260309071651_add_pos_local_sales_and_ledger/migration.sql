-- CreateTable
CREATE TABLE "LocalSale" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER,
    "vendorName" TEXT,
    "saleType" TEXT NOT NULL DEFAULT 'POS',
    "discountTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocalSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalSaleItem" (
    "id" SERIAL NOT NULL,
    "localSaleId" INTEGER NOT NULL,
    "productId" INTEGER,
    "name" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "lineTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "LocalSaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT,
    "entryType" TEXT NOT NULL DEFAULT 'RECEIVABLE',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "due" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LocalSaleItem" ADD CONSTRAINT "LocalSaleItem_localSaleId_fkey" FOREIGN KEY ("localSaleId") REFERENCES "LocalSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
