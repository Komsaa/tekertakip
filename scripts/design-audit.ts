import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const { chromium } = require("playwright");
const url = new URL(process.env.DATABASE_URL || "");
assert.equal(url.host, "127.0.0.1:55439"); assert.equal(url.pathname, "/tekertakip_e2e");
const prisma = new PrismaClient();
const output = path.resolve("artifacts/design-audit");
const base = "http://127.0.0.1:3101";
async function main() {
  fs.mkdirSync(output, { recursive: true });
  const suffix = Date.now().toString(36);
  const company = await prisma.company.create({ data: { name: "Örnek Taşımacılık", code: "UI" + suffix } });
  const user = await prisma.panelUser.create({ data: { name: "Tasarım Testi", username: "design" + suffix, role: "firma", companyId: company.id, passwordHash: await bcrypt.hash("test-password", 10) } });
  const driver = await prisma.driver.create({ data: { name: "Ahmet Yılmaz", companyId: company.id } });
  const vehicle = await prisma.vehicle.create({ data: { plate: "34 UI " + suffix, brand: "Mercedes-Benz", model: "Sprinter", capacity: 16, companyId: company.id } });
  const route = await prisma.route.create({ data: { name: "Kadıköy — Ataşehir Sabah Servisi", driverId: driver.id, companyId: company.id } });
  const pages = ["/", "/kayit", "/login", ...["", "araclar", "soforler", "guzergahlar", "servis-takip", "konum", "servis-odemeler", "isler", "yakit", "bakim", "arizalar", "taseronlar", "takvim", "faturalar", "odeme", "maaslar", "kredikartlari", "raporlar", "finans", "belgeler", "gorevler", "ayarlar", "evrak-rehberi", "hosgeldiniz", "yakit/toplu-yukle", "belgeler/toplu-yukle", `araclar/${vehicle.id}`, `soforler/${driver.id}`, `guzergahlar/${route.id}/ogrenciler`].map(p => "/panel" + (p ? "/" + p : ""))];
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const results: any[] = [];
  try {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const csrf = await (await context.request.get(base + "/api/auth/csrf")).json();
    await context.request.post(base + "/api/auth/callback/credentials", { form: { csrfToken: csrf.csrfToken, username: user.username, password: "test-password", json: "true" } });
    const page = await context.newPage();
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const routePath of pages) {
        const errors: string[] = []; const onError = (e: Error) => errors.push(e.message); page.on("pageerror", onError);
        try {
          const response = await page.goto(base + routePath, { waitUntil: "networkidle", timeout: 45000 });
          const metrics = await page.evaluate(() => {
            const main = document.querySelector("#panel-main") || document.documentElement;
            return { overflow: main.scrollWidth > main.clientWidth + 2, scroll: main.scrollWidth, width: main.clientWidth, heading: document.querySelector("h1")?.textContent, errorScreen: /Dashboard yüklenemedi|Application error|Internal Server Error/.test(document.body.innerText) };
          });
          const name = routePath.replace(/[^a-z0-9-]/gi, "_") || "home";
          await page.screenshot({ path: path.join(output, `${width}${name}.png`), fullPage: false });
          results.push({ route: routePath, viewportWidth: width, status: response?.status(), ...metrics, errors });
          console.log(JSON.stringify(results[results.length - 1]));
        } catch (e) { results.push({ route: routePath, width, failure: String(e) }); }
        page.off("pageerror", onError);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base + "/panel/araclar");
    await page.getByRole("button", { name: "Menüyü aç" }).click();
    assert.equal(await page.getByRole("dialog", { name: "Ana menü" }).isVisible(), true);
    await page.keyboard.press("Escape"); assert.equal(await page.getByRole("dialog").count(), 0);
    assert.equal(await page.getByRole("button", { name: "Menüyü aç" }).evaluate((el: HTMLElement) => el === document.activeElement), true);
    const school = await prisma.company.create({ data: { name: "Örnek Okul Servisi", code: "SUI" + suffix, type: "okul" } });
    const schoolUser = await prisma.panelUser.create({ data: { name: "Okul Testi", username: "school" + suffix, role: "firma", companyId: school.id, passwordHash: await bcrypt.hash("test-password", 10) } });
    const firmAdmin = await prisma.panelUser.create({ data: { name: "Firma Admin Testi", username: "firmadmin" + suffix, role: "admin", companyId: company.id, passwordHash: await bcrypt.hash("test-password", 10) } });
    for (const account of [
      { name: "superadmin", username: "e2e_super", password: "test-super-password", pages: ["/panel/admin", "/panel/admin/simulator", "/panel/sirketler"] },
      { name: "okul", username: schoolUser.username, password: "test-password", pages: ["/panel", "/panel/guzergahlar"] },
      { name: "firma-admin", username: firmAdmin.username, password: "test-password", pages: ["/panel"] },
    ]) {
      const loginCsrf = await (await context.request.get(base + "/api/auth/csrf")).json();
      await context.request.post(base + "/api/auth/callback/credentials", { form: { csrfToken: loginCsrf.csrfToken, username: account.username, password: account.password, json: "true" } });
      for (const width of [390, 1440]) for (const routePath of account.pages) {
        await page.setViewportSize({ width, height: 1000 });
        const response = await page.goto(base + routePath, { waitUntil: "networkidle", timeout: 45000 });
        const metrics = await page.evaluate(() => { const el = document.querySelector("#panel-main")!; return { overflow: el.scrollWidth > el.clientWidth + 2, heading: document.querySelector("h1")?.textContent }; });
        results.push({ account: account.name, route: routePath, viewportWidth: width, status: response?.status(), ...metrics, errors: [] });
        await page.screenshot({ path: path.join(output, `${width}_${account.name}_${routePath.replaceAll("/", "_")}.png`) });
      }
    }
    const problems = results.filter(r => r.failure || r.overflow || r.status >= 400 || r.errors.length || r.errorScreen);
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify({ total: results.length, problems, results, menuKeyboard: "passed" }, null, 2));
    console.log("SUMMARY", JSON.stringify({ total: results.length, problems, menuKeyboard: "passed" }));
    if (problems.length) process.exitCode = 1;
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
