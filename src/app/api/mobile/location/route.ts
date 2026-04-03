export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getDriverFromToken(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  return prisma.driver.findUnique({ where: { mobileToken: token } });
}

// Konum güncelle
export async function POST(req: NextRequest) {
  const driver = await getDriverFromToken(req);
  if (!driver) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { latitude, longitude } = await req.json();
  if (!latitude || !longitude)
    return NextResponse.json({ error: "Konum gerekli" }, { status: 400 });

  await prisma.driver.update({
    where: { id: driver.id },
    data: { latitude, longitude, lastLocationAt: new Date(), isTracking: true },
  });

  return NextResponse.json({ ok: true });
}

// Takibi durdur
export async function DELETE(req: NextRequest) {
  const driver = await getDriverFromToken(req);
  if (!driver) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  await prisma.driver.update({
    where: { id: driver.id },
    data: { isTracking: false },
  });

  return NextResponse.json({ ok: true });
}
