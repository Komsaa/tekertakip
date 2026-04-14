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

  // 1. Şöför — araç da ata
  const driver = await prisma.driver.findFirst({ orderBy: { createdAt: "asc" } });
  const vehicle = await prisma.vehicle.findFirst({ orderBy: { createdAt: "asc" } });
  if (driver) {
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        mobileUsername: "mertturburak",
        mobilePin: await bcrypt.hash("1234", 10),
        ...(vehicle ? { vehicleId: vehicle.id } : {}),
      },
    });
    results.sofor = {
      kullaniciAdi: "mertturburak",
      pin: "1234",
      isim: driver.name,
      arac: vehicle?.plate ?? "Araç yok — panelden ekleyin",
    };
  } else {
    results.sofor = { hata: "Sistemde hiç şöför yok" };
  }

  // 2. Veli — mevcut yolcu varsa güncelle, yoksa route+stop+passenger oluştur
  let passenger = await prisma.routePassenger.findFirst({ orderBy: { createdAt: "asc" } });

  if (!passenger) {
    // Test route oluştur
    const route = await prisma.route.create({
      data: {
        name: "Test Güzergahı",
        type: "okul",
        stops: {
          create: {
            order: 1,
            name: "Test Durağı",
            estimatedTime: "07:30",
            passengers: {
              create: {
                name: "Ahmet İzel",
                order: 1,
                active: true,
                veliUsername: "ahmetizel",
                veliPasswordHash: await bcrypt.hash("veli1234", 10),
              },
            },
          },
        },
      },
      include: { stops: { include: { passengers: true } } },
    });
    passenger = route.stops[0].passengers[0];
  } else {
    await prisma.routePassenger.update({
      where: { id: passenger.id },
      data: {
        veliUsername: "ahmetizel",
        veliPasswordHash: await bcrypt.hash("veli1234", 10),
        active: true,
      },
    });
  }

  results.veli = { kullaniciAdi: "ahmetizel", sifre: "veli1234", yolcu: passenger.name };

  // 3. Yönetici
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { email: true, name: true },
  });
  results.yonetici = {
    email: user?.email ?? "—",
    isim: user?.name ?? "—",
    not: "tekertakip.com panel şifrenizle giriş yapın",
  };

  return NextResponse.json({ ok: true, kullanicilar: results });
}
