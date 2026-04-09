import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

async function getDriverFromToken() {
  const h = await headers();
  const auth = h.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  return prisma.driver.findFirst({ where: { mobileToken: token } });
}

// Bir duraktaki tüm yolcuların yoklamasını kaydet
export async function POST(req: NextRequest) {
  const driver = await getDriverFromToken();
  if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { routeId, date, attendances } = await req.json();
  // attendances: [{ passengerId, status }]

  if (!routeId || !date || !Array.isArray(attendances)) {
    return NextResponse.json({ error: "routeId, date, attendances zorunlu" }, { status: 400 });
  }

  for (const a of attendances) {
    await prisma.tripAttendance.upsert({
      where: { passengerId_routeId_date: { passengerId: a.passengerId, routeId, date } },
      create: { passengerId: a.passengerId, routeId, driverId: driver.id, date, status: a.status },
      update: { status: a.status },
    });
  }

  return NextResponse.json({ success: true });
}
