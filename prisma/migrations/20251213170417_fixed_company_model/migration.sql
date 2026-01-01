-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "categoryId" INTEGER;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
