import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vehicleId = req.nextUrl.searchParams.get("vehicleId");
  if (!vehicleId) return NextResponse.json({ error: "vehicleId zorunlu" }, { status: 400 });

  const records = await prisma.vehicleMaintenance.findMany({
    where: { vehicleId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  const { vehicleId, date, type, description, cost, odometer, nextDate, nextKm } = await req.json();
  if (!vehicleId || !date || !type || !description) {
    return NextResponse.json({ error: "vehicleId, date, type ve description zorunlu" }, { status: 400 });
  }

  const record = await prisma.vehicleMaintenance.create({
    data: {
      vehicleId,
      companyId,
      date: new Date(date),
      type,
      description,
      cost: cost ? parseFloat(cost) : null,
      odometer: odometer ? parseInt(odometer) : null,
      nextDate: nextDate ? new Date(nextDate) : null,
      nextKm: nextKm ? parseInt(nextKm) : null,
    },
  });
  return NextResponse.json(record, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });

  await prisma.vehicleMaintenance.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
