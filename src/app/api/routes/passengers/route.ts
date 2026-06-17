import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stopId = req.nextUrl.searchParams.get("stopId");
  const routeId = req.nextUrl.searchParams.get("routeId");

  if (stopId) {
    const passengers = await prisma.routePassenger.findMany({
      where: { stopId },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(passengers);
  }

  if (routeId) {
    const passengers = await prisma.routePassenger.findMany({
      where: { stop: { routeId } },
      include: { stop: { select: { id: true, name: true, order: true } } },
      orderBy: [{ stop: { order: "asc" } }, { order: "asc" }],
    });
    return NextResponse.json(passengers);
  }

  return NextResponse.json({ error: "stopId veya routeId zorunlu" }, { status: 400 });
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/ş/g, "s").replace(/ı/g, "i").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
}

function randomPin(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "90" + digits.slice(1);
  if (digits.startsWith("90")) return digits;
  if (digits.length === 10) return "90" + digits;
  return digits;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  const { stopId, name, phone, parentPhone, parentName } = await req.json();
  if (!stopId || !name) return NextResponse.json({ error: "stopId ve name zorunlu" }, { status: 400 });

  // Sıra numarası
  const count = await prisma.routePassenger.count({ where: { stopId } });

  // Otomatik veli hesabı oluştur
  const base = slugify(parentName?.trim() || name.trim());
  let veliUsername: string;
  let attempts = 0;
  do {
    veliUsername = `${base}${randomPin(4)}`;
    const exists = await prisma.routePassenger.findUnique({ where: { veliUsername } });
    if (!exists) break;
    attempts++;
  } while (attempts < 10);

  const veliPassword = randomPin(6);
  const veliPasswordHash = await bcrypt.hash(veliPassword, 10);

  const passenger = await prisma.routePassenger.create({
    data: {
      stopId,
      name: name.trim(),
      phone: phone?.trim() || null,
      parentName: parentName?.trim() || null,
      parentPhone: parentPhone?.trim() || null,
      order: count,
      veliUsername,
      veliPasswordHash,
    },
  });

  // WhatsApp kuyruğuna ekle (parentPhone varsa)
  if (parentPhone?.trim()) {
    const formattedPhone = formatPhone(parentPhone.trim());
    const stop = await prisma.routeStop.findUnique({
      where: { id: stopId },
      include: { route: { select: { name: true } } },
    });
    const routeName = stop?.route?.name ?? "Servis";
    const veliAdi = parentName?.trim() || name.trim();

    const message =
      `Merhaba ${veliAdi},\n\n` +
      `*${name.trim()}* için servis takip hesabınız oluşturuldu.\n\n` +
      `*Güzergah:* ${routeName}\n` +
      `*Kullanıcı adı:* ${veliUsername}\n` +
      `*Şifre:* ${veliPassword}\n\n` +
      `TékerTakip uygulamasına giriş yaparak servisin anlık konumunu takip edebilirsiniz.`;

    await prisma.whatsAppQueue.create({
      data: { phone: formattedPhone, message },
    });
  }

  return NextResponse.json({ ...passenger, veliPassword }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, stopId, name, parentName, parentPhone } = await req.json();
  if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });
  const updated = await prisma.routePassenger.update({
    where: { id },
    data: {
      ...(stopId && { stopId }),
      ...(name !== undefined && { name }),
      ...(parentName !== undefined && { parentName }),
      ...(parentPhone !== undefined && { parentPhone }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });
  await prisma.routePassenger.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
