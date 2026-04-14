import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToStorage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "Dosya eksik" }, { status: 400 });

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    if (!["jpg", "jpeg", "png"].includes(ext)) {
      return NextResponse.json({ error: "Sadece JPG/PNG yüklenebilir" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const key = `fuel/${Date.now()}.${ext}`;
    await uploadToStorage(key, buffer, "image/jpeg");

    return NextResponse.json({ url: `/api/files/${key}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
