export type MapPoint = { lat: number | null; lng: number | null };

export function validPoint(point: MapPoint): point is { lat: number; lng: number } {
  return typeof point.lat === "number" && Number.isFinite(point.lat) && Math.abs(point.lat) <= 90
    && typeof point.lng === "number" && Number.isFinite(point.lng) && Math.abs(point.lng) <= 180;
}

// Only stop coordinates are sent here; never the viewer's own location.
export async function roadRoute(points: MapPoint[], signal?: AbortSignal): Promise<[number, number][]> {
  const stops = points.filter(validPoint);
  if (stops.length < 2) return [];
  const coords = stops.map(p => `${p.lng},${p.lat}`).join(";");
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`, { signal });
  if (!response.ok) throw new Error("Yol hesaplanamadı");
  const data = await response.json();
  const line: unknown = data.routes?.[0]?.geometry?.coordinates;
  if (data.code !== "Ok" || !Array.isArray(line) || line.length < 2) throw new Error("Yol bulunamadı");
  return line.map((p: unknown) => {
    if (!Array.isArray(p) || !validPoint({ lat: p[1], lng: p[0] })) throw new Error("Geçersiz yol");
    return [p[1], p[0]] as [number, number];
  });
}
