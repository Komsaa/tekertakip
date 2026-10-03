import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
const { request } = require("playwright");
const url = new URL(process.env.DATABASE_URL || "");
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.port, "55439");
assert.equal(url.pathname, "/tekertakip_e2e");
const prisma = new PrismaClient();
const suffix = Date.now().toString(36);
let passed = 0;
let failed = 0;
let api: any;
async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log("PASS", name);
  } catch (error) {
    failed++;
    console.error("FAIL", name, error);
  }
}
async function main() {
  api = await request.newContext({ baseURL: "http://127.0.0.1:3101" });
  const a = await prisma.company.create({
    data: { name: "Mobile Test A", code: "MA" + suffix },
  });
  const b = await prisma.company.create({
    data: { name: "Mobile Test B", code: "MB" + suffix },
  });
  const driver = await prisma.driver.create({
    data: {
      name: "Test Driver",
      companyId: a.id,
      mobileToken: randomBytes(24).toString("hex"),
      mobileTokenAt: new Date(),
    },
  });
  const route = await prisma.route.create({
    data: { name: "Test Route", companyId: a.id, driverId: driver.id },
  });
  const other = await prisma.route.create({
    data: { name: "Other Route", companyId: b.id },
  });
  const stop = await prisma.routeStop.create({
    data: {
      routeId: route.id,
      name: "Test Stop",
      order: 1,
      estimatedTime: "07:30",
    },
  });
  const foreignStop = await prisma.routeStop.create({
    data: {
      routeId: other.id,
      name: "Foreign Stop",
      order: 1,
      estimatedTime: "07:30",
    },
  });
  const parent = await prisma.routePassenger.create({
    data: {
      stopId: stop.id,
      name: "Synthetic Child",
      veliUsername: "parent" + suffix,
      veliPasswordHash: await bcrypt.hash("test-password", 10),
    },
  });
  const foreign = await prisma.routePassenger.create({
    data: { stopId: foreignStop.id, name: "Foreign Child" },
  });
  const login = () =>
    api.post("/api/mobile/veli-auth", {
      data: { username: parent.veliUsername, password: "test-password" },
    });
  let token = "";
  const ph = () => ({ Authorization: "Bearer " + token });
  const dh = { Authorization: "Bearer " + driver.mobileToken };
  const attendance = (data: any) =>
    api.post("/api/mobile/sefer/attendance", { headers: dh, data });
  const payload = {
    routeId: route.id,
    date: "2026-09-14",
    attendances: [{ passengerId: parent.id, status: "boarded" }],
  };
  await check("parent login issues valid session", async () => {
    const r = await login();
    assert.equal(r.status(), 200);
    token = (await r.json()).token;
    assert.ok(token);
  });
  await check("active parent reads status and map", async () => {
    for (const path of ["status", "harita"])
      assert.equal(
        (await api.get("/api/mobile/veli/" + path, { headers: ph() })).status(),
        200,
      );
  });
  await check("malformed parent login rejected", async () =>
    assert.equal(
      (
        await api.post("/api/mobile/veli-auth", {
          data: { username: [], password: 5 },
        })
      ).status(),
      400,
    ),
  );
  await check("invalid push token rejected", async () =>
    assert.equal(
      (
        await api.post("/api/mobile/veli/push-token", {
          headers: ph(),
          data: { pushToken: {} },
        })
      ).status(),
      400,
    ),
  );
  await check("driver GPS persists valid coordinates", async () => {
    assert.equal(
      (
        await api.post("/api/mobile/location", {
          headers: dh,
          data: { latitude: 41.01, longitude: 29.01 },
        })
      ).status(),
      200,
    );
    const d = await prisma.driver.findUniqueOrThrow({
      where: { id: driver.id },
    });
    assert.equal(d.latitude, 41.01);
    assert.equal(d.isTracking, true);
    assert.equal(
      await prisma.driverLocationHistory.count({
        where: { driverId: driver.id },
      }),
      1,
    );
  });
  await check("out of range GPS rejected without mutation", async () => {
    assert.equal(
      (
        await api.post("/api/mobile/location", {
          headers: dh,
          data: { latitude: 91, longitude: 181 },
        })
      ).status(),
      400,
    );
    assert.equal(
      (await prisma.driver.findUniqueOrThrow({ where: { id: driver.id } }))
        .latitude,
      41.01,
    );
  });
  await check("driver can stop location tracking", async () => {
    assert.equal(
      (await api.delete("/api/mobile/location", { headers: dh })).status(),
      200,
    );
    assert.equal(
      (await prisma.driver.findUniqueOrThrow({ where: { id: driver.id } }))
        .isTracking,
      false,
    );
  });
  await check("foreign route attendance blocked", async () =>
    assert.equal(
      (
        await attendance({
          ...payload,
          routeId: other.id,
          attendances: [{ passengerId: foreign.id, status: "boarded" }],
        })
      ).status(),
      404,
    ),
  );
  await check("foreign passenger attendance blocked", async () =>
    assert.equal(
      (
        await attendance({
          ...payload,
          attendances: [{ passengerId: foreign.id, status: "boarded" }],
        })
      ).status(),
      400,
    ),
  );
  await check("foreign next stop notifications blocked", async () =>
    assert.equal(
      (await attendance({ ...payload, nextStopId: foreignStop.id })).status(),
      400,
    ),
  );
  await check("invalid attendance status rejected", async () =>
    assert.equal(
      (
        await attendance({
          ...payload,
          attendances: [{ passengerId: parent.id, status: "invalid" }],
        })
      ).status(),
      400,
    ),
  );
  await check("rejected attendance writes nothing", async () =>
    assert.equal(
      await prisma.tripAttendance.count({
        where: { routeId: { in: [route.id, other.id] } },
      }),
      0,
    ),
  );
  await check("authorized attendance persists", async () => {
    assert.equal((await attendance(payload)).status(), 200);
    const saved = await prisma.tripAttendance.findFirstOrThrow({
      where: { routeId: route.id },
    });
    assert.equal(saved.passengerId, parent.id);
    assert.equal(saved.driverId, driver.id);
  });
  await check("inactive parent denied all parent endpoints", async () => {
    await prisma.routePassenger.update({
      where: { id: parent.id },
      data: { active: false },
    });
    for (const path of ["status", "harita"])
      assert.equal(
        (await api.get("/api/mobile/veli/" + path, { headers: ph() })).status(),
        401,
      );
    assert.equal(
      (
        await api.post("/api/mobile/veli/push-token", {
          headers: ph(),
          data: { pushToken: "ExpoPushToken[synthetic]" },
        })
      ).status(),
      401,
    );
    assert.equal(
      (
        await api.post("/api/mobile/veli-change-password", {
          headers: ph(),
          data: {
            currentPassword: "test-password",
            newPassword: "new-password",
          },
        })
      ).status(),
      401,
    );
    assert.equal(
      (
        await api.delete("/api/mobile/account/delete?role=veli", {
          headers: ph(),
        })
      ).status(),
      401,
    );
  });
  await prisma.routePassenger.update({
    where: { id: parent.id },
    data: { active: true },
  });
  await check(
    "suspended company denies parent login and existing token",
    async () => {
      await prisma.company.update({
        where: { id: a.id },
        data: { active: false },
      });
      assert.equal((await login()).status(), 403);
      assert.equal(
        (await api.get("/api/mobile/veli/harita", { headers: ph() })).status(),
        401,
      );
      assert.equal(
        (
          await api.post("/api/mobile/location", {
            headers: dh,
            data: { latitude: 41, longitude: 29 },
          })
        ).status(),
        401,
      );
    },
  );
  await prisma.company.update({
    where: { id: a.id },
    data: { active: true, isDemo: true, demoExpiresAt: new Date(0) },
  });
  await check("expired demo denies alternate parent login", async () => {
    assert.equal((await login()).status(), 403);
    assert.equal(
      (await api.get("/api/mobile/veli/status", { headers: ph() })).status(),
      401,
    );
  });
  await prisma.company.update({ where: { id: a.id }, data: { isDemo: false } });
  await check("inactive route denies parent access", async () => {
    await prisma.route.update({
      where: { id: route.id },
      data: { active: false },
    });
    assert.equal((await login()).status(), 403);
    assert.equal(
      (await api.get("/api/mobile/veli/harita", { headers: ph() })).status(),
      401,
    );
  });
  await prisma.route.update({
    where: { id: route.id },
    data: { active: true },
  });
  await check("legacy token without expiry denied", async () => {
    token = randomBytes(24).toString("hex");
    await prisma.routePassenger.update({
      where: { id: parent.id },
      data: { veliToken: token },
    });
    assert.equal(
      (await api.get("/api/mobile/veli/status", { headers: ph() })).status(),
      401,
    );
  });
  await check("expired token denied", async () => {
    token = randomBytes(24).toString("hex") + "|1000000000000";
    await prisma.routePassenger.update({
      where: { id: parent.id },
      data: { veliToken: token },
    });
    assert.equal(
      (await api.get("/api/mobile/veli/harita", { headers: ph() })).status(),
      401,
    );
  });
  console.log(JSON.stringify({ total: passed + failed, passed, failed }));
  if (failed) process.exitCode = 1;
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await api?.dispose();
    await prisma.$disconnect();
  });
