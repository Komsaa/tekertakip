import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const filename = `fuel_${Date.now()}.${ext}`;
    const dir = path.join(process.cwd(), "uploads", "fuel");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);

    return NextResponse.json({ url: `/api/files/fuel/${filename}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
