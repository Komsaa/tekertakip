// Mobil uygulama: şöför login
// Giriş: kullanıcı adı + şifre (işletme kodu yok)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Kullanıcı adı ve şifre zorunlu" }, { status: 400 });
    }

    // Kullanıcı adına göre şöförü bul (tüm şirketlerde, büyük/küçük harf fark etmez)
    const driver = await prisma.driver.findFirst({
      where: {
        status: "active",
        mobileUsername: { equals: username.trim(), mode: "insensitive" },
        mobilePin: password,
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

    if (!driver) {
      return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı" }, { status: 401 });
    }

    if (driver.company && !driver.company.active) {
      return NextResponse.json({ error: "Bu işletmenin erişimi askıya alınmış" }, { status: 403 });
    }

    const token = randomUUID();
    await prisma.driver.update({
      where: { id: driver.id },
      data: { mobileToken: token },
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
