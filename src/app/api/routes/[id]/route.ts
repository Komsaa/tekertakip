import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere, requireTenant } from "@/lib/tenant";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantErr = requireTenant(session); if (tenantErr) return tenantErr;
  const companyId = getCompanyId(session);
  const route = await prisma.route.findFirst({
    where: { id: params.id, ...tenantWhere(companyId) },
    include: { stops: { orderBy: { order: "asc" } }, driver: true, vehicle: true },
  });
  if (!route) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(route);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantErr = requireTenant(session); if (tenantErr) return tenantErr;
  const companyId = getCompanyId(session);
  try {
    const b = await req.json();

    if (typeof b.name !== "string" || !b.name.trim() || !Array.isArray(b.stops) || !b.stops.length || b.stops.some((s: any) =>
      !s || typeof s.name !== "string" || !s.name.trim() || typeof s.estimatedTime !== "string" ||
      (s.lat != null || s.lng != null) && !(typeof s.lat === "number" && Number.isFinite(s.lat) && Math.abs(s.lat) <= 90 && typeof s.lng === "number" && Number.isFinite(s.lng) && Math.abs(s.lng) <= 180))) {
      return NextResponse.json({ error: "Güzergâh adı ve geçerli durak bilgileri gerekli" }, { status: 400 });
    }
    const route = await prisma.$transaction(async tx => {
      const existing = await tx.route.findFirst({
        where: { id: params.id, ...tenantWhere(companyId) },
        include: { stops: { include: { _count: { select: { passengers: true } } } } },
      });
      if (!existing) throw new Error("ROUTE_NOT_FOUND");
      const ids = b.stops.filter((s: any) => s.id).map((s: any) => s.id) as string[];
      if (new Set(ids).size !== ids.length || ids.some(id => !existing.stops.some(s => s.id === id))) throw new Error("INVALID_STOP");
      const removed = existing.stops.filter(s => !ids.includes(s.id));
      if (removed.some(s => s._count.passengers > 0)) throw new Error("STOP_HAS_PASSENGERS");
      if (b.driverId && !await tx.driver.findFirst({ where: { id: b.driverId, companyId: existing.companyId } })) throw new Error("INVALID_ASSIGNMENT");
      if (b.vehicleId && !await tx.vehicle.findFirst({ where: { id: b.vehicleId, companyId: existing.companyId } })) throw new Error("INVALID_ASSIGNMENT");
      return tx.route.update({
        where: { id: existing.id },
        data: {
          name: b.name.trim(), type: b.type || "okul", driverId: b.driverId || null,
          vehicleId: b.vehicleId || null, weekdaysOnly: b.weekdaysOnly !== false,
          active: b.active !== false, notes: b.notes || null,
          stops: {
            deleteMany: { id: { in: removed.map(s => s.id) } },
            update: b.stops.filter((s: any) => s.id).map((s: any) => ({ where: { id: s.id }, data: {
              order: b.stops.indexOf(s), name: s.name.trim(), lat: s.lat ?? null, lng: s.lng ?? null,
              estimatedTime: s.estimatedTime, notes: s.notes || null,
            } })),
            create: b.stops.filter((s: any) => !s.id).map((s: any) => ({
              order: b.stops.indexOf(s), name: s.name.trim(), lat: s.lat ?? null, lng: s.lng ?? null,
              estimatedTime: s.estimatedTime, notes: s.notes || null,
            })),
          },
        },
        include: { stops: { orderBy: { order: "asc" } }, driver: true, vehicle: true },
      });
    });
    return NextResponse.json(route);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "ROUTE_NOT_FOUND") return NextResponse.json({ error: "Güzergâh bulunamadı" }, { status: 404 });
    if (msg === "INVALID_STOP") return NextResponse.json({ error: "Durak bu güzergâha ait değil veya tekrarlanıyor" }, { status: 400 });
    if (msg === "INVALID_ASSIGNMENT") return NextResponse.json({ error: "Şoför veya araç bu firmaya ait değil" }, { status: 400 });
    if (msg === "STOP_HAS_PASSENGERS") return NextResponse.json({ error: "Yolcu kayıtlı durak silinemez. Önce yolcuları başka durağa taşıyın." }, { status: 409 });
    console.error("PUT /api/routes error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantErr = requireTenant(session); if (tenantErr) return tenantErr;
  const companyId = getCompanyId(session);
  try {
    await prisma.route.delete({ where: { id: params.id, ...tenantWhere(companyId) } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
