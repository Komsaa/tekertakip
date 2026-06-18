export const dynamic = "force-dynamic";

// POST /api/invoices/parse-pdf  (multipart form: file=PDF)
// PDF'i MinIO'ya yükler, Gemini ile fatura verilerini çıkarır
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { uploadToStorage } from "@/lib/storage";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Gemini API anahtarı eksik" }, { status: 500 });

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

    // Gemini ile içerik çıkar
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const base64 = buffer.toString("base64");
    const mimeType = file.type as string;

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      `Bu bir fatura belgesi. Türkçe veya İngilizce olabilir. Belgedeki bilgileri çıkar ve SADECE aşağıdaki JSON formatında döndür, başka hiçbir şey yazma:
{
  "invoiceNo": "fatura numarası veya null",
  "clientName": "müşteri/firma adı veya null",
  "issueDate": "YYYY-MM-DD veya null",
  "dueDate": "YYYY-MM-DD veya null",
  "periodStart": "YYYY-MM-DD veya null",
  "periodEnd": "YYYY-MM-DD veya null",
  "tripCount": sayı veya null,
  "unitPrice": sayı veya null,
  "subtotal": sayı veya null,
  "kdvRate": sayı veya null,
  "kdvAmount": sayı veya null,
  "tevkifatRate": sayı veya null,
  "tevkifatAmount": sayı veya null,
  "totalAmount": sayı veya null,
  "payableAmount": sayı veya null,
  "notes": "açıklama/not veya null"
}
Önemli notlar:
- tripCount: sefer sayısı, gün sayısı veya miktar (kalem adedi)
- unitPrice: birim fiyat (sefer başına veya günlük)
- Türk para birimi için nokta binlik ayraç, virgül ondalık (3.400,50 → 3400.50)
- Tarihler DD.MM.YYYY formatından YYYY-MM-DD'ye çevir
- tevkifat yoksa tevkifatRate: 0, tevkifatAmount: 0
- Emin olmadığına null yaz`,
    ]);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ pdfUrl, parsed: null, error: "Fatura verisi okunamadı" });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ pdfUrl, parsed });
  } catch (e) {
    console.error("PDF parse hatası:", e);
    return NextResponse.json({ pdfUrl: null, parsed: null, error: "İşlem başarısız" }, { status: 500 });
  }
}
