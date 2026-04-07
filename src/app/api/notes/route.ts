import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  const setting = await prisma.setting.findFirst({
    where: { key: "dashboard_notes", companyId: companyId ?? null },
  });
  return NextResponse.json({ notes: setting?.value ?? "" });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  const { notes } = await req.json();
  const cid = companyId ?? null;
  await prisma.setting.upsert({
    where: { key_companyId: { key: "dashboard_notes", companyId: cid as string } },
    update: { value: notes ?? "" },
    create: { key: "dashboard_notes", value: notes ?? "", companyId: cid },
  });
  return NextResponse.json({ ok: true });
}
