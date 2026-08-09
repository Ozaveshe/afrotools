const { test, expect } = require("@playwright/test"),
  fs = require("node:fs"),
  pdf = require("pdf-parse");
const route = "/sw/zana/kifurushi-ushahidi-ulaghai-crypto/";
async function open(page, w = 375) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.addInitScript(() =>
    localStorage.setItem("afrotools_cookie_consent", "declined"),
  );
  const raw = [];
  page.on("request", (r) => {
    if (/incident|seed|password|wallet|loss/i.test(r.url())) raw.push(r.url());
  });
  await page.goto(route);
  return raw;
}
async function organize(page) {
  await page.fill("#incidentLabel", "Ujumbe wa usaidizi usiotarajiwa");
  await page.fill("#incidentDate", "2026-07-20");
  await page.fill("#platform", "Huduma ya mfano");
  await page.fill("#contactReference", "Rejea 12");
  await page.check("[name=redFlag]");
  await page.fill("#evidenceNotes", "picha-1.png\nrisiti ya muamala");
  await page.fill("#timelineNotes", "09:15 ujumbe wa kwanza");
  await page.fill("#currencyCode", "KES");
  await page.locator(".scam-loss-row input").nth(0).fill("Uhamisho");
  await page.locator(".scam-loss-row input").nth(1).fill("1200");
  await page.click(".scam-submit");
  await expect(page.locator("#scamEvidenceResults")).toContainText("6 / 6");
}
test("local organizer stale state and parsed exports", async ({ page }) => {
  const raw = await open(page);
  await organize(page);
  for (const type of ["json", "txt", "pdf"]) {
    const [d] = await Promise.all([
      page.waitForEvent("download"),
      page.click(`[data-scam-export=${type}]`),
    ]);
    const b = fs.readFileSync(await d.path());
    if (type === "json")
      expect(JSON.parse(b.toString()).summary.record.incidentLabel).toContain("Ujumbe");
    if (type === "txt") expect(b.toString()).toContain("Kifurushi binafsi");
    if (type === "pdf")
      expect((await pdf(b)).text).toContain("Kifurushi binafsi");
  }
  await page.fill("#incidentLabel", "Imebadilika");
  await expect(page.locator("[data-scam-export=json]")).toBeDisabled();
  expect(raw).toEqual([]);
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((k) =>
        /scam|incident|evidence/i.test(k),
      ),
    ),
  ).toEqual([]);
});
for (const w of [320, 375])
  test(`${w}px dark keyboard no overflow`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await open(page, w);
    await page.locator("#incidentLabel").focus();
    await expect(page.locator("#incidentLabel")).toBeFocused();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
test("200 percent metadata artwork", async ({ page }) => {
  await open(page, 640);
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
    "href",
    "https://afrotools.com/sw/zana/kifurushi-ushahidi-ulaghai-crypto/",
  );
  expect(
    (await page.request.get("/assets/img/tools/crypto-scam.webp")).status(),
  ).toBe(200);
});
