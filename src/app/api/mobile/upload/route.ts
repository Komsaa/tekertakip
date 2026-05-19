// Mobil uygulama: fiş fotoğrafı yükleme
import { NextRequest, NextResponse } from "next/server";
import { getDriverFromRequest } from "@/lib/mobile-auth";
import { uploadToStorage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const driver = await getDriverFromRequest(req);
    if (!driver) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "Dosya eksik" }, { status: 400 });

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    if (!["jpg", "jpeg", "png"].includes(ext)) {
      return NextResponse.json({ error: "Sadece JPG/PNG yüklenebilir" }, { status: 400 });
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Dosya 10 MB'dan büyük olamaz" }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const key = `fuel-receipts/${driver.id}_${Date.now()}.${ext}`;
    await uploadToStorage(key, buffer, "image/jpeg");

    const url = `/api/files/${key}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
