import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { companyAccessError } from "./access-policy";

const TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
async function getActiveDriver(auth: string) {
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const driver = await prisma.driver.findUnique({
    where: { mobileToken: token },
    include: {
      vehicles: { include: { vehicle: { select: { id: true, plate: true } } } },
      company: { select: { active: true, isDemo: true, demoExpiresAt: true } },
    },
  });
  if (
    !driver ||
    driver.status !== "active" ||
    companyAccessError(driver.company)
  )
    return null;
  if (!driver.mobileTokenAt) return null;
  const age = Date.now() - driver.mobileTokenAt.getTime();
  if (age < 0 || age >= TOKEN_LIFETIME_MS) return null;
  return driver;
}

export async function getDriverFromRequest(req: NextRequest) {
  return getActiveDriver(req.headers.get("authorization") ?? "");
}

export async function getDriverFromHeaders() {
  const { headers } = await import("next/headers");
  return getActiveDriver(headers().get("authorization") ?? "");
}
