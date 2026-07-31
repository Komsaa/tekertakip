import { NextRequest, NextResponse } from "next/server";
import { verifyManagerTokenFull } from "@/lib/manager-token";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getManager(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyManagerTokenFull(auth.slice(7));
}

export async function GET(req: NextRequest) {
  const manager = getManager(req);
  if (!manager) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const companyFilter = manager.companyId ? { companyId: manager.companyId } : {};

  const drivers = await prisma.driver.findMany({
    where: { ...companyFilter, NOT: { status: "deleted" } },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      latitude: true,
      longitude: true,
      lastLocationAt: true,
      isTracking: true,
      vehicles: {
        take: 1,
        include: { vehicle: { select: { plate: true } } },
      },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(drivers.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    status: d.status,
    latitude: d.latitude,
    longitude: d.longitude,
    lastLocationAt: d.lastLocationAt,
    isTracking: d.isTracking,
    plate: d.vehicles[0]?.vehicle?.plate ?? null,
  })));
}
