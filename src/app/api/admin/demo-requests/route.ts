import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminErr = requireAdmin(session); if (adminErr) return adminErr;

  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "DemoRequest" ORDER BY "createdAt" DESC
  `;
  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminErr = requireAdmin(session); if (adminErr) return adminErr;

  const { id, status, notes } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "id ve status zorunlu" }, { status: 400 });

  await prisma.$executeRawUnsafe(
    `UPDATE "DemoRequest" SET "status"=$1, "notes"=$2 WHERE "id"=$3`,
    status, notes ?? null, id,
  );
  return NextResponse.json({ success: true });
}
