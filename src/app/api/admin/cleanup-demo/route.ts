import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminErr = requireAdmin(session); if (adminErr) return adminErr;

  const testDrivers = await prisma.driver.findMany({
    where: { mobileUsername: { in: ["testsofor", "test"] } },
    select: { id: true, name: true, mobileUsername: true },
  });

  const expiredDemos = await prisma.company.findMany({
    where: { isDemo: true, demoExpiresAt: { lt: new Date() } },
    select: { id: true, name: true },
  });

  if (testDrivers.length > 0) {
    await prisma.driver.deleteMany({ where: { id: { in: testDrivers.map((d) => d.id) } } });
  }

  return NextResponse.json({
    success: true,
    deletedTestDrivers: testDrivers.map((d) => d.mobileUsername),
    expiredDemoCompanies: expiredDemos.map((c) => c.name),
  });
}
