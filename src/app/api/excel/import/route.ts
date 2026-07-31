import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCompanyId, tenantData } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  // Excel serial number
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  // String "YYYY-MM-DD" veya "DD.MM.YYYY"
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s);
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) {
    const [d, m, y] = s.split(".");
    return new Date(`${y}-${m}-${d}`);
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer", cellDates: false });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    if (rows.length === 0) return NextResponse.json({ error: "Dosya boş" }, { status: 400 });

    if (type === "drivers") {
      const created: string[] = [];
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = String(row["Ad Soyad *"] || row["Ad Soyad"] || "").trim();
        if (!name) { errors.push(`Satır ${i + 2}: Ad Soyad boş — atlandı`); continue; }

        try {
          await prisma.driver.create({
            data: {
              name,
              phone: String(row["Telefon"] || "").trim() || null,
              licenseNumber: String(row["Ehliyet No"] || "").trim() || null,
              licenseClass: String(row["Ehliyet Sınıfı"] || "").trim() || null,
              licenseExpiry: parseDate(row["Ehliyet Son Geçerlilik"]),
              srcNumber: String(row["SRC No"] || "").trim() || null,
              srcExpiry: parseDate(row["SRC Son Geçerlilik"]),
              psychotechExpiry: parseDate(row["Psikoteknik Son Geçerlilik"]),
              criminalRecordExpiry: parseDate(row["Adli Sicil Geçerlilik"]),
              healthReportExpiry: parseDate(row["Sağlık Raporu Geçerlilik"]),
              address: String(row["Adres"] || "").trim() || null,
              notes: String(row["Notlar"] || "").trim() || null,
              status: "active",
              ...tenantData(companyId),
            },
          });
          created.push(name);
        } catch (e) {
          errors.push(`Satır ${i + 2} (${name}): ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      return NextResponse.json({ type: "drivers", created: created.length, errors });
    }

    if (type === "vehicles") {
      const created: string[] = [];
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const plate = String(row["Plaka *"] || row["Plaka"] || "").trim().toUpperCase();
        if (!plate) { errors.push(`Satır ${i + 2}: Plaka boş — atlandı`); continue; }

        try {
          await prisma.vehicle.create({
            data: {
              plate,
              brand: String(row["Marka"] || "").trim() || null,
              model: String(row["Model"] || "").trim() || null,
              year: row["Yıl"] ? parseInt(String(row["Yıl"])) || null : null,
              capacity: row["Kapasite"] ? parseInt(String(row["Kapasite"])) || null : null,
              inspectionExpiry: parseDate(row["Muayene Son Geçerlilik"]),
              insuranceExpiry: parseDate(row["Sigorta Son Geçerlilik"]),
              routePermitExpiry: parseDate(row["Güzergah İzni Bitiş"]),
              approvalExpiry: parseDate(row["Uygunluk Belgesi Bitiş"]),
              notes: String(row["Notlar"] || "").trim() || null,
              status: "active",
              ...tenantData(companyId),
            },
          });
          created.push(plate);
        } catch (e) {
          errors.push(`Satır ${i + 2} (${plate}): ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      return NextResponse.json({ type: "vehicles", created: created.length, errors });
    }

    return NextResponse.json({ error: "type=drivers veya type=vehicles gerekli" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
