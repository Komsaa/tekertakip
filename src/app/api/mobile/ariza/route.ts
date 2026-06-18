export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDriverFromRequest } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
  const driver = await getDriverFromRequest(req);
  if (!driver) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { description, photoUrl } = await req.json();
  if (!description?.trim()) {
    return NextResponse.json({ error: "Açıklama zorunlu" }, { status: 400 });
  }

  const report = await prisma.vehicleReport.create({
    data: {
      driverId: driver.id,
      vehicleId: driver.vehicles?.[0]?.vehicleId ?? null,
      description: description.trim(),
      photoUrl: photoUrl || null,
      status: "open",
    },
  });

  return NextResponse.json({ ok: true, id: report.id });
}
