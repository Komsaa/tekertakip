import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {validDocumentDate,readDocumentDates,DRIVER_DATES} from "../src/lib/document-dates";
const {chromium}=require("playwright");
const db=new URL(process.env.DATABASE_URL||"");assert.equal(db.host,"127.0.0.1:55439");assert.equal(db.pathname,"/tekertakip_e2e");
const prisma=new PrismaClient();
async function main(){
 const checks:string[]=[];
 assert.equal(validDocumentDate("2027-02-30"),false);assert.equal(validDocumentDate("2028-02-29"),true);assert.equal(validDocumentDate("tomorrow"),false);
 assert.deepEqual(readDocumentDates('{"expiryDate":"2027-02-30","issueDate":"2026-09-21"}'),{expiryDate:null,issueDate:"2026-09-21"});assert.equal(DRIVER_DATES.src,undefined);checks.push("strict dates and SRC exclusion");
 const browser=await chromium.launch({channel:"chrome",headless:true});
 try{
 const context=await browser.newContext(), base="http://127.0.0.1:3102";
 assert.equal((await context.request.patch(base+"/api/documents/date",{data:{}})).status(),401);checks.push("anonymous denied");
 const user=await prisma.panelUser.findFirstOrThrow({where:{username:{startsWith:"setup"}},orderBy:{createdAt:"desc"}});
 const csrf=await(await context.request.get(base+"/api/auth/csrf")).json();await context.request.post(base+"/api/auth/callback/credentials",{form:{csrfToken:csrf.csrfToken,username:user.username,password:"test-password",json:"true"}});
 const driver=await prisma.driver.create({data:{name:"Belge Testi",companyId:user.companyId,phone:"TEST-PHONE",licenseClass:"D",licenseExpiry:new Date("2029-01-01"),srcExpiry:new Date("2020-01-01")}});
 const body={entityType:"driver",entityId:driver.id,docType:"psychotech",date:"2028-04-20"};
 assert.equal((await context.request.patch(base+"/api/documents/date",{data:body})).status(),200);
 const updated=await prisma.driver.findUniqueOrThrow({where:{id:driver.id}});assert.equal(updated.phone,"TEST-PHONE");assert.equal(updated.licenseExpiry?.toISOString().slice(0,10),"2029-01-01");assert.equal(updated.psychotechExpiry?.toISOString().slice(0,10),"2028-04-20");checks.push("date update preserves unrelated fields");
 assert.equal((await context.request.patch(base+"/api/documents/date",{data:{...body,docType:"src"}})).status(),400);assert.equal((await context.request.patch(base+"/api/documents/date",{data:{...body,date:"2027-02-30"}})).status(),400);checks.push("SRC and invalid date rejected");
 const foreign=await prisma.driver.findFirstOrThrow({where:{companyId:{not:user.companyId}}});
 assert.equal((await context.request.patch(base+"/api/documents/date",{data:{...body,entityId:foreign.id}})).status(),404);checks.push("cross-company date update denied");
 assert.equal((await context.request.post(base+"/api/upload",{multipart:{entityType:"driver",entityId:foreign.id,docType:"license",file:{name:"test.pdf",mimeType:"application/pdf",buffer:Buffer.from("%PDF-test")}}})).status(),404);checks.push("cross-company upload denied before storage");
 const page=await context.newPage();await page.goto(base+"/panel/soforler/"+driver.id,{waitUntil:"networkidle"});
 const src=page.getByRole("region",{name:"SRC-2 Belgesi",exact:true});assert.equal(await src.getByRole("button",{name:/Tarih/}).count(),0);assert.equal(await page.getByRole("link",{name:/e-Devlet/}).count(),0);checks.push("no SRC date controls or e-government links");
 await page.route("**/api/upload",(r:any)=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({url:"/api/files/test",parsed:{expiryDate:"2030-05-10",issueDate:null}})}));
 const license=page.getByRole("region",{name:"Ehliyet",exact:true});await license.getByLabel("Ehliyet dosyası").setInputFiles({name:"test.pdf",mimeType:"application/pdf",buffer:Buffer.from("%PDF-test")});await license.getByRole("button",{name:"Dosyayı yükle"}).click();await license.getByLabel("Ehliyet tarihi").waitFor();assert.equal(await license.getByLabel("Ehliyet tarihi").inputValue(),"2030-05-10");assert.equal((await prisma.driver.findUniqueOrThrow({where:{id:driver.id}})).licenseExpiry?.toISOString().slice(0,10),"2029-01-01");checks.push("mock OCR prefill waits for approval");
 await license.getByRole("button",{name:"Tarihi onayla"}).click();await page.waitForResponse((r:any)=>r.url().endsWith("/api/documents/date")&&r.status()===200);assert.equal((await prisma.driver.findUniqueOrThrow({where:{id:driver.id}})).licenseExpiry?.toISOString().slice(0,10),"2030-05-10");checks.push("confirmed date persists");
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
