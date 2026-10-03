import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { isSetupStats } from "../src/lib/setup-guide";
const { chromium } = require("playwright");
const url = new URL(process.env.DATABASE_URL || "");
assert.equal(url.host,"127.0.0.1:55439"); assert.equal(url.pathname,"/tekertakip_e2e");
const prisma = new PrismaClient();
async function main() {
 const suffix=Date.now().toString(36), base="http://127.0.0.1:3102";
 const company=await prisma.company.create({data:{name:"Kurulum Testi",code:"SET"+suffix}});
 const username="setup"+suffix;
 await prisma.panelUser.create({data:{name:"Kurulum Testi",username,passwordHash:await bcrypt.hash("test-password",10),companyId:company.id,role:"firma"}});
 const browser=await chromium.launch({channel:"chrome",headless:true});
 const passed:string[]=[];
 try {
  const context=await browser.newContext();
  assert.equal((await context.request.get(base+"/api/panel/onboarding")).status(),401);passed.push("anonymous denied");
  const csrf=await(await context.request.get(base+"/api/auth/csrf")).json();
  await context.request.post(base+"/api/auth/callback/credentials",{form:{csrfToken:csrf.csrfToken,username,password:"test-password",json:"true"}});
  const empty=await(await context.request.get(base+"/api/panel/onboarding")).json();
  assert.ok(isSetupStats(empty));assert.ok(Object.values(empty).every(n=>n===0));passed.push("empty company isolated from other test companies");
  const client=await prisma.client.create({data:{name:"Test Müşteri",companyId:company.id}});
  await prisma.job.create({data:{title:"Test",type:"personel",date:new Date(),startTime:"08:00",companyId:company.id}});
  let stats=await(await context.request.get(base+"/api/panel/onboarding")).json();assert.equal(stats.invoices,0);passed.push("client and job do not complete invoice");
  const vehicle=await prisma.vehicle.create({data:{plate:"SET"+suffix,companyId:company.id,inspectionExpiry:new Date()}});
  const driver=await prisma.driver.create({data:{name:"Test Şoför",companyId:company.id}});
  const route=await prisma.route.create({data:{name:"Test Hat",companyId:company.id}});
  stats=await(await context.request.get(base+"/api/panel/onboarding")).json();assert.equal(stats.documents,1);assert.equal(stats.routes,0);passed.push("date counted and incomplete route excluded");
  await prisma.route.update({where:{id:route.id},data:{driverId:driver.id,vehicleId:vehicle.id,stops:{create:{order:0,name:"Test Durak",estimatedTime:"08:00"}}}});
  stats=await(await context.request.get(base+"/api/panel/onboarding")).json();assert.equal(stats.routes,1);passed.push("assigned route with stop counted");
  assert.equal(isSetupStats({...stats,invoices:-1}),false);assert.equal(isSetupStats({error:"failure"}),false);passed.push("invalid payload rejected");
  const page=await context.newPage();const errors:string[]=[];page.on("pageerror",(e:Error)=>errors.push(e.message));
  for(const width of [390,768,1440]) {
   await page.setViewportSize({width,height:1000});await page.goto(base+"/panel/hosgeldiniz",{waitUntil:"networkidle"});
   await page.getByRole("navigation",{name:"Kurulum adımları"}).waitFor();
   assert.ok(await page.evaluate(()=>{const e=document.getElementById("panel-main")!;return e.scrollWidth<=e.clientWidth+2;}));
   await page.screenshot({path:`artifacts/design-audit/setup-${width}.jpg`,type:"jpeg"});passed.push("layout "+width);
  }
  await page.getByRole("button",{name:/8 Faturalar/}).click();await page.getByRole("heading",{name:"Faturalar",exact:true}).waitFor();
  await page.getByText("Henüz bu ölçüte uyan kayıt yok.",{exact:true}).waitFor();
  assert.equal(await page.getByRole("link",{name:/Faturaları aç/}).getAttribute("target"),"_blank");passed.push("step navigation and safe action link");
  await page.route("**/api/panel/onboarding",(r:any)=>r.fulfill({status:503,body:'{}',contentType:"application/json"}));
  await page.getByRole("button",{name:"Durumu yenile"}).click();await page.getByRole("alert").filter({hasText:"Kurulum durumu yüklenemedi"}).waitFor();assert.equal(await page.getByRole("progressbar").count(),0);passed.push("failure never shown as empty progress");
  await page.unroute("**/api/panel/onboarding");await page.getByRole("button",{name:"Tekrar dene"}).click();await page.getByRole("progressbar").waitFor();passed.push("retry recovers");
  assert.deepEqual(errors,[]);passed.push("no browser errors");console.log(JSON.stringify({passed:passed.length,checks:passed,previewAccount:username},null,2));
 } finally {await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
