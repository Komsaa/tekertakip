export const dynamic = "force-dynamic";

// POST /api/invoices/parse-pdf  (multipart form: file=PDF)
// PDF/görüntüyü MinIO'ya yükler, URL döndürür
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToStorage } from "@/lib/storage";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      return NextResponse.json({ error: "Sadece PDF veya resim dosyası desteklenir" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() ?? (isPdf ? "pdf" : "jpg");
    const key = `invoices/pdf/${randomUUID()}.${ext}`;
    await uploadToStorage(key, buffer, file.type);
    const pdfUrl = `/api/files/${key}`;

    return NextResponse.json({ pdfUrl });
  } catch (e) {
    console.error("PDF yükleme hatası:", e);
    return NextResponse.json({ error: "Yükleme başarısız" }, { status: 500 });
  }
}
