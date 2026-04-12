// Panel: bir yolcu için veli giriş bilgisi üretir
// POST { passengerId } → { veliUsername, veliPassword (düz metin, sadece bu anda) }
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/tenant";
import bcrypt from "bcryptjs";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/ş/g, "s").replace(/ı/g, "i").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
}

function randomPin(length = 4) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  const { passengerId } = await req.json();
  if (!passengerId) return NextResponse.json({ error: "passengerId zorunlu" }, { status: 400 });

  // Yolcunun bu şirkete ait olduğunu doğrula
  const passenger = await prisma.routePassenger.findUnique({
    where: { id: passengerId },
    include: {
      stop: {
        include: { route: { select: { companyId: true } } },
      },
    },
  });

  if (!passenger) return NextResponse.json({ error: "Yolcu bulunamadı" }, { status: 404 });
  if (companyId && passenger.stop.route.companyId !== companyId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  // Kullanıcı adı: ad'ın ilk 8 harfi + 4 rakamlı benzersiz suffix
  const base = slugify(passenger.name);
  let veliUsername: string;
  let attempts = 0;
  do {
    veliUsername = `${base}${randomPin(4)}`;
    const exists = await prisma.routePassenger.findUnique({ where: { veliUsername } });
    if (!exists) break;
    attempts++;
  } while (attempts < 10);

  // Şifre: 6 rakamlı PIN
  const veliPassword = randomPin(6);
  const veliPasswordHash = await bcrypt.hash(veliPassword, 10);

  await prisma.routePassenger.update({
    where: { id: passengerId },
    data: {
      veliUsername,
      veliPasswordHash,
      veliToken: null, // eski token'ı sıfırla (yeni şifre = yeni oturum)
    },
  });

  return NextResponse.json({ veliUsername, veliPassword });
}
