const { test, expect } = require("@playwright/test");
const fs = require("fs");

const route = "/sw/zana/mwongozo-wa-sars-efiling/";

test("native Swahili guide, local persistence and reopened exports", async ({ page }) => {
  const writes = [];
  page.on("request", request => { if (request.method() !== "GET") writes.push(`${request.method()} ${request.url()}`); });
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator("h1")).toContainText("mifumo rasmi ya SARS");
  await expect(page.locator(".se-step")).toHaveCount(6);
  await expect(page.locator("[data-sars-task]")).toHaveCount(6);
  await expect(page.locator("#main-content form,#main-content input,#main-content textarea,#main-content select")).toHaveCount(0);
  const first = page.locator('[data-sars-task="domain"]');
  await first.focus(); await page.keyboard.press("Space");
  await expect(first).toHaveAttribute("aria-checked", "true");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-sars-task="domain"]')).toHaveAttribute("aria-checked", "true");

  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Pakua JSON" }).click();
  const json = await jsonDownload;
  const jsonPath = await json.path();
  const report = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  expect(report.schema).toBe("afrotools.sars-efiling-preparation.v1");
  expect(report.tasks).toHaveLength(6); expect(report.tasks[0].complete).toBe(true);
  expect(JSON.stringify(report)).not.toMatch(/password|otpValue|taxNumber|bankAccount/i);

  const txtDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Pakua TXT" }).click();
  const txt = fs.readFileSync(await (await txtDownload).path(), "utf8");
  expect(txt).toContain("Rekodi ya maandalizi ya SARS eFiling");
  expect(txt).toContain("[x]");

  const pdfDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Pakua PDF" }).click();
  const pdfBuffer = fs.readFileSync(await (await pdfDownload).path());
  expect(pdfBuffer.subarray(0, 4).toString()).toBe("%PDF");
  const reopened = await page.evaluate(async base64 => {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const documentPdf = await window.PDFLib.PDFDocument.load(bytes);
    return { pages: documentPdf.getPageCount(), title: documentPdf.getTitle(), subject: documentPdf.getSubject() };
  }, pdfBuffer.toString("base64"));
  expect(reopened.pages).toBe(1);
  expect(reopened.title).toContain("SARS eFiling");
  expect(reopened.subject).toContain("si marejesho");

  await page.getByRole("button", { name: "Futa orodha" }).click();
  await expect(page.locator('[data-sars-task="domain"]')).toHaveAttribute("aria-checked", "false");
  expect(writes).toEqual([]);
});

test("mobile, reflow, themes, focus and metadata", async ({ page }) => {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.locator('[data-sars-task="domain"]').focus();
  expect(await page.locator('[data-sars-task="domain"]').evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe("none");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  expect(await page.locator("body").evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe("rgb(240, 241, 242)");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://afrotools.com/sw/zana/mwongozo-wa-sars-efiling/");
  await expect(page.locator('link[hreflang="en"]')).toHaveCount(1);
  await expect(page.locator('link[hreflang="fr"]')).toHaveCount(1);
  await expect(page.locator('link[hreflang="sw"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /sars-efiling\.svg$/);
});

test("invalid stored state fails closed and English owner retains workflow", async ({ page }) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("afro_sars_efiling_preparation_v1", "{broken"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-sars-task][aria-checked="true"]')).toHaveCount(0);
  await page.goto("/tools/sars-efiling/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".se-step")).toHaveCount(6);
  await expect(page.locator("[data-sars-task]")).toHaveCount(6);
  await expect(page.getByRole("button", { name: "Download JSON" })).toBeVisible();
  await expect(page.locator("body")).toContainText("1-12 July 2026");
});
