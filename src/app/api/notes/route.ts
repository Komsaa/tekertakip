import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const setting = await prisma.setting.findUnique({ where: { key: "dashboard_notes" } });
  return NextResponse.json({ notes: setting?.value ?? "" });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { notes } = await req.json();
  await prisma.setting.upsert({
    where: { key: "dashboard_notes" },
    update: { value: notes ?? "" },
    create: { key: "dashboard_notes", value: notes ?? "" },
  });
  return NextResponse.json({ ok: true });
}
