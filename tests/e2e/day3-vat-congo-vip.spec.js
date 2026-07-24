const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const pdfParse = require("pdf-parse");

const routes = [
  { path: "/congo/cg-vat", heading: /Congo VAT/i },
  { path: "/fr/congo/calculateur-tva", heading: /TVA Congo/i },
  { path: "/sw/congo/kikokotoo-vat/", heading: /VAT ya Kongo/i },
];

for (const route of routes) {
  test(`${route.path} calculates the composed standard burden locally`, async ({ page }) => {
    const errors = [];
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(route.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(route.heading);
    await expect(page.locator("#cgvNet")).toContainText(/100.?000/);
    await expect(page.locator("#cgvVat")).toContainText(/18.?000/);
    await expect(page.locator("#cgvCentimes")).toContainText(/900/);
    await expect(page.locator("#cgvGross")).toContainText(/118.?900/);
    await expect(page.locator("#cgvRate")).toHaveText("18.9%");
    expect(errors).toEqual([]);
  });
}

test("special treatments fail closed until exact evidence is confirmed", async ({ page }) => {
  await page.goto("/congo/cg-vat");
  await page.getByRole("button", { name: /Confirmed Annex 5/ }).click();
  await expect(page.locator("#cgvError")).toContainText(/Confirm the exact legal evidence/);
  await expect(page.locator("#cgvResult")).not.toHaveClass(/on/);
  await page.locator("#cgvEvidence").check();
  await expect(page.locator("#cgvVat")).toContainText(/5.?000/);
  await expect(page.locator("#cgvCentimes")).toContainText(/250/);
  await expect(page.locator("#cgvGross")).toContainText(/105.?250/);
  await expect(page.locator("#cgvRate")).toHaveText("5.25%");
});

test("mobile, dark mode and two-times text reflow stay usable", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/congo/cg-vat");
  await page.screenshot({ path: "artifacts/congo-vat-vip-320-dark.png", fullPage: true });
  await page.addStyleTag({ content: "html{font-size:200%!important}" });
  await expect(page.getByRole("button", { name: "Calculate" })).toBeVisible();
  const overflow = await page.evaluate(() => ({
    present: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    widths: { html: document.documentElement.scrollWidth, body: document.body.scrollWidth, client: document.documentElement.clientWidth },
    offenders: [...document.querySelectorAll("body *")].filter(el => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1 || el.getBoundingClientRect().left < -1).slice(0, 8).map(el => ({ tag: el.tagName, id: el.id, className: String(el.className), left: Math.round(el.getBoundingClientRect().left), right: Math.round(el.getBoundingClientRect().right), width: Math.round(el.getBoundingClientRect().width) })),
  }));
  expect(overflow.present, JSON.stringify(overflow)).toBe(false);
  const buttonHeight = await page.getByRole("button", { name: "Calculate" }).evaluate(el => el.getBoundingClientRect().height);
  expect(buttonHeight).toBeGreaterThanOrEqual(44);
});

test("PDF export downloads a non-empty local document", async ({ page }) => {
  await page.goto("/congo/cg-vat");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#cgvPdf").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("congo-vat-estimate.pdf");
  const stream = await download.createReadStream();
  let size = 0;
  for await (const chunk of stream) size += chunk.length;
  expect(size).toBeGreaterThan(1000);
  const parsed = await pdfParse(fs.readFileSync(await download.path()));
  expect(parsed.text).toContain("Congo VAT planning estimate");
  expect(parsed.text).toContain("VAT 18%");
  expect(parsed.text).toContain("Additional centimes");
  expect(parsed.text).toContain("XAF 118900.00");
});

test("page uses no remote runtime requests or browser persistence", async ({ page }) => {
  const remote = [];
  page.on("request", request => { const url = new URL(request.url()); if (!url.hostname.match(/^(127\.0\.0\.1|localhost)$/)) remote.push(request.url()); });
  await page.goto("/congo/cg-vat");
  await page.locator("#cgvAmount").fill("250000");
  await page.getByRole("button", { name: "Calculate" }).click();
  expect(remote).toEqual([]);
  const persisted = await page.evaluate(() => ({ local: Object.keys(localStorage).filter(key => /cgv|cg-vat/i.test(key)), session: Object.keys(sessionStorage).filter(key => /cgv|cg-vat/i.test(key)) }));
  expect(persisted).toEqual({ local: [], session: [] });
});
