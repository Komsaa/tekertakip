/**
 * Mert Tur — 2026 Excel Verisi Import Scripti
 * Çalıştır: npx tsx prisma/seed-merttur-2026.ts
 *
 * İçerik:
 * 1) Şöför Maaşları (Ocak-Haziran 2026, ödendi)
 * 2) Araç Muayene & Sigorta tarihleri
 * 3) Erkanlar/Akbank Çekleri (2026 tüm yıl)
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ─── 1. ŞÖFÖR MAAŞ VERİSİ ────────────────────────────────────────────────────
// Excel'den okunan veriler (ay: 1-12, maas, avans=totalAmount olarak işaretlendi)
// kalan < 0 → avans fazla çekilmiş (bonusAmount ile not tutuyoruz)
const salaryData: {
  name: string;
  records: { month: number; year: number; base: number; advance: number }[];
}[] = [
  {
    name: "İbrahim UZUN",
    records: [
      { month: 1, year: 2026, base: 25000, advance: 25000 },
      { month: 2, year: 2026, base: 25000, advance: 25000 },
      { month: 3, year: 2026, base: 25000, advance: 25000 },
      { month: 4, year: 2026, base: 25000, advance: 25000 },
      { month: 5, year: 2026, base: 25000, advance: 25000 },
      { month: 6, year: 2026, base: 25000, advance: 25000 },
    ],
  },
  {
    name: "Adem ÇALIŞKAN",
    records: [
      { month: 1, year: 2026, base: 22000, advance: 22000 },
      { month: 2, year: 2026, base: 22000, advance: 22000 },
      { month: 3, year: 2026, base: 22000, advance: 22000 },
      { month: 4, year: 2026, base: 22000, advance: 22000 },
      { month: 5, year: 2026, base: 22000, advance: 22000 },
      { month: 6, year: 2026, base: 22000, advance: 22000 },
    ],
  },
  {
    name: "İsmail ŞAHAN",
    records: [
      { month: 1, year: 2026, base: 25000, advance: 25000 },
      { month: 2, year: 2026, base: 25000, advance: 25000 },
      { month: 3, year: 2026, base: 30000, advance: 30200 }, // 200 TL fazla avans
      { month: 4, year: 2026, base: 30000, advance: 30000 },
      { month: 5, year: 2026, base: 30000, advance: 30000 },
      { month: 6, year: 2026, base: 30000, advance: 30000 },
    ],
  },
  {
    name: "Hüsnü ARACI",
    records: [
      { month: 1, year: 2026, base: 30000, advance: 30000 },
      { month: 2, year: 2026, base: 30000, advance: 30000 },
      { month: 3, year: 2026, base: 30000, advance: 30000 },
      { month: 4, year: 2026, base: 30000, advance: 30000 },
      { month: 5, year: 2026, base: 30000, advance: 30000 },
      { month: 6, year: 2026, base: 30000, advance: 30000 },
    ],
  },
  {
    name: "Muhammet ÇOKTU",
    records: [
      { month: 1, year: 2026, base: 9000,  advance: 9000  },
      { month: 2, year: 2026, base: 22000, advance: 22000 },
      { month: 3, year: 2026, base: 22000, advance: 22000 },
      { month: 4, year: 2026, base: 22000, advance: 22000 },
      { month: 5, year: 2026, base: 22000, advance: 22000 },
      { month: 6, year: 2026, base: 22000, advance: 30000 }, // 8.000 TL fazla avans
    ],
  },
  {
    name: "Mustafa DURAN",
    records: [
      { month: 1, year: 2026, base: 22000, advance: 22000 },
      { month: 2, year: 2026, base: 22000, advance: 22000 },
      { month: 3, year: 2026, base: 22000, advance: 22000 },
      { month: 4, year: 2026, base: 22000, advance: 22000 },
      { month: 5, year: 2026, base: 22000, advance: 22000 },
      { month: 6, year: 2026, base: 22000, advance: 22000 },
    ],
  },
  {
    name: "Ertan BUĞDAYCI",
    records: [
      { month: 1, year: 2026, base: 23000, advance: 23000 },
      { month: 2, year: 2026, base: 23000, advance: 23000 },
      { month: 3, year: 2026, base: 23000, advance: 23000 },
      { month: 4, year: 2026, base: 23000, advance: 23000 },
      { month: 5, year: 2026, base: 23000, advance: 23000 },
      { month: 6, year: 2026, base: 26500, advance: 26500 }, // 7 gün tarla
    ],
  },
  {
    name: "Ahmet OKUR",
    records: [
      { month: 5, year: 2026, base: 15000, advance: 15000 }, // 12 Mayıs işe başladı
      { month: 6, year: 2026, base: 22000, advance: 22000 },
    ],
  },
  {
    name: "Cihan ÖZ",
    records: [
      { month: 1, year: 2026, base: 25000,  advance: 25000  },
      { month: 2, year: 2026, base: 18350,  advance: 18350  }, // işten ayrıldı
    ],
  },
];

// Temmuz 2026 — son ödenen (Haziran) baz alınarak eklendi, henüz ödenmedi
const temmuzData: typeof salaryData = [
  { name: "İbrahim UZUN",   records: [{ month: 7, year: 2026, base: 25000, advance: 0 }] },
  { name: "Adem ÇALIŞKAN",  records: [{ month: 7, year: 2026, base: 22000, advance: 0 }] },
  { name: "İsmail ŞAHAN",   records: [{ month: 7, year: 2026, base: 30000, advance: 0 }] }, // 5000 avans çekti — panelden güncelle
  { name: "Hüsnü ARACI",    records: [{ month: 7, year: 2026, base: 30000, advance: 0 }] },
  { name: "Muhammet ÇOKTU", records: [{ month: 7, year: 2026, base: 22000, advance: 0 }] },
  { name: "Mustafa DURAN",  records: [{ month: 7, year: 2026, base: 22000, advance: 0 }] },
  { name: "Ertan BUĞDAYCI", records: [{ month: 7, year: 2026, base: 23000, advance: 0 }] },
  { name: "Ahmet OKUR",     records: [{ month: 7, year: 2026, base: 22000, advance: 0 }] },
  // Cihan ÖZ işten ayrıldı — Temmuz yok
];

// ─── 2. ARAÇ BELGE TARİHLERİ ─────────────────────────────────────────────────
// Plaka sonu: içeriği "45 MT XXXX" formatında. Tarihin yorumu:
//   2026 muayene/sigorta → Araç o tarihte muayene/sigorta yapıldı.
//   Muayene: 1 yıl geçerli → expiry = tarih + 1 yıl
//   Sigorta: 1 yıl geçerli → expiry = tarih + 1 yıl
// NOT: Gerçekte 6 ay aralıklı muayene varsa düzenleyiniz.

const vehicleDocData: {
  plateSuffix: string; // son 4 rakam
  inspectionExpiry?: string; // YYYY-MM-DD
  insuranceExpiry?: string;
}[] = [
  // OCAK 2026
  { plateSuffix: "9454", insuranceExpiry: "2027-01-10" },
  { plateSuffix: "9442", insuranceExpiry: "2027-01-22" },
  // ŞUBAT 2026
  // Jeep: Şubat 3 muayene (plateSuffix bilinmiyor, skip — manuel girin)
  { plateSuffix: "9424", inspectionExpiry: "2027-02-20" },
  // MART 2026
  { plateSuffix: "9420", inspectionExpiry: "2027-03-06" },
  { plateSuffix: "9461", insuranceExpiry:  "2027-03-17" },
  { plateSuffix: "9461", inspectionExpiry: "2027-03-19" },
  // NİSAN 2026
  { plateSuffix: "9454", inspectionExpiry: "2027-04-04" },
  { plateSuffix: "9438", inspectionExpiry: "2027-04-18" },
  // MAYIS 2026
  { plateSuffix: "9455", inspectionExpiry: "2027-05-20" },
  { plateSuffix: "9432", inspectionExpiry: "2027-05-22" },
  { plateSuffix: "9458", insuranceExpiry:  "2027-05-26" },
  // TEMMUZ 2026
  // Jeep: Temmuz 11 sigorta — skip
  { plateSuffix: "9424", insuranceExpiry: "2027-07-17" },
  // 9452-9458 muayene 18 Temmuz (iki araç)
  { plateSuffix: "9452", inspectionExpiry: "2027-07-18" },
  { plateSuffix: "9458", inspectionExpiry: "2027-07-18" },
  // Temmuz 31: 9438-9452-9432-9420-9445 sigorta
  { plateSuffix: "9438", insuranceExpiry: "2027-07-31" },
  { plateSuffix: "9452", insuranceExpiry: "2027-07-31" },
  { plateSuffix: "9432", insuranceExpiry: "2027-07-31" },
  { plateSuffix: "9420", insuranceExpiry: "2027-07-31" },
  { plateSuffix: "9445", insuranceExpiry: "2027-07-31" },
  // AĞUSTOS 2026
  { plateSuffix: "9455", insuranceExpiry: "2027-08-21" },
  // EYLÜL 2026
  { plateSuffix: "9443", insuranceExpiry: "2027-09-02" },
  { plateSuffix: "9413", insuranceExpiry: "2027-09-03" },
  // EKİM 2026
  { plateSuffix: "9445", inspectionExpiry: "2027-10-08" },
  // ARALIK 2026
  { plateSuffix: "9413", inspectionExpiry: "2027-12-09" },
];

// ─── 3. ÇEK VERİSİ ───────────────────────────────────────────────────────────
// Tümü "aldık" (müşteriden alınan çek)
const checkData: {
  contactName: string;
  bankName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
}[] = [
  // 2026
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 200000, dueDate: "2026-01-30" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 150000, dueDate: "2026-02-28" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 200000, dueDate: "2026-03-28" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 150000, dueDate: "2026-04-30" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 200000, dueDate: "2026-05-30" },
  { contactName: "Akbank",    bankName: "Akbank",    amount: 150000, dueDate: "2026-06-27" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 100000, dueDate: "2026-06-30" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 100000, dueDate: "2026-07-30" },
  { contactName: "Akbank",    bankName: "Akbank",    amount:  51600, dueDate: "2026-07-31" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 100000, dueDate: "2026-07-30" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 150000, dueDate: "2026-08-29" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 150000, dueDate: "2026-08-29" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 100000, dueDate: "2026-09-30" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 100000, dueDate: "2026-09-28" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 100000, dueDate: "2026-10-30" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 200000, dueDate: "2026-10-31" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 250000, dueDate: "2026-11-28" },
  { contactName: "Erkanlar",  bankName: "Erkanlar",  amount: 300000, dueDate: "2026-12-26" },
];

// ─── YARDIMCI FONKSİYONLAR ───────────────────────────────────────────────────
function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ç/g, "c")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o")
    .trim();
}

function driverMatch(dbName: string, excelName: string) {
  const a = normalize(dbName);
  const b = normalize(excelName);
  return a === b || a.includes(b.split(" ")[0]) || b.includes(a.split(" ")[0]);
}

// ─── 0. ŞÖFÖR ve ARAÇ TANIMLARI ──────────────────────────────────────────────
const driverDefs = [
  { name: "İbrahim UZUN",    status: "active"   },
  { name: "Adem ÇALIŞKAN",   status: "active"   },
  { name: "İsmail ŞAHAN",    status: "active"   },
  { name: "Hüsnü ARACI",     status: "active"   },
  { name: "Muhammet ÇOKTU",  status: "active"   },
  { name: "Mustafa DURAN",   status: "active"   },
  { name: "Ertan BUĞDAYCI",  status: "active"   },
  { name: "Ahmet OKUR",      status: "active"   },
  { name: "Cihan ÖZ",        status: "inactive" }, // işten ayrıldı
];

const vehicleDefs = [
  { plate: "45 J 9413" },
  { plate: "45 J 9420" },
  { plate: "45 J 9424" },
  { plate: "45 J 9432" },
  { plate: "45 J 9438" },
  { plate: "45 J 9442" },
  { plate: "45 J 9443" },
  { plate: "45 J 9445" },
  { plate: "45 J 9452" },
  { plate: "45 J 9454" },
  { plate: "45 J 9455" },
  { plate: "45 J 9458" },
  { plate: "45 J 9461" },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  // Tüm şirketleri listele
  const companies = await prisma.company.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  console.log("\n📋 Sistemdeki şirketler:");
  companies.forEach((c, i) => console.log(`  [${i}] ${c.name} (kod: ${c.code}) — ID: ${c.id}`));

  // Mert Tur'u bul: hem "mert" hem "tur" içermeli
  const merttur = companies.find(c =>
    normalize(c.name).includes("mert") && normalize(c.name).includes("tur")
  );

  if (!merttur) {
    console.log('\n❌ "Mert Tur" bulunamadı. Şirket adını kontrol edin.');
    console.log('   Farklı bir şirkete aktarmak için scripti düzenleyin.');
    process.exit(1);
  }

  console.log(`\n✅ Hedef şirket: "${merttur.name}" (${merttur.id})`);
  console.log("   5 saniye içinde başlıyor... Durdurmak için Ctrl+C\n");
  await new Promise(r => setTimeout(r, 5000));

  const cId = merttur.id;

  // ── 0a. ŞÖFÖR OLUŞTUR (yoksa) ──────────────────────────────────────────────
  console.log("\n👥 Şöförler kontrol ediliyor...");
  for (const def of driverDefs) {
    const existing = await prisma.driver.findFirst({
      where: { name: def.name, companyId: cId },
    });
    if (!existing) {
      await prisma.driver.create({
        data: { name: def.name, status: def.status, companyId: cId },
      });
      console.log(`  🆕 Şöför oluşturuldu: ${def.name}`);
    } else {
      console.log(`  ✓  Mevcut: ${def.name}`);
    }
  }

  // ── 0b. ARAÇ OLUŞTUR (yoksa) ────────────────────────────────────────────────
  console.log("\n🚌 Araçlar kontrol ediliyor...");
  for (const def of vehicleDefs) {
    const existing = await prisma.vehicle.findFirst({
      where: { plate: def.plate },
    });
    if (!existing) {
      await prisma.vehicle.create({
        data: { plate: def.plate, status: "active", companyId: cId },
      });
      console.log(`  🆕 Araç oluşturuldu: ${def.plate}`);
    } else {
      // companyId yoksa ata
      if (!existing.companyId) {
        await prisma.vehicle.update({ where: { id: existing.id }, data: { companyId: cId } });
        console.log(`  🔗 Merttur'a bağlandı: ${def.plate}`);
      } else {
        console.log(`  ✓  Mevcut: ${def.plate}`);
      }
    }
  }

  // Şöförleri ve araçları çek
  const dbDrivers = await prisma.driver.findMany({
    where: { companyId: cId },
    select: { id: true, name: true },
  });
  console.log(`\n✅ Toplam ${dbDrivers.length} şöför`);

  const dbVehicles = await prisma.vehicle.findMany({
    where: { companyId: cId },
    select: { id: true, plate: true },
  });
  console.log(`✅ Toplam ${dbVehicles.length} araç`);

  // ── 1. MAAŞLAR ──────────────────────────────────────────────────────────────
  console.log("\n📋 Maaş kayıtları işleniyor...");
  let salaryCreated = 0, salarySkipped = 0;

  for (const person of [...salaryData, ...temmuzData]) {
    const driver = dbDrivers.find(d => driverMatch(d.name, person.name));
    if (!driver) {
      console.log(`  ⚠️  Şöför bulunamadı: "${person.name}" — atlandı`);
      continue;
    }

    for (const r of person.records) {
      // Avans fazlaysa bunu not olarak tutuyoruz
      const paid = r.advance > 0;
      const totalAmount = r.base;
      const bonusAmount = r.advance > r.base ? r.advance - r.base : 0;

      try {
        await prisma.salary.upsert({
          where: { driverId_month_year: { driverId: driver.id, month: r.month, year: r.year } },
          update: {},  // mevcut kaydı değiştirme
          create: {
            driverId: driver.id,
            month: r.month,
            year: r.year,
            baseAmount: r.base,
            bonusAmount,
            totalAmount,
            jobCount: 0,
            paid,
            paidAt: paid ? new Date(`${r.year}-${String(r.month).padStart(2,"0")}-28`) : null,
          },
        });
        salaryCreated++;
        console.log(`  ✅ ${person.name} — ${r.year}/${r.month}: ₺${r.base.toLocaleString("tr-TR")} (ödendi)`);
      } catch (e: any) {
        console.log(`  ❌ ${person.name} ${r.year}/${r.month}: ${e.message}`);
        salarySkipped++;
      }
    }
  }
  console.log(`\n  Maaş: ${salaryCreated} oluşturuldu, ${salarySkipped} atlandı`);

  // ── 2. ARAÇ BELGELERİ ───────────────────────────────────────────────────────
  console.log("\n🔧 Araç belge tarihleri güncelleniyor...");
  let vehicleUpdated = 0, vehicleSkipped = 0;

  // Platları suffix'e göre grupla
  const vehicleMap: Record<string, string> = {};
  for (const v of dbVehicles) {
    const digits = v.plate.replace(/\s/g, "").replace(/[A-Za-zÇŞĞÜÖI]/g, "");
    const suffix = digits.slice(-4);
    vehicleMap[suffix] = v.id;
  }
  console.log("  Araç suffix map:", vehicleMap);

  // Grupla: plateSuffix → max expiry (aynı araç için birden fazla kayıt olabilir)
  const vehicleUpdateMap: Record<string, { inspectionExpiry?: Date; insuranceExpiry?: Date }> = {};
  for (const doc of vehicleDocData) {
    if (!vehicleUpdateMap[doc.plateSuffix]) vehicleUpdateMap[doc.plateSuffix] = {};
    if (doc.inspectionExpiry) {
      const d = new Date(doc.inspectionExpiry);
      const existing = vehicleUpdateMap[doc.plateSuffix].inspectionExpiry;
      if (!existing || d > existing) vehicleUpdateMap[doc.plateSuffix].inspectionExpiry = d;
    }
    if (doc.insuranceExpiry) {
      const d = new Date(doc.insuranceExpiry);
      const existing = vehicleUpdateMap[doc.plateSuffix].insuranceExpiry;
      if (!existing || d > existing) vehicleUpdateMap[doc.plateSuffix].insuranceExpiry = d;
    }
  }

  for (const [suffix, updates] of Object.entries(vehicleUpdateMap)) {
    const vehicleId = vehicleMap[suffix];
    if (!vehicleId) {
      console.log(`  ⚠️  Araç bulunamadı suffix: ${suffix} — atlandı`);
      vehicleSkipped++;
      continue;
    }
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...(updates.inspectionExpiry ? { inspectionExpiry: updates.inspectionExpiry } : {}),
        ...(updates.insuranceExpiry  ? { insuranceExpiry:  updates.insuranceExpiry  } : {}),
      },
    });
    const v = dbVehicles.find(v => v.id === vehicleId);
    console.log(`  ✅ ${v?.plate} (${suffix}) — muayene: ${updates.inspectionExpiry?.toISOString().slice(0,10) ?? "—"} | sigorta: ${updates.insuranceExpiry?.toISOString().slice(0,10) ?? "—"}`);
    vehicleUpdated++;
  }
  console.log(`\n  Araç: ${vehicleUpdated} güncellendi, ${vehicleSkipped} atlandı`);

  // ── 3. ÇEKLER ──────────────────────────────────────────────────────────────
  console.log("\n💳 Çekler işleniyor...");

  // Contact'ları bul veya oluştur
  const contactCache: Record<string, string> = {};
  async function getOrCreateContact(name: string): Promise<string> {
    if (contactCache[name]) return contactCache[name];
    let contact = await prisma.contact.findFirst({
      where: { name: { contains: name }, companyId: cId },
    });
    if (!contact) {
      contact = await prisma.contact.create({
        data: { name, type: "musteri", companyId: cId },
      });
      console.log(`  🆕 Cari oluşturuldu: ${name}`);
    }
    contactCache[name] = contact.id;
    return contact.id;
  }

  let checkCreated = 0;
  for (const c of checkData) {
    const contactId = await getOrCreateContact(c.contactName);
    // Aynı tutarda aynı tarihli çek varsa atla
    const existing = await prisma.check.findFirst({
      where: { contactId, amount: c.amount, dueDate: new Date(c.dueDate), companyId: cId },
    });
    if (existing) {
      console.log(`  ⏭️  Zaten var: ${c.dueDate} ${c.contactName} ₺${c.amount.toLocaleString("tr-TR")}`);
      continue;
    }
    await prisma.check.create({
      data: {
        contactId,
        direction: "aldik",  // biz aldık (müşteriden gelen çek)
        amount: c.amount,
        dueDate: new Date(c.dueDate),
        bankName: c.bankName,
        status: new Date(c.dueDate) < new Date() ? "tahsil_edildi" : "bekliyor",
        companyId: cId,
      },
    });
    console.log(`  ✅ ${c.dueDate} ${c.contactName} ₺${c.amount.toLocaleString("tr-TR")}`);
    checkCreated++;
  }
  console.log(`\n  Çek: ${checkCreated} oluşturuldu`);

  console.log("\n✅ Import tamamlandı!");
}

main()
  .catch(e => { console.error("❌ Hata:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
