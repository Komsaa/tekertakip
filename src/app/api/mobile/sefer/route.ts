import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

async function getDriverFromToken() {
  const h = await headers();
  const auth = h.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  return prisma.driver.findFirst({ where: { mobileToken: token } });
}

// Şöförün aktif güzergahını duraklar + yolcular + bugünkü yoklama ile döner
export async function GET() {
  const driver = await getDriverFromToken();
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
