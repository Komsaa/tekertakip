import assert from "node:assert/strict";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import {PrismaClient} from "@prisma/client";
const {chromium}=require("playwright");
const db=new URL(process.env.DATABASE_URL||"");assert.equal(db.host,"127.0.0.1:55439");assert.equal(db.pathname,"/tekertakip_e2e");
const prisma=new PrismaClient();
async function main(){
 const company=await prisma.company.upsert({where:{code:"LANDING_PREVIEW"},create:{code:"LANDING_PREVIEW",name:"Örnek Servis Firması"},update:{}});
 const suffix=Date.now().toString(36);const username="preview"+suffix;const password="preview-"+suffix;
 await prisma.panelUser.create({data:{username,name:"Örnek Firma",role:"firma",companyId:company.id,passwordHash:await bcrypt.hash(password,10)}});
 if(await prisma.vehicle.count({where:{companyId:company.id}})===0){
  const plates=["45 HB 123","45 HB 124","45 HB 125","35 AB 456","34 CD 789","06 EF 321"];
  assert.equal(await prisma.vehicle.count({where:{plate:{in:plates}}}),0,"Demo plakaları başka kayıtta; üzerine yazılmadı");
  for(let i=0;i<plates.length;i++){
   const vehicle=await prisma.vehicle.create({data:{companyId:company.id,plate:plates[i],brand:i%2?"Ford":"Mercedes-Benz",model:i%2?"Transit":"Sprinter",capacity:16,status:"active",inspectionExpiry:new Date("2027-09-21"),insuranceExpiry:new Date("2027-09-21"),routePermitExpiry:new Date("2027-09-21"),approvalExpiry:new Date("2027-09-21")}});
   const driver=await prisma.driver.create({data:{companyId:company.id,name:`Örnek Şoför ${i+1}`,licenseClass:"D",licenseExpiry:new Date("2029-09-21"),vehicles:{create:{vehicleId:vehicle.id}}}});
   await prisma.route.create({data:{companyId:company.id,name:i<3?`Okul Hattı ${i+1}`:`Personel Hattı ${i-2}`,type:i<3?"okul":"personel",driverId:driver.id,vehicleId:vehicle.id,stops:{create:[{order:0,name:"Merkez",estimatedTime:"07:30"},{order:1,name:i<3?"Okul":"İş yeri",estimatedTime:"08:00"}]}}});
  }
 }
 const vehicles=await prisma.vehicle.findMany({where:{companyId:company.id}});assert.ok(vehicles.every(v=>/^\d{2} [A-Z]{2} \d{3}$/.test(v.plate)));
 const browser=await chromium.launch({channel:"chrome",headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const base="http://127.0.0.1:3102";
 const csrf=await(await context.request.get(base+"/api/auth/csrf")).json();await context.request.post(base+"/api/auth/callback/credentials",{form:{csrfToken:csrf.csrfToken,username,password,json:"true"}});
 const page=await context.newPage();fs.mkdirSync("public/product",{recursive:true});
 for(const section of ["araclar","soforler","guzergahlar"]){assert.equal((await page.goto(base+"/panel/"+section,{waitUntil:"networkidle"})).status(),200);assert.ok(!page.url().includes("login"));if(section==="araclar")await page.getByRole("link",{name:"45 HB 123",exact:true}).first().waitFor();await page.screenshot({path:`public/product/${section}.webp`,type:"jpeg",quality:85});}
 // Browser screenshots are JPEG files; use matching extensions.
 for(const section of ["araclar","soforler","guzergahlar"])fs.renameSync(`public/product/${section}.webp`,`public/product/${section}.jpg`);
 console.log("Three real screenshots captured with synthetic, formatted plates.");
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
