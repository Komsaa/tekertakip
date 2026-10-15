const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
  });
  const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3100";
  const output = process.env.TEST_OUTPUT_DIR;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    const response = await page.goto(base, { waitUntil: "domcontentloaded" });
    assert.equal(response.status(), 200);
    assert.match(
      response.headers()["permissions-policy"],
      /geolocation=\(self\)/,
    );
    await page
      .getByRole("heading", { name: /Yollar hareketli/ })
      .waitFor();
    for (const label of ["Araç yönetimi", "Şoför kayıtları", "Güzergâhlar"]) {
      const button = page.getByRole("group", { name: "Ürün ekranı seçimi" }).getByRole("button", { name: label, exact: true });
      await button.click();
      await page.getByRole("group", { name: "Ürün ekranı seçimi" }).getByRole("button", { name: label, exact: true, pressed: true }).waitFor();
      assert.equal(await button.getAttribute("aria-pressed"), "true");
      const screenshot = page.getByRole("img", { name: `TekerTakip ${label} ekranı, örnek firma verileri`, exact: true });
      await screenshot.scrollIntoViewIfNeeded();
      await screenshot.evaluate(async image => { if (!image.complete) await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; }); if (!image.naturalWidth) throw new Error("Ürün görseli yüklenemedi"); });
    }
    await page.getByRole("button", { name: /34 CD 002/ }).click();
    assert.equal(
      await page
        .getByRole("button", { name: /34 CD 002/ })
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.match(
      await page.locator('[aria-live="polite"]').first().innerText(),
      /Ataşehir/,
    );
    await page.getByRole("button", { name: /Yıllık/ }).click();
    assert.match(
      await page.locator('[aria-atomic="true"]').innerText(),
      /₺60.000/,
    );
    await page.getByRole("button", { name: "Aylık", exact: true }).click();
    assert.match(
      await page.locator('[aria-atomic="true"]').innerText(),
      /₺6.000/,
    );
    await page
      .getByText("Ayrı bir GPS cihazı gerekiyor mu?", { exact: true })
      .click();
    assert.equal(
      await page.locator("details").first().getAttribute("open"),
      "",
    );
    const brokenAnchors = await page
      .locator('a[href^="#"]')
      .evaluateAll((links) =>
        links
          .filter((a) => !document.getElementById(a.hash.slice(1)))
          .map((a) => a.hash),
      );
    assert.deepEqual(brokenAnchors, []);
    if (output) {
      fs.mkdirSync(output, { recursive: true });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: path.join(output, "landing-desktop.png"),
        fullPage: true,
      });
    }
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "Landing overflow at " + width,
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Menüyü aç" }).click();
    await page
      .getByRole("navigation", { name: "Mobil menü" })
      .getByText("Özellikler", { exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Menüyü aç" })
        .getAttribute("aria-expanded"),
      "false",
    );
    await page.getByRole("button", { name: "Menüyü aç" }).click();
    await page
      .getByRole("navigation", { name: "Mobil menü" })
      .getByText("Özellikler", { exact: true })
      .focus();
    await page.keyboard.press("Escape");
    assert.equal(
      await page
        .getByRole("button", { name: "Menüyü aç" })
        .getAttribute("aria-expanded"),
      "false",
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    if (output)
      await page.screenshot({
        path: path.join(output, "landing-mobile.png"),
        fullPage: true,
      });
    await page.goto(base + "/kayit", { waitUntil: "networkidle" });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "Form overflow at " + width,
      );
    }
    if (output)
      await page.screenshot({
        path: path.join(output, "demo-desktop.png"),
        fullPage: true,
      });
    await page.getByLabel("Firma adı").fill("Örnek Servis");
    await page.getByLabel("Adınız ve soyadınız").fill("Örnek Yetkili");
    await page.getByLabel("Telefon", { exact: false }).fill("123");
    await page.getByRole("button", { name: "Demo talebini gönder" }).click();
    assert.match(await page.locator('p[role="alert"]').innerText(), /telefon numarası/);
    await page.getByLabel("Telefon", { exact: false }).fill("05321234567");
    // Mock only the valid submission: never creates a real demo request.
    await page.route("**/api/kayit", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Test sunucu hatası" }),
      }),
    );
    await page.getByRole("button", { name: "Demo talebini gönder" }).click();
    assert.match(
      await page.locator('p[role="alert"]').innerText(),
      /Test sunucu hatası/,
    );
    assert.equal(
      await page.getByLabel("Firma adı").inputValue(),
      "Örnek Servis",
    );
    await page.unroute("**/api/kayit");
    await page.route("**/api/kayit", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      }),
    );
    await page.getByRole("button", { name: "Demo talebini gönder" }).click();
    await page
      .getByRole("heading", { name: "Talebiniz bize ulaştı." })
      .waitFor();
    const badResponse = await page.request.post(base + "/api/kayit", {
      data: { companyName: 123 },
    });
    assert.equal(badResponse.status(), 400);
    const malformed = await page.request.post(base + "/api/kayit", {
      data: "{",
      headers: { "Content-Type": "application/json" },
    });
    assert.equal(malformed.status(), 400);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: desktop/mobile layouts, routes, pricing, FAQ, anchors, menu, form validation, mocked error/success, invalid API requests, no browser exceptions.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
