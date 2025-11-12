-- CreateTable
CREATE TABLE "Round" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "courseName" TEXT NOT NULL,
    "datePlayed" TIMESTAMP(3) NOT NULL,
    "score" INTEGER NOT NULL,
    "holes" INTEGER NOT NULL DEFAULT 18,
    "courseRating" DOUBLE PRECISION,
    "slopeRating" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Round_userId_idx" ON "Round"("userId");

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
