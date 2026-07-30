const { test, expect } = require("@playwright/test");
const fs = require("fs");

async function downloadText(page, action) {
  const pending = page.waitForEvent("download");
  await action();
  const download = await pending;
  return fs.readFileSync(await download.path(), "utf8");
}

test("English Proforma uses the shared owner and preserves totals/exports", async ({ page }) => {
  await page.goto("/tools/proforma-invoice/");
  await page.locator("#sellerName").fill("Synthetic seller");
  await page.locator("#buyerName").fill("Synthetic buyer");
  const row = page.locator("#itemsBody tr").first();
  await row.locator("input").nth(0).fill("Synthetic cacao");
  await row.locator('input[type="number"]').nth(0).fill("12");
  await row.locator('input[type="number"]').nth(1).fill("80");
  await page.locator("#piFreight").fill("120");
  await page.locator("#piInsurance").fill("30");
  const totals = await page.evaluate(() => {
    calcTotals();
    return { shared: Boolean(window.TradeUtilityEngine), totals: proformaTotals() };
  });
  expect(totals.shared).toBe(true);
  expect(totals.totals).toMatchObject({ subtotal: 960, fob: 960, cfr: 1080, cif: 1110, itemCount: 1 });
  const json = JSON.parse(await downloadText(page, () => page.locator("#piJsonBtn").click()));
  expect(json.totals.cif).toBe(1110);
  const csv = await downloadText(page, () => page.locator("#piCsvBtn").click());
  expect(csv).toContain("Synthetic cacao");
  expect(csv).toContain("1110.00");
});

test("English Packing List uses the shared owner and preserves totals/exports", async ({ page }) => {
  await page.goto("/tools/packing-list/");
  const row = page.locator("#pkgBody tr").first();
  await row.locator("input").nth(2).fill("Synthetic cacao");
  await row.locator("input").nth(3).fill("2");
  await row.locator("input").nth(4).fill("20");
  await row.locator("input").nth(5).fill("24");
  await row.locator("input").nth(6).fill("100");
  await row.locator("input").nth(7).fill("50");
  await row.locator("input").nth(8).fill("40");
  const data = await page.evaluate(() => {
    calcCBM(1);
    return { shared: Boolean(window.TradeUtilityEngine), draft: packingDraftData() };
  });
  expect(data.shared).toBe(true);
  expect(data.draft.totals).toEqual({ packages: 2, netKg: 20, grossKg: 24, cbm: 0.2 });
  const json = JSON.parse(await downloadText(page, () => page.getByRole("button", { name: "Backup JSON" }).click()));
  expect(json.totals.cbm).toBe(0.2);
  const csv = await downloadText(page, () => page.getByRole("button", { name: "Download CSV" }).click());
  expect(csv).toContain("Synthetic cacao");
});

test("English Bill of Lading exposes shared draft validation and TXT", async ({ page }) => {
  await page.goto("/tools/bol-generator/");
  await page.locator("#blShipperName").fill("Synthetic shipper");
  await page.locator("#blConsigneeName").fill("Synthetic consignee");
  await page.locator("#blPOL").fill("Tema");
  await page.locator("#blPOD").fill("Dakar");
  const row = page.locator("#blCargoBody tr").first();
  await row.locator("input").nth(4).fill("Synthetic cacao");
  await row.locator("input").nth(5).fill("240");
  await row.locator("input").nth(6).fill("4.2");
  const text = await page.evaluate(() => {
    renderBL();
    return blDraftText();
  });
  expect(text).toContain("Shared validation: minimum draft fields present");
  const downloaded = await downloadText(page, () => page.getByRole("button", { name: "Download .txt" }).click());
  expect(downloaded).toContain("DRAFT ONLY");
  expect(downloaded).toContain("Tema");
});

test("English Customs-time uses the shared owner and reopens CSV", async ({ page }) => {
  await page.goto("/tools/customs-time/");
  await page.locator("#custCountry").selectOption("kenya");
  await page.locator("#custGoodsType").selectOption("food");
  await page.locator("#custDocs").selectOption("partial");
  await page.locator("#custValue").fill("10000");
  const result = await page.evaluate(() => {
    calcCustomsTime();
    return { shared: Boolean(window.TradeUtilityEngine), result: lastCustomsResult };
  });
  expect(result.shared).toBe(true);
  expect(result.result).toMatchObject({ min: 7, typical: 20, max: 39, agentFee: 120, storageCost: 700 });
  const csv = await downloadText(page, () => page.getByRole("button", { name: "Download CSV" }).first().click());
  expect(csv).toContain('"typical_days","20"');
});

test("English Shipping Weight uses the shared owner and reopens TXT", async ({ page }) => {
  await page.goto("/tools/shipping-weight/");
  await page.locator("#pkgLength").fill("50");
  await page.locator("#pkgWidth").fill("40");
  await page.locator("#pkgHeight").fill("30");
  await page.locator("#pkgWeight").fill("8");
  await page.locator("#pkgShipType").selectOption("air");
  const result = await page.evaluate(() => {
    calcShipWeight();
    return {
      shared: Boolean(window.TradeUtilityEngine),
      actual: document.querySelector("#swActual").textContent,
      volumetric: document.querySelector("#swVolume").textContent,
      chargeable: document.querySelector("#swChargeable").textContent
    };
  });
  expect(result).toEqual({ shared: true, actual: "8.00 kg", volumetric: "12.00 kg", chargeable: "12.00 kg" });
  const txt = await downloadText(page, () => page.getByRole("button", { name: "Download .txt" }).click());
  expect(txt).toContain("Chargeable weight: 12.00 kg");
});

test("English Cross-border explorer uses the shared profile owner", async ({ page }) => {
  await page.goto("/tools/cross-border-data/");
  const result = await page.evaluate(() => {
    selectCountry("NG");
    return {
      shared: Boolean(window.TradeUtilityEngine),
      title: document.querySelector("#tpTitle").textContent,
      mechanismCount: document.querySelectorAll("#mechanismGrid .mech-card").length,
      stepCount: document.querySelectorAll("#complianceSteps li").length
    };
  });
  expect(result.shared).toBe(true);
  expect(result.title).toContain("Nigeria");
  expect(result.mechanismCount).toBe(6);
  expect(result.stepCount).toBe(7);
});
