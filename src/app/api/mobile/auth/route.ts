// Mobil uygulama: şöför login
// Giriş: işletme kodu + ad soyad + şifre
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { companyCode, name, password } = await req.json();

    if (!companyCode || !name || !password) {
      return NextResponse.json({ error: "İşletme kodu, ad ve şifre zorunlu" }, { status: 400 });
    }

    // Şirketi bul
    const company = await prisma.company.findUnique({
      where: { code: companyCode.trim().toUpperCase() },
    });

    if (!company) {
      return NextResponse.json({ error: "İşletme kodu hatalı" }, { status: 401 });
    }

    if (!company.active) {
      return NextResponse.json({ error: "Bu işletmenin erişimi askıya alınmış" }, { status: 403 });
    }

    // Şirkete ait, ada göre şöför ara (büyük/küçük harf fark etmez)
    const drivers = await prisma.driver.findMany({
      where: {
        companyId: company.id,
        status: "active",
        name: { equals: name.trim(), mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        mobilePin: true,
        vehicle: { select: { id: true, plate: true } },
      },
    });

    if (drivers.length === 0) {
      return NextResponse.json({ error: "Bu isimde aktif şöför bulunamadı" }, { status: 404 });
    }

    // Şifreyi kontrol et (aynı isimde birden fazla varsa hepsini dene)
    const driver = drivers.find((d) => d.mobilePin === password);

    if (!driver) {
      return NextResponse.json({ error: "Şifre hatalı" }, { status: 401 });
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
        companyName: company.name,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
