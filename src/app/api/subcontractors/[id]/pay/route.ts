// Taşerona ait tüm bekleyen işleri ödenmiş işaretle
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  // jobIds belirtilmişse sadece onları öde, yoksa tüm bekleyenleri
  const jobIds: string[] | undefined = body.jobIds;

  const where = jobIds?.length
    ? { id: { in: jobIds }, subcontractorId: params.id }
    : { subcontractorId: params.id, subcontractorPaid: false };

  const result = await prisma.job.updateMany({
    where,
    data: { subcontractorPaid: true, subcontractorPaidAt: new Date() },
  });

  return NextResponse.json({ updated: result.count });
}
