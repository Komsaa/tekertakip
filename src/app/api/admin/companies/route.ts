import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _adminErr = requireAdmin(session); if (_adminErr) return _adminErr;
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(companies);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _adminErr = requireAdmin(session); if (_adminErr) return _adminErr;
  try {
    const body = await req.json();
    const company = await prisma.company.create({
      data: {
        name: body.name,
        code: body.code,
        driverLimit: body.driverLimit ? parseInt(body.driverLimit) : 10,
        active: body.active !== false,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(company, { status: 201 });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Bu kod zaten kullanılıyor" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
