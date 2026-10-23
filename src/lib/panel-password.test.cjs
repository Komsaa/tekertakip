const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const bcrypt = require('bcryptjs');
const json = (body, options = {}) => ({ body, status: options.status || 200 });
function load(file, modules) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText,
    { exports, Buffer, console, require: name => { if (!(name in modules)) throw Error(name); return modules[name]; } });
  return exports;
}
const tenant = load(__dirname + '/tenant.ts', { 'next/server': { NextResponse: { json } } });
function setup(session = { user: { role: 'admin', companyId: null } }) {
  const calls = [];
  const api = load(__dirname + '/../app/api/admin/panel-users/route.ts', {
    'next/server': { NextResponse: { json } }, 'next-auth': { getServerSession: async () => session },
    '@/lib/auth': { authOptions: {} }, '@/lib/tenant': tenant, bcryptjs: bcrypt,
    '@/lib/prisma': { prisma: { panelUser: {
      update: async q => { calls.push(q); return { id: q.where.id, username: 'test' }; },
      findMany: async q => { calls.push(q); return []; },
      create: async q => { calls.push(q); return { id: 'test' }; },
    } } },
  });
  return { ...api, calls, put: body => api.PUT({ json: async () => body }) };
}
for (const session of [null, { user: { role: 'firma', companyId: 'a' } }, { user: { role: 'admin', companyId: 'a' } }]) {
  test('password management rejects unauthorized session ' + JSON.stringify(session), async () => {
    const api = setup(session);
    assert.equal((await api.put({ id: 'test', password: 'TestOnly-123' })).status, session ? 403 : 401);
    assert.equal((await api.GET()).status, session ? 403 : 401);
    assert.equal(api.calls.length, 0);
  });
}
test('password reset writes only a bcrypt hash and returns no secret', async () => {
  const api = setup();
  const result = await api.put({ id: 'test', password: 'TestOnly-123' });
  assert.equal(result.status, 200);
  assert.deepEqual(Object.keys(api.calls[0].data), ['passwordHash']);
  assert.ok(await bcrypt.compare('TestOnly-123', api.calls[0].data.passwordHash));
  assert.ok(!JSON.stringify(result).includes('TestOnly-123'));
  assert.ok(!('passwordHash' in api.calls[0].select));
});
test('list never selects password or hash', async () => {
  const api = setup(); await api.GET();
  assert.ok(!('passwordHash' in api.calls[0].select));
  assert.ok(!('password' in api.calls[0].select));
  assert.ok(!('mobilePin' in api.calls[0].select));
});
test('invalid password lengths and nonstrings never write', async () => {
  for (const password of ['short', 'a'.repeat(73), 'ş'.repeat(37), 12345678, null]) {
    const api = setup();
    assert.equal((await api.put({ id: 'test', password })).status, 400);
    assert.equal((await api.POST({ json: async () => ({ username: 'test', name: 'Test', companyId: 'a', password }) })).status, 400);
    assert.equal(api.calls.length, 0);
  }
});
test('blank password in existing edit preserves stored password', async () => {
  const api = setup(); await api.put({ id: 'test', name: 'Changed', password: '' });
  assert.ok(!('passwordHash' in api.calls[0].data));
});
