import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/tenant";

type BulkEntry = {
  name: string;
  entityType: string;
  entityId: string;
  fileUrl: string;
  category?: string;
  expiry?: string;
  notes?: string;
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  try {
    const { entries }: { entries: BulkEntry[] } = await req.json();
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "Boş liste" }, { status: 400 });
    }

    const created = await prisma.$transaction(
      entries.map((e) =>
        prisma.document.create({
          data: {
            name: e.name,
            entityType: e.entityType,
            entityId: e.entityId,
            fileUrl: e.fileUrl || null,
            ...(e.category ? { category: e.category } : {}),
            expiry: e.expiry ? new Date(e.expiry) : null,
            notes: e.notes || null,
            companyId: companyId ?? null,
          } as any,
        })
      )
    );

    return NextResponse.json({ count: created.length }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
