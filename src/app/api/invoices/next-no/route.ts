import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere } from "@/lib/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { ...tenantWhere(companyId), invoiceNo: { startsWith: `KOM${year}` } },
  });
  const no = String(count + 1).padStart(9, "0");
  return NextResponse.json({ invoiceNo: `KOM${year}${no}` });
}
