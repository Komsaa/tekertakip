// GEÇİCİ ENDPOINT — test kullanıcıları oluşturur, sonra silinecek
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const SECRET = "testsetup2026";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results: Record<string, any> = {};

  // 1. Şöför — ilk şöförü bul, mobile bilgilerini set et
  const driver = await prisma.driver.findFirst({ orderBy: { createdAt: "asc" } });
  if (driver) {
    const pin = "1234";
    const username = "test.sofor";
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        mobileUsername: username,
        mobilePin: await bcrypt.hash(pin, 10),
      },
    });
    results.sofor = { kullaniciAdi: username, pin, isim: driver.name };
  } else {
    results.sofor = { hata: "Sistemde hiç şöför yok, önce panel'den ekleyin" };
  }

  // 2. Veli — ilk RoutePassenger'ı bul, veli bilgilerini set et
  const passenger = await prisma.routePassenger.findFirst({
    orderBy: { createdAt: "asc" },
    include: { stop: { include: { route: true } } },
  });
  if (passenger) {
    const veliPass = "veli1234";
    const veliUser = "test.veli";
    await prisma.routePassenger.update({
      where: { id: passenger.id },
      data: {
        veliUsername: veliUser,
        veliPasswordHash: await bcrypt.hash(veliPass, 10),
        active: true,
      },
    });
    results.veli = {
      kullaniciAdi: veliUser,
      sifre: veliPass,
      yolcu: passenger.name,
      guzergah: passenger.stop.route.name,
    };
  } else {
    results.veli = { hata: "Sistemde hiç yolcu yok, önce güzergah ve durak ekleyin" };
  }

  // 3. Yönetici — mevcut panel kullanıcısı
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  results.yonetici = {
    kullaniciAdi: user?.username ?? user?.email ?? "—",
    not: "Panel şifrenizle giriş yapın",
  };

  return NextResponse.json({ ok: true, kullanicilar: results });
}
