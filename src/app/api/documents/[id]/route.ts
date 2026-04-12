import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  try {
    const b = await req.json();
    // Tenant kontrolü: companyId varsa belge bu şirkete ait mi?
    if (companyId) {
      const existing = await prisma.document.findFirst({ where: { id: params.id, companyId } });
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const doc = await prisma.document.update({
      where: { id: params.id },
      data: {
        ...(b.name && { name: b.name }),
        expiry: b.expiry ? new Date(b.expiry) : null,
        fileUrl: b.fileUrl || null,
        notes: b.notes || null,
      },
    });
    return NextResponse.json(doc);
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  try {
    if (companyId) {
      const existing = await prisma.document.findFirst({ where: { id: params.id, companyId } });
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.document.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
