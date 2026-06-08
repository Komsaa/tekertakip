// GEÇİCİ ENDPOINT — tüm şöförleri siler, testsofor oluşturur
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const SECRET = "resetdrivers2026";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 1. Maaşları sil (driverId zorunlu)
  await prisma.salary.deleteMany({});

  // 2. Araç raporlarını sil (driverId zorunlu)
  await prisma.vehicleReport.deleteMany({});

  // 3. Opsiyonel FK'ları null yap
  await prisma.job.updateMany({ data: { driverId: null } });
  await prisma.fuelEntry.updateMany({ data: { driverId: null } });
  await prisma.route.updateMany({ data: { driverId: null } });

  // 4. Tüm şöförleri sil (locationHistory cascade ile silinir)
  await prisma.driver.deleteMany({});

  // 5. Testsofor oluştur
  const driver = await prisma.driver.create({
    data: {
      name: "Test Sofor",
      status: "active",
      mobileUsername: "testsofor",
      mobilePin: await bcrypt.hash("1234", 10),
    },
  });

  return NextResponse.json({
    ok: true,
    mesaj: "Tüm şöförler silindi, testsofor oluşturuldu",
    sofor: {
      id: driver.id,
      kullaniciAdi: "testsofor",
      pin: "1234",
    },
  });
}
