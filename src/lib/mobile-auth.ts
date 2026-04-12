// Mobil şöför token doğrulama — merkezi helper
// Token 30 gün geçerli; süresi dolan token reddedilir.
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const TOKEN_EXPIRY_DAYS = 30;

export async function getDriverFromRequest(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token) return null;

  const driver = await prisma.driver.findUnique({
    where: { mobileToken: token },
  });
  if (!driver) return null;

  // Token süresi kontrolü
  if (driver.mobileTokenAt) {
    const ageMs = Date.now() - driver.mobileTokenAt.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays > TOKEN_EXPIRY_DAYS) {
      // Süresi dolmuş — token sıfırla
      await prisma.driver.update({
        where: { id: driver.id },
        data: { mobileToken: null, mobileTokenAt: null },
      });
      return null;
    }
  }

  return driver;
}

// headers() kullanan route'lar için (sefer, attendance gibi)
export async function getDriverFromHeaders() {
  const { headers } = await import("next/headers");
  const h = await headers();
  const auth = h.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;

  const driver = await prisma.driver.findFirst({ where: { mobileToken: token } });
  if (!driver) return null;

  if (driver.mobileTokenAt) {
    const ageDays = (Date.now() - driver.mobileTokenAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > TOKEN_EXPIRY_DAYS) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: { mobileToken: null, mobileTokenAt: null },
      });
      return null;
    }
  }

  return driver;
}
