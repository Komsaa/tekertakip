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

  const [vehicles, records] = await Promise.all([
    prisma.vehicle.findMany({
      where: { ...companyFilter, NOT: { status: "deleted" } },
      select: { id: true, plate: true, brand: true, model: true },
      orderBy: { plate: "asc" },
    }),
    prisma.vehicleMaintenance.findMany({
      where: { ...companyFilter },
      include: { vehicle: { select: { plate: true } } },
      orderBy: { date: "desc" },
      take: 30,
    }),
  ]);

  return NextResponse.json({
    vehicles,
    records: records.map((r) => ({
      id: r.id,
      vehicleId: r.vehicleId,
      plate: r.vehicle.plate,
      date: r.date,
      type: r.type,
      description: r.description,
      cost: r.cost,
      odometer: r.odometer,
      nextDate: r.nextDate,
    })),
  });
}

export async function POST(req: NextRequest) {
  const manager = getManager(req);
  if (!manager) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { vehicleId, date, type, description, cost, odometer, nextDate } = await req.json();
  if (!vehicleId || !date || !type || !description) {
    return NextResponse.json({ error: "vehicleId, date, type ve description zorunlu" }, { status: 400 });
  }

  const companyFilter = manager.companyId ? { companyId: manager.companyId } : {};
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, ...companyFilter },
    select: { id: true, plate: true },
  });
  if (!vehicle) return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });

  const record = await prisma.vehicleMaintenance.create({
    data: {
      vehicleId,
      companyId: manager.companyId ?? null,
      date: new Date(date),
      type,
      description,
      cost: cost ? parseFloat(String(cost)) : null,
      odometer: odometer ? parseInt(String(odometer)) : null,
      nextDate: nextDate ? new Date(nextDate) : null,
    },
  });

  return NextResponse.json({ success: true, id: record.id, plate: vehicle.plate });
}
