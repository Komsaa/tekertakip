import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

// Tüm null companyId kayıtlarını belirtilen şirkete bağlar
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _adminErr = requireAdmin(session); if (_adminErr) return _adminErr;

  const { companyId } = await req.json();
  if (!companyId) return NextResponse.json({ error: "companyId zorunlu" }, { status: 400 });

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 404 });

  const tables = [
    "Driver", "Vehicle", "Job", "FuelEntry", "FinanceEntry", "Contact",
    "Task", "Route", "CreditCard", "Client", "Invoice", "PaymentCalendar",
    "Salary",
  ];

  const results: Record<string, number> = {};
  for (const table of tables) {
    try {
      const res = await prisma.$executeRawUnsafe(
        `UPDATE "${table}" SET "companyId" = $1 WHERE "companyId" IS NULL`,
        companyId
      );
      results[table] = Number(res);
    } catch {
      results[table] = -1;
    }
  }

  return NextResponse.json({ success: true, company: company.name, updated: results });
}
