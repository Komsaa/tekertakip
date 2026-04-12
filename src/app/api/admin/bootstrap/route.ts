import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminErr = requireAdmin(session); if (adminErr) return adminErr;

  const log: string[] = [];

  async function exec(label: string, sql: string) {
    try {
      await prisma.$executeRawUnsafe(sql);
      log.push(`✓ ${label}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already exists") || msg.includes("does not exist") && label.startsWith("Driver drop")) {
        log.push(`→ ${label} (atlandı)`);
      } else {
        log.push(`✗ ${label}: ${msg.slice(0, 120)}`);
      }
    }
  }

  await exec("Client table", `CREATE TABLE IF NOT EXISTS "Client" ("id" TEXT NOT NULL,"name" TEXT NOT NULL,"vkn" TEXT,"taxOffice" TEXT,"address" TEXT,"email" TEXT,"phone" TEXT,"unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,"paymentTermDays" INTEGER NOT NULL DEFAULT 30,"kdvRate" DOUBLE PRECISION NOT NULL DEFAULT 20,"tevkifatRate" DOUBLE PRECISION NOT NULL DEFAULT 50,"notes" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Client_pkey" PRIMARY KEY ("id"))`);
  await exec("Invoice table", `CREATE TABLE IF NOT EXISTS "Invoice" ("id" TEXT NOT NULL,"invoiceNo" TEXT NOT NULL,"clientId" TEXT NOT NULL,"issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"dueDate" TIMESTAMP(3) NOT NULL,"periodStart" TIMESTAMP(3) NOT NULL,"periodEnd" TIMESTAMP(3) NOT NULL,"tripCount" INTEGER NOT NULL,"unitPrice" DOUBLE PRECISION NOT NULL,"subtotal" DOUBLE PRECISION NOT NULL,"kdvRate" DOUBLE PRECISION NOT NULL DEFAULT 20,"kdvAmount" DOUBLE PRECISION NOT NULL,"tevkifatRate" DOUBLE PRECISION NOT NULL DEFAULT 50,"tevkifatAmount" DOUBLE PRECISION NOT NULL,"totalAmount" DOUBLE PRECISION NOT NULL,"payableAmount" DOUBLE PRECISION NOT NULL,"status" TEXT NOT NULL DEFAULT 'bekliyor',"paidAt" TIMESTAMP(3),"paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,"notes" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id"))`);
  await exec("Invoice invoiceNo unique", `CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo")`);
  await exec("Invoice clientId FK", `ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
  await exec("Job.clientId column", `ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "clientId" TEXT`);
  await exec("Job clientId FK", `ALTER TABLE "Job" ADD CONSTRAINT "Job_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
  await exec("AuditLog table", `CREATE TABLE IF NOT EXISTS "AuditLog" ("id" TEXT NOT NULL,"userEmail" TEXT NOT NULL,"action" TEXT NOT NULL,"entity" TEXT NOT NULL,"entityId" TEXT,"entityName" TEXT,"changes" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"))`);
  await exec("AuditLog createdAt index", `CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt")`);
  await exec("AuditLog entity index", `CREATE INDEX IF NOT EXISTS "AuditLog_entity_idx" ON "AuditLog"("entity")`);
  await exec("AuditLog userEmail index", `CREATE INDEX IF NOT EXISTS "AuditLog_userEmail_idx" ON "AuditLog"("userEmail")`);
  await exec("DriverLocationHistory table", `CREATE TABLE IF NOT EXISTS "DriverLocationHistory" ("id" TEXT NOT NULL,"driverId" TEXT NOT NULL,"latitude" DOUBLE PRECISION NOT NULL,"longitude" DOUBLE PRECISION NOT NULL,"timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "DriverLocationHistory_pkey" PRIMARY KEY ("id"))`);
  await exec("DriverLocationHistory FK", `ALTER TABLE "DriverLocationHistory" ADD CONSTRAINT "DriverLocationHistory_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  await exec("DriverLocationHistory index", `CREATE INDEX IF NOT EXISTS "DriverLocationHistory_driverId_timestamp_idx" ON "DriverLocationHistory"("driverId","timestamp")`);
  await exec("Driver drop srcExpiry", `ALTER TABLE "Driver" DROP COLUMN IF EXISTS "srcExpiry"`);
  await exec("Driver drop psychotechExpiry", `ALTER TABLE "Driver" DROP COLUMN IF EXISTS "psychotechExpiry"`);
  await exec("Driver drop criminalRecordDate", `ALTER TABLE "Driver" DROP COLUMN IF EXISTS "criminalRecordDate"`);
  await exec("Driver drop criminalRecordExpiry", `ALTER TABLE "Driver" DROP COLUMN IF EXISTS "criminalRecordExpiry"`);
  await exec("Driver drop healthReportExpiry", `ALTER TABLE "Driver" DROP COLUMN IF EXISTS "healthReportExpiry"`);

  // PanelUser tablosu — phone dahil
  await exec("PanelUser table", `CREATE TABLE IF NOT EXISTS "PanelUser" ("id" TEXT NOT NULL,"username" TEXT NOT NULL,"passwordHash" TEXT NOT NULL,"name" TEXT NOT NULL,"phone" TEXT,"role" TEXT NOT NULL DEFAULT 'firma',"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "PanelUser_pkey" PRIMARY KEY ("id"))`);
  await exec("PanelUser username unique", `CREATE UNIQUE INDEX IF NOT EXISTS "PanelUser_username_key" ON "PanelUser"("username")`);
  // phone kolonu — tablo önceden oluşturulduysa ekle
  await exec("PanelUser phone column", `ALTER TABLE "PanelUser" ADD COLUMN IF NOT EXISTS "phone" TEXT`);

  // ── Multi-tenant migration ──
  await exec("PanelUser companyId", `ALTER TABLE "PanelUser" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("Vehicle companyId", `ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("Job companyId", `ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("FuelEntry companyId", `ALTER TABLE "FuelEntry" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("FinanceEntry companyId", `ALTER TABLE "FinanceEntry" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("Contact companyId", `ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("Task companyId", `ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("Route companyId", `ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("CreditCard companyId", `ALTER TABLE "CreditCard" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("Client companyId", `ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("Invoice companyId", `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("PaymentCalendar companyId", `ALTER TABLE "PaymentCalendar" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("AuditLog companyId", `ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("Setting companyId", `ALTER TABLE "Setting" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("Setting drop unique", `DROP INDEX IF EXISTS "Setting_key_key"`);
  await exec("Setting composite unique", `CREATE UNIQUE INDEX IF NOT EXISTS "Setting_key_companyId_key" ON "Setting"("key", "companyId")`);
  await exec("Driver companyId", `ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("Salary companyId", `ALTER TABLE "Salary" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("RoutePassenger table", `CREATE TABLE IF NOT EXISTS "RoutePassenger" ("id" TEXT NOT NULL,"stopId" TEXT NOT NULL,"name" TEXT NOT NULL,"phone" TEXT,"notes" TEXT,"active" BOOLEAN NOT NULL DEFAULT true,"order" INTEGER NOT NULL DEFAULT 0,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "RoutePassenger_pkey" PRIMARY KEY ("id"))`);
  await exec("RoutePassenger FK", `ALTER TABLE "RoutePassenger" ADD CONSTRAINT "RoutePassenger_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "RouteStop"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  await exec("TripAttendance table", `CREATE TABLE IF NOT EXISTS "TripAttendance" ("id" TEXT NOT NULL,"passengerId" TEXT NOT NULL,"routeId" TEXT NOT NULL,"driverId" TEXT,"date" TEXT NOT NULL,"status" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "TripAttendance_pkey" PRIMARY KEY ("id"))`);
  await exec("TripAttendance FK", `ALTER TABLE "TripAttendance" ADD CONSTRAINT "TripAttendance_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "RoutePassenger"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  await exec("TripAttendance unique", `CREATE UNIQUE INDEX IF NOT EXISTS "TripAttendance_passengerId_routeId_date_key" ON "TripAttendance"("passengerId","routeId","date")`);
  await exec("RoutePassenger parentPhone", `ALTER TABLE "RoutePassenger" ADD COLUMN IF NOT EXISTS "parentPhone" TEXT`);
  await exec("RoutePassenger parentPushToken", `ALTER TABLE "RoutePassenger" ADD COLUMN IF NOT EXISTS "parentPushToken" TEXT`);
  await exec("RoutePassenger veliToken", `ALTER TABLE "RoutePassenger" ADD COLUMN IF NOT EXISTS "veliToken" TEXT`);
  await exec("RoutePassenger veliToken unique", `CREATE UNIQUE INDEX IF NOT EXISTS "RoutePassenger_veliToken_key" ON "RoutePassenger"("veliToken")`);
  await exec("Document companyId", `ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("Check companyId", `ALTER TABLE "Check" ADD COLUMN IF NOT EXISTS "companyId" TEXT`);
  await exec("RoutePassenger veliUsername", `ALTER TABLE "RoutePassenger" ADD COLUMN IF NOT EXISTS "veliUsername" TEXT`);
  await exec("RoutePassenger veliPasswordHash", `ALTER TABLE "RoutePassenger" ADD COLUMN IF NOT EXISTS "veliPasswordHash" TEXT`);
  await exec("RoutePassenger veliUsername unique", `CREATE UNIQUE INDEX IF NOT EXISTS "RoutePassenger_veliUsername_key" ON "RoutePassenger"("veliUsername")`);
  await exec("Driver mobileTokenAt", `ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "mobileTokenAt" TIMESTAMP(3)`);

  // ── Kullanıcı oluştur (tamamen raw SQL, Prisma model API kullanmadan) ──
  // Şifre env var'dan alınır; tanımlı değilse kullanıcı oluşturulmaz.
  const bootstrapPassword = process.env.BOOTSTRAP_PASSWORD;
  if (!bootstrapPassword) {
    log.push("→ BOOTSTRAP_PASSWORD env var tanımlı değil, kullanıcı oluşturulmadı");
    const errors = log.filter(l => l.startsWith("✗"));
    return NextResponse.json({ success: errors.length === 0, log, ...(errors.length > 0 ? { errors } : {}) });
  }
  const usersToCreate = [
    { username: process.env.BOOTSTRAP_USERNAME ?? "admin", password: bootstrapPassword, name: process.env.BOOTSTRAP_NAME ?? "Admin", role: "admin", phone: null as string | null },
  ];

  for (const u of usersToCreate) {
    try {
      // Var mı kontrol et
      const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM "PanelUser" WHERE "username" = $1`, u.username
      );
      const exists = rows[0] && Number(rows[0].count) > 0;

      if (exists) {
        log.push(`→ Kullanıcı zaten var: ${u.username}`);
        continue;
      }

      const hash = await bcrypt.hash(u.password, 10);
      const id = randomBytes(12).toString("hex");
      await prisma.$executeRawUnsafe(
        `INSERT INTO "PanelUser" ("id","username","passwordHash","name","phone","role","active","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,true,NOW(),NOW())`,
        id, u.username, hash, u.name, u.phone, u.role
      );
      log.push(`✓ Kullanıcı oluşturuldu: ${u.username} (${u.name})`);
    } catch (e) {
      log.push(`✗ Kullanıcı hatası ${u.username}: ${String(e).slice(0, 120)}`);
    }
  }

  const errors = log.filter(l => l.startsWith("✗"));
  return NextResponse.json({
    success: errors.length === 0,
    log,
    ...(errors.length > 0 ? { errors } : {}),
  });
}
