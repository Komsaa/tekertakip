export const dynamic = "force-dynamic";

// POST /api/invoices/parse-pdf  (multipart form: file=PDF)
// PDF'i MinIO'ya yükler, e-fatura text'ini parse eder
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToStorage } from "@/lib/storage";
import { randomUUID } from "crypto";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require("pdf-parse");

// Türkçe sayı formatı: 70.875,00 → 70875.00
function parseTRNumber(s: string): number {
  return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
}

// DD-MM-YYYY veya DD.MM.YYYY → YYYY-MM-DD
function parseTRDate(s: string): string | null {
  const m = s.match(/(\d{2})[-.](\d{2})[-.](\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function parseEFaturaText(text: string) {
  const r: Record<string, string | number | null> = {};

  // Fatura No
  const invoiceNoM = text.match(/Fatura No[:：]\s*([A-Z0-9]+)/);
  if (invoiceNoM) r.invoiceNo = invoiceNoM[1].trim();

  // Fatura Tarihi (issueDate)
  const issueDateM = text.match(/Fatura Tarihi[:：]\s*(\d{2}[-.]?\d{2}[-.]?\d{4})/);
  if (issueDateM) r.issueDate = parseTRDate(issueDateM[1]);

  // Düzenleme Tarihi fallback
  if (!r.issueDate) {
    const m = text.match(/Düzenleme Tarihi[:：]\s*(\d{2}[-.]?\d{2}[-.]?\d{4})/);
    if (m) r.issueDate = parseTRDate(m[1]);
  }

  // Son Ödeme Tarihi (dueDate)
  const dueDateM = text.match(/Son Ödeme Tarihi\s*(\d{2}[-.]?\d{2}[-.]?\d{4})/);
  if (dueDateM) r.dueDate = parseTRDate(dueDateM[1]);
  if (!r.dueDate) r.dueDate = r.issueDate ?? null;

  // Müşteri adı (SAYIN bloğundan)
  const clientM = text.match(/SAYIN\s*[\r\n]+(.+)/);
  if (clientM) r.clientName = clientM[1].trim();

  // Sefer/Adet sayısı ve birim fiyat: "45Adet 1.575TL" veya "45 Adet 1.575 TL"
  const tripM = text.match(/(\d+)\s*Adet\s+([\d.,]+)\s*TL/);
  if (tripM) {
    r.tripCount = parseInt(tripM[1]);
    r.unitPrice = parseTRNumber(tripM[2]);
  }

  // KDV Oranı: "Hesaplanan KDV(%20)"
  const kdvRateM = text.match(/Hesaplanan KDV\(%(\d+)\)/);
  if (kdvRateM) r.kdvRate = parseInt(kdvRateM[1]);

  // Tevkifat Oranı: "KDV TEVKİFAT (%50,00)" veya "Hesaplanan KDV Tevkifat(%50)"
  const tevkifatRateM = text.match(/KDV TEVKİFAT\s*\(%(\d+)/i) ||
                        text.match(/KDV Tevkifat\(%(\d+)/i);
  if (tevkifatRateM) r.tevkifatRate = parseInt(tevkifatRateM[1]);

  // Mal Hizmet Toplam Tutarı (subtotal)
  const subtotalM = text.match(/Mal Hizmet Toplam Tutarı\s*([\d.,]+)\s*TL/);
  if (subtotalM) r.subtotal = parseTRNumber(subtotalM[1]);

  // KDV Tutarı (kdvAmount) — "Hesaplanan KDV(%20)14.175,00"
  const kdvAmtM = text.match(/Hesaplanan KDV\(%\d+\)\s*([\d.,]+)\s*TL/);
  if (kdvAmtM) r.kdvAmount = parseTRNumber(kdvAmtM[1]);

  // Tevkifat Tutarı — "Hesaplanan KDV Tevkifat(%50)7.087,50"
  const tevkifatAmtM = text.match(/Hesaplanan KDV Tevkifat\(%\d+\)\s*([\d.,]+)\s*TL/);
  if (tevkifatAmtM) r.tevkifatAmount = parseTRNumber(tevkifatAmtM[1]);

  // Toplam Tutar — "Vergiler Dahil Toplam Tutar85.050,00"
  const totalM = text.match(/Vergiler Dahil Toplam Tutar\s*([\d.,]+)\s*TL/);
  if (totalM) r.totalAmount = parseTRNumber(totalM[1]);

  // Ödenecek Tutar
  const payableM = text.match(/Ödenecek Tutar\s*([\d.,]+)\s*TL/);
  if (payableM) r.payableAmount = parseTRNumber(payableM[1]);

  // Dönem: fatura tarihinin ilk/son günü (PDF'de yazılmıyor genellikle)
  if (r.issueDate) {
    const [y, mo] = (r.issueDate as string).split("-").map(Number);
    r.periodStart = `${y}-${String(mo).padStart(2, "0")}-01`;
    const lastDay = new Date(y, mo, 0).getDate();
    r.periodEnd = `${y}-${String(mo).padStart(2, "0")}-${lastDay}`;
  }

  return r;
}

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

    // PDF'den text çıkar ve parse et
    if (isPdf) {
      try {
        const data = await pdfParse(buffer);
        const parsed = parseEFaturaText(data.text);
        return NextResponse.json({ pdfUrl, parsed });
      } catch {
        // Parse başarısız olsa bile pdfUrl döndür
        return NextResponse.json({ pdfUrl, parsed: null });
      }
    }

    return NextResponse.json({ pdfUrl, parsed: null });
  } catch (e) {
    console.error("PDF yükleme hatası:", e);
    return NextResponse.json({ error: "Yükleme başarısız" }, { status: 500 });
  }
}
