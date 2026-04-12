import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

// Güvenli, idempotent migration runner (IF NOT EXISTS / IF EXISTS kullanır)
// GET /api/admin/run-migrations  — sadece oturum açmış admin çalıştırabilir

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _adminErr = requireAdmin(session); if (_adminErr) return _adminErr;

  const results: { step: string; status: "ok" | "error"; detail?: string }[] = [];

  async function run(step: string, sql: string) {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push({ step, status: "ok" });
    } catch (e) {
      results.push({ step, status: "error", detail: String(e) });
    }
  }

  // 1. Client tablosu
  await run("Client table", `
    CREATE TABLE IF NOT EXISTS "Client" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "vkn" TEXT,
      "taxOffice" TEXT,
      "address" TEXT,
      "email" TEXT,
      "phone" TEXT,
      "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "paymentTermDays" INTEGER NOT NULL DEFAULT 30,
      "kdvRate" DOUBLE PRECISION NOT NULL DEFAULT 20,
      "tevkifatRate" DOUBLE PRECISION NOT NULL DEFAULT 50,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
    )
  `);

  // 2. Invoice tablosu
  await run("Invoice table", `
    CREATE TABLE IF NOT EXISTS "Invoice" (
      "id" TEXT NOT NULL,
      "invoiceNo" TEXT NOT NULL,
      "clientId" TEXT NOT NULL,
      "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dueDate" TIMESTAMP(3) NOT NULL,
      "periodStart" TIMESTAMP(3) NOT NULL,
      "periodEnd" TIMESTAMP(3) NOT NULL,
      "tripCount" INTEGER NOT NULL,
      "unitPrice" DOUBLE PRECISION NOT NULL,
      "subtotal" DOUBLE PRECISION NOT NULL,
      "kdvRate" DOUBLE PRECISION NOT NULL DEFAULT 20,
      "kdvAmount" DOUBLE PRECISION NOT NULL,
      "tevkifatRate" DOUBLE PRECISION NOT NULL DEFAULT 50,
      "tevkifatAmount" DOUBLE PRECISION NOT NULL,
      "totalAmount" DOUBLE PRECISION NOT NULL,
      "payableAmount" DOUBLE PRECISION NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'bekliyor',
      "paidAt" TIMESTAMP(3),
      "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
    )
  `);

  await run("Invoice invoiceNo unique index", `
    CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo")
  `);

  await run("Invoice clientId FK", `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_clientId_fkey'
      ) THEN
        ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey"
          FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      END IF;
    END $$
  `);

  // 3. Job.clientId kolonu
  await run("Job.clientId column", `
    ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "clientId" TEXT
  `);

  await run("Job clientId FK", `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Job_clientId_fkey'
      ) THEN
        ALTER TABLE "Job" ADD CONSTRAINT "Job_clientId_fkey"
          FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$
  `);

  // 4. AuditLog tablosu
  await run("AuditLog table", `
    CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT NOT NULL,
      "userEmail" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "entity" TEXT NOT NULL,
      "entityId" TEXT,
      "entityName" TEXT,
      "changes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
    )
  `);

  await run("AuditLog indexes", `
    CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
    CREATE INDEX IF NOT EXISTS "AuditLog_entity_idx" ON "AuditLog"("entity");
    CREATE INDEX IF NOT EXISTS "AuditLog_userEmail_idx" ON "AuditLog"("userEmail")
  `);

  // 5. DriverLocationHistory tablosu
  await run("DriverLocationHistory table", `
    CREATE TABLE IF NOT EXISTS "DriverLocationHistory" (
      "id" TEXT NOT NULL,
      "driverId" TEXT NOT NULL,
      "latitude" DOUBLE PRECISION NOT NULL,
      "longitude" DOUBLE PRECISION NOT NULL,
      "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DriverLocationHistory_pkey" PRIMARY KEY ("id")
    )
  `);

  await run("DriverLocationHistory FK", `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DriverLocationHistory_driverId_fkey'
      ) THEN
        ALTER TABLE "DriverLocationHistory" ADD CONSTRAINT "DriverLocationHistory_driverId_fkey"
          FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `);

  await run("DriverLocationHistory index", `
    CREATE INDEX IF NOT EXISTS "DriverLocationHistory_driverId_timestamp_idx"
      ON "DriverLocationHistory"("driverId", "timestamp")
  `);

  // 6. Driver eski kolonları kaldır
  await run("Driver drop srcExpiry", `ALTER TABLE "Driver" DROP COLUMN IF EXISTS "srcExpiry"`);
  await run("Driver drop psychotechExpiry", `ALTER TABLE "Driver" DROP COLUMN IF EXISTS "psychotechExpiry"`);
  await run("Driver drop criminalRecordDate", `ALTER TABLE "Driver" DROP COLUMN IF EXISTS "criminalRecordDate"`);
  await run("Driver drop criminalRecordExpiry", `ALTER TABLE "Driver" DROP COLUMN IF EXISTS "criminalRecordExpiry"`);
  await run("Driver drop healthReportExpiry", `ALTER TABLE "Driver" DROP COLUMN IF EXISTS "healthReportExpiry"`);

  // 7. PanelUser tablosu
  await run("PanelUser table", `
    CREATE TABLE IF NOT EXISTS "PanelUser" (
      "id" TEXT NOT NULL,
      "username" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'admin',
      "active" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PanelUser_pkey" PRIMARY KEY ("id")
    )
  `);

  await run("PanelUser username unique index", `
    CREATE UNIQUE INDEX IF NOT EXISTS "PanelUser_username_key" ON "PanelUser"("username")
  `);

  const allOk = results.every(r => r.status === "ok");
  const errors = results.filter(r => r.status === "error");

  return NextResponse.json({
    success: allOk,
    summary: `${results.filter(r => r.status === "ok").length}/${results.length} adım başarılı`,
    errors: errors.length > 0 ? errors : undefined,
    results,
  });
}
