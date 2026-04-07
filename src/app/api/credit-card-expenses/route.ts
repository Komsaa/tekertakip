import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  try {
    const b = await req.json();
    // Güvenlik: cardId tenant'a ait mi?
    if (companyId) {
      const card = await prisma.creditCard.findFirst({ where: { id: b.cardId, ...tenantWhere(companyId) } });
      if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    const date = new Date(b.date);
    const expense = await prisma.creditCardExpense.create({
      data: {
        cardId: b.cardId,
        amount: parseFloat(b.amount),
        date,
        description: b.description,
        category: b.category || "diger",
        merchant: b.merchant || null,
        receiptPhoto: b.receiptPhoto || null,
        billingMonth: b.billingMonth || date.getMonth() + 1,
        billingYear: b.billingYear || date.getFullYear(),
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("POST /api/credit-card-expenses:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
