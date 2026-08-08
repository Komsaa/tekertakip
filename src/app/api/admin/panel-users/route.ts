import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";
import bcrypt from "bcryptjs";

function dbErr(e: unknown) {
  if (e && typeof e === "object" && "code" in e) {
    const code = (e as { code: string }).code;
    if (code === "P2002") return NextResponse.json({ error: "Bu kullanıcı adı zaten kullanılıyor" }, { status: 400 });
    if (code === "P2021" || code === "P2022") return NextResponse.json({ error: "Tablo bulunamadı — lütfen /api/admin/bootstrap adresini ziyaret edin" }, { status: 500 });
  }
  const msg = e instanceof Error ? e.message : String(e);
  console.error("panel-users error:", msg);
  return NextResponse.json({ error: msg }, { status: 500 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _adminErr = requireAdmin(session); if (_adminErr) return _adminErr;

  try {
    const users = await prisma.panelUser.findMany({
      select: { id: true, username: true, name: true, phone: true, role: true, active: true, companyId: true, mobileUsername: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(users);
  } catch (e) {
    return dbErr(e);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _adminErr = requireAdmin(session); if (_adminErr) return _adminErr;

  const { username, password, name, phone, role, companyId, mobileUsername, mobilePin } = await req.json();
  if (!username || !password || !name) {
    return NextResponse.json({ error: "username, password ve name zorunlu" }, { status: 400 });
  }
  if ((role ?? "firma") === "firma" && !companyId) {
    return NextResponse.json({ error: "Firma kullanıcısı için şirket seçimi zorunlu" }, { status: 400 });
  }

  try {
    if (role === "admin" && companyId) {
      const existing = await prisma.panelUser.findFirst({ where: { companyId, role: "admin" } });
      if (existing) return NextResponse.json({ error: `Bu şirketin zaten bir admin hesabı var: ${existing.username}` }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.panelUser.create({
      data: { username, passwordHash, name, phone: phone || null, role: role ?? "firma", active: true, companyId: companyId || null, mobileUsername: mobileUsername || null, mobilePin: mobilePin || null },
      select: { id: true, username: true, name: true, phone: true, role: true, active: true, companyId: true, mobileUsername: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    return dbErr(e);
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _adminErr = requireAdmin(session); if (_adminErr) return _adminErr;

  const { id, name, phone, role, active, password, companyId, mobileUsername, mobilePin } = await req.json();
  if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });
  if (role === "firma" && companyId !== undefined && !companyId) {
    return NextResponse.json({ error: "Firma kullanıcısı için şirket seçimi zorunlu" }, { status: 400 });
  }

  try {
    if (role === "admin") {
      const user = await prisma.panelUser.findUnique({ where: { id }, select: { companyId: true } });
      const cId = companyId !== undefined ? companyId : user?.companyId;
      if (cId) {
        const existing = await prisma.panelUser.findFirst({ where: { companyId: cId, role: "admin", NOT: { id } } });
        if (existing) return NextResponse.json({ error: `Bu şirketin zaten bir admin hesabı var: ${existing.username}` }, { status: 400 });
      }
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone || null;
    if (role !== undefined) data.role = role;
    if (active !== undefined) data.active = active;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    if (companyId !== undefined) data.companyId = companyId || null;
    if (mobileUsername !== undefined) data.mobileUsername = mobileUsername || null;
    if (mobilePin !== undefined) data.mobilePin = mobilePin || null;

    const user = await prisma.panelUser.update({
      where: { id },
      data,
      select: { id: true, username: true, name: true, phone: true, role: true, active: true, companyId: true, mobileUsername: true, createdAt: true },
    });
    return NextResponse.json(user);
  } catch (e) {
    return dbErr(e);
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _adminErr = requireAdmin(session); if (_adminErr) return _adminErr;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });

  try {
    await prisma.panelUser.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return dbErr(e);
  }
}
