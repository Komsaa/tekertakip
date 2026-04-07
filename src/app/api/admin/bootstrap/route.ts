import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

// Tüm migration'ları çalıştırır + varsayılan kullanıcıları oluşturur
// GET /api/admin/bootstrap

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const log: string[] = [];

  async function exec(label: string, sql: string) {
    try {
      await prisma.$executeRawUnsafe(sql);
      log.push(`✓ ${label}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // Zaten varsa hata değil
      if (msg.includes("already exists")) {
        log.push(`→ ${label} (zaten mevcut)`);
      } else {
        log.push(`✗ ${label}: ${msg}`);
      }
    }
  }

  // ── Tablolar ──────────────────────────────────────────────────
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

  await exec("PanelUser table", `CREATE TABLE IF NOT EXISTS "PanelUser" ("id" TEXT NOT NULL,"username" TEXT NOT NULL,"passwordHash" TEXT NOT NULL,"name" TEXT NOT NULL,"role" TEXT NOT NULL DEFAULT 'admin',"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "PanelUser_pkey" PRIMARY KEY ("id"))`);

  await exec("PanelUser username unique", `CREATE UNIQUE INDEX IF NOT EXISTS "PanelUser_username_key" ON "PanelUser"("username")`);

  // ── Varsayılan kullanıcılar ────────────────────────────────────
  const users = [
    { username: "yigittur", password: "123", name: "Yiğit YILDIRIM", role: "admin" },
  ];

  const created: string[] = [];
  for (const u of users) {
    try {
      const existing = await prisma.panelUser.findUnique({ where: { username: u.username } });
      if (existing) {
        log.push(`→ Kullanıcı zaten var: ${u.username}`);
        continue;
      }
      const passwordHash = await bcrypt.hash(u.password, 10);
      const id = randomBytes(12).toString("hex");
      await prisma.$executeRawUnsafe(
        `INSERT INTO "PanelUser" ("id","username","passwordHash","name","role","active","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,true,NOW(),NOW())`,
        id, u.username, passwordHash, u.name, u.role
      );
      log.push(`✓ Kullanıcı oluşturuldu: ${u.username} (${u.name})`);
      created.push(u.username);
    } catch (e) {
      log.push(`✗ Kullanıcı hatası ${u.username}: ${e}`);
    }
  }

  return NextResponse.json({ log, created });
}
