import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { companyCode, parentPhone } = await req.json();
  if (!companyCode || !parentPhone) {
    return NextResponse.json({ error: "companyCode ve parentPhone zorunlu" }, { status: 400 });
  }

  const company = await prisma.company.findFirst({
    where: { code: companyCode.trim().toUpperCase(), active: true },
  });
  if (!company) return NextResponse.json({ error: "İşletme kodu geçersiz" }, { status: 401 });

  // Bu şirkete ait güzergahlar → duraklar → yolcular içinde parentPhone ara
  const passenger = await prisma.routePassenger.findFirst({
    where: {
      parentPhone: parentPhone.trim(),
      active: true,
      stop: {
        route: { companyId: company.id, active: true },
      },
    },
    include: {
      stop: {
        include: {
          route: {
            include: {
              stops: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!passenger) return NextResponse.json({ error: "Bu telefon ile kayıtlı öğrenci bulunamadı" }, { status: 401 });

  // Token oluştur veya mevcut olanı döndür
  let token = passenger.veliToken;
  if (!token) {
    token = randomBytes(24).toString("hex");
    await prisma.routePassenger.update({ where: { id: passenger.id }, data: { veliToken: token } });
  }

  return NextResponse.json({
    token,
    passenger: { id: passenger.id, name: passenger.name },
    stop: { id: passenger.stop.id, name: passenger.stop.name, order: passenger.stop.order, estimatedTime: passenger.stop.estimatedTime },
    route: { id: passenger.stop.route.id, name: passenger.stop.route.name, totalStops: passenger.stop.route.stops.length },
    company: { name: company.name },
  });
}
