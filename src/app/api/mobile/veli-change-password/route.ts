// Veli kendi şifresini değiştirebilir
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getActiveParent } from "@/lib/parent-auth";

export async function POST(req: NextRequest) {
  const passenger = await getActiveParent(req.headers.get("authorization") ?? "");
  if (!passenger) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword || currentPassword.length > 1024 || Buffer.byteLength(newPassword, "utf8") > 72) {
    return NextResponse.json({ error: "Mevcut ve yeni şifre zorunlu" }, { status: 400 });
  }
  if (newPassword.length < 4) {
    return NextResponse.json({ error: "Yeni şifre en az 4 karakter olmalı" }, { status: 400 });
  }

  if (!passenger.veliPasswordHash) return NextResponse.json({ error: "Şifre bilgisi bulunamadı" }, { status: 400 });
  const valid = await bcrypt.compare(currentPassword, passenger.veliPasswordHash);
  if (!valid) return NextResponse.json({ error: "Mevcut şifre hatalı" }, { status: 401 });

  const hash = await bcrypt.hash(newPassword, 10);
  const changed = await prisma.routePassenger.updateMany({ where: { id: passenger.id, active: true, veliPasswordHash: passenger.veliPasswordHash, veliToken: passenger.veliToken }, data: { veliPasswordHash: hash } });
  if (changed.count !== 1) return NextResponse.json({ error: "Hesap değişti; tekrar giriş yapın" }, { status: 409 });

  return NextResponse.json({ ok: true });
}
