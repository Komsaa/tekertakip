import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDriverFromHeaders } from "@/lib/mobile-auth";

// Şöförün aktif güzergahını duraklar + yolcular + bugünkü yoklama ile döner
// Ayrıca bugünkü işleri (Job) de döner
export async function GET() {
  const driver = await getDriverFromHeaders();
  if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);

  // Bugünün başlangıç ve sonu (UTC)
  const todayStart = new Date(today + "T00:00:00.000Z");
  const todayEnd = new Date(today + "T23:59:59.999Z");

  const [route, jobs] = await Promise.all([
    prisma.route.findFirst({
      where: { driverId: driver.id, active: true },
      include: {
        stops: {
          orderBy: { order: "asc" },
          include: {
            passengers: {
              where: { active: true },
              orderBy: { order: "asc" },
              include: {
                attendances: {
                  where: { date: today },
                },
              },
            },
          },
        },
      },
    }),
    prisma.job.findMany({
      where: {
        driverId: driver.id,
        date: { gte: todayStart, lte: todayEnd },
        status: { not: "cancelled" },
      },
      include: {
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
        subcontractor: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  return NextResponse.json({ route: route ?? null, jobs, today });
}
