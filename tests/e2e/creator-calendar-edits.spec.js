const fs = require("node:fs/promises");
const { test, expect } = require("@playwright/test");

test.use({ timezoneId: "America/Los_Angeles" });

for (const route of [
  "/tools/creator-calendar/app",
  "/fr/tools/calendrier-createur/app",
  "/sw/zana/kalenda-ya-mtayarishi/app"
]) {
  test(`local start date and edited calendar exports on ${route}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-12-02T01:00:00Z"));
    await page.goto(route);
    const form = page.locator("[data-creator-calendar-native] form");
    const start = form.locator('[name="startDate"]');
    await expect(start).toHaveValue("2026-12-01");
    await form.locator('[type="submit"]').click();
    await start.fill("2026-12-15");
    await form.locator('[name="topic"]').fill("Studio");
    await form.locator('[name="days"]').fill("2");
    await form.locator('[name="country"]').selectOption("KE");
    for (const checkbox of await form.locator('[name="platform"]').all()) {
      await checkbox.uncheck();
    }
    await expect(page.locator("[data-output]")).toBeHidden();
    await expect(page.locator("[data-export-actions]")).toBeHidden();
    await form.locator('[value="linkedin"]').check();
    const rows = page.locator("[data-output] tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText("2026-12-15");
    await expect(rows.last()).toContainText("2026-12-16");

    async function download(format) {
      const pending = page.waitForEvent("download");
      await page.locator(`[data-${format}]`).click();
      return fs.readFile(await (await pending).path(), "utf8");
    }
    const json = JSON.parse(await download("json"));
    expect(json).toMatchObject({ topic: "Studio", startDate: "2026-12-15", country: "KE", days: 2, platforms: ["linkedin"] });
    const csvRows = (await download("csv")).trim().split(/\r?\n/).slice(1);
    expect(csvRows).toHaveLength(2);
    for (let i = 0; i < 2; i++) {
      const cells = await rows.nth(i).locator("td").allTextContents();
      expect(csvRows[i]).toBe(cells.map(value => '"' + value + '"').join(","));
      expect(json.posts[i]).toMatchObject({ date: cells[1], platform: cells[2], time: cells[3] });
    }
  });
}
