// Şöför kendi PIN'ini değiştirebilir
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDriverFromRequest } from "@/lib/mobile-auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const driver = await getDriverFromRequest(req);
  if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPin, newPin } = await req.json();
  if (!currentPin || !newPin) {
    return NextResponse.json({ error: "Mevcut ve yeni şifre zorunlu" }, { status: 400 });
  }
  if (newPin.length < 4) {
    return NextResponse.json({ error: "Yeni şifre en az 4 karakter olmalı" }, { status: 400 });
  }

  const full = await prisma.driver.findUnique({ where: { id: driver.id }, select: { mobilePin: true } });
  if (!full?.mobilePin) return NextResponse.json({ error: "Şifre bilgisi bulunamadı" }, { status: 400 });

  let valid = false;
  if (full.mobilePin.startsWith("$2")) {
    valid = await bcrypt.compare(currentPin, full.mobilePin);
  } else {
    valid = full.mobilePin === currentPin;
  }
  if (!valid) return NextResponse.json({ error: "Mevcut şifre hatalı" }, { status: 401 });

  const hash = await bcrypt.hash(newPin, 10);
  await prisma.driver.update({ where: { id: driver.id }, data: { mobilePin: hash } });

  return NextResponse.json({ ok: true });
}
