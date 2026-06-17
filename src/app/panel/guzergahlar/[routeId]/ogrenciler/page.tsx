import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import OgrencilerClient from "./OgrencilerClient";

export default async function OgrencilerPage({ params }: { params: { routeId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const route = await prisma.route.findUnique({
    where: { id: params.routeId },
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
