export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere, requireTenant } from "@/lib/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const tenantErr = requireTenant(session); if (tenantErr) return tenantErr;
  const companyId = getCompanyId(session);

  const drivers = await prisma.driver.findMany({
    where: { ...tenantWhere(companyId), status: "active", latitude: { not: null } },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      lastLocationAt: true,
      isTracking: true,
      vehicles: { take: 1, include: { vehicle: { select: { plate: true } } } },
      routes: {
        where: { active: true, type: "okul" },
        take: 1,
        select: {
          stops: {
            select: {
              passengers: {
                where: { active: true },
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Okul güzergahı olan şöförler için bugünkü boarding kayıtlarını tek sorguda çek
  const today = new Date().toISOString().slice(0, 10);
  const schoolDriverIds = drivers.filter(d => d.routes.length > 0).map(d => d.id);

  const boardingRecords = schoolDriverIds.length > 0
    ? await prisma.tripAttendance.findMany({
        where: { driverId: { in: schoolDriverIds }, date: today },
        select: { driverId: true, passengerId: true, status: true },
      })
    : [];

  const boardingByDriver: Record<string, { passengerId: string; status: string }[]> = {};
  for (const r of boardingRecords) {
    if (!r.driverId) continue;
    if (!boardingByDriver[r.driverId]) boardingByDriver[r.driverId] = [];
    boardingByDriver[r.driverId].push(r);
  }

  const result = drivers.map(d => {
    const route = d.routes[0];
    if (!route) return { ...d, routes: undefined, boardingInfo: null };

    const allPassengers = route.stops.flatMap(s => s.passengers);
    const total = allPassengers.length;
    if (total === 0) return { ...d, routes: undefined, boardingInfo: null };

    const driverBoarding = boardingByDriver[d.id] ?? [];
    const boardedIds = new Set(
      driverBoarding.filter(r => r.status === "boarded").map(r => r.passengerId)
    );

    return {
      ...d,
      routes: undefined,
      boardingInfo: {
        total,
        boarded: boardedIds.size,
        passengers: allPassengers.map(p => ({ name: p.name, boarded: boardedIds.has(p.id) })),
      },
    };
  });

  return NextResponse.json(result);
}
