import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.panelUser.findMany({
    select: { id: true, username: true, name: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username, password, name, role } = await req.json();
  if (!username || !password || !name) {
    return NextResponse.json({ error: "username, password ve name zorunlu" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.panelUser.create({
      data: { username, passwordHash, name, role: role ?? "admin" },
      select: { id: true, username: true, name: true, role: true, active: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e) {
      const code = (e as { code: string }).code;
      if (code === "P2002") return NextResponse.json({ error: "Bu kullanıcı adı zaten kullanılıyor" }, { status: 400 });
      if (code === "P2021") return NextResponse.json({ error: "Veritabanı tablosu bulunamadı. SQL migration çalıştırıldı mı?" }, { status: 500 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("panel-users POST:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, role, active, password } = await req.json();
  if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (role !== undefined) data.role = role;
  if (active !== undefined) data.active = active;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.panelUser.update({
    where: { id },
    data,
    select: { id: true, username: true, name: true, role: true, active: true, createdAt: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });

  await prisma.panelUser.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
