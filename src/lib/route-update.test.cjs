const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function setup(existing, auth = true) {
  let update;
  const exports = {};
  const tx = {route:{findFirst: async q => {assert.equal(q.where.companyId,'company-a'); return existing;},update:async q=>{update=q;return q.data;}},driver:{findFirst:async()=>({})},vehicle:{findFirst:async()=>({})}};
  const modules = {
    'next/server':{NextResponse:{json:(body,opts)=>({body,status:opts?.status??200})}},
    'next-auth':{getServerSession:async()=>auth?{user:{companyId:'company-a'}}:null},
    '@/lib/auth':{authOptions:{}},
    '@/lib/tenant':{getCompanyId:s=>s.user.companyId,tenantWhere:companyId=>({companyId}),requireTenant:()=>null},
    '@/lib/prisma':{prisma:{$transaction:async fn=>fn(tx)}},
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(__dirname+'/../app/api/routes/[id]/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:n=>modules[n],console});
  return {put:stops=>exports.PUT({json:async()=>({name:'Pilot',stops})},{params:{id:'route-a'}}),update:()=>update};
}
const stop = {id:'stop-a',name:'First',estimatedTime:'07:14',lat:38.7,lng:27.9};
const existing = {id:'route-a',companyId:'company-a',stops:[{...stop,_count:{passengers:15}}]};
test('16 stops retain existing stop identity and passenger associations',async()=>{
 const s=setup(existing); const stops=[stop,...Array.from({length:15},(_,i)=>({name:`Stop ${i+2}`,estimatedTime:'07:30',lat:38.7+i/10000,lng:27.9}))];
 assert.equal((await s.put(stops)).status,200);
 const data=s.update().data.stops;
 assert.equal(data.update[0].where.id,'stop-a');assert.equal(data.create.length,15);assert.equal(data.deleteMany.id.in.length,0);
 assert.equal(data.create[14].order,15);
});
test('reordering retains ids',async()=>{
 const s=setup({...existing,stops:[...existing.stops,{...stop,id:'stop-b',_count:{passengers:0}}]});
 assert.equal((await s.put([{...stop,id:'stop-b'},stop])).status,200);
 assert.equal(s.update().data.stops.update[1].where.id,'stop-a');assert.equal(s.update().data.stops.update[1].data.order,1);
});
test('cannot silently delete a populated stop',async()=>{const s=setup(existing);assert.equal((await s.put([{...stop,id:undefined}])).status,409);assert.equal(s.update(),undefined);});
test('cannot write another tenant route',async()=>{const s=setup(null);assert.equal((await s.put([stop])).status,404);assert.equal(s.update(),undefined);});
test('foreign stop ids rejected',async()=>{const s=setup(existing);assert.equal((await s.put([{...stop,id:'foreign'}])).status,400);assert.equal(s.update(),undefined);});
test('duplicate stop ids rejected',async()=>{const s=setup(existing);assert.equal((await s.put([stop,stop])).status,400);});
test('incomplete coordinates rejected',async()=>{const s=setup(existing);assert.equal((await s.put([{...stop,lng:null}])).status,400);});
test('anonymous update rejected',async()=>{const s=setup(existing,false);assert.equal((await s.put([stop])).status,401);});
