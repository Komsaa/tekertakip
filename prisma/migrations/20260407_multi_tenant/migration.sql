-- PanelUser companyId
ALTER TABLE "PanelUser" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Vehicle
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Job
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- FuelEntry
ALTER TABLE "FuelEntry" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- FinanceEntry
ALTER TABLE "FinanceEntry" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Contact
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Task
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Route
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- CreditCard
ALTER TABLE "CreditCard" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Client
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- PaymentCalendar
ALTER TABLE "PaymentCalendar" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- AuditLog
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Setting: key unique kaldır, composite unique ekle
ALTER TABLE "Setting" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
DROP INDEX IF EXISTS "Setting_key_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Setting_key_companyId_key" ON "Setting"("key", "companyId");
