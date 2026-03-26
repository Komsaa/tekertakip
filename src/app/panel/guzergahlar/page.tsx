import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import GuzergahlarClient from "./GuzergahlarClient";

export default async function GuzergahlarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  try {
    const [routes, drivers, vehicles] = await Promise.all([
      prisma.route.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          driver: true,
          vehicle: true,
          stops: { orderBy: { order: "asc" } },
        },
      }).catch(() => []),
      prisma.driver.findMany({ where: { status: "active" }, orderBy: { name: "asc" } }).catch(() => []),
      prisma.vehicle.findMany({ where: { status: "active" }, orderBy: { plate: "asc" } }).catch(() => []),
    ]);

    return <GuzergahlarClient initialRoutes={routes} drivers={drivers} vehicles={vehicles} />;
  } catch (e) {
    console.error("Guzergahlar sayfa hatası:", e);
    return <GuzergahlarClient initialRoutes={[]} drivers={[]} vehicles={[]} />;
  }
}
