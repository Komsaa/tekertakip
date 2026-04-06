import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const job = await prisma.job.update({
      where: { id: params.id },
      data: {
        ...(b.title && { title: b.title }),
        ...(b.type && { type: b.type }),
        ...(b.status && { status: b.status }),
        ...(b.date && { date: new Date(b.date) }),
        ...(b.startTime && { startTime: b.startTime }),
        endTime: b.endTime || null,
        clientId: b.clientId || null,
        clientName: b.clientName || null,
        driverId: b.driverId || null,
        vehicleId: b.vehicleId || null,
        startLocation: b.startLocation || null,
        endLocation: b.endLocation || null,
        route: b.route || null,
        revenue: b.revenue ? parseFloat(b.revenue) : null,
        notes: b.notes || null,
      },
    });
    await logAction({ userEmail: session.user?.email ?? "admin", action: "UPDATE", entity: "Job", entityId: params.id, entityName: job.title ?? job.clientName ?? params.id });
    return NextResponse.json(job);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const existing = await prisma.job.findUnique({ where: { id: params.id } });
    await prisma.job.delete({ where: { id: params.id } });
    await logAction({ userEmail: session.user?.email ?? "admin", action: "DELETE", entity: "Job", entityId: params.id, entityName: existing?.title ?? existing?.clientName ?? params.id, changes: existing ?? undefined });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
