function stub(
  t: { after: (fn: () => void) => void },
  target: any,
  key: string,
  replacement: any,
) {
  const previous = target[key];
  target[key] = replacement;
  t.after(() => {
    target[key] = previous;
  });
}
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createManagerToken, verifyManagerTokenFull } from "./manager-token";
import { parseLogin, safeCompare, companyAccessError } from "./access-policy";
import { getActiveManager } from "./manager-access";
import { prisma } from "./prisma";
import { getDriverFromRequest } from "./mobile-auth";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { POST as login } from "../app/api/mobile/unified-auth/route";
process.env.NEXTAUTH_SECRET = "isolated-test-secret-not-for-production";
const company = {
  active: true,
  isDemo: false,
  demoExpiresAt: null,
  type: "firma",
};
const user = {
  id: "test-user",
  username: "test",
  name: "Test",
  role: "firma",
  companyId: "company-a",
  active: true,
  company,
};
const issue = () =>
  createManagerToken("test", { role: "firma", companyId: "company-a" });
test("valid token preserves tenant", () =>
  assert.equal(verifyManagerTokenFull(issue())?.companyId, "company-a"));
for (const change of [
  { role: "admin" },
  { companyId: null },
  { companyId: "other" },
  { username: "other" },
  { source: "env" },
]) {
  test("rejects tampering " + JSON.stringify(change), () => {
    const [payload, sig] = issue().split(".");
    const changed = Buffer.from(
      JSON.stringify({
        ...JSON.parse(Buffer.from(payload, "base64url").toString()),
        ...change,
      }),
    ).toString("base64url");
    assert.equal(verifyManagerTokenFull(changed + "." + sig), null);
  });
}
test("rejects legacy signature", () => {
  const period = Math.floor(Date.now() / 2592000000);
  const payload = Buffer.from(
    JSON.stringify({
      username: "test",
      period,
      role: "admin",
      companyId: null,
    }),
  ).toString("base64url");
  const sig = createHmac("sha256", process.env.NEXTAUTH_SECRET!)
    .update("test:" + period)
    .digest("hex");
  assert.equal(verifyManagerTokenFull(payload + "." + sig), null);
});
for (const change of [
  { expiresAt: 0 },
  { issuedAt: Date.now() + 86400000 },
  { role: "unknown" },
  { companyId: null },
  { version: 1 },
]) {
  test("rejects invalid signed claims " + JSON.stringify(change), () => {
    const claims = JSON.parse(
      Buffer.from(issue().split(".")[0], "base64url").toString(),
    );
    const payload = Buffer.from(
      JSON.stringify({ ...claims, ...change }),
    ).toString("base64url");
    const sig = createHmac("sha256", process.env.NEXTAUTH_SECRET!)
      .update(payload)
      .digest("hex");
    assert.equal(verifyManagerTokenFull(payload + "." + sig), null);
  });
}
test("rejects extra token segments", () =>
  assert.equal(verifyManagerTokenFull(issue() + ".extra"), null));
test("unicode comparison is safe", () => {
  assert.equal(safeCompare("ş", "a"), false);
  assert.equal(safeCompare("şifre", "şifre"), true);
});
test("password whitespace is preserved", () =>
  assert.deepEqual(parseLogin({ username: " test ", password: " secret " }), {
    username: "test",
    password: " secret ",
  }));
test("invalid login shapes rejected", () => {
  for (const input of [
    null,
    [],
    {},
    { username: 1, password: [] },
    { username: " ", password: "x" },
  ])
    assert.equal(parseLogin(input), null);
});
test("company policy", () => {
  assert.equal(companyAccessError(company), null);
  assert.ok(companyAccessError(null));
  assert.ok(companyAccessError({ ...company, active: false }));
  assert.ok(
    companyAccessError({
      ...company,
      isDemo: true,
      demoExpiresAt: new Date(0),
    }),
  );
});
test("active manager accepted", async (t) => {
  stub(t, prisma.panelUser, "findUnique", async () => user);
  assert.equal((await getActiveManager(issue()))?.id, user.id);
});
for (const change of [
  { active: false },
  { role: "admin" },
  { companyId: "other" },
  { company: { ...company, active: false } },
  { company: { ...company, isDemo: true, demoExpiresAt: new Date(0) } },
]) {
  test("revoked manager rejected " + JSON.stringify(change), async (t) => {
    stub(t, prisma.panelUser, "findUnique", async () => ({
      ...user,
      ...change,
    }));
    assert.equal(await getActiveManager(issue()), null);
  });
}
const driver = {
  id: "test-driver",
  status: "active",
  company,
  mobileTokenAt: new Date(),
  vehicles: [],
};
const req = () =>
  new NextRequest("http://localhost/test", {
    headers: { authorization: "Bearer test" },
  });
test("active driver accepted", async (t) => {
  stub(t, prisma.driver, "findUnique", async () => driver);
  assert.equal((await getDriverFromRequest(req()))?.id, driver.id);
});
for (const change of [
  { status: "inactive" },
  { mobileTokenAt: null },
  { mobileTokenAt: new Date(0) },
  { company: null },
  { company: { ...company, active: false } },
]) {
  test(
    "invalid driver session rejected " + JSON.stringify(change),
    async (t) => {
      stub(t, prisma.driver, "findUnique", async () => ({
        ...driver,
        ...change,
      }));
      assert.equal(await getDriverFromRequest(req()), null);
    },
  );
}
test("invalid login returns 400 before database access", async () => {
  const response = await login(
    new NextRequest("http://localhost/test", {
      method: "POST",
      body: JSON.stringify({ username: 1, password: [] }),
    }),
  );
  assert.equal(response.status, 400);
});
for (const active of [false, true]) {
  test("mobile web-password login with company active=" + active, async (t) => {
    stub(t, prisma.driver, "findFirst", async () => null);
    stub(t, prisma.routePassenger, "findUnique", async () => null);
    const hash = await bcrypt.hash(" secret ", 4);
    stub(t, prisma.panelUser, "findFirst", async (args: any) =>
      args.where.mobileUsername ? null : { ...user, passwordHash: hash },
    );
    stub(t, prisma.company, "findUnique", async () => ({ ...company, active }));
    const response = await login(
      new NextRequest("http://localhost/test", {
        method: "POST",
        body: JSON.stringify({ username: "test", password: " secret " }),
      }),
    );
    assert.equal(response.status, active ? 200 : 403);
  });
}
