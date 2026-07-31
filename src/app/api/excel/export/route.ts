import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCompanyId, tenantWhere } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

function fmt(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("tr-TR");
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  const tw = tenantWhere(companyId);

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const wb = XLSX.utils.book_new();

  if (type === "drivers") {
    const drivers = await prisma.driver.findMany({
      where: tw,
      orderBy: { name: "asc" },
    });

    const rows = drivers.map((d) => ({
      "Ad Soyad": d.name,
      "Telefon": d.phone ?? "",
      "TC Kimlik No": d.tcNo ?? "",
      "Ehliyet Sınıfı": d.licenseClass ?? "",
      "Ehliyet Son Geçerlilik": fmt(d.licenseExpiry),
      "Doğum Tarihi": fmt(d.birthDate),
      "Adres": d.address ?? "",
      "Durum": d.status === "active" ? "Aktif" : "Pasif",
      "Notlar": d.notes ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 22 }, { wch: 15 }, { wch: 25 }, { wch: 8 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Şöförler");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="soforler.xlsx"`,
      },
    });
  }

  if (type === "vehicles") {
    const vehicles = await prisma.vehicle.findMany({
      where: tw,
      orderBy: { plate: "asc" },
    });

    const rows = vehicles.map((v) => ({
      "Plaka": v.plate,
      "Marka": v.brand ?? "",
      "Model": v.model ?? "",
      "Yıl": v.year ?? "",
      "Kapasite": v.capacity ?? "",
      "Yakıt Tipi": v.fuelType ?? "",
      "Muayene Son Geçerlilik": fmt(v.inspectionExpiry),
      "Sigorta Son Geçerlilik": fmt(v.insuranceExpiry),
      "Güzergah İzni Bitiş": fmt(v.routePermitExpiry),
      "Uygunluk Belgesi Bitiş": fmt(v.approvalExpiry),
      "Durum": v.status === "active" ? "Aktif" : "Pasif",
      "Notlar": v.notes ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 6 }, { wch: 10 }, { wch: 10 },
      { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 22 }, { wch: 8 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Araçlar");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="araclar.xlsx"`,
      },
    });
  }

  return NextResponse.json({ error: "type=drivers veya type=vehicles gerekli" }, { status: 400 });
}
