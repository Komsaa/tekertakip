import { MatchRoute, MatchStop, validCoordinates } from "./gps-trip-matching";
const cache = new Map<string, { until: number; path: [number, number][]; road: boolean }>();

// Reuse the existing OSRM provider. Only configured stop coordinates leave the
// server; GPS traces, driver identities and pupil information are never sent.
export async function historyRouteShape(route: { id: string; name: string; stops: MatchStop[] }): Promise<MatchRoute> {
  const coords = route.stops.filter(s => validCoordinates(s.lat, s.lng)).map(s => [s.lat!, s.lng!] as [number, number]);
  const key = JSON.stringify(coords), saved = cache.get(key);
  const missingCoordinates = route.stops.length - coords.length;
  if (saved && saved.until > Date.now()) return { ...route, missingCoordinates, path: saved.path, geometry: saved.road ? "road" : "stops" };
  let path = coords, road = false;
  // Missing intermediate coordinates make an exact shape unprovable.
  if (coords.length >= 2 && coords.length <= 80) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${coords.map(p => `${p[1]},${p[0]}`).join(";")}?overview=simplified&geometries=geojson`;
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!response.ok) throw new Error("route unavailable");
      const data = await response.json();
      const line = data.routes?.[0]?.geometry?.coordinates;
      if (data.code === "Ok" && Array.isArray(line) && line.length >= 2 && line.length <= 2000 && line.every(p => Array.isArray(p) && validCoordinates(p[1], p[0]))) { path = line.map(p => [p[1], p[0]]); road = true; }
    } catch { /* Fall back explicitly to stop geometry, without ETA. */ }
  }
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  cache.set(key, { path, road, until: Date.now() + (road ? 86400000 : 60000) });
  return { ...route, missingCoordinates, path, geometry: road ? "road" : "stops" };
}
