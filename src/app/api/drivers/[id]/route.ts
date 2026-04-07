import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { getCompanyId, tenantWhere } from "@/lib/tenant";

function parseDate(s: string | undefined | null) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  const driver = await prisma.driver.findFirst({ where: { id: params.id, ...tenantWhere(companyId) }, include: { vehicle: true } });
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(driver);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  try {
    const body = await req.json();
    const driver = await prisma.driver.update({
      where: { id: params.id, ...tenantWhere(companyId) },
      data: {
        ...(body.name && { name: body.name }),
        phone: body.phone || null,
        status: body.status || undefined,
        licenseClass: body.licenseClass || null,
        licenseNumber: body.licenseNumber || null,
        licenseExpiry: parseDate(body.licenseExpiry),
        address: body.address || null,
        notes: body.notes || null,
        ...(body.mobilePin !== undefined && { mobilePin: body.mobilePin || null }),
        ...(body.mobileUsername !== undefined && { mobileUsername: body.mobileUsername || null }),
        ...(body.companyId !== undefined && { companyId: body.companyId || null }),
      },
    });
    await logAction({ userEmail: session.user?.email ?? "admin", action: "UPDATE", entity: "Driver", entityId: params.id, entityName: driver.name, changes: body });
    return NextResponse.json(driver);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  try {
    const existing = await prisma.driver.findFirst({ where: { id: params.id, ...tenantWhere(companyId) } });
    await prisma.driver.delete({ where: { id: params.id } });
    await logAction({ userEmail: session.user?.email ?? "admin", action: "DELETE", entity: "Driver", entityId: params.id, entityName: existing?.name, changes: existing ?? undefined });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
