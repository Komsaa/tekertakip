import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/tenant";

// GET /api/routes/payments?routeId=xxx&month=6&year=2026
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const routeId = req.nextUrl.searchParams.get("routeId");
  const month = parseInt(req.nextUrl.searchParams.get("month") ?? "0");
  const year = parseInt(req.nextUrl.searchParams.get("year") ?? "0");

  if (!routeId || !month || !year) {
    return NextResponse.json({ error: "routeId, month, year zorunlu" }, { status: 400 });
  }

  const payments = await prisma.passengerPayment.findMany({
    where: {
      month,
      year,
      passenger: { stop: { routeId } },
    },
    select: { passengerId: true, paid: true, paidAt: true, amount: true, notes: true, id: true },
  });

  return NextResponse.json(payments);
}

// POST /api/routes/payments — ödeme oluştur veya güncelle (upsert)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  const { passengerId, month, year, amount, paid, notes } = await req.json();
  if (!passengerId || !month || !year || amount === undefined) {
    return NextResponse.json({ error: "passengerId, month, year, amount zorunlu" }, { status: 400 });
  }

  const payment = await prisma.passengerPayment.upsert({
    where: { passengerId_month_year: { passengerId, month, year } },
    update: {
      amount,
      paid: paid ?? false,
      paidAt: paid ? new Date() : null,
      notes: notes ?? null,
    },
    create: {
      passengerId,
      month,
      year,
      amount,
      paid: paid ?? false,
      paidAt: paid ? new Date() : null,
      notes: notes ?? null,
      companyId,
    },
  });

  return NextResponse.json(payment);
}

// PATCH /api/routes/payments — ödeme durumunu toggle et
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, paid } = await req.json();
  if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });

  const payment = await prisma.passengerPayment.update({
    where: { id },
    data: { paid, paidAt: paid ? new Date() : null },
  });

  return NextResponse.json(payment);
}

// DELETE /api/routes/payments
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });

  await prisma.passengerPayment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
