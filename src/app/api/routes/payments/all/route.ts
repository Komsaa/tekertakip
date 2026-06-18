import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/tenant";

// GET /api/routes/payments/all?month=6&year=2026
// Tüm şirkete ait güzergahlardaki öğrencilerin ödemelerini döner
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  const month = parseInt(req.nextUrl.searchParams.get("month") ?? "0");
  const year = parseInt(req.nextUrl.searchParams.get("year") ?? "0");
  if (!month || !year) return NextResponse.json({ error: "month ve year zorunlu" }, { status: 400 });

  const payments = await prisma.passengerPayment.findMany({
    where: {
      month,
      year,
      ...(companyId ? { companyId } : {}),
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
