import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Atanmamış tüm şöförleri bu şirkete ata
// POST /api/companies/[id]/assign-unassigned
export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await prisma.company.findUnique({ where: { id: params.id } });
  if (!company) return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 404 });

  const unassigned = await prisma.driver.findMany({
    where: { companyId: null },
    select: { id: true, name: true, mobilePin: true, mobileUsername: true },
  });

  if (unassigned.length === 0) {
    return NextResponse.json({ count: 0, message: "Atanmamış şöför yok" });
  }

  for (const d of unassigned) {
    const firstName = d.name.trim().split(/\s+/)[0].toLowerCase();
    await prisma.driver.update({
      where: { id: d.id },
      data: {
        companyId: company.id,
        mobilePin: d.mobilePin ?? firstName,
        mobileUsername: d.mobileUsername ?? firstName,
      },
    });
  }

  return NextResponse.json({
    count: unassigned.length,
    message: `${unassigned.length} şöför "${company.name}" şirketine atandı`,
  });
}
