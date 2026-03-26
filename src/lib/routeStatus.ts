export interface RouteStop {
  order: number;
  name: string;
  lat: number | null;
  lng: number | null;
  estimatedTime: string; // "07:30"
}

export interface LiveStatus {
  phase: "not_started" | "active" | "completed" | "weekend";
  currentStopIndex: number; // hangi durağa yakın
  progressPct: number; // 0-100 genel ilerleme
  estimatedLat: number | null;
  estimatedLng: number | null;
  label: string;
  nextStopName: string | null;
  nextStopTime: string | null;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function computeLiveStatus(
  stops: RouteStop[],
  weekdaysOnly: boolean
): LiveStatus {
  const dow = new Date().getDay();
  if (weekdaysOnly && (dow === 0 || dow === 6)) {
    return {
      phase: "weekend",
      currentStopIndex: 0,
      progressPct: 0,
      estimatedLat: stops[0]?.lat ?? null,
      estimatedLng: stops[0]?.lng ?? null,
      label: "Hafta sonu",
      nextStopName: null,
      nextStopTime: null,
    };
  }

  if (stops.length === 0) {
    return { phase: "not_started", currentStopIndex: 0, progressPct: 0, estimatedLat: null, estimatedLng: null, label: "Durak yok", nextStopName: null, nextStopTime: null };
  }

  const now = nowMinutes();
  const firstTime = timeToMinutes(stops[0].estimatedTime);
  const lastTime = timeToMinutes(stops[stops.length - 1].estimatedTime);

  if (now < firstTime - 5) {
    return {
      phase: "not_started",
      currentStopIndex: 0,
      progressPct: 0,
      estimatedLat: stops[0].lat ?? null,
      estimatedLng: stops[0].lng ?? null,
      label: `Başlamadı · İlk durak ${stops[0].estimatedTime}`,
      nextStopName: stops[0].name,
      nextStopTime: stops[0].estimatedTime,
    };
  }

  if (now > lastTime + 10) {
    return {
      phase: "completed",
      currentStopIndex: stops.length - 1,
      progressPct: 100,
      estimatedLat: stops[stops.length - 1].lat ?? null,
      estimatedLng: stops[stops.length - 1].lng ?? null,
      label: "Tamamlandı",
      nextStopName: null,
      nextStopTime: null,
    };
  }

  // Aktif — hangi segment üzerinde?
  let segIdx = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const t0 = timeToMinutes(stops[i].estimatedTime);
    const t1 = timeToMinutes(stops[i + 1].estimatedTime);
    if (now >= t0 && now <= t1) {
      segIdx = i;
      break;
    }
    if (now > t1) segIdx = i + 1;
  }

  const cur = stops[segIdx];
  const next = stops[segIdx + 1] ?? null;

  // Konum interpolasyonu
  let estimatedLat: number | null = cur.lat ?? null;
  let estimatedLng: number | null = cur.lng ?? null;

  if (next && cur.lat != null && cur.lng != null && next.lat != null && next.lng != null) {
    const t0 = timeToMinutes(cur.estimatedTime);
    const t1 = timeToMinutes(next.estimatedTime);
    const ratio = t1 > t0 ? Math.min(1, (now - t0) / (t1 - t0)) : 0;
    estimatedLat = cur.lat + (next.lat - cur.lat) * ratio;
    estimatedLng = cur.lng + (next.lng - cur.lng) * ratio;
  }

  const totalDuration = lastTime - firstTime || 1;
  const progressPct = Math.round(((now - firstTime) / totalDuration) * 100);

  const label = next
    ? `${cur.name} → ${next.name} (${next.estimatedTime})`
    : `Son durak: ${cur.name}`;

  return {
    phase: "active",
    currentStopIndex: segIdx,
    progressPct: Math.min(100, Math.max(0, progressPct)),
    estimatedLat,
    estimatedLng,
    label,
    nextStopName: next?.name ?? null,
    nextStopTime: next?.estimatedTime ?? null,
  };
}
