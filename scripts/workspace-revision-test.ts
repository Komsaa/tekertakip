import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
const { chromium } = require("playwright");
const db = new URL(process.env.DATABASE_URL || "");
assert.equal(db.host, "127.0.0.1:55439"); assert.equal(db.pathname, "/tekertakip_e2e");
const prisma = new PrismaClient();
const base = "http://127.0.0.1:3101";
async function main() {
  const suffix = Date.now().toString(36);
  const company = await prisma.company.create({ data: { name: "Atlas Test Taşımacılık", code: "REV"+suffix } });
  const user = await prisma.panelUser.create({ data: { name: "Tasarım Testi", username: "rev"+suffix, passwordHash: await bcrypt.hash("test-password", 10), companyId: company.id, role: "firma" } });
  await prisma.vehicle.createMany({ data: Array.from({length:23}, (_,i)=>({plate:`34 REV ${suffix.toUpperCase()} ${String(i).padStart(3,"0")}`, brand: i===0 ? "İstanbul Özel" : "Mercedes-Benz", model:"Sprinter", companyId:company.id, capacity:16, status:i<20?"active":"inactive", inspectionExpiry: i===0?new Date(0):null })) });
  const job = await prisma.job.create({data:{title:"Test Sabah Servisi", type:"personel", date:new Date(), startTime:"08:00", companyId:company.id}});
  await prisma.driver.create({data:{name:"İstanbul Test Şoförü", companyId:company.id, licenseExpiry:new Date(0)}});
  await prisma.route.create({data:{name:"Test Okul Hattı", type:"okul", companyId:company.id}});
  await prisma.route.create({data:{name:"Test Personel Hattı", type:"personel", companyId:company.id}});
  const browser = await chromium.launch({channel:"chrome",headless:true});
  fs.mkdirSync("artifacts/design-audit",{recursive:true});
  const results:string[]=[];
  try {
    const context = await browser.newContext();
    const csrf = await (await context.request.get(base+"/api/auth/csrf")).json();
    await context.request.post(base+"/api/auth/callback/credentials",{form:{csrfToken:csrf.csrfToken,username:user.username,password:"test-password",json:"true"}});
    const page = await context.newPage(); const errors:string[]=[];page.on("pageerror",(e:Error)=>errors.push(e.message));
    for(const width of [390,768,1440]) {
      await page.setViewportSize({width,height:1000});
      for(const route of ["/panel","/panel/araclar","/panel/soforler","/panel/guzergahlar"]) {
        assert.equal((await page.goto(base+route,{waitUntil:"networkidle"})).status(),200);
        assert.ok(await page.evaluate(()=>{const e=document.getElementById("panel-main")!;return e.scrollWidth<=e.clientWidth+2;}),`overflow ${route} ${width}`);
        await page.screenshot({path:`artifacts/design-audit/revision-${width}-${route.split("/").pop()}.jpg`,type:"jpeg",quality:65});
        results.push(`layout ${route} ${width}`);
      }
    }
    await page.getByRole("button",{name:/^Okul Servisi/}).click();
    await page.getByText("Test Okul Hattı",{exact:true}).waitFor();
    assert.equal(await page.getByText("Test Personel Hattı",{exact:true}).count(),0);
    assert.equal(await page.getByRole("button",{name:/^Okul Servisi/}).getAttribute("aria-pressed"),"true");results.push("route type filter");
    await page.goto(base+"/panel/soforler",{waitUntil:"networkidle"});
    await page.getByText("İstanbul Test Şoförü",{exact:true}).waitFor();results.push("driver record displayed");
    await page.goto(base+"/panel/araclar",{waitUntil:"networkidle"});
    await page.getByLabel("Araç ara").fill("istanbul");
    await page.getByText("1 araç · Sayfa 1 / 1",{exact:true}).waitFor(); results.push("Turkish search");
    await page.getByLabel("Araç ara").fill("");
    await page.getByRole("button",{name:"Sonraki sayfa",exact:true}).click();
    await page.getByText("23 araç · Sayfa 2 / 3",{exact:true}).waitFor();results.push("pagination");
    await page.getByRole("button",{name:"Aktif",exact:true}).click();
    await page.getByText("20 araç · Sayfa 1 / 2",{exact:true}).waitFor();results.push("active filter resets page");
    await page.getByRole("button",{name:"Belge takibi",exact:true}).click();
    await page.getByText("1 araç · Sayfa 1 / 1",{exact:true}).waitFor();results.push("document filter");
    await page.getByLabel("Araç ara").fill("no-match");await page.getByRole("heading",{name:"Aramanıza uygun araç bulunamadı"}).waitFor();results.push("empty search state");
    await page.goto(base+"/panel",{waitUntil:"networkidle"});
    await page.route("**/api/jobs/"+job.id,(r:any)=>r.fulfill({status:500,contentType:"application/json",body:'{"error":"test"}'}));
    await page.getByRole("button",{name:"Test Sabah Servisi geldi olarak işaretle",exact:true}).click();
    await page.getByRole("alert").filter({hasText:"Sefer durumu kaydedilemedi"}).waitFor();
    assert.equal((await prisma.job.findUniqueOrThrow({where:{id:job.id}})).status,"planned");results.push("failed arrival retains stored state and displays error");
    await page.route("**/api/notes",(r:any)=>r.fulfill({status:500,contentType:"application/json",body:'{"error":"test"}'}));
    await page.getByLabel("Operasyon notları").fill("Başarısız kayıt denemesi");
    await page.getByRole("alert").filter({hasText:"Not kaydedilemedi"}).waitFor();
    assert.equal(await page.getByLabel("Operasyon notları").inputValue(),"Başarısız kayıt denemesi");results.push("failed note keeps draft");
    await page.unroute("**/api/notes");
    await page.getByRole("button",{name:"Tekrar kaydet",exact:true}).click();
    await page.waitForResponse((r:any)=>r.url().endsWith("/api/notes")&&r.status()===200);
    assert.equal((await prisma.setting.findFirstOrThrow({where:{companyId:company.id,key:"dashboard_notes"}})).value,"Başarısız kayıt denemesi");results.push("note retry persists");
    assert.deepEqual(errors,[]);results.push("no page errors");
    console.log(JSON.stringify({passed:results.length,results},null,2));
  } finally {await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
