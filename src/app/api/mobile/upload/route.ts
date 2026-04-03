// Mobil uygulama: fiş fotoğrafı yükleme
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getDriverFromToken(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  return prisma.driver.findUnique({ where: { mobileToken: token }, select: { id: true, name: true } });
}

export async function POST(req: NextRequest) {
  try {
    const driver = await getDriverFromToken(req);
    if (!driver) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "Dosya eksik" }, { status: 400 });

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    if (!["jpg", "jpeg", "png"].includes(ext)) {
      return NextResponse.json({ error: "Sadece JPG/PNG yüklenebilir" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const dir = path.join(process.cwd(), "uploads", "fuel-receipts");
    const filename = `${driver.id}_${Date.now()}.${ext}`;
    const filepath = path.join(dir, filename);

    await mkdir(dir, { recursive: true });
    await writeFile(filepath, buffer);

    const url = `/api/files/fuel-receipts/${filename}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
