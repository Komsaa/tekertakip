ALTER TABLE "RouteProposal" ADD COLUMN "learningKey" TEXT, ADD COLUMN "learnedPath" JSONB;
CREATE UNIQUE INDEX "RouteProposal_learningKey_key" ON "RouteProposal"("learningKey");
CREATE TABLE "LearningSession" (
  "id" TEXT NOT NULL PRIMARY KEY, "driverId" TEXT NOT NULL, "companyId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL, "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL, "endedAt" TIMESTAMP(3),
  CONSTRAINT "LearningSession_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "LearningSession_driverId_companyId_startedAt_idx" ON "LearningSession"("driverId", "companyId", "startedAt");
CREATE TABLE "LearningPoint" (
  "id" TEXT NOT NULL PRIMARY KEY, "sessionId" TEXT NOT NULL, "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL, "accuracy" DOUBLE PRECISION NOT NULL, "timestamp" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LearningPoint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LearningPoint_sessionId_timestamp_key" ON "LearningPoint"("sessionId", "timestamp");
