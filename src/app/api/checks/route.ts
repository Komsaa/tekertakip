import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere } from "@/lib/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  const checks = await prisma.check.findMany({
    where: companyId ? { companyId } : {},
    orderBy: { dueDate: "asc" },
    include: { contact: { select: { id: true, name: true } } },
  });
  return NextResponse.json(checks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  try {
    const b = await req.json();
    // Güvenlik: contactId tenant'a ait mi?
    if (companyId && b.contactId) {
      const contact = await prisma.contact.findFirst({ where: { id: b.contactId, ...tenantWhere(companyId) } });
      if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    const check = await prisma.check.create({
      data: {
        contactId: b.contactId || null,
        direction: b.direction,
        amount: parseFloat(b.amount),
        dueDate: new Date(b.dueDate),
        bankName: b.bankName || null,
        checkNo: b.checkNo || null,
        status: "bekliyor",
        notes: b.notes || null,
        companyId: companyId ?? null,
      },
      include: { contact: true },
    });
    return NextResponse.json(check, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
