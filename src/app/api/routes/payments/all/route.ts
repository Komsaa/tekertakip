import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, requireTenant, tenantWhere } from "@/lib/tenant";

// GET /api/routes/payments/all?month=6&year=2026
// Tüm şirkete ait güzergahlardaki öğrencilerin ödemelerini döner
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = requireTenant(session); if (denied) return denied;
  const companyId = getCompanyId(session);

  const month = parseInt(req.nextUrl.searchParams.get("month") ?? "0");
  const year = parseInt(req.nextUrl.searchParams.get("year") ?? "0");
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) return NextResponse.json({ error: "month ve year zorunlu" }, { status: 400 });

  const payments = await prisma.passengerPayment.findMany({
    where: {
      month,
      year,
      passenger: { stop: { route: tenantWhere(companyId) } },
    },
    select: {
      id: true,
      passengerId: true,
      paid: true,
      paidAt: true,
      amount: true,
      notes: true,
    },
  });

  return NextResponse.json(payments);
}
