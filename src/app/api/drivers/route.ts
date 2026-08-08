import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { getCompanyId, tenantWhere, requireTenant } from "@/lib/tenant";
import bcrypt from "bcryptjs";

function parseDate(s: string | undefined | null) {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenantErr = requireTenant(session); if (tenantErr) return tenantErr;
  const companyId = getCompanyId(session);
  const drivers = await prisma.driver.findMany({ where: { ...tenantWhere(companyId), status: { not: "deleted" } }, orderBy: { name: "asc" }, include: { vehicles: { include: { vehicle: { select: { id: true, plate: true, brand: true, model: true } } } } } });
  return NextResponse.json(drivers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  try {
    const body = await req.json();
    const driver = await prisma.driver.create({
      data: {
        name: body.name,
        phone: body.phone || null,
        licenseClass: body.licenseClass || null,
        licenseNumber: body.licenseNumber || null,
        licenseExpiry: parseDate(body.licenseExpiry),
        address: body.address || null,
        notes: body.notes || null,
        status: body.status || "active",
        companyId: companyId ?? body.companyId ?? null,
        mobileUsername: body.mobileUsername || null,
        mobilePin: body.mobilePin ? await bcrypt.hash(body.mobilePin, 10) : null,
      },
    });
    await logAction({ userEmail: session.user?.email ?? "admin", action: "CREATE", entity: "Driver", entityId: driver.id, entityName: driver.name, changes: { name: driver.name, phone: driver.phone, mobileUsername: driver.mobileUsername } });
    return NextResponse.json(driver, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
