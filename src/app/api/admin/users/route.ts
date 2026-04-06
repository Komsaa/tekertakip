import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const drivers = await prisma.driver.findMany({
    where: { mobileUsername: { not: null } },
    select: {
      id: true,
      name: true,
      phone: true,
      mobileUsername: true,
      mobilePin: true,
      status: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(drivers);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, mobileUsername, mobilePin } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const driver = await prisma.driver.update({
    where: { id },
    data: {
      ...(mobileUsername !== undefined ? { mobileUsername: mobileUsername || null } : {}),
      ...(mobilePin !== undefined ? { mobilePin: mobilePin || null } : {}),
    },
    select: { id: true, name: true, mobileUsername: true, mobilePin: true },
  });

  return NextResponse.json(driver);
}
