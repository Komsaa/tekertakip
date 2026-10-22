export type GPS = { latitude: number; longitude: number; timestamp: string };
export type MatchStop = { id: string; name: string; lat: number | null; lng: number | null };
export type MatchRoute = { id: string; name: string; stops: MatchStop[]; path: [number, number][]; geometry: "road" | "stops"; missingCoordinates?: number };
export type MatchedTrip = {
  id: string; routeId: string | null; routeName: string; kind: "matched" | "ambiguous" | "outside";
  direction: "forward" | "reverse" | "unknown"; points: GPS[]; firstAt: string; lastAt: string;
  progress: number | null; coverage: number | null; etaMinutes: number | null;
  status: "live" | "finished" | "partial" | "unmatched"; confidence: "medium" | "low";
  stopVisits: { id: string; name: string; observedAt: string | null }[];
};
const radians = Math.PI / 180;
export function gpsDistance(a: [number, number], b: [number, number]) {
  const x = (b[1] - a[1]) * Math.cos((a[0] + b[0]) * radians / 2), y = b[0] - a[0];
  return Math.hypot(x, y) * 111195;
}
export function validCoordinates(lat: unknown, lng: unknown): boolean {
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}
function geometry(route: MatchRoute) {
  const lengths = [0];
  for (let i = 1; i < route.path.length; i++) lengths.push(lengths[i - 1] + gpsDistance(route.path[i - 1], route.path[i]));
  return { route, lengths, total: lengths.at(-1) ?? 0 };
}
function project(p: GPS, g: ReturnType<typeof geometry>) {
  let distance = Infinity, along = 0;
  const cos = Math.cos(p.latitude * radians);
  for (let i = 1; i < g.route.path.length; i++) {
    const a = g.route.path[i - 1], b = g.route.path[i];
    const ax = (a[1] - p.longitude) * cos * 111195, ay = (a[0] - p.latitude) * 111195;
    const dx = (b[1] - a[1]) * cos * 111195, dy = (b[0] - a[0]) * 111195;
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    const d = Math.hypot(ax + t * dx, ay + t * dy);
    if (d < distance) { distance = d; along = g.lengths[i - 1] + t * (g.lengths[i] - g.lengths[i - 1]); }
  }
  return { distance, fraction: g.total ? along / g.total : 0, g };
}

// This is deliberately an estimate. No persisted trip boundaries or attendance
// records are manufactured. Shared corridors remain ambiguous.
export function matchGpsTrips(input: GPS[], routes: MatchRoute[], now = Date.now()) {
  const geometries = routes.map(geometry).filter(g => g.route.path.length >= 2 && g.total >= 150);
  const clean: GPS[] = []; let rejected = 0;
  for (const p of [...input].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))) {
    const prior = clean.at(-1), dt = prior ? (Date.parse(p.timestamp) - Date.parse(prior.timestamp)) / 1000 : 0;
    if (!validCoordinates(p.latitude, p.longitude) || !Number.isFinite(Date.parse(p.timestamp)) || (prior && (dt <= 0 || gpsDistance([p.latitude, p.longitude], [prior.latitude, prior.longitude]) / dt > 45))) { rejected++; continue; }
    clean.push(p);
  }
  type Item = { p: GPS; candidate: ReturnType<typeof project> | null; kind: MatchedTrip["kind"] };
  const groups: Item[][] = [];
  for (const p of clean) {
    const candidates = geometries.map(g => project(p, g)).filter(c => c.distance <= (c.g.route.geometry === "road" ? 180 : 250)).sort((a, b) => a.distance - b.distance);
    const ambiguous = candidates.length > 1 && candidates[1].distance - candidates[0].distance < 75;
    const item: Item = { p, candidate: ambiguous ? null : candidates[0] ?? null, kind: ambiguous ? "ambiguous" : candidates.length ? "matched" : "outside" };
    const group = groups.at(-1), last = group?.at(-1);
    let split = !last || item.kind !== last.kind || item.candidate?.g.route.id !== last.candidate?.g.route.id || Date.parse(p.timestamp) - Date.parse(last.p.timestamp) > 10 * 60000;
    if (!split && group && item.candidate && last?.candidate) {
      const first = group[0].candidate!.fraction, current = item.candidate.fraction, previous = last.candidate.fraction;
      const delta = previous - first;
      // Turnarounds and a return to the origin start another candidate run.
      if ((delta > .15 && current < previous - .12) || (delta < -.15 && current > previous + .12)) split = true;
      if (Math.abs(current - previous) > .6) split = true;
    }
    if (split) groups.push([item]); else group!.push(item);
  }
  const trips: MatchedTrip[] = groups.map((items, index) => {
    const first = items[0], last = items.at(-1)!, route = first.candidate?.g.route;
    const points = items.map(x => x.p), firstAt = first.p.timestamp, lastAt = last.p.timestamp;
    const start = first.candidate?.fraction ?? 0, end = last.candidate?.fraction ?? 0, delta = end - start;
    const enough = items.length >= 3 && Math.abs(delta) * (first.candidate?.g.total ?? 0) >= 150 && Date.parse(lastAt) - Date.parse(firstAt) >= 30000;
    const direction = !enough ? "unknown" : delta >= 0 ? "forward" : "reverse";
    const progress = direction === "unknown" ? null : Math.round((direction === "forward" ? end : 1 - end) * 100);
    const coverage = enough ? Math.round(Math.abs(delta) * 100) : null;
    const fresh = now - Date.parse(lastAt) >= 0 && now - Date.parse(lastAt) <= 120000 && index === groups.length - 1;
    let etaMinutes: number | null = null;
    if (enough && fresh && progress! < 95 && route?.geometry === "road" && !route.missingCoordinates) {
      const recent = items.filter(x => Date.parse(lastAt) - Date.parse(x.p.timestamp) <= 5 * 60000);
      const seconds = (Date.parse(lastAt) - Date.parse(recent[0].p.timestamp)) / 1000;
      const travelled = Math.abs(end - recent[0].candidate!.fraction) * first.candidate!.g.total;
      const speed = travelled / seconds;
      if (recent.length >= 3 && seconds >= 60 && speed >= 1.4 && speed <= 28) {
        const minutes = first.candidate!.g.total * (1 - progress! / 100) / speed / 60;
        if (minutes <= 120) etaMinutes = Math.max(1, Math.round(minutes));
      }
    }
    return { id: `gps-${index}-${Date.parse(firstAt)}`, routeId: route?.id ?? null, routeName: route?.name ?? (first.kind === "ambiguous" ? "Birden fazla güzergâhla eşleşiyor" : "Güzergâh dışı / eşleşmeyen hareket"), kind: first.kind, direction, points, firstAt, lastAt, progress, coverage, etaMinutes,
      status: !enough ? (route ? "partial" : "unmatched") : progress! >= 95 && coverage! >= 75 && !route?.missingCoordinates ? "finished" : fresh ? "live" : "partial",
      confidence: enough && route?.geometry === "road" && !route.missingCoordinates ? "medium" : "low",
      stopVisits: (route?.stops ?? []).map(s => ({ id: s.id, name: s.name, observedAt: validCoordinates(s.lat, s.lng) ? points.find(p => gpsDistance([p.latitude, p.longitude], [s.lat!, s.lng!]) <= 150)?.timestamp ?? null : null })) };
  });
  return { trips, rejected, unmatchedPoints: trips.filter(t => t.kind !== "matched").reduce((n, t) => n + t.points.length, 0) };
}
