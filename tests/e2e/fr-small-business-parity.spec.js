"use strict";

const { test, expect } = require("@playwright/test");
const { routes } = require("../../scripts/lib/fr-small-business-parity-config");

test.describe.configure({ mode: "serial" });

test("hub owns the exact 28-app French SME collection", async ({ page }) => {
  await page.goto("/fr/small-business/");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("body")).toHaveAttribute("data-parity-root", "fr-small-business-sme-parity");
  await expect(page.locator("main li > a")).toHaveCount(28);
  await expect(page.locator("body")).toContainText("28 applications gratuites");
});

for (const route of routes) {
  test(`${route.id}: native workflow, reflow, themes and parsed ${route.export} export`, async ({ page }) => {
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.setViewportSize({ width: 320, height: 820 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto(`/fr/tools/${route.slug}/`);

    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("body")).toHaveAttribute("data-parity-root", "fr-small-business-sme-parity");
    await expect(page.locator("body")).toHaveAttribute("data-sme-tool", route.id);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator("form[data-sme-form]")).toBeVisible();
    await expect(page.locator("form label")).toHaveCount(route.fields.length);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.evaluate(() => { document.documentElement.style.zoom = ""; document.documentElement.dataset.themeChoice = "dark"; });
    await page.emulateMedia({ colorScheme: "dark" });

    const calculate = page.locator("form[data-sme-form] button[type=submit]");
    await calculate.focus();
    await expect(calculate).toBeFocused();
    await calculate.click();
    await expect(page.locator("[data-sme-results]")).toBeVisible();
    await expect(page.locator("[data-sme-status]")).toContainText("Résultat prêt");
    await expect(page.locator("[data-sme-export]")).toBeEnabled();

    const downloadPromise = page.waitForEvent("download");
    await page.locator("[data-sme-export]").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`${route.id}-fr.${route.export}`);
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const payload = Buffer.concat(chunks).toString("utf8");
    expect(payload.length).toBeGreaterThan(20);
    if (route.export === "json") {
      const parsed = JSON.parse(payload);
      expect(parsed.tool).toBe(route.id);
      expect(parsed.result.ok).toBe(true);
    } else if (route.export === "csv") {
      expect(payload.split(/\r?\n/).filter(Boolean).length).toBeGreaterThan(1);
      expect(payload).toContain(",");
    } else {
      expect(payload).toContain(`Outil : ${route.id}`);
    }

    expect(consoleErrors).toEqual([]);
  });
}
