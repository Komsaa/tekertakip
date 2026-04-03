-- AlterTable
ALTER TABLE "Driver" ADD COLUMN "mobilePin" TEXT;
ALTER TABLE "Driver" ADD COLUMN "mobileToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Driver_mobileToken_key" ON "Driver"("mobileToken");
