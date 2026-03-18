-- AddForeignKey
ALTER TABLE "LocalSaleItem" ADD CONSTRAINT "LocalSaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
