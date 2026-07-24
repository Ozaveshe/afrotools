const { test, expect } = require("@playwright/test");

async function calculate(page, route, currency, onReady) {
  await page.goto(route);
  if (onReady) onReady();
  await page.fill("#currencyCode", currency);
  await page.fill("#coinLabel", "BTC");
  await page.fill("#grossCoinPerDay", "2");
  await page.fill("#coinPrice", "100");
  await page.fill("#powerWatts", "1000");
  await page.fill("#uptimeHours", "10");
  await page.fill("#electricityRate", "2");
  await page.fill("#poolFeePercent", "10");
  await page.fill("#otherDailyCost", "10");
  await page.fill("#hardwareCost", "300");
  await page.selectOption("#periodDays", "30");
  await page.click(".mining-submit");
  await expect(page.locator("#miningMarginResults")).toHaveAttribute("data-result-settled", "true");
}

test("English worksheet is deterministic, accessible and mobile-overlay safe", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ colorScheme:"dark", reducedMotion:"reduce" });
  const external = [];
  const toolInputRequests = [];
  let enteringEvidence = false;
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") external.push(request.url());
    if (enteringEvidence && ["fetch","xhr"].includes(request.resourceType())) {
      toolInputRequests.push({ url:request.url(), method:request.method(), body:request.postData() });
    }
  });
  await calculate(page, "/crypto/mining-calculator/", "USD", () => { enteringEvidence = true; });
  await expect(page.locator("#miningMarginResults")).toContainText("$150.00");
  await expect(page.locator("#miningMarginResults")).toContainText("75% operating margin");
  await expect(page.locator("#miningMarginResults")).toContainText("$4,500.00");
  await expect(page.locator("#miningMarginResults")).toContainText("2 days");
  await expect(page.locator("#miningMarginResults")).toBeFocused();
  expect(await page.locator("#miningMarginForm input,#miningMarginForm select").evaluateAll(nodes => nodes.every(node => node.labels && node.labels.length > 0))).toBe(true);
  const overlay = await page.evaluate(() => {
    const cookie = document.querySelector("#afro-cookie-consent");
    const assistant = document.querySelector("afro-site-assistant");
    const critical = [
      document.querySelector(".mining-submit"), document.querySelector("#miningMarginStatus"),
      document.querySelector(".mining-result-hero"), document.querySelector(".mining-result-list"),
      document.querySelector(".mining-payback"), document.querySelector(".mining-method"),
      ...document.querySelectorAll(".mining-actions button")
    ].filter(Boolean);
    const hit = (a,b) => {
      const x=a.getBoundingClientRect(), y=b.getBoundingClientRect();
      return x.width>0 && x.height>0 && y.width>0 && y.height>0 && x.left<y.right && x.right>y.left && x.top<y.bottom && x.bottom>y.top;
    };
    return {
      cookieCritical: cookie ? critical.some(node => hit(cookie,node)) : false,
      assistantCritical: assistant ? critical.some(node => hit(assistant,node)) : false,
      assistantSuppressed: cookie && assistant ? assistant.getBoundingClientRect().width === 0 : true,
      cookieActionsContained: cookie ? [...cookie.querySelectorAll(".afro-cc-actions > *")].every(node => {
        const outer=cookie.getBoundingClientRect(), inner=node.getBoundingClientRect();
        return inner.left>=outer.left && inner.right<=outer.right;
      }) : true
    };
  });
  expect(overlay).toEqual({ cookieCritical:false, assistantCritical:false, assistantSuppressed:true, cookieActionsContained:true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  const unexpectedExternal = external.filter(url =>
    // Shared footer shadow CSS imports the DM Sans family.
    !/^https:\/\/fonts\.googleapis\.com\/css2\?family=DM\+Sans/.test(url)
    // Shared navbar country selector renders its default Nigeria flag with Twemoji.
    && !/^https:\/\/cdn\.jsdelivr\.net\/gh\/twitter\/twemoji@14\.0\.2\/assets\/svg\/[a-f0-9-]+\.svg$/.test(url)
  );
  expect(unexpectedExternal).toEqual([]);
  expect(external.some(url => /coingecko|chart|crypto-data/i.test(url))).toBeFalsy();
  expect(toolInputRequests).toEqual([]);
});

test("French route is native parity and unsafe inputs fail closed", async ({ page }) => {
  await page.setViewportSize({ width:768, height:900 });
  await calculate(page, "/fr/crypto/mining-calculator/", "EUR");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("#miningMarginResults")).toContainText("150,00");
  await expect(page.locator("iframe")).toHaveCount(0);
  const assertLocaleOverlaySafe = async () => {
    const state = await page.evaluate(() => {
      const cookie=document.querySelector("#afro-cookie-consent");
      const assistant=document.querySelector("afro-site-assistant");
      const critical=[document.querySelector(".mining-submit"),document.querySelector("#miningMarginStatus"),document.querySelector(".mining-result-hero"),document.querySelector(".mining-result-list"),document.querySelector(".mining-payback"),document.querySelector(".mining-method"),...document.querySelectorAll(".mining-actions button")].filter(Boolean);
      const hit=(a,b)=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.width>0&&x.height>0&&y.width>0&&y.height>0&&x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;};
      return {cookieCritical:cookie?critical.some(node=>hit(cookie,node)):false,assistantCritical:assistant?critical.some(node=>hit(assistant,node)):false,assistantSuppressed:cookie&&assistant?assistant.getBoundingClientRect().width===0:true,cookieActionsContained:cookie?[...cookie.querySelectorAll(".afro-cc-actions > *")].every(node=>{const outer=cookie.getBoundingClientRect(),inner=node.getBoundingClientRect();return inner.left>=outer.left&&inner.right<=outer.right;}):true};
    });
    expect(state).toEqual({cookieCritical:false,assistantCritical:false,assistantSuppressed:true,cookieActionsContained:true});
    expect(await page.evaluate(() => document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
  };
  await assertLocaleOverlaySafe();
  await page.setViewportSize({ width:375, height:900 });
  await page.click(".mining-submit");
  await expect(page.locator("#miningMarginResults")).toHaveAttribute("data-result-settled","true");
  await assertLocaleOverlaySafe();
  await page.fill("#poolFeePercent", "100");
  await page.click(".mining-submit");
  await expect(page.locator("#miningMarginStatus")).not.toBeEmpty();
  await expect(page.locator("[data-mining-export=pdf]")).toBeDisabled();
});

test("CSV JSON parser-readable PDF and print remain local", async ({ page }) => {
  await calculate(page, "/crypto/mining-calculator/", "USD");
  for (const type of ["csv","json"]) {
    const download = page.waitForEvent("download");
    await page.click(`[data-mining-export=${type}]`);
    const item = await download;
    expect(item.suggestedFilename()).toContain(`.${type}`);
  }
  const pdfDownload = page.waitForEvent("download");
  await page.click("[data-mining-export=pdf]");
  const pdf = await pdfDownload;
  const stream = await pdf.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  expect(Buffer.concat(chunks).subarray(0,4).toString()).toBe("%PDF");
  await page.evaluate(() => { window.__printed=false; window.print=() => { window.__printed=true; }; });
  await page.click("[data-mining-export=print]");
  expect(await page.evaluate(() => window.__printed)).toBe(true);
});
