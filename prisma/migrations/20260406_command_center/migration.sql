-- GPS geçmişi tablosu (güzergah durak analizi)
CREATE TABLE "DriverLocationHistory" (
  "id" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DriverLocationHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DriverLocationHistory_driverId_timestamp_idx"
  ON "DriverLocationHistory"("driverId", "timestamp");

ALTER TABLE "DriverLocationHistory"
  ADD CONSTRAINT "DriverLocationHistory_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
