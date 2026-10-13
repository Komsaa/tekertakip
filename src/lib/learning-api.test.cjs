const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function setup({ auth = true, foreign = false, ended = false } = {}) {
  let writes = 0;
  const now = Date.now();
  const session = { id:'own',driverId:'d1',companyId:'c1',startedAt:new Date(now-10000),expiresAt:new Date(now+10000),endedAt:ended?new Date():null };
  const tx = { $queryRaw: async () => [], learningSession:{findFirst:async ({where})=>where.id && !foreign?session:null},
    learningPoint:{ createMany:async ()=>{writes++} } };
  const exports = {};
  const modules = {'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status??200})}},
    '@/lib/prisma':{prisma:{$transaction:async fn=>fn(tx)}},
    '@/lib/mobile-auth':{getDriverFromRequest:async ()=>auth?{id:'d1',companyId:'c1',vehicles:[{vehicleId:'bus'}]}:null},
    '@/lib/route-learning':{},
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(`${__dirname}/../app/api/mobile/learning/route.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>modules[n],console});
  return { post:body=>exports.POST({json:async()=>body}),writes:()=>writes,now };
}
test('unauthenticated driver cannot record a location',async()=>{const s=setup({auth:false});assert.equal((await s.post({action:'points'})).status,401);});
test('another driver or company session is inaccessible',async()=>{const s=setup({foreign:true});assert.equal((await s.post({action:'points',sessionId:'other'})).status,404);});
test('unassigned vehicle cannot start learning',async()=>{const s=setup();assert.equal((await s.post({action:'start',vehicleId:'other'})).status,400);});
test('ended session rejects further tracking',async()=>{const s=setup({ended:true});assert.equal((await s.post({action:'points',sessionId:'own',points:[]})).status,409);});
test('invalid coordinates and capture time reject the entire batch',async()=>{
  const s=setup(); const point={latitude:38,longitude:27,accuracy:5,timestamp:s.now};
  for (const bad of [{...point,latitude:91},{...point,timestamp:s.now-20000},{...point,timestamp:s.now+20000},{...point,accuracy:100}]) {
    assert.equal((await s.post({action:'points',sessionId:'own',points:[point,bad]})).status,400);
  }
  assert.equal(s.writes(),0);
});
test('valid in-session locations are accepted',async()=>{const s=setup();assert.equal((await s.post({action:'points',sessionId:'own',points:[{latitude:38,longitude:27,accuracy:5,timestamp:s.now}]})).status,200);assert.equal(s.writes(),1);});
