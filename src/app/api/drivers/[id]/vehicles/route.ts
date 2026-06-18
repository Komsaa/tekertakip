import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere } from "@/lib/tenant";

// POST /api/drivers/[id]/vehicles  { vehicleId }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  const driver = await prisma.driver.findFirst({ where: { id: params.id, ...tenantWhere(companyId) } });
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { vehicleId } = await req.json();
  if (!vehicleId) return NextResponse.json({ error: "vehicleId zorunlu" }, { status: 400 });

  await prisma.driverVehicle.upsert({
    where: { driverId_vehicleId: { driverId: params.id, vehicleId } },
    create: { driverId: params.id, vehicleId },
    update: {},
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/drivers/[id]/vehicles  { vehicleId }
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  const driver = await prisma.driver.findFirst({ where: { id: params.id, ...tenantWhere(companyId) } });
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { vehicleId } = await req.json();
  if (!vehicleId) return NextResponse.json({ error: "vehicleId zorunlu" }, { status: 400 });

  await prisma.driverVehicle.deleteMany({ where: { driverId: params.id, vehicleId } });

  return NextResponse.json({ success: true });
}
