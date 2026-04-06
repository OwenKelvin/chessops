-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "country" TEXT,
ADD COLUMN     "countryName" TEXT;

-- CreateIndex
CREATE INDEX "Tournament_country_idx" ON "Tournament"("country");
