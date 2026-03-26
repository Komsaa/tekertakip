import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface ParsedStop {
  name: string;
  lat: number | null;
  lng: number | null;
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=tr`,
      {
        headers: {
          "User-Agent": "MertTur Fleet Management App",
          "Accept-Language": "tr",
        },
      }
    );
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

async function resolveUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "tr-TR,tr;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });
    return res.url;
  } catch {
    return url;
  }
}

function extractWaypoints(url: string): string[] {
  // /maps/dir/wp1/wp2/.../@lat,lng or /maps/dir/wp1/wp2.../data=...
  const dirMatch = url.match(/\/maps\/dir\/(.+?)(?:\/data=|$)/);
  if (!dirMatch) return [];

  const raw = dirMatch[1];
  // Son kısım @lat,lng,zoom ise çıkar
  const parts = raw.split("/").filter((p) => p && !p.startsWith("@"));

  return parts
    .map((p) => decodeURIComponent(p.replace(/\+/g, " ")).trim())
    .filter((p) => p.length > 0);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL gerekli" }, { status: 400 });

    // Kısa link ise uzun URL'e çevir
    const finalUrl = await resolveUrl(url);

    const waypoints = extractWaypoints(finalUrl);
    if (waypoints.length === 0) {
      return NextResponse.json(
        { error: "Güzergah bulunamadı. Google Maps'ten 'Yol Tarifi' linkini paylaştığınızdan emin olun." },
        { status: 400 }
      );
    }

    // Her durak için koordinat çıkar
    const stops: ParsedStop[] = await Promise.all(
      waypoints.map(async (wp, i) => {
        // Koordinat mı? (örn: "38.7139,27.9181")
        const coordMatch = wp.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
        if (coordMatch) {
          const lat = parseFloat(coordMatch[1]);
          const lng = parseFloat(coordMatch[2]);
          return { name: `Durak ${i + 1}`, lat, lng };
        }

        // Yer adı — geocode et
        const geo = await geocode(wp);
        return { name: wp, lat: geo?.lat ?? null, lng: geo?.lng ?? null };
      })
    );

    return NextResponse.json({ stops, finalUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
