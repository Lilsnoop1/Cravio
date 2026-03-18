/*
  Warnings:

  - A unique constraint covering the columns `[receiptId]` on the table `LocalSale` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "LocalSale_receiptId_key" ON "LocalSale"("receiptId");
