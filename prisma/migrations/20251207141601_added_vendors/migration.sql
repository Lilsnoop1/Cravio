-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "p2pVendorId" INTEGER;

-- CreateTable
CREATE TABLE "P2PVendor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "P2PVendor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_p2pVendorId_fkey" FOREIGN KEY ("p2pVendorId") REFERENCES "P2PVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "P2PVendor" ADD CONSTRAINT "P2PVendor_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
