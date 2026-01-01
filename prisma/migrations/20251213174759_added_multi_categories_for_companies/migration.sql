/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Company` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_categoryId_fkey";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "categoryId";

-- CreateTable
CREATE TABLE "_CompanyCategories" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CompanyCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CompanyCategories_B_index" ON "_CompanyCategories"("B");

-- AddForeignKey
ALTER TABLE "_CompanyCategories" ADD CONSTRAINT "_CompanyCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyCategories" ADD CONSTRAINT "_CompanyCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
