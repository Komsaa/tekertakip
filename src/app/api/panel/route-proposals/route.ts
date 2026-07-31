import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere } from "@/lib/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  const proposals = await prisma.routeProposal.findMany({
    where: { ...tenantWhere(companyId), status: "pending" },
    include: { driver: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(proposals);
}
