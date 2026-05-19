import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDriverFromRequest } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

// Şöför hesap silme
export async function DELETE(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role") ?? "driver";

  if (role === "veli") {
    const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim();
    if (!token) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const passenger = await prisma.routePassenger.findUnique({ where: { veliToken: token } });
    if (!passenger) return NextResponse.json({ error: "Hesap bulunamadı" }, { status: 404 });

    // Veli bilgilerini temizle (yolcuyu silme, sadece giriş bilgilerini sil)
    await prisma.routePassenger.update({
      where: { id: passenger.id },
      data: {
        veliToken: null,
        veliUsername: null,
        veliPasswordHash: null,
        parentPushToken: null,
      },
    });

    return NextResponse.json({ ok: true });
  }

  // Şöför
  const driver = await getDriverFromRequest(req);
  if (!driver) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  // Token'ı ve mobil bilgileri temizle (şöförü silme, firma kaybeder verisini)
  await prisma.driver.update({
    where: { id: driver.id },
    data: {
      mobileToken: null,
      mobileTokenAt: null,
      mobilePin: null,
      mobileUsername: null,
      isTracking: false,
    },
  });

  return NextResponse.json({ ok: true });
}
