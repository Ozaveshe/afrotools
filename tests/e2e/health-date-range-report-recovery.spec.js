"use strict";
const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const pdfParse = require("pdf-parse");
const routes = { en: "/tools/due-date/", fr: "/fr/tools/date-accouchement/", sw: "/sw/zana/kikokotoo-tarehe-ya-kujifungua/" };
const normalize = text => text.replace(/\s+/g, " ").trim();
for (const [lang, route] of Object.entries(routes)) {
  for (const input of [{ method: "lmp", cycle: 21 }, { method: "lmp", cycle: 28 }, { method: "lmp", cycle: 35 }, { method: "ivf", age: 3 }, { method: "ivf", age: 5 }]) {
    test(`${lang} ${JSON.stringify(input)}: local reports preserve dates and invalidate after edits`, async ({ page }, info) => {
      const errors = []; page.on("pageerror", e => errors.push(e.message));
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route);
      await page.locator(`input[name=method][value=${input.method}]`).check();
      await page.locator("#estimate-date").fill("2026-07-01");
      if (input.cycle) await page.locator("#cycle-length").fill(String(input.cycle));
      if (input.age) await page.locator("#embryo-age").selectOption(String(input.age));
      await page.locator("#date-range-form button[type=submit]").click();
      await expect(page.locator("#date-range-results")).toBeVisible();
      const outputs = {};
      for (const kind of ["txt", "pdf"]) {
        const download = page.waitForEvent("download");
        await page.locator(`#download-${kind}`).click();
        const item = await download, file = info.outputPath(`report.${kind}`);
        await item.saveAs(file);
        outputs[kind] = kind === "txt" ? fs.readFileSync(file, "utf8") : (await pdfParse(fs.readFileSync(file))).text;
      }
      expect(normalize(outputs.pdf)).toBe(normalize(outputs.txt));
      const offset = input.method === "lmp" ? 280 + input.cycle - 28 : input.age === 3 ? 263 : 261;
      for (const days of [offset, offset - 21, offset + 14]) {
        const date = new Date(Date.UTC(2026, 6, 1 + days));
        const formatted = new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
        expect(outputs.txt).toContain(formatted);
      }
      expect(outputs.txt).toContain(lang === "fr" ? "nécessaires pour créer ce rapport" : "required to create this report");
      expect(outputs.txt).not.toMatch(/No account, email, upload, analytics|suivi analytique ou enregistrement/);
      await page.locator("#estimate-date").fill("2026-07-02");
      await expect(page.locator("#date-range-results")).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      expect(errors).toEqual([]);
    });
  }
}
