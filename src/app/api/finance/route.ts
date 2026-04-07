import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere, tenantData } from "@/lib/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  return NextResponse.json(await prisma.financeEntry.findMany({ where: tenantWhere(companyId), orderBy: { date: "desc" } }));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  try {
    const b = await req.json();
    const entry = await prisma.financeEntry.create({
      data: {
        type: b.type,
        category: b.category,
        amount: parseFloat(b.amount),
        date: new Date(b.date),
        description: b.description || null,
        vehicleId: b.vehicleId || null,
        driverId: b.driverId || null,
        invoiceNo: b.invoiceNo || null,
        ...tenantData(companyId),
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
