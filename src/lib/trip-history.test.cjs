const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, modules = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports, require: n => { if (!(n in modules)) throw new Error(n); return modules[n]; }, Date, Map, console });
  return exports;
}
const { historyDay } = load(__dirname + '/trip-history.ts');
test('Turkey midnight is inclusive; next midnight exclusive', () => {
  const r = historyDay('2026-10-21');
  assert.equal(r.gte.toISOString(), '2026-10-20T21:00:00.000Z');
  assert.equal(r.lt.toISOString(), '2026-10-21T21:00:00.000Z');
});
test('invalid calendar dates rejected, leap day accepted', () => {
  for (const d of ['2026-02-29', '2026-04-31', '2026-13-01', '21.10.2026', '', '2016-01-01']) assert.equal(historyDay(d), null);
  assert.ok(historyDay('2024-02-29'));
});
function setup({ manager = { role: 'firma', companyId: 'a' }, foreign = false, points = [], records = [], fail = false } = {}) {
  const calls = [];
  const prisma = {
    driver: {
      findFirst: async q => { calls.push(q); assert.equal(q.where.companyId, 'a'); return foreign ? null : { id: 'd', name: 'Test' }; },
      findMany: async q => { calls.push(q); assert.equal(q.where.companyId, 'a'); return []; },
    },
    route: { findMany: async q => { assert.equal(q.where.companyId, 'a'); return [{ id: 'r', name: 'Route' }]; } },
    driverLocationHistory: { findMany: async q => { calls.push(q); assert.equal(q.where.driver.companyId, 'a'); assert.equal(q.where.driverId, 'd'); assert.equal(q.where.timestamp.gte.toISOString(), '2026-10-20T21:00:00.000Z'); if (fail) throw new Error('secret database error'); return points; } },
    tripAttendance: { findMany: async q => { calls.push(q); assert.equal(q.where.passenger.stop.route.companyId, 'a'); assert.equal(q.where.routeId.in.join(','), 'r'); assert.equal(q.where.date, '2026-10-21'); assert.equal(q.where.driverId, 'd'); return records; } },
  };
  const { GET } = load(__dirname + '/../app/api/mobile/manager/trip-history/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } },
    '@/lib/manager-access': { getActiveManager: async () => manager }, '@/lib/prisma': { prisma }, '@/lib/trip-history': { historyDay },
  });
  return { calls, get: (query = '?driverId=d&date=2026-10-21', token = 'Bearer test') => GET({ headers: { get: () => token }, nextUrl: new URL('https://local/' + query) }) };
}
test('anonymous and driver tokens rejected without data queries', async () => {
  for (const token of [null, 'Basic test', 'Bearer invalid']) { const s = setup({ manager: null }); assert.equal((await s.get(undefined, token)).status, 401); assert.equal(s.calls.length, 0); }
});
test('wrong role and tenantless admins fail closed', async () => {
  for (const manager of [{ role: 'driver', companyId: 'a' }, { role: 'admin', companyId: null }]) { const s = setup({ manager }); assert.equal((await s.get()).status, 403); assert.equal(s.calls.length, 0); }
});
test('foreign driver does not trigger GPS or pupil queries', async () => { const s = setup({ foreign: true }); assert.equal((await s.get()).status, 404); assert.equal(s.calls.length, 1); });
test('invalid date rejected before data access', async () => { const s = setup(); assert.equal((await s.get('?driverId=d&date=2026-02-30')).status, 400); assert.equal(s.calls.length, 0); });
test('empty day returns explicit empty arrays, no synthetic events', async () => { const r = await setup().get(); assert.equal(r.status, 200); assert.equal(r.body.points.length, 0); assert.equal(r.body.attendances.length, 0); assert.equal(r.headers['Cache-Control'], 'private, no-store'); });
test('driver picker is tenant scoped', async () => { assert.equal((await setup().get('')).status, 200); });
test('attendance without GPS preserves creation time and hides moved stop', async () => {
  const createdAt = new Date('2026-10-21T04:00:00Z');
  const record = { id: '1', routeId: 'r', createdAt, status: 'absent', passenger: { name: 'Test pupil', stop: { name: 'New stop', routeId: 'other' } } };
  const r = await setup({ records: [record] }).get();
  assert.equal(r.body.attendances[0].createdAt, createdAt); assert.equal(r.body.attendances[0].stopName, null); assert.equal(r.body.points.length, 0);
});
test('bad GPS points removed and truncation disclosed', async () => {
  const points = Array.from({ length: 5001 }, () => ({ latitude: 38, longitude: 27, timestamp: new Date() })); points[0].latitude = 100;
  const r = await setup({ points }).get(); assert.equal(r.body.truncated, true); assert.equal(r.body.points.length, 4999); assert.equal(r.body.invalidPointCount, 1);
});
test('database errors do not expose internals', async () => { const r = await setup({ fail: true }).get(); assert.equal(r.status, 500); assert.ok(!JSON.stringify(r.body).includes('secret')); });
