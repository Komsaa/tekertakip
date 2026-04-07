import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  try {
    const body = await req.json();
    const client = await prisma.client.update({
      where: { id: params.id, ...tenantWhere(companyId) },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.vkn !== undefined && { vkn: body.vkn || null }),
        ...(body.taxOffice !== undefined && { taxOffice: body.taxOffice || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.unitPrice !== undefined && { unitPrice: parseFloat(body.unitPrice) }),
        ...(body.paymentTermDays !== undefined && { paymentTermDays: parseInt(body.paymentTermDays) }),
        ...(body.kdvRate !== undefined && { kdvRate: parseFloat(body.kdvRate) }),
        ...(body.tevkifatRate !== undefined && { tevkifatRate: parseFloat(body.tevkifatRate) }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
    });
    return NextResponse.json(client);
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
    await prisma.client.delete({ where: { id: params.id, ...tenantWhere(companyId) } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
