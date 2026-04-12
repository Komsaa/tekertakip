import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDriverFromHeaders } from "@/lib/mobile-auth";

// Şöförün aktif güzergahını duraklar + yolcular + bugünkü yoklama ile döner
export async function GET() {
  const driver = await getDriverFromHeaders();
  if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);

  const route = await prisma.route.findFirst({
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
  });

  if (!route) return NextResponse.json({ error: "Aktif güzergah bulunamadı" }, { status: 404 });

  return NextResponse.json({ route, today });
}
