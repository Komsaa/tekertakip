import { test } from "node:test";
import assert from "node:assert/strict";
import { matchGpsTrips, type GPS, type MatchRoute } from "./gps-trip-matching";
const start = Date.parse("2026-10-22T04:00:00Z");
const route: MatchRoute = { id: "school", name: "Anadolu Lisesi", geometry: "road", path: [[38.9,27.8],[38.92,27.8]], stops: [{ id:"a",name:"Evler",lat:38.9,lng:27.8 },{ id:"b",name:"Okul",lat:38.92,lng:27.8 }] };
const point = (fraction: number, minute: number, longitude = 27.8): GPS => ({ latitude:38.9 + .02*fraction,longitude,timestamp:new Date(start+minute*60000).toISOString() });
test("school trace excludes later extra work outside route", () => {
  const r = matchGpsTrips([point(0,0),point(.3,2),point(.6,4),point(1,6),point(1.4,8),point(2,10)], [route], start+3600000);
  assert.equal(r.trips.length,2); assert.equal(r.trips[0].routeId,"school"); assert.equal(r.trips[0].points.length,4); assert.equal(r.trips[1].kind,"outside"); assert.equal(r.trips[0].status,"finished");
});
test("same route repeated 14 times remains separate", () => {
  const points = Array.from({length:14},(_,i)=>[point(0,i*30),point(.3,i*30+2),point(.6,i*30+4),point(1,i*30+6)]).flat();
  assert.equal(matchGpsTrips(points,[route],start+86400000).trips.filter(t=>t.routeId).length,14);
});
test("reverse direction is a separate run", () => {
  const r=matchGpsTrips([point(0,0),point(.3,2),point(.6,4),point(1,6),point(.8,8),point(.4,10),point(0,12)],[route],start+86400000);
  assert.equal(r.trips.length,2); assert.equal(r.trips[0].direction,"forward"); assert.equal(r.trips[1].direction,"reverse");
});
test("shared route geometry is ambiguous, not arbitrarily assigned",()=>{
  const r=matchGpsTrips([point(0,0),point(.3,2),point(.6,4)],[route,{...route,id:"other",name:"Başka okul"}],start+4*60000);
  assert.ok(r.trips.every(t=>t.kind==="ambiguous"&&t.routeId===null&&t.etaMinutes===null));
});
test("fresh moving road match gets ETA; stale data never does",()=>{
  const points=[point(0,0),point(.2,2),point(.4,4)];
  assert.ok(matchGpsTrips(points,[route],start+4*60000).trips[0].etaMinutes!>0);
  assert.equal(matchGpsTrips(points,[route],start+10*60000).trips[0].etaMinutes,null);
});
test("stationary, single point and fallback stop geometry have no ETA",()=>{
  for(const points of [[point(.3,0)],[point(.3,0),point(.3,2),point(.3,4)]]) assert.equal(matchGpsTrips(points,[route],start+4*60000).trips[0].etaMinutes,null);
  assert.equal(matchGpsTrips([point(0,0),point(.2,2),point(.4,4)],[{...route,geometry:"stops"}],start+4*60000).trips[0].etaMinutes,null);
});
test("missing route coordinates and empty GPS are explicit",()=>{
  assert.equal(matchGpsTrips([], [route]).trips.length,0);
  assert.equal(matchGpsTrips([point(.2,0)],[{...route,path:[]}]).trips[0].kind,"outside");
});
test("progress is not observed coverage when recording starts late",()=>{
  const t=matchGpsTrips([point(.7,0),point(.8,2),point(1,4)],[route],start+3600000).trips[0];
  assert.equal(t.progress,100); assert.equal(t.coverage,30); assert.equal(t.status,"partial");
});
test("GPS jumps and duplicate timestamps rejected",()=>{
  const r=matchGpsTrips([point(0,0),point(.2,0),point(100,1),point(.3,2)],[route]);
  assert.equal(r.rejected,2); assert.equal(r.trips.flatMap(t=>t.points).length,2);
});
test("large GPS gap separates partial evidence",()=>{
  const r=matchGpsTrips([point(0,0),point(.2,2),point(.6,20),point(.8,22)],[route]);
  assert.equal(r.trips.length,2); assert.ok(r.trips.every(t=>t.status==="partial"));
});
test("missing final stop coordinates suppress ETA even with road geometry",()=>{
  const t=matchGpsTrips([point(0,0),point(.2,2),point(.4,4)],[{...route,missingCoordinates:1}],start+4*60000).trips[0];
  assert.equal(t.etaMinutes,null); assert.equal(t.confidence,"low");
  const end=matchGpsTrips([point(0,0),point(.5,2),point(1,4)],[{...route,missingCoordinates:1}],start+3600000).trips[0];
  assert.equal(end.status,"partial");
});
