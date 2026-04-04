/**
 * Şirket + şöför kurulum scripti
 * Çalıştır: node setup-company.js
 *
 * Yapar:
 * 1. "Mert Tur" şirketini MT2024 koduyla oluşturur
 * 2. companyId'si null olan tüm şöförleri bu şirkete atar
 * 3. Şöförlerin mobilePin'ini ad bazlı atar (ilk isim, küçük harf)
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Şirket kurulumu başlıyor...\n");

  // 1. Şirketi oluştur veya bul
  let company = await prisma.company.findUnique({ where: { code: "MT2024" } });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Mert Tur",
        code: "MT2024",
        driverLimit: 20,
        active: true,
      },
    });
    console.log(`✅ Şirket oluşturuldu: ${company.name} (${company.code}) → ID: ${company.id}`);
  } else {
    console.log(`ℹ️  Şirket zaten var: ${company.name} (${company.code}) → ID: ${company.id}`);
  }

  // 2. companyId'siz şöförleri bu şirkete ata
  const unassigned = await prisma.driver.findMany({
    where: { companyId: null },
  });

  console.log(`\n📋 companyId'siz şöför sayısı: ${unassigned.length}`);

  for (const driver of unassigned) {
    // mobilePin: adın ilk kelimesi, küçük harf (ör. "Mert yıldırım" → "mert")
    const firstName = driver.name.trim().split(/\s+/)[0].toLowerCase();

    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        companyId: company.id,
        mobilePin: driver.mobilePin || firstName,
        mobileUsername: driver.mobileUsername || firstName,
      },
    });
    console.log(`  ✅ ${driver.name} → companyId atandı, kullanıcı adı: "${firstName}", pin: "${driver.mobilePin || firstName}"`);
  }

  // 3. Mevcut tüm şöförleri listele
  console.log("\n📊 Güncel şöför listesi:");
  const allDrivers = await prisma.driver.findMany({
    where: { companyId: company.id },
    select: { name: true, mobileUsername: true, mobilePin: true, status: true },
    orderBy: { name: "asc" },
  });

  for (const d of allDrivers) {
    console.log(`  • ${d.name} | kullanıcı: "${d.mobileUsername || "-"}" | pin: "${d.mobilePin || "-"}" | durum: ${d.status}`);
  }

  console.log("\n✅ Kurulum tamamlandı!");
  console.log(`\n📱 Mobil giriş bilgileri:`);
  console.log(`   İşletme Kodu: MT2024`);
  console.log(`   Kullanıcı adı: [ilk isim, küçük harf]`);
  console.log(`   Şifre: [ilk isim, küçük harf]`);
  console.log(`\n   Örnek: İşletme: MT2024 | Ad: mert | Şifre: mert`);
}

main()
  .catch((e) => { console.error("❌ Hata:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
