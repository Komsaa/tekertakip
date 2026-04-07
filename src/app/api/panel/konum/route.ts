export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere } from "@/lib/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
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
      vehicle: { select: { plate: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(drivers);
}
