import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "drivers" | "vehicles"

  const wb = XLSX.utils.book_new();

  if (type === "drivers") {
    const headers = [
      ["Ad Soyad *", "Telefon", "Ehliyet No", "Ehliyet Sınıfı", "Ehliyet Son Geçerlilik", "SRC No", "SRC Son Geçerlilik", "Psikoteknik Son Geçerlilik", "Adli Sicil Geçerlilik", "Sağlık Raporu Geçerlilik", "Adres", "Notlar"],
      ["Ahmet Yılmaz", "05301234567", "A-123456", "D", "2027-06-30", "SRC-123456", "2028-03-15", "2028-03-15", "2026-12-31", "2026-09-01", "İzmir Merkez", "Örnek satır - silinebilir"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    ws["!cols"] = [
      { wch: 20 }, { wch: 15 }, { wch: 14 }, { wch: 12 },
      { wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 22 },
      { wch: 22 }, { wch: 22 }, { wch: 25 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Şöförler");
  } else if (type === "vehicles") {
    const headers = [
      ["Plaka *", "Marka", "Model", "Yıl", "Kapasite", "Muayene Son Geçerlilik", "Sigorta Son Geçerlilik", "Güzergah İzni Bitiş", "Uygunluk Belgesi Bitiş", "Notlar"],
      ["34 ABC 123", "Mercedes", "Sprinter", "2020", "14", "2025-12-31", "2025-08-15", "2025-09-01", "2025-09-01", "Örnek - silinebilir"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    ws["!cols"] = [
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 6 }, { wch: 10 },
      { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 22 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Araçlar");
  } else {
    return NextResponse.json({ error: "type=drivers veya type=vehicles gerekli" }, { status: 400 });
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = type === "drivers" ? "sofor-sablonu.xlsx" : "arac-sablonu.xlsx";

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
