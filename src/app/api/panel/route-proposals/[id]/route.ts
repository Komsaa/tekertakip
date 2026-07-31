import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere, tenantData } from "@/lib/tenant";

// Onayla → Route oluştur
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  const proposal = await prisma.routeProposal.findFirst({
    where: { id: params.id, ...tenantWhere(companyId) },
    include: { driver: true },
  });
  if (!proposal) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const body = await req.json();
  const stops = (body.stops ?? proposal.stops) as { name: string; lat: number | null; lng: number | null; estimatedTime?: string }[];
  const routeName = body.name || proposal.name || `${proposal.driver.name} Güzergahı`;

  try {
    const route = await prisma.route.create({
      data: {
        name: routeName,
        type: body.type || "okul",
        driverId: proposal.driverId,
        weekdaysOnly: true,
        active: true,
        ...tenantData(companyId),
        stops: {
          create: stops.map((s, i) => ({
            order: i,
            name: s.name || `Durak ${i + 1}`,
            lat: s.lat ?? null,
            lng: s.lng ?? null,
            estimatedTime: s.estimatedTime || "",
          })),
        },
      },
      include: { stops: { orderBy: { order: "asc" } } },
    });

    await prisma.routeProposal.update({
      where: { id: params.id },
      data: { status: "approved" },
    });

    return NextResponse.json({ success: true, routeId: route.id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// Reddet veya sil
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  await prisma.routeProposal.updateMany({
    where: { id: params.id, ...tenantWhere(companyId) },
    data: { status: "rejected" },
  });

  return NextResponse.json({ success: true });
}
