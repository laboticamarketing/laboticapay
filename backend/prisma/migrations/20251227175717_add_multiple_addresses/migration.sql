/*
  Warnings:

  - You are about to drop the column `addressCity` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `addressComplement` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `addressNeighborhood` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `addressNumber` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `addressState` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `addressStreet` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `addressZip` on the `Customer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "addressCity",
DROP COLUMN "addressComplement",
DROP COLUMN "addressNeighborhood",
DROP COLUMN "addressNumber",
DROP COLUMN "addressState",
DROP COLUMN "addressStreet",
DROP COLUMN "addressZip";

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Casa',
    "zip" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "complement" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
