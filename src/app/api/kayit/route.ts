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

    const demoExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 gün

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

    return NextResponse.json({
      success: true,
      username: kullaniciAdi.trim().toLowerCase(),
      companyCode: company.code,
      demoExpiresAt,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası, lütfen tekrar dene" }, { status: 500 });
  }
}
