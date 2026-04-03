-- Şirketler tablosu oluştur
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "driverLimit" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

-- Şöförler tablosuna şirket alanı ekle
ALTER TABLE "Driver" ADD COLUMN "companyId" TEXT;

-- Foreign key
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Mert Tur şirketini oluştur ve mevcut tüm şöförleri ona ata
INSERT INTO "Company" ("id", "name", "code", "driverLimit", "active", "createdAt", "updatedAt")
VALUES ('company_merttur', 'Mert Tur', 'MT2024', 15, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE "Driver" SET "companyId" = 'company_merttur' WHERE "companyId" IS NULL;
