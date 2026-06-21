-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");

-- CreateIndex
CREATE INDEX "Tournament_slug_idx" ON "Tournament"("slug");
