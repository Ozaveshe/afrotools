const { test, expect } = require("@playwright/test");

test("French CreatorSplit calculates and reopens local JSON/TXT exports", async ({ page }) => {
  const sensitiveRequests = [];
  page.on("request", request => {
    if (/supabase|netlify|\/api\/|ai-advisor|generate/i.test(request.url())) sensitiveRequests.push(request.url());
  });
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/fr/tools/repartition-des-revenus-entre-createurs/app");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/fr/tools/repartition-des-revenus-entre-createurs/app");
  await page.locator('[name="project"]').fill("EP Dakar");
  await page.locator('[name="currency"]').selectOption("XOF");
  await page.locator('[name="revenue"]').fill("100000");
  const downloadJson = page.waitForEvent("download");
  await page.getByRole("button", {name: "Calculer la répartition"}).click();
  await expect(page.locator("[data-output]")).toContainText("50 000");
  await page.getByRole("button", {name: "Télécharger JSON"}).click();
  const json = await downloadJson;
  const jsonText = require("node:fs").readFileSync(await json.path(), "utf8");
  const parsed = JSON.parse(jsonText);
  expect(parsed.project).toBe("EP Dakar");
  expect(parsed.currency).toBe("XOF");
  expect(parsed.shares).toHaveLength(2);
  expect(parsed.shares.reduce((sum, share) => sum + share.amount, 0)).toBe(100000);

  const downloadTxt = page.waitForEvent("download");
  await page.getByRole("button", {name: "Télécharger TXT"}).click();
  const txt = await downloadTxt;
  const txtText = require("node:fs").readFileSync(await txt.path(), "utf8");
  expect(txtText).toContain("ACCORD DE RÉPARTITION DES REVENUS");
  expect(txtText).toContain("EP Dakar");
  expect(sensitiveRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("CreatorSplit fails closed when allocation is not 100%", async ({ page }) => {
  await page.goto("/fr/tools/repartition-des-revenus-entre-createurs/app");
  await page.locator('[name="member-share"]').first().fill("40");
  await page.getByRole("button", {name: "Calculer la répartition"}).click();
  await expect(page.locator("[data-status]")).toContainText("exactement 100");
  await expect(page.locator("[data-actions]")).toBeHidden();
});

test("French CreatorSplit reflows at 320px and 200% zoom", async ({ page }) => {
  await page.setViewportSize({width: 640, height: 900});
  await page.goto("/fr/tools/repartition-des-revenus-entre-createurs/app");
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole("button", {name: "Calculer la répartition"})).toBeVisible();
});
