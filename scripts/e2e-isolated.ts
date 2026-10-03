import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const { request, chromium } = require("playwright");
const db = new URL(process.env.DATABASE_URL || "");
assert.equal(db.hostname, "127.0.0.1");
assert.equal(db.port, "55439");
assert.equal(db.pathname, "/tekertakip_e2e");
const base = "http://127.0.0.1:3101";
const prisma = new PrismaClient();
const suffix = Date.now().toString(36);
const results: { name: string; passed: boolean; error?: string }[] = [];
const clients: any[] = [];
async function check(name: string, run: () => Promise<void>) {
  try {
    await run();
    results.push({ name, passed: true });
    console.log("PASS", name);
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    results.push({ name, passed: false, error });
    console.log("FAIL", name, error);
  }
}
async function login(username: string, password = "test-password") {
  const client = await request.newContext({ baseURL: base });
  clients.push(client);
  const csrf = await (await client.get("/api/auth/csrf")).json();
  await client.post("/api/auth/callback/credentials", {
    form: {
      csrfToken: csrf.csrfToken,
      username,
      password,
      json: "true",
      callbackUrl: base + "/panel",
    },
  });
  return client;
}
async function main() {
  const a = await prisma.company.create({
    data: { name: "Test Firma A", code: "A" + suffix },
  });
  const b = await prisma.company.create({
    data: { name: "Test Firma B", code: "B" + suffix },
  });
  const expired = await prisma.company.create({
    data: {
      name: "Test Demo",
      code: "D" + suffix,
      isDemo: true,
      demoExpiresAt: new Date(0),
    },
  });
  const passwordHash = await bcrypt.hash("test-password", 10);
  const makeUser = (name: string, companyId: string, role = "firma") =>
    prisma.panelUser.create({
      data: { username: name + suffix, name, companyId, role, passwordHash },
    });
  const ua = await makeUser("usera", a.id);
  const ub = await makeUser("userb", b.id);
  const admin = await makeUser("companyadmin", a.id, "admin");
  const demo = await makeUser("expired", expired.id);
  const va = await prisma.vehicle.create({
    data: { plate: "A-" + suffix, companyId: a.id },
  });
  const vb = await prisma.vehicle.create({
    data: { plate: "B-" + suffix, companyId: b.id },
  });
  const ca = await login(ua.username);
  const cb = await login(ub.username);
  const cadmin = await login(admin.username);
  const csuper = await login("e2e_super", "test-super-password");
  const anon = await request.newContext({ baseURL: base });
  clients.push(anon);
  await check("real company login", async () =>
    assert.equal(
      (await (await ca.get("/api/auth/session")).json()).user.id,
      ua.id,
    ),
  );
  await check("wrong password rejected", async () => {
    const c = await login(ua.username, "wrong");
    assert.ok(!(await (await c.get("/api/auth/session")).json()).user);
  });
  await check("expired demo login rejected", async () => {
    const c = await login(demo.username);
    assert.ok(!(await (await c.get("/api/auth/session")).json()).user);
  });
  await check("anonymous vehicle list denied", async () =>
    assert.equal((await anon.get("/api/vehicles")).status(), 401),
  );
  await check("A sees only A vehicles", async () => {
    const rows = await (await ca.get("/api/vehicles")).json();
    assert.ok(rows.some((r: any) => r.id === va.id));
    assert.ok(rows.every((r: any) => r.companyId === a.id));
  });
  await check("B sees only B vehicles", async () => {
    const rows = await (await cb.get("/api/vehicles")).json();
    assert.ok(rows.some((r: any) => r.id === vb.id));
    assert.ok(rows.every((r: any) => r.companyId === b.id));
  });
  await check("cross-tenant update returns 404", async () => {
    assert.equal(
      (
        await ca.put("/api/vehicles/" + vb.id, { data: { plate: "ATTEMPT" } })
      ).status(),
      404,
    );
    assert.equal(
      (await prisma.vehicle.findUniqueOrThrow({ where: { id: vb.id } })).plate,
      vb.plate,
    );
  });
  await check("cross-tenant deletion denied", async () => {
    assert.equal((await ca.delete("/api/vehicles/" + vb.id)).status(), 404);
    assert.equal(
      (await prisma.vehicle.findUniqueOrThrow({ where: { id: vb.id } })).status,
      "active",
    );
  });
  await check(
    "submitted companyId cannot override vehicle ownership",
    async () => {
      const res = await ca.post("/api/vehicles", {
        data: { plate: "NEW-" + suffix, companyId: b.id },
      });
      assert.equal(res.status(), 201);
      assert.equal((await res.json()).companyId, a.id);
    },
  );
  await check("ordinary user denied global admin API", async () =>
    assert.equal((await ca.get("/api/admin/panel-users")).status(), 403),
  );
  await check("company admin denied global admin API", async () =>
    assert.equal((await cadmin.get("/api/admin/panel-users")).status(), 403),
  );
  await check("company admin cannot impersonate another firm", async () =>
    assert.equal(
      (
        await cadmin.post("/api/admin/impersonate", {
          data: { companyId: b.id },
        })
      ).status(),
      403,
    ),
  );
  await check("superadmin can list users", async () =>
    assert.equal((await csuper.get("/api/admin/panel-users")).status(), 200),
  );
  await check("superadmin can enter firm scope and return", async () => {
    assert.equal(
      (
        await csuper.post("/api/admin/impersonate", {
          data: { companyId: b.id },
        })
      ).status(),
      200,
    );
    const session = await (await csuper.get("/api/auth/session")).json();
    assert.equal(session.user.companyId, b.id);
    assert.equal(session.user.impersonating, true);
    const rows = await (await csuper.get("/api/vehicles")).json();
    assert.ok(rows.length > 0);
    assert.ok(rows.every((r: any) => r.companyId === b.id));
    assert.equal((await csuper.get("/api/admin/panel-users")).status(), 403);
    assert.equal((await csuper.delete("/api/admin/impersonate")).status(), 200);
    assert.equal((await csuper.get("/api/admin/panel-users")).status(), 200);
  });
  await check(
    "company admin redirected away from global admin page",
    async () => {
      const res = await cadmin.get("/panel/admin", { maxRedirects: 0 });
      assert.equal(res.status(), 307);
      assert.equal(res.headers().location, "/panel");
    },
  );
  await check("real demo submission persisted", async () => {
    const name = "Demo E2E " + suffix;
    const res = await anon.post("/api/kayit", {
      data: {
        companyName: name,
        contactName: "Test",
        phone: "05321234567",
        vehicleCount: "3",
        serviceType: "okul",
      },
    });
    assert.equal(res.status(), 200);
    const rows = await prisma.$queryRaw<
      any[]
    >`SELECT * FROM "DemoRequest" WHERE "companyName" = ${name}`;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].vehicleCount, 3);
    assert.equal(rows[0].status, "pending");
  });
  await check("company user cannot read demo requests", async () =>
    assert.equal((await ca.get("/api/admin/demo-requests")).status(), 403),
  );
  await check("wrong current password rejected", async () =>
    assert.equal(
      (
        await ca.post("/api/panel/change-password", {
          data: { currentPassword: "wrong", newPassword: "changed-password" },
        })
      ).status(),
      400,
    ),
  );
  await check(
    "password change persists and old password stops working",
    async () => {
      assert.equal(
        (
          await ca.post("/api/panel/change-password", {
            data: {
              currentPassword: "test-password",
              newPassword: "changed-password",
            },
          })
        ).status(),
        200,
      );
      const old = await login(ua.username);
      assert.ok(!(await (await old.get("/api/auth/session")).json()).user);
      const fresh = await login(ua.username, "changed-password");
      assert.equal(
        (await (await fresh.get("/api/auth/session")).json()).user.id,
        ua.id,
      );
    },
  );
  await check("existing session revoked after user deactivation", async () => {
    await prisma.panelUser.update({
      where: { id: ub.id },
      data: { active: false },
    });
    assert.equal((await cb.get("/api/vehicles")).status(), 401);
  });
  await check("old session revoked after password change", async () =>
    assert.equal((await ca.get("/api/vehicles")).status(), 401),
  );
  await check("existing session revoked after company suspension", async () => {
    const fresh = await login(ua.username, "changed-password");
    await prisma.company.update({
      where: { id: a.id },
      data: { active: false },
    });
    assert.equal((await fresh.get("/api/vehicles")).status(), 401);
  });
  await prisma.company.update({ where: { id: a.id }, data: { active: true } });
  await check("existing session revoked after demo expiry", async () => {
    await prisma.company.update({
      where: { id: expired.id },
      data: { demoExpiresAt: new Date(Date.now() + 86400000) },
    });
    const c = await login(demo.username);
    assert.equal((await c.get("/api/vehicles")).status(), 200);
    await prisma.company.update({
      where: { id: expired.id },
      data: { demoExpiresAt: new Date(0) },
    });
    assert.equal((await c.get("/api/vehicles")).status(), 401);
  });
  await check(
    "existing session revoked after tenant reassignment",
    async () => {
      const c = await login(admin.username);
      assert.equal((await c.get("/api/vehicles")).status(), 200);
      await prisma.panelUser.update({
        where: { id: admin.id },
        data: { companyId: b.id },
      });
      assert.equal((await c.get("/api/vehicles")).status(), 401);
    },
  );
  await check("browser demo form persists a real request", async () => {
    const browser = await chromium.launch({
      channel: "chrome",
      headless: true,
    });
    try {
      const page = await browser.newPage();
      const name = "Browser Demo " + suffix;
      await page.goto(base + "/kayit");
      await page.locator("#companyName").fill(name);
      await page.locator("#contactName").fill("Test Yetkili");
      await page.locator("#phone").fill("05321234567");
      await page.locator("#vehicleCount").fill("7");
      const response = page.waitForResponse(
        (r: any) =>
          r.url().endsWith("/api/kayit") && r.request().method() === "POST",
      );
      await page.locator('button[type="submit"]').click();
      assert.equal((await response).status(), 200);
      await page.getByRole("link", { name: /Ana sayfaya dön/ }).waitFor();
      const rows = await prisma.$queryRaw<
        any[]
      >`SELECT * FROM "DemoRequest" WHERE "companyName" = ${name}`;
      assert.equal(rows.length, 1);
      assert.equal(rows[0].vehicleCount, 7);
    } finally {
      await browser.close();
    }
  });
  await check("browser login reaches panel", async () => {
    const browser = await chromium.launch({
      channel: "chrome",
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.goto(base + "/login");
      await page.getByLabel("Kullanıcı Adı").fill(ua.username);
      await page.getByLabel("Şifre", { exact: true }).fill("changed-password");
      await page
        .getByRole("button", { name: "Giriş Yap", exact: true })
        .click();
      await page.waitForURL("**/panel", { timeout: 30000 });
    } finally {
      await browser.close();
    }
  });
  console.log(
    JSON.stringify(
      {
        total: results.length,
        passed: results.filter((r) => r.passed).length,
        failed: results.filter((r) => !r.passed),
      },
      null,
      2,
    ),
  );
  if (results.some((r) => !r.passed)) process.exitCode = 1;
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    for (const c of clients) await c.dispose();
    await prisma.$disconnect();
  });
