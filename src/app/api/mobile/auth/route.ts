// Mobil uygulama: şöför login
// Giriş: kullanıcı adı + şifre (işletme kodu yok)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Kullanıcı adı ve şifre zorunlu" }, { status: 400 });
    }

    // Kullanıcı adına göre şöförü bul (PIN karşılaştırması aşağıda yapılır)
    const driver = await prisma.driver.findFirst({
      where: {
        status: "active",
        mobileUsername: { equals: username.trim(), mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        mobilePin: true,
        companyId: true,
        vehicle: { select: { id: true, plate: true } },
        company: { select: { name: true, active: true } },
      },
    });

    if (!driver || !driver.mobilePin) {
      return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı" }, { status: 401 });
    }

    // PIN doğrulama: bcrypt hash mi yoksa düz metin mi?
    let pinValid = false;
    if (driver.mobilePin.startsWith("$2")) {
      // Yeni format: bcrypt hash
      pinValid = await bcrypt.compare(password, driver.mobilePin);
    } else {
      // Eski format: düz metin — geçerli ise hash'e migrate et
      pinValid = driver.mobilePin === password;
      if (pinValid) {
        const hash = await bcrypt.hash(password, 10);
        await prisma.driver.update({ where: { id: driver.id }, data: { mobilePin: hash } });
      }
    }

    if (!pinValid) {
      return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı" }, { status: 401 });
    }

    if (driver.company && !driver.company.active) {
      return NextResponse.json({ error: "Bu işletmenin erişimi askıya alınmış" }, { status: 403 });
    }

    const token = randomUUID();
    await prisma.driver.update({
      where: { id: driver.id },
      data: { mobileToken: token, mobileTokenAt: new Date() },
    });

    return NextResponse.json({
      token,
      driver: {
        id: driver.id,
        name: driver.name,
        vehicle: driver.vehicle,
        companyName: driver.company?.name ?? null,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
