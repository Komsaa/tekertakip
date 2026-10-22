import { test } from "node:test";
import assert from "node:assert/strict";
import { historyRouteShape } from "./history-route-shapes";
test("routing request contains only stop coordinates and caches geometry", async () => {
  const original=global.fetch; let calls=0;
  global.fetch=async (url) => { calls++; assert.ok(String(url).includes("27.8,38.9;27.8,38.92")); assert.ok(!String(url).includes("Private")); return Response.json({code:"Ok",routes:[{geometry:{coordinates:[[27.8,38.9],[27.8,38.92]]}}]}); };
  try {
    const r={id:"private-id",name:"Private route",stops:[{id:"a",name:"Private stop",lat:38.9,lng:27.8},{id:"b",name:"School",lat:38.92,lng:27.8}]};
    assert.equal((await historyRouteShape(r)).geometry,"road"); await historyRouteShape(r); assert.equal(calls,1);
  } finally { global.fetch=original; }
});
test("provider failure falls back without claiming a road shape", async()=>{
  const original=global.fetch; global.fetch=async()=>{throw new Error("offline")};
  try { const r=await historyRouteShape({id:"b",name:"Test",stops:[{id:"x",name:"x",lat:39,lng:28},{id:"y",name:"y",lat:39.1,lng:28}]});assert.equal(r.geometry,"stops");assert.equal(r.path.length,2); } finally {global.fetch=original;}
});
