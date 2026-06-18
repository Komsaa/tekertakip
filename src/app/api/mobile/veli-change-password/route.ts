// Veli kendi şifresini değiştirebilir
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function getPassengerFromRequest(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const [, expiresStr] = token.split("|");
  if (Date.now() > parseInt(expiresStr ?? "0")) return null;
  return prisma.routePassenger.findFirst({ where: { veliToken: token } });
}

export async function POST(req: NextRequest) {
  const passenger = await getPassengerFromRequest(req);
  if (!passenger) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Mevcut ve yeni şifre zorunlu" }, { status: 400 });
  }
  if (newPassword.length < 4) {
    return NextResponse.json({ error: "Yeni şifre en az 4 karakter olmalı" }, { status: 400 });
  }

  if (!passenger.veliPasswordHash) return NextResponse.json({ error: "Şifre bilgisi bulunamadı" }, { status: 400 });
  const valid = await bcrypt.compare(currentPassword, passenger.veliPasswordHash);
  if (!valid) return NextResponse.json({ error: "Mevcut şifre hatalı" }, { status: 401 });

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.routePassenger.update({ where: { id: passenger.id }, data: { veliPasswordHash: hash } });

  return NextResponse.json({ ok: true });
}
