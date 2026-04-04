// Tek kullanımlık: test şöförü oluştur
// GET /api/setup/test-driver (admin session gerekli)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Mevcut test şöförü varsa sil, yeniden oluştur
    await prisma.driver.deleteMany({ where: { mobileUsername: "test" } });

    const driver = await prisma.driver.create({
      data: {
        name: "Test Şöför",
        mobileUsername: "test",
        mobilePin: "test123",
        status: "active",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test şöförü oluşturuldu",
      credentials: {
        kullaniciAdi: "test",
        sifre: "test123",
      },
      driverId: driver.id,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}
