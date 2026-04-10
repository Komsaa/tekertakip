import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await req.json();
    let demoExpiresAt = undefined;
    if (b.extendDemo) {
      // Mevcut süreyi baz alarak 30 gün ekle
      const current = await prisma.company.findUnique({ where: { id: params.id }, select: { demoExpiresAt: true } });
      const base = current?.demoExpiresAt && current.demoExpiresAt > new Date() ? current.demoExpiresAt : new Date();
      demoExpiresAt = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (b.demoExpiresAt !== undefined) {
      demoExpiresAt = b.demoExpiresAt ? new Date(b.demoExpiresAt) : null;
    }

    const company = await prisma.company.update({
      where: { id: params.id },
      data: {
        name: b.name || undefined,
        driverLimit: b.driverLimit ? parseInt(b.driverLimit) : undefined,
        active: b.active !== undefined ? b.active : undefined,
        notes: b.notes ?? undefined,
        isDemo: b.isDemo !== undefined ? b.isDemo : undefined,
        demoExpiresAt,
      },
    });
    return NextResponse.json(company);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.company.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}
