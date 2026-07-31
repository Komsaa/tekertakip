import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere, tenantData } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  try {
    const body = await req.json();
    const inv = await prisma.invoice.update({
      where: { id: params.id, ...tenantWhere(companyId) },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.paidAt !== undefined && { paidAt: body.paidAt ? new Date(body.paidAt) : null }),
        ...(body.paidAmount !== undefined && { paidAmount: parseFloat(body.paidAmount) }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
      include: { client: { select: { id: true, name: true } } },
    });

    // Fatura ödendi → cari artı kayıt
    if (body.status === "odendi") {
      const alreadyExists = await prisma.financeEntry.findFirst({
        where: { ...tenantWhere(companyId), invoiceNo: inv.invoiceNo },
      });
      if (!alreadyExists) {
        await prisma.financeEntry.create({
          data: {
            type: "income",
            category: "fatura_tahsilat",
            amount: inv.paidAmount > 0 ? inv.paidAmount : inv.payableAmount,
            date: body.paidAt ? new Date(body.paidAt) : new Date(),
            description: `Fatura tahsilatı — ${inv.invoiceNo} (${inv.client.name})`,
            invoiceNo: inv.invoiceNo,
            ...tenantData(companyId),
          },
        });
      }
    }

    // Fatura geri alındı → cari kaydı sil
    if (body.status === "bekliyor") {
      await prisma.financeEntry.deleteMany({
        where: { ...tenantWhere(companyId), invoiceNo: inv.invoiceNo },
      });
    }

    return NextResponse.json(inv);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  try {
    await prisma.invoice.delete({ where: { id: params.id, ...tenantWhere(companyId) } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
