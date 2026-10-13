import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDriverFromRequest } from "@/lib/mobile-auth";
import { inferRoutes, LEARNING_WEEK_MS, learningDay } from "@/lib/route-learning";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const driver = await getDriverFromRequest(req);
  if (!driver?.companyId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const sessions = await prisma.learningSession.findMany({ where: { driverId: driver.id, companyId: driver.companyId }, orderBy: { startedAt: "asc" } });
  const active = sessions.find(s => !s.endedAt && +s.expiresAt > Date.now());
  const weekEndsAt = sessions.length ? new Date(+sessions[0].startedAt + LEARNING_WEEK_MS) : null;
  return NextResponse.json({ active: active ?? null, weekEndsAt, days: new Set(sessions.filter(s => s.endedAt).map(s => learningDay(s.startedAt))).size,
    vehicles: driver.vehicles.map(v => v.vehicle) });
}

export async function POST(req: NextRequest) {
  const driver = await getDriverFromRequest(req);
  if (!driver?.companyId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || !["start", "points", "finish"].includes(body.action)) return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  const companyId = driver.companyId;
  try {
    const result = await prisma.$transaction(async tx => {
      // Serialize start/upload/finish for this driver, including retries from another device.
      await tx.$queryRaw`SELECT id FROM "Driver" WHERE id = ${driver.id} FOR UPDATE`;
      const now = new Date();
      if (body.action === "start") {
        if (typeof body.vehicleId !== "string" || !driver.vehicles.some(v => v.vehicleId === body.vehicleId)) throw new Error("400:Araç seçin");
        const first = await tx.learningSession.findFirst({ where: { driverId: driver.id, companyId }, orderBy: { startedAt: "asc" } });
        const weekEnd = new Date(+(first?.startedAt ?? now) + LEARNING_WEEK_MS);
        if (+now >= +weekEnd) throw new Error("409:Bir haftalık öğrenme tamamlandı. Taslakları panelden inceleyin.");
        await tx.learningSession.updateMany({ where: { driverId: driver.id, endedAt: null, expiresAt: { lte: now } }, data: { endedAt: now } });
        const active = await tx.learningSession.findFirst({ where: { driverId: driver.id, companyId, endedAt: null } });
        if (active) return { session: active };
        const session = await tx.learningSession.create({ data: { driverId: driver.id, companyId, vehicleId: body.vehicleId,
          expiresAt: new Date(Math.min(+now + 8 * 3600000, +weekEnd)) } });
        return { session };
      }
      if (typeof body.sessionId !== "string") throw new Error("400:Sefer gerekli");
      const session = await tx.learningSession.findFirst({ where: { id: body.sessionId, driverId: driver.id, companyId } });
      if (!session) throw new Error("404:Sefer bulunamadı");
      if (body.action === "points") {
        if (session.endedAt) throw new Error("409:Sefer sona erdi");
        if (!Array.isArray(body.points) || body.points.length < 1 || body.points.length > 200) throw new Error("400:Geçersiz konum paketi");
        const points = body.points.map((p: Record<string, unknown>) => {
          if (!p || typeof p.latitude !== "number" || typeof p.longitude !== "number" || !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude) || Math.abs(p.latitude) > 90 || Math.abs(p.longitude) > 180 || typeof p.timestamp !== "number" || !Number.isFinite(p.timestamp) || p.timestamp < +session.startedAt || p.timestamp > Math.min(+now + 30000, +session.expiresAt) || typeof p.accuracy !== "number" || !Number.isFinite(p.accuracy) || p.accuracy < 0 || p.accuracy > 50) throw new Error("400:Geçersiz konum");
          return { sessionId: session.id, latitude: p.latitude, longitude: p.longitude, accuracy: p.accuracy, timestamp: new Date(p.timestamp) };
        });
        await tx.learningPoint.createMany({ data: points, skipDuplicates: true });
        return { ok: true };
      }
      if (!session.endedAt) {
        const endedAt = new Date(body.endedAt);
        if (!Number.isFinite(+endedAt) || +endedAt < +session.startedAt || +endedAt > +now + 30000) throw new Error("400:Geçersiz bitiş zamanı");
        await tx.learningSession.update({ where: { id: session.id }, data: { endedAt: new Date(Math.min(+endedAt, +session.expiresAt)) } });
      }
      const sessions = await tx.learningSession.findMany({ where: { driverId: driver.id, companyId, endedAt: { not: null } },
        include: { points: { orderBy: { timestamp: "asc" } } }, orderBy: { startedAt: "asc" } });
      const drafts = inferRoutes(sessions);
      for (const draft of drafts) {
        const existing = await tx.routeProposal.findUnique({ where: { learningKey: draft.key } });
        const data = { name: draft.name, stops: draft.stops, learnedPath: draft.path,
          notes: `${draft.days} farklı servis gününden otomatik oluşturuldu. Duraklar adaydır; trafik beklemelerini kontrol edin.` };
        if (!existing) await tx.routeProposal.create({ data: { ...data, driverId: driver.id, companyId, learningKey: draft.key } });
        else if (existing.status === "pending") await tx.routeProposal.update({ where: { id: existing.id }, data });
      }
      return { ok: true, drafts: drafts.length };
    }, { timeout: 30000 });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const match = /^(400|404|409):(.+)$/.exec(message);
    if (match) return NextResponse.json({ error: match[2] }, { status: Number(match[1]) });
    console.error("Learning operation failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Kayıt tamamlanamadı, tekrar deneyin" }, { status: 500 });
  }
}
