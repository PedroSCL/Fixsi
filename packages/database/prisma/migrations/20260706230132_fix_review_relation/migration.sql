/*
  Warnings:

  - A unique constraint covering the columns `[bookingId,authorId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Review_bookingId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_authorId_key" ON "Review"("bookingId", "authorId");
