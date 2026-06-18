import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCompanyId, tenantWhere } from "@/lib/tenant";
import ServisOdemelerClient from "./ServisOdemelerClient";

export default async function ServisOdemelerPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const companyId = getCompanyId(session);

  const routes = await prisma.route.findMany({
    where: { ...tenantWhere(companyId), active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      stops: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          order: true,
          estimatedTime: true,
          passengers: {
            where: { active: true },
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              parentName: true,
              parentPhone: true,
              monthlyFee: true,
              veliUsername: true,
              stopId: true,
            },
          },
        },
      },
    },
  });

  return <ServisOdemelerClient routes={routes} />;
}
