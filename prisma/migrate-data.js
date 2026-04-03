// Eski veritabanından yeni veritabanına veri aktarım scripti
// Kullanım: OLD_DB="postgres://..." node prisma/migrate-data.js

const { PrismaClient } = require("@prisma/client");

const OLD_DB = process.env.OLD_DB ||
  "postgres://postgres:rSrHaPt2K4NnAxeTcenGb2g92eWk9RKjVpwJ9tOc3bkAyJfB10xmwywpo0YmVH29@skk8gcco0w0c8cgwwkksoc84:5432/postgres";

const src = new PrismaClient({ datasources: { db: { url: OLD_DB } } });
const dst = new PrismaClient(); // DATABASE_URL kullanır

async function copy(label, fn) {
  try {
    const count = await fn();
    console.log(`✓ ${label}: ${count} kayıt`);
  } catch (e) {
    console.error(`✗ ${label}: ${e.message}`);
  }
}

async function main() {
  console.log("Veri aktarımı başlıyor...\n");

  await copy("Setting", async () => {
    const rows = await src.setting.findMany();
    for (const r of rows) await dst.setting.upsert({ where: { key: r.key }, update: r, create: r });
    return rows.length;
  });

  await copy("Company", async () => {
    const rows = await src.company.findMany();
    for (const r of rows) await dst.company.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("Vehicle", async () => {
    const rows = await src.vehicle.findMany();
    for (const r of rows) await dst.vehicle.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("Driver", async () => {
    const rows = await src.driver.findMany();
    for (const r of rows) await dst.driver.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("Job", async () => {
    const rows = await src.job.findMany();
    for (const r of rows) await dst.job.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("FuelEntry", async () => {
    const rows = await src.fuelEntry.findMany();
    for (const r of rows) await dst.fuelEntry.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("FinanceEntry", async () => {
    const rows = await src.financeEntry.findMany();
    for (const r of rows) await dst.financeEntry.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("Salary", async () => {
    const rows = await src.salary.findMany();
    for (const r of rows) {
      await dst.salary.upsert({
        where: { driverId_month_year: { driverId: r.driverId, month: r.month, year: r.year } },
        update: r,
        create: r,
      });
    }
    return rows.length;
  });

  await copy("Contact", async () => {
    const rows = await src.contact.findMany();
    for (const r of rows) await dst.contact.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("ContactTransaction", async () => {
    const rows = await src.contactTransaction.findMany();
    for (const r of rows) await dst.contactTransaction.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("Check", async () => {
    const rows = await src.check.findMany();
    for (const r of rows) await dst.check.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("Task", async () => {
    const rows = await src.task.findMany();
    for (const r of rows) await dst.task.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("Document", async () => {
    const rows = await src.document.findMany();
    for (const r of rows) await dst.document.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("Route", async () => {
    const rows = await src.route.findMany();
    for (const r of rows) await dst.route.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("RouteStop", async () => {
    const rows = await src.routeStop.findMany();
    for (const r of rows) await dst.routeStop.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("CreditCard", async () => {
    const rows = await src.creditCard.findMany();
    for (const r of rows) await dst.creditCard.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("CreditCardExpense", async () => {
    const rows = await src.creditCardExpense.findMany();
    for (const r of rows) await dst.creditCardExpense.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  await copy("PaymentCalendar", async () => {
    const rows = await src.paymentCalendar.findMany();
    for (const r of rows) await dst.paymentCalendar.upsert({ where: { id: r.id }, update: r, create: r });
    return rows.length;
  });

  console.log("\nAktarım tamamlandı!");
  await src.$disconnect();
  await dst.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
