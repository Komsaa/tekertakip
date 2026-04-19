import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCompanyId } from "@/lib/tenant";
import { redirect } from "next/navigation";
import BelgelerClient from "./BelgelerClient";

export default async function BelgelerPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const companyId = getCompanyId(session);

  const docs = await prisma.document.findMany({
    where: companyId ? { companyId } : {},
    orderBy: { createdAt: "desc" },
  });

  // İlgili entity adlarını çek
  const driverIds = Array.from(new Set(docs.filter((d) => d.entityType === "driver").map((d) => d.entityId)));
  const vehicleIds = Array.from(new Set(docs.filter((d) => d.entityType === "vehicle").map((d) => d.entityId)));

  const [drivers, vehicles] = await Promise.all([
    driverIds.length
      ? prisma.driver.findMany({ where: { id: { in: driverIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
    vehicleIds.length
      ? prisma.vehicle.findMany({ where: { id: { in: vehicleIds } }, select: { id: true, plate: true } })
      : Promise.resolve([]),
  ]);

  const driverMap = Object.fromEntries(drivers.map((d) => [d.id, d.name]));
  const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, v.plate]));

  const enriched = docs.map((doc) => ({
    ...doc,
    entityName:
      doc.entityType === "driver"
        ? (driverMap[doc.entityId] ?? "—")
        : doc.entityType === "vehicle"
        ? (vehicleMap[doc.entityId] ?? "—")
        : "Genel",
    category: (doc as any).category ?? "diger",
    expiry: doc.expiry ? doc.expiry.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }));

  return <BelgelerClient docs={enriched} />;
}
