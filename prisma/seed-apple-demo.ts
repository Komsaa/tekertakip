/**
 * Apple App Review için demo hesapları oluşturur.
 * Mevcut Merttur şirketini kullanır.
 *
 * Çalıştır: npx tsx prisma/seed-apple-demo.ts
 *
 * Demo bilgileri:
 *   Şöför  → kullanıcı: demo_sofor   şifre: Demo2024
 *   Veli   → kullanıcı: demo_veli    şifre: Demo2024
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Şirket bul ────────────────────────────────────────────────────────────
  const company = await prisma.company.findFirst({
    where: {
      name: { contains: "mert", mode: "insensitive" },
    },
  });

  if (!company) {
    console.error("Merttur şirketi bulunamadı. Önce seed-merttur-2026.ts çalıştırın.");
    process.exit(1);
  }

  console.log(`Şirket: ${company.name} (${company.id})`);

  // ── Demo Şöför ────────────────────────────────────────────────────────────
  const demoPin = "Demo2024";
  const pinHash = await bcrypt.hash(demoPin, 10);

  let demoDriver = await prisma.driver.findFirst({
    where: { mobileUsername: "demo_sofor" },
  });

  if (demoDriver) {
    demoDriver = await prisma.driver.update({
      where: { id: demoDriver.id },
      data: { mobilePin: pinHash, status: "active" },
    });
    console.log(`Demo şöför güncellendi: ${demoDriver.name}`);
  } else {
    // Mevcut şöförlerden birine demo credentials ekle (yoksa yeni oluştur)
    const existingDriver = await prisma.driver.findFirst({
      where: { companyId: company.id, status: "active", mobileUsername: null },
    });

    if (existingDriver) {
      demoDriver = await prisma.driver.update({
        where: { id: existingDriver.id },
        data: { mobileUsername: "demo_sofor", mobilePin: pinHash },
      });
      console.log(`Demo credentials mevcut şöföre eklendi: ${demoDriver.name}`);
    } else {
      demoDriver = await prisma.driver.create({
        data: {
          name: "Demo Şöför",
          phone: "05001234567",
          status: "active",
          companyId: company.id,
          mobileUsername: "demo_sofor",
          mobilePin: pinHash,
        },
      });
      console.log(`Demo şöför oluşturuldu: ${demoDriver.name}`);
    }
  }

  // ── Demo Güzergah + Durak + Yolcu (Veli) ─────────────────────────────────
  const demoPassword = "Demo2024";
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  // Önce demo güzergah var mı kontrol et
  let demoRoute = await prisma.route.findFirst({
    where: { companyId: company.id, name: { contains: "Demo", mode: "insensitive" } },
    include: { stops: { include: { passengers: true } } },
  });

  if (!demoRoute) {
    // Şirkette mevcut güzergah var mı
    const existingRoute = await prisma.route.findFirst({
      where: { companyId: company.id, active: true },
      include: { stops: { include: { passengers: true }, orderBy: { order: "asc" } } },
    });

    if (existingRoute && existingRoute.stops.length > 0) {
      demoRoute = existingRoute;
      console.log(`Mevcut güzergah kullanılacak: ${demoRoute.name}`);
    } else {
      // Yeni demo güzergah oluştur
      demoRoute = await prisma.route.create({
        data: {
          name: "Demo Okul Servisi",
          type: "okul",
          active: true,
          companyId: company.id,
          driverId: demoDriver.id,
          stops: {
            create: [
              { name: "Demo Mahalle", order: 1, estimatedTime: "07:30" },
              { name: "Demo Okul", order: 2, estimatedTime: "08:00" },
            ],
          },
        },
        include: { stops: { include: { passengers: true }, orderBy: { order: "asc" } } },
      });
      console.log(`Demo güzergah oluşturuldu: ${demoRoute.name}`);
    }
  }

  // İlk durağa demo veli yolcusu ekle
  const firstStop = demoRoute.stops[0];
  if (!firstStop) {
    console.error("Güzergahta durak bulunamadı.");
    process.exit(1);
  }

  const existingVeli = await prisma.routePassenger.findFirst({
    where: { veliUsername: "demo_veli" },
  });

  if (existingVeli) {
    await prisma.routePassenger.update({
      where: { id: existingVeli.id },
      data: { veliPasswordHash: passwordHash, active: true },
    });
    console.log(`Demo veli güncellendi: ${existingVeli.name}`);
  } else {
    const newPassenger = await prisma.routePassenger.create({
      data: {
        name: "Demo Öğrenci",
        stopId: firstStop.id,
        active: true,
        veliUsername: "demo_veli",
        veliPasswordHash: passwordHash,
      },
    });
    console.log(`Demo veli oluşturuldu: ${newPassenger.name}`);
  }

  // ── Araç-şöför bağlantısı ─────────────────────────────────────────────────
  const anyVehicle = await prisma.vehicle.findFirst({
    where: { companyId: company.id, status: "active" },
  });

  if (anyVehicle && demoDriver) {
    const alreadyLinked = await prisma.driverVehicle.findFirst({
      where: { driverId: demoDriver.id, vehicleId: anyVehicle.id },
    });
    if (!alreadyLinked) {
      await prisma.driverVehicle.create({
        data: { driverId: demoDriver.id, vehicleId: anyVehicle.id },
      });
      console.log(`Araç bağlandı: ${anyVehicle.plate}`);
    }
  }

  console.log("\n========================================");
  console.log("Apple App Review — Demo Hesapları");
  console.log("========================================");
  console.log("\n📱 ŞÖFÖR UYGULAMASI");
  console.log("   Kullanıcı adı : demo_sofor");
  console.log("   Şifre         : Demo2024");
  console.log("\n👨‍👩‍👦 VELİ UYGULAMASI");
  console.log("   Kullanıcı adı : demo_veli");
  console.log("   Şifre         : Demo2024");
  console.log("========================================\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
