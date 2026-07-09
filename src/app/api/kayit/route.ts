import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generateCompanyCode(name: string): string {
  const slug = name
    .toUpperCase()
    .replace(/Ş/g, "S").replace(/İ/g, "I").replace(/Ğ/g, "G")
    .replace(/Ü/g, "U").replace(/Ö/g, "O").replace(/Ç/g, "C")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${slug}${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const { firmaAdi, adSoyad, telefon, kullaniciAdi, sifre } = await req.json();

    if (!firmaAdi?.trim() || !adSoyad?.trim() || !kullaniciAdi?.trim() || !sifre?.trim()) {
      return NextResponse.json({ error: "Firma adı, ad soyad, kullanıcı adı ve şifre zorunlu" }, { status: 400 });
    }

    if (sifre.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalı" }, { status: 400 });
    }

    // Kullanıcı adı müsait mi?
    const existing = await prisma.panelUser.findUnique({ where: { username: kullaniciAdi.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Bu kullanıcı adı alınmış, başka bir tane dene" }, { status: 400 });
    }

    // Benzersiz şirket kodu üret
    let companyCode: string;
    let attempts = 0;
    do {
      companyCode = generateCompanyCode(firmaAdi.trim());
      const codeExists = await prisma.company.findUnique({ where: { code: companyCode } });
      if (!codeExists) break;
      attempts++;
    } while (attempts < 10);

    const demoExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // +14 gün

    const company = await prisma.company.create({
      data: {
        name: firmaAdi.trim(),
        code: companyCode!,
        isDemo: true,
        demoExpiresAt,
        active: true,
        driverLimit: 10,
      },
    });

    const passwordHash = await bcrypt.hash(sifre, 10);
    await prisma.panelUser.create({
      data: {
        username: kullaniciAdi.trim().toLowerCase(),
        passwordHash,
        name: adSoyad.trim(),
        phone: telefon?.trim() || null,
        role: "firma",
        active: true,
        companyId: company.id,
      },
    });

    // Telefon varsa WhatsApp'a hoş geldin mesajı gönder
    if (telefon?.trim()) {
      const digits = telefon.trim().replace(/\D/g, "");
      const formattedPhone = digits.startsWith("90") ? digits : digits.startsWith("0") ? "90" + digits.slice(1) : digits.length === 10 ? "90" + digits : digits;
      const username = kullaniciAdi.trim().toLowerCase();
      const message =
        `Merhaba ${adSoyad.trim()}! 👋\n\n` +
        `*TekerTakip* hesabınız oluşturuldu. 30 günlük ücretsiz denemeniz başladı.\n\n` +
        `🔐 *Giriş bilgileriniz:*\n` +
        `• Kullanıcı adı: *${username}*\n` +
        `• Şifre: *${sifre}*\n` +
        `• Panel: tekertakip.com/login\n\n` +
        `📱 *Hızlı başlangıç:*\n` +
        `1. tekertakip.com/login adresine giriş yapın\n` +
        `2. Şöförlerinizi ekleyin (Şöförler menüsü)\n` +
        `3. Şöförlere mobil uygulamayı indirtin (TekerTakip)\n` +
        `4. Şöfor, sefer başlatınca siz haritada görürsünüz\n\n` +
        `Sorularınız için bu numaraya yazabilirsiniz. Kolay gelsin!`;
      await prisma.whatsAppQueue.create({ data: { phone: formattedPhone, message } }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      username: kullaniciAdi.trim().toLowerCase(),
      phoneProvided: !!telefon?.trim(),
      demoExpiresAt,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası, lütfen tekrar dene" }, { status: 500 });
  }
}
