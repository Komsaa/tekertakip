import { prisma } from "./prisma";
import { companyAccessError } from "./access-policy";

export async function getActiveParent(authorization: string) {
  if (!authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  const match = /^[a-f0-9]{48}\|(\d{13})$/.exec(token);
  if (!match) return null;
  const expiry = Number(match[1]);
  const now = Date.now();
  if (expiry <= now || expiry > now + 30 * 86400000) return null;
  const passenger = await prisma.routePassenger.findUnique({
    where: { veliToken: token },
    include: { stop: { include: { route: { include: { company: true } } } } },
  });
  if (
    !passenger?.active ||
    !passenger.stop.route.active ||
    companyAccessError(passenger.stop.route.company)
  )
    return null;
  return passenger;
}
