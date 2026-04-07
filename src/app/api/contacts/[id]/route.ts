import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere } from "@/lib/tenant";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  const contact = await prisma.contact.findFirst({
    where: { id: params.id, ...tenantWhere(companyId) },
    include: {
      transactions: { orderBy: { date: "desc" } },
      checks: { orderBy: { dueDate: "asc" } },
    },
  });
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  try {
    const b = await req.json();
    const contact = await prisma.contact.update({
      where: { id: params.id, ...tenantWhere(companyId) },
      data: {
        name: b.name,
        type: b.type,
        phone: b.phone || null,
        email: b.email || null,
        address: b.address || null,
        taxNo: b.taxNo || null,
        notes: b.notes || null,
      },
    });
    return NextResponse.json(contact);
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
    await prisma.contact.delete({ where: { id: params.id, ...tenantWhere(companyId) } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
