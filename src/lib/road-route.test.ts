import { test } from "node:test";
import assert from "node:assert/strict";
import { roadRoute, validPoint } from "./road-route";

test("coordinate validation accepts zero and rejects missing/out-of-range values", () => {
  assert.equal(validPoint({lat:0,lng:0}), true);
  for (const point of [{lat:null,lng:27},{lat:91,lng:27},{lat:38,lng:NaN}]) assert.equal(validPoint(point), false);
});
test("road geometry uses longitude-latitude and preserves stop order", async t => {
  let requested = "";
  t.mock.method(globalThis, "fetch", async (url: string) => {
    requested = url;
    return {ok:true,json:async()=>({code:"Ok",routes:[{geometry:{coordinates:[[27,38],[27.1,38.1],[28,39]]}}]})};
  });
  assert.deepEqual(await roadRoute([{lat:38,lng:27},{lat:39,lng:28}]), [[38,27],[38.1,27.1],[39,28]]);
  assert.match(requested, /27,38;28,39/);
});
test("failed routing never returns a made-up straight line", async t => {
  t.mock.method(globalThis, "fetch", async()=>({ok:true,json:async()=>({code:"NoRoute",routes:[]})}));
  await assert.rejects(roadRoute([{lat:38,lng:27},{lat:39,lng:28}]));
});
test("one stop requires no routing service", async t => {
  const fetch = t.mock.method(globalThis,"fetch",async()=>{throw Error("unexpected request");});
  assert.deepEqual(await roadRoute([{lat:38,lng:27}]), []);
  assert.equal(fetch.mock.callCount(), 0);
});
test("bad geometry is rejected", async t => {
  t.mock.method(globalThis,"fetch",async()=>({ok:true,json:async()=>({code:"Ok",routes:[{geometry:{coordinates:[[27,38],[28,NaN]]}}]})}));
  await assert.rejects(roadRoute([{lat:38,lng:27},{lat:39,lng:28}]));
});
