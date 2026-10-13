import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import OgrencilerClient from "./OgrencilerClient";
import { getCompanyId, requireTenant, tenantWhere } from "@/lib/tenant";

export default async function OgrencilerPage({ params }: { params: { routeId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (requireTenant(session)) redirect("/login");

  const route = await prisma.route.findFirst({
    where: { id: params.routeId, ...tenantWhere(getCompanyId(session)) },
    include: {
      stops: {
        orderBy: { order: "asc" },
        include: {
          passengers: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!route) notFound();

  return <OgrencilerClient route={route} />;
}
