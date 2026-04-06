import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const existing = await prisma.fuelEntry.findUnique({ where: { id: params.id } });
    await prisma.fuelEntry.delete({ where: { id: params.id } });
    await logAction({ userEmail: session.user?.email ?? "admin", action: "DELETE", entity: "FuelEntry", entityId: params.id, entityName: `${existing?.totalAmount}₺`, changes: existing ?? undefined });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
