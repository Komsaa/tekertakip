/**
 * Test veli hesabı oluşturur.
 * Coolify container terminalinde çalıştır:
 *   npx tsx prisma/seed-test-veli.ts
 *
 * Çıktı: veli kullanıcı adı ve şifre yazılır.
 * Sil: npx tsx prisma/seed-test-veli.ts --clean
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ROUTE_NAME = "TEST Güzergahı";
const PASSENGER_NAME = "Test Öğrenci";
const VELI_USERNAME = "testveli";
const VELI_PASSWORD = "123456";

async function main() {
  const isClean = process.argv.includes("--clean");

  if (isClean) {
    // Temizle
    const route = await prisma.route.findFirst({ where: { name: ROUTE_NAME } });
    if (route) {
      await prisma.route.delete({ where: { id: route.id } });
      console.log("✅ Test verisi silindi.");
    } else {
      console.log("ℹ️  Test verisi zaten yok.");
    }
    return;
  }

  // Şirketi bul (ilk aktif şirket)
  const company = await prisma.company.findFirst({ where: { active: true } });
  if (!company) {
    console.error("❌ Aktif şirket bulunamadı. Önce panel'den şirket oluştur.");
    process.exit(1);
  }
  console.log(`ℹ️  Şirket: ${company.name} (${company.id})`);

  // Şöförü bul (ilk aktif şöför)
  const driver = await prisma.driver.findFirst({
    where: { status: "active", companyId: company.id },
  });
  if (driver) {
    console.log(`ℹ️  Şöför: ${driver.name}`);
  } else {
    console.log("⚠️  Aktif şöför yok — güzergah şöförsüz oluşturulacak (harita testi yapılamaz).");
  }

  // Güzergah zaten varsa sil (temiz test için)
  const existing = await prisma.route.findFirst({ where: { name: ROUTE_NAME } });
  if (existing) {
    await prisma.route.delete({ where: { id: existing.id } });
    console.log("⚠️  Eski test güzergahı silindi, yeniden oluşturuluyor.");
  }

  // Güzergah oluştur
  const route = await prisma.route.create({
    data: {
      name: ROUTE_NAME,
      type: "okul",
      companyId: company.id,
      driverId: driver?.id ?? null,
      active: true,
    },
  });

  // 3 durak oluştur (test yolcusu 2. durağa atanacak)
  const stopsData = [
    { order: 1, name: "Başlangıç Durağı", estimatedTime: "07:20" },
    { order: 2, name: "Test Durağı", estimatedTime: "07:30" },
    { order: 3, name: "Bitiş Durağı", estimatedTime: "07:40" },
  ];

  const stops = await Promise.all(
    stopsData.map((s) =>
      prisma.routeStop.create({
        data: { routeId: route.id, ...s },
      })
    )
  );

  const myStop = stops[1]; // 2. durak

  // Veli şifresini hashle
  const veliPasswordHash = await bcrypt.hash(VELI_PASSWORD, 10);

  // Yolcu oluştur
  const passenger = await prisma.routePassenger.create({
    data: {
      stopId: myStop.id,
      name: PASSENGER_NAME,
      parentName: "Test Veli",
      active: true,
      veliUsername: VELI_USERNAME,
      veliPasswordHash,
    },
  });

  console.log("\n✅ TEST VELİ HESABI OLUŞTURULDU");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Kullanıcı adı : ${VELI_USERNAME}`);
  console.log(`Şifre         : ${VELI_PASSWORD}`);
  console.log(`Güzergah      : ${ROUTE_NAME}`);
  console.log(`Öğrenci       : ${PASSENGER_NAME}`);
  console.log(`Durak         : ${myStop.name} (${myStop.estimatedTime})`);
  console.log(`Şöför         : ${driver?.name ?? "— yok"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📱 Mobil uygulamada bu bilgilerle giriş yap.");
  console.log("🗑  Temizlemek için: npx tsx prisma/seed-test-veli.ts --clean\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
