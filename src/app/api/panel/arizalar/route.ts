export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere } from "@/lib/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const companyId = getCompanyId(session);

  const reports = await prisma.vehicleReport.findMany({
    where: {
      status: "open",
      ...(companyId ? { driver: { companyId } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      driver: { select: { name: true, phone: true } },
      vehicle: { select: { plate: true } },
    },
  });

  return NextResponse.json(reports);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const companyId = getCompanyId(session);

  const { id } = await req.json();
  if (companyId) {
    const existing = await prisma.vehicleReport.findFirst({ where: { id, driver: { companyId } } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.vehicleReport.update({
    where: { id },
    data: { status: "resolved", resolvedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
