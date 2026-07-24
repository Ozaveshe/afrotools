const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const pdf = require("pdf-parse");

const routes = [
  "/tools/business-name-gen/",
  "/fr/tools/generateur-nom-entreprise/",
  "/sw/zana/kitengeneza-jina-la-biashara/"
];
const widths = [320, 375, 768];

async function generate(page, keywords = "trust, payments, quick") {
  await page.locator("#keywords").fill(keywords);
  await page.locator(".bnw-form button[type=submit]").click();
}

for (const route of routes) {
  for (const width of widths) {
    test(`${route} is native, deterministic and reflow safe at ${width}px`, async ({ page }) => {
      const errors = [];
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.goto(route);
      await expect(page.locator(".bnw-form")).toBeVisible();
      await generate(page);
      await expect(page.locator(".bnw-name")).toHaveCount(20);
      expect(await page.locator(".bnw-name h3").first().innerText()).toBe("Trust Tech");
      expect(await page.locator(".bnw-form input,.bnw-form select").evaluateAll((nodes) => nodes.every((node) => node.labels.length > 0))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
}

test("unsafe input remains text, changes stale exports and no state persists", async ({ page }) => {
  await page.goto("/tools/business-name-gen/");
  const before = await page.evaluate(() => Object.keys(localStorage).concat(Object.keys(sessionStorage)));
  await generate(page, "<img src=x onerror=alert(1)>, trust, payments");
  await expect(page.locator(".bnw-name")).toHaveCount(20);
  await expect(page.locator(".bnw-name img,.bnw-name script")).toHaveCount(0);
  await expect(page.locator("[data-export]:not(:disabled)")).toHaveCount(4);
  await page.locator("#keywords").fill("new brief");
  await expect(page.locator("[data-export]:disabled")).toHaveCount(4);
  await expect(page.locator(".bnw-name")).toHaveCount(0);
  const after = await page.evaluate(() => Object.keys(localStorage).concat(Object.keys(sessionStorage)));
  expect(after).toEqual(before);
});

test("CSV, JSON and parser-readable PDF preserve scope and verification", async ({ page }) => {
  await page.goto("/tools/business-name-gen/");
  await generate(page);

  const csvDownload = page.waitForEvent("download");
  await page.locator('[data-export="csv"]').click();
  const csv = fs.readFileSync(await (await csvDownload).path(), "utf8");
  expect(csv).toContain('"name","style","score"');
  expect(csv).toContain('"Trust Tech"');
  expect(csv).toContain('"scope","No availability');
  expect(csv).toContain('"engine_version","business-name-workshop-2026-07-23"');

  const jsonDownload = page.waitForEvent("download");
  await page.locator('[data-export="json"]').click();
  const json = JSON.parse(fs.readFileSync(await (await jsonDownload).path(), "utf8"));
  expect(json.suggestions).toHaveLength(20);
  expect(json.scope).toContain("No availability");
  expect(json.verificationChecklist).toHaveLength(5);

  const pdfDownload = page.waitForEvent("download");
  await page.locator('[data-export="pdf"]').click();
  const parsed = await pdf(fs.readFileSync(await (await pdfDownload).path()));
  expect(parsed.text).toContain("African Business Name");
  expect(parsed.text).toContain("No availability");
  expect(parsed.text).toContain("Verification checklist");
});
