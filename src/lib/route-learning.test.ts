import { test } from "node:test";
import assert from "node:assert/strict";
import { inferRoutes, learningDay, type Trip } from "./route-learning";

function trip(day: number, reverse = false, vehicleId = "bus", offset = 0): Trip {
  const startedAt = new Date(`2026-10-${String(day).padStart(2, "0")}T${reverse ? "14" : "04"}:00:00Z`);
  const points = Array.from({ length: 241 }, (_, i) => {
    // 12-minute route with a two-minute passenger stop in the middle.
    let step = i < 90 ? i : i <= 130 ? 90 : i - 40;
    if (reverse) step = 200 - step;
    return { latitude: 38 + step * 0.00005 + offset, longitude: 27, accuracy: 8, timestamp: new Date(+startedAt + i * 3000) };
  });
  return { id: `trip-${day}-${reverse}-${vehicleId}`, vehicleId, startedAt, points };
}
test("requires five distinct service days, not five trips", () => {
  assert.equal(inferRoutes([1, 2, 3, 4].map(d => trip(d))).length, 0);
  assert.equal(inferRoutes(Array.from({ length: 6 }, () => trip(1))).length, 0);
});
test("five days produce endpoints, repeated candidate and recorded path", () => {
  const result = inferRoutes([1, 2, 3, 4, 5].map(d => trip(d)));
  assert.equal(result.length, 1); assert.equal(result[0].stops.length, 3);
  assert.equal(result[0].stops[0].estimatedTime, "07:00");
  assert.equal(result[0].days, 5); assert.ok(result[0].path.length > 2);
});
test("opposite directions and different vehicles are never combined", () => {
  const trips = [1, 2, 3, 4, 5].flatMap(d => [trip(d), trip(d, true), trip(d, false, "other")]);
  assert.equal(inferRoutes(trips).length, 3);
});
test("a single detour is excluded from the repeated route", () => {
  const result = inferRoutes([... [1, 2, 3, 4, 5].map(d => trip(d)), trip(6, false, "bus", 0.02)]);
  assert.equal(result.length, 1); assert.equal(result[0].days, 5);
});
test("GPS gaps and low accuracy do not invent a stopped vehicle", () => {
  const trips = [1, 2, 3, 4, 5].map(d => trip(d));
  trips[4].points = trips[4].points.filter((_, i) => i < 30 || i > 100);
  assert.equal(inferRoutes(trips).length, 0);
  const poor = [1, 2, 3, 4, 5].map(d => ({ ...trip(d), points: trip(d).points.map(p => ({ ...p, accuracy: 100 })) }));
  assert.equal(inferRoutes(poor).length, 0);
});
test("short traffic waits do not become stops", () => {
  const trips = [1, 2, 3, 4, 5].map(d => {
    const t = trip(d); t.points = t.points.filter((_, i) => i < 100 || i > 125).map((p, i) => ({ ...p, timestamp: new Date(+t.startedAt + i * 3000) })); return t;
  });
  assert.equal(inferRoutes(trips)[0].stops.length, 2);
});
test("service days follow Turkey midnight", () => {
  assert.equal(learningDay(new Date("2026-10-01T22:00:00Z")), "2026-10-02");
});
