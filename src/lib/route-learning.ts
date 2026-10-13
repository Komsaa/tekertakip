export type Point = { latitude: number; longitude: number; timestamp: Date; accuracy?: number | null };
export type Trip = { id: string; vehicleId: string; startedAt: Date; points: Point[] };
const DAY = 86400000;
export const learningDay = (date: Date) => new Date(date.getTime() + 3 * 3600000).toISOString().slice(0, 10);
const minute = (date: Date) => { const d = new Date(date.getTime() + 3 * 3600000); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
export function meters(a: Point, b: Point) {
  const r = Math.PI / 180, dLat = (b.latitude - a.latitude) * r, dLng = (b.longitude - a.longitude) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
function clean(points: Point[]) {
  const result: Point[] = [];
  for (const p of [...points].sort((a, b) => +a.timestamp - +b.timestamp)) {
    if (!Number.isFinite(p.latitude) || !Number.isFinite(p.longitude) || Math.abs(p.latitude) > 90 || Math.abs(p.longitude) > 180 || (p.accuracy != null && p.accuracy > 50)) continue;
    const prev = result.at(-1), dt = prev ? (+p.timestamp - +prev.timestamp) / 1000 : 0;
    if (prev && (dt <= 0 || meters(prev, p) / dt > 55)) continue;
    result.push(p);
  }
  return result;
}
function pauses(points: Point[]) {
  const stops: Point[] = [];
  for (let i = 0; i < points.length;) {
    let j = i + 1;
    while (j < points.length && meters(points[i], points[j]) <= 40 && +points[j].timestamp - +points[j - 1].timestamp <= 60000) j++;
    if (+points[j - 1].timestamp - +points[i].timestamp >= 90000) stops.push(points[i]);
    i = j;
  }
  return stops;
}
function sample(points: Point[], count = 120) {
  return points.filter((_, i) => i % Math.max(1, Math.ceil(points.length / count)) === 0 || i === points.length - 1);
}
function samePath(a: Point[], b: Point[]) {
  const x = sample(a, 60), y = sample(b, 120);
  return x.filter(p => y.some(q => meters(p, q) < 250)).length / x.length >= 0.75;
}
export function inferRoutes(input: Trip[]) {
  const trips = input.map(t => ({ ...t, points: clean(t.points) })).filter(t =>
    t.points.length >= 30 && +t.points.at(-1)!.timestamp - +t.points[0].timestamp >= 300000 &&
    t.points.slice(1).reduce((d, p, i) => d + meters(t.points[i], p), 0) >= 500 &&
    !t.points.slice(1).some((p, i) => +p.timestamp - +t.points[i].timestamp > 120000)
  ).sort((a, b) => +a.startedAt - +b.startedAt);
  const groups: typeof trips[] = [];
  for (const t of trips) {
    const group = groups.find(g => {
      const a = g[0], delta = Math.abs(minute(a.startedAt) - minute(t.startedAt));
      return a.vehicleId === t.vehicleId && Math.min(delta, 1440 - delta) <= 90 &&
        meters(a.points[0], t.points[0]) < 250 && meters(a.points.at(-1)!, t.points.at(-1)!) < 250 &&
        samePath(a.points, t.points) && samePath(t.points, a.points);
    });
    if (group) group.push(t); else groups.push([t]);
  }
  return groups.flatMap(group => {
    const days = new Set(group.map(t => learningDay(t.startedAt))).size;
    if (days < 5) return [];
    const representative = [...group].sort((a, b) => a.points.length - b.points.length)[Math.floor(group.length / 2)];
    const candidates = pauses(representative.points).filter(p => {
      const matchingDays = new Set(group.filter(t => pauses(t.points).some(q => meters(p, q) < 60)).map(t => learningDay(t.startedAt)));
      return matchingDays.size >= Math.max(3, Math.ceil(days * 0.6));
    });
    const first = representative.points[0], last = representative.points.at(-1)!;
    const selected = [first, ...candidates.filter(p => meters(first, p) > 80 && meters(last, p) > 80), last];
    const stops = selected.map((p, i) => {
      const times = group.map(t => {
        const q = t.points.reduce((best, q) => meters(q, p) < meters(best, p) ? q : best, t.points[0]);
        return (+q.timestamp - +t.points[0].timestamp) / 60000;
      }).sort((a, b) => a - b);
      const starts = group.map(t => minute(t.points[0].timestamp)).sort((a,b) => a-b);
      const m = Math.round(starts[Math.floor(starts.length / 2)] + times[Math.floor(times.length / 2)]) % 1440;
      return { name: i === 0 ? "Başlangıç" : i === selected.length - 1 ? "Bitiş" : `Olası durak ${i}`, lat: p.latitude, lng: p.longitude,
        timestamp: p.timestamp.toISOString(), estimatedTime: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}` };
    });
    return [{ key: group[0].id, days, vehicleId: representative.vehicleId, stops,
      path: sample(representative.points, 1500).map(p => [p.latitude, p.longitude]),
      name: `Öğrenilen güzergâh ${stops[0].estimatedTime}` }];
  });
}
export const LEARNING_WEEK_MS = 7 * DAY;
