-- Remove document expiry date fields from Driver
ALTER TABLE "Driver" DROP COLUMN IF EXISTS "srcExpiry";
ALTER TABLE "Driver" DROP COLUMN IF EXISTS "psychotechExpiry";
ALTER TABLE "Driver" DROP COLUMN IF EXISTS "criminalRecordDate";
ALTER TABLE "Driver" DROP COLUMN IF EXISTS "criminalRecordExpiry";
ALTER TABLE "Driver" DROP COLUMN IF EXISTS "healthReportExpiry";
