import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const _adminErr = requireAdmin(session); if (_adminErr) return _adminErr;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.demoExpiresAt !== undefined) data.demoExpiresAt = body.demoExpiresAt ? new Date(body.demoExpiresAt) : null;
    if (body.active !== undefined) data.active = body.active;
    if (body.notes !== undefined) data.notes = body.notes || null;
    const company = await prisma.company.update({ where: { id: params.id }, data });
    return NextResponse.json(company);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
