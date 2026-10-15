import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Veritabanı seed başlıyor...");

  // Admin kullanıcıları oluştur
  const admins = [
    {
      email: process.env.ADMIN_EMAIL_1 || "admin@tekertakip.com",
      password: process.env.ADMIN_PASSWORD_1 || "Admin2024!",
      name: process.env.ADMIN_NAME_1 || "Admin 1",
    },
    {
      email: process.env.ADMIN_EMAIL_2 || "admin2@tekertakip.com",
      password: process.env.ADMIN_PASSWORD_2 || "Admin2024!",
      name: process.env.ADMIN_NAME_2 || "Admin 2",
    },
    {
      email: process.env.ADMIN_EMAIL_3 || "admin3@tekertakip.com",
      password: process.env.ADMIN_PASSWORD_3 || "Admin2024!",
      name: process.env.ADMIN_NAME_3 || "Admin 3",
    },
  ];

  for (const admin of admins) {
    const hashedPassword = await bcrypt.hash(admin.password, 12);
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        email: admin.email,
        password: hashedPassword,
        name: admin.name,
        role: "admin",
      },
    });
    console.log(`✅ Kullanıcı oluşturuldu: ${admin.email}`);
  }

  // Örnek şöför
  await prisma.driver.upsert({
    where: { id: "example-driver-1" },
    update: {},
    create: {
      id: "example-driver-1",
      name: "Örnek Şöför",
      phone: "05001234567",
      status: "active",
      licenseClass: "D",
    },
  });

  // Örnek araç
  await prisma.vehicle.upsert({
    where: { plate: "34 TT 001" },
    update: {},
    create: {
      plate: "34 TT 001",
      brand: "Ford",
      model: "Transit",
      year: 2020,
      capacity: 14,
      color: "Sarı",
      status: "active",
    },
  });

  // Ayarlar (superadmin seviyesi — companyId null)
  const seedSettings = [
    { key: "company_name", value: process.env.COMPANY_NAME || "Firma Adı" },
    { key: "company_phone", value: process.env.COMPANY_PHONE || "" },
    { key: "company_city", value: process.env.COMPANY_CITY || "" },
  ];
  for (const s of seedSettings) {
    const existing = await prisma.setting.findFirst({ where: { key: s.key, companyId: null } });
    if (!existing) {
      await prisma.setting.create({ data: { key: s.key, value: s.value, companyId: null } });
    }
  }

  console.log("✅ Seed tamamlandı!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
