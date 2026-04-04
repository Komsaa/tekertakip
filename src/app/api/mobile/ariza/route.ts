export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const driver = await prisma.driver.findUnique({
    where: { mobileToken: token },
    select: { id: true, name: true, vehicleId: true },
  });
  if (!driver) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { description, photoUrl } = await req.json();
  if (!description?.trim()) {
    return NextResponse.json({ error: "Açıklama zorunlu" }, { status: 400 });
  }

  const report = await prisma.vehicleReport.create({
    data: {
      driverId: driver.id,
      vehicleId: driver.vehicleId,
      description: description.trim(),
      photoUrl: photoUrl || null,
      status: "open",
    },
  });

  return NextResponse.json({ ok: true, id: report.id });
}
