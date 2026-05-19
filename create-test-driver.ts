import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const all = await prisma.company.findMany({ select: { id: true, name: true } });
  console.log('Şirketler:', JSON.stringify(all, null, 2));

  const company = await prisma.company.findFirst({
    where: { name: { contains: 'mert', mode: 'insensitive' } }
  });

  if (company) {
    const pin = await bcrypt.hash('1234', 10);
    const driver = await prisma.driver.create({
      data: {
        name: 'Test Şöför',
        mobileUsername: 'testsofor',
        mobilePin: pin,
        companyId: company.id,
        status: 'active',
      }
    });
    console.log('Oluşturuldu:', driver.id, driver.mobileUsername);
  } else {
    console.log('Mert Tur bulunamadı, şirketi yukarıdan seç.');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
