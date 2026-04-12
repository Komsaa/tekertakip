import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _ae = requireAdmin(session); if (_ae) return _ae;

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { drivers: { where: { status: "active" } } } } },
  });
  return NextResponse.json(companies);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _ae = requireAdmin(session); if (_ae) return _ae;

  try {
    const b = await req.json();
    if (!b.name || !b.code) {
      return NextResponse.json({ error: "İsim ve kod zorunlu" }, { status: 400 });
    }

    const existing = await prisma.company.findUnique({ where: { code: b.code.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: "Bu kod zaten kullanılıyor" }, { status: 409 });
    }

    const demoExpiresAt = b.isDemo
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : undefined;

    const company = await prisma.company.create({
      data: {
        name: b.name,
        code: b.code.toUpperCase(),
        driverLimit: b.driverLimit ? parseInt(b.driverLimit) : 10,
        notes: b.notes || null,
        isDemo: b.isDemo ?? false,
        demoExpiresAt,
      },
    });
    return NextResponse.json(company, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
