const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function setup(auth=true) {
  let query;
  const exports = {};
  const modules = {
    "next/server":{NextResponse:{json:(body,options)=>({body,status:options?.status??200})}},
    "@/lib/mobile-auth":{getDriverFromHeaders:async()=>auth?{id:"driver-1"}:null},
    "@/lib/prisma":{prisma:{route:{findFirst:async q=>{query=q;return null;}},job:{findMany:async()=>[]}}},
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+"/../app/api/mobile/sefer/route.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:n=>modules[n],Date,Promise});
  return {get:exports.GET,query:()=>query};
}
test("trip contacts require driver authentication",async()=>{
  const s=setup(false);assert.equal((await s.get()).status,401);assert.equal(s.query(),undefined);
});
test("contacts are restricted to assigned active trip and exclude guardian credentials",async()=>{
  const s=setup();await s.get();const q=s.query();
  assert.equal(q.where.driverId,"driver-1");assert.equal(q.where.active,true);
  const p=q.include.stops.include.passengers;
  assert.equal(p.where.active,true);
  assert.equal(p.select.phone,true);assert.equal(p.select.parentPhone,true);
  assert.equal(p.select.veliPasswordHash,undefined);assert.equal(p.select.veliToken,undefined);
  assert.equal(p.include,undefined);
});
