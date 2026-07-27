const { test, expect } = require("@playwright/test");

const syntheticMarker = "day10-african-synthetic";

async function assertNoOverflow(page, allowance = 8) {
  const details = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll("body *")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
          if (/^(auto|scroll|hidden|clip)$/.test(getComputedStyle(parent).overflowX)) return false;
          parent = parent.parentElement;
        }
        return rect.right > document.documentElement.clientWidth + 2 || rect.left < -2;
      })
      .slice(0, 12)
      .map((element) => `${element.tagName}#${element.id}.${element.className}`);
    return { overflow, offenders };
  });
  expect(details.overflow, details.offenders.join("\n")).toBeLessThanOrEqual(allowance);
}

async function openApp(page, route) {
  const errors = [];
  const unsafeRequests = [];
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("aft_theme", "dark"));
  page.on("pageerror", (error) => {
    if (!/Transition was skipped/i.test(error.message)) errors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/favicon|manifest|Failed to load resource|ERR_FAILED|CORS|api\/|supabase|netlify|google|Transition was skipped/i.test(text)) return;
    errors.push(text);
  });
  page.on("request", (request) => {
    const serialized = `${request.url()}\n${request.postData() || ""}`;
    if (serialized.includes(syntheticMarker)) unsafeRequests.push(serialized);
  });
  await page.route("**/*", async (routeHandler) => {
    const requestUrl = new URL(routeHandler.request().url());
    if (["127.0.0.1", "localhost"].includes(requestUrl.hostname)) {
      return routeHandler.continue();
    }
    return routeHandler.abort();
  });
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1").first()).toBeVisible();
  await assertNoOverflow(page);
  return async function verifyRuntime() {
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await assertNoOverflow(page);
    expect(unsafeRequests).toEqual([]);
    expect(errors).toEqual([]);
  };
}

test.describe.configure({ mode: "serial" });

test("01 Japa calculator returns the fixed relocation fixture and recalculates", async ({ page }) => {
  const verify = await openApp(page, "/tools/japa-calculator/");
  await page.getByRole("button", { name: /Calculate My Total Japa Cost/ }).click();
  await expect(page.locator("#totUsd")).toHaveText("$24,217 USD");
  await expect(page.locator("#totLocal")).toContainText("38,262,896");
  await page.locator("#dCtry").selectOption("UK");
  await expect(page.locator("#totUsd")).not.toHaveText("$24,217 USD");
  await page.setViewportSize({ width: 320, height: 812 });
  await verify();
});

test("02 Generator fuel calculator proves arithmetic, invalid state and CSV", async ({ page }) => {
  const verify = await openApp(page, "/tools/generator-fuel/");
  await page.locator("#gfHours").fill("2");
  await page.locator("#gfFuelPrice").fill("1000");
  await page.locator("#gfCalculate").click();
  await expect(page.locator("#gfMonthly")).toHaveText("₦67,200");
  await expect(page.locator("#gfLitres")).toHaveText("2.2 L");
  await expect(page.locator("#gfKwh")).toHaveText("₦280/kWh");

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#gfCsv").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("afrotools-generator-fuel-estimate.csv");

  await page.locator("#gfFuelPrice").fill("0");
  await page.locator("#gfCalculate").click();
  await expect(page.locator("#gfFuelPrice")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#gfResults")).not.toHaveClass(/\bon\b/);
  await verify();
});

test("03 Mobile-money comparison proves the Kenya fee table and clears stale invalid output", async ({ page }) => {
  const verify = await openApp(page, "/tools/mobile-money-fees/");
  await page.locator("#mmCountry").selectOption("KE");
  await page.locator("#mmAmount").fill("1000");
  await page.locator("#mmTxType").selectOption("send");
  await page.evaluate(() => compare());
  await expect(page.locator("#cheapestTag")).toContainText("KSh");
  await expect(page.locator("#amtBreakdown")).toContainText("1,000");
  await expect(page.locator("#mmTableBody tr")).toHaveCount(2);

  await page.locator("#mmAmount").fill("0");
  await page.evaluate(() => compare());
  await expect(page.locator("#resultsSection")).toBeHidden();
  await verify();
});

test("04 Fintech Fee Watch quality coach scores and withdraws evidence deterministically", async ({ page }) => {
  const verify = await openApp(page, "/tools/fintech-fee-watch/");
  await page.locator("#mdReportProvider").fill("M-Pesa");
  await page.locator("#report_fee_type").selectOption("Transfer");
  await page.locator("#report_amount_band").fill("1,001-5,000");
  await page.locator("#report_fee_amount").fill("25");
  await page.locator("#report_transaction_channel").selectOption("App");
  await page.locator("#mdSourceType").selectOption("official_notice");
  await page.locator("#mdProofUrl").fill("https://example.test/tariff");
  await expect(page.locator("#ffQuality")).toContainText("100/100");
  await page.locator("#mdProofUrl").fill("");
  await expect(page.locator("#ffQuality")).toContainText("75/100");
  await verify();
});

test("05 Ajo tracker canonical route reaches the real app and builds a two-member schedule", async ({ page }) => {
  const verify = await openApp(page, "/tools/ajo-tracker/");
  await page.getByRole("link", { name: /Start Tracking/ }).click();
  await expect(page).toHaveURL(/\/tools\/ajo-tracker\/app\.html$/);
  await page.locator("#amount").fill("100");
  await page.locator("#newMemberName").fill("Ama");
  await page.getByRole("button", { name: "Add" }).click();
  await page.locator("#newMemberName").fill("Kojo");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.locator("#sum-members")).toHaveText("2");
  await expect(page.locator("#sum-pool")).toContainText("200");
  await expect(page.locator("#schedule-body tr")).toHaveCount(2);
  await verify();
});

test("06 Electricity estimator proves appliance arithmetic and changes with usage", async ({ page }) => {
  const verify = await openApp(page, "/tools/electricity-estimator/");
  await page.getByRole("button", { name: /Small Apartment/ }).click();
  await page.getByRole("button", { name: /Calculate Bill/ }).click();
  await expect(page.locator("#resKwh")).toHaveText("165.0 kWh");
  await expect(page.locator("#resDailyKwh")).toHaveText("5.50 kWh");
  await expect(page.locator("#resDailyCost")).toHaveText("₦1,237.50");
  await page.locator(".eb-app-slider").first().fill("0");
  await page.getByRole("button", { name: /Calculate Bill/ }).click();
  await expect(page.locator("#resKwh")).not.toHaveText("165.0 kWh");
  await verify();
});

test("07 Fuel-cost calculator proves route-condition and reserve arithmetic", async ({ page }) => {
  const verify = await openApp(page, "/tools/fuel-cost/");
  await page.locator("#distance").fill("100");
  await page.locator("#consumption").fill("10");
  await page.locator("#fuelPrice").fill("1000");
  await page.getByRole("button", { name: "Calculate Cost" }).first().click();
  await expect(page.locator("#resultGrid")).toContainText("12.7 L");
  await expect(page.locator("#resultGrid")).toContainText("₦12,650");
  await page.locator("#distance").fill("0");
  await page.getByRole("button", { name: "Calculate Cost" }).first().click();
  await expect(page.locator("#resultCard")).toBeHidden();
  await verify();
});

test("08 Hawala tracker compares a fixed US-to-Nigeria corridor and rejects zero", async ({ page }) => {
  const verify = await openApp(page, "/tools/hawala-tracker/");
  await page.locator("#from").selectOption("us");
  await page.locator("#to").selectOption("ng");
  await page.locator("#amount").fill("1000");
  await page.evaluate(() => compare());
  await expect(page.locator("#resultCard")).toContainText("Total Cost$11.70 (1.2%)");
  await expect(page.locator("#resultCard")).toContainText("Total Cost$72.00 (7.2%)");
  await page.locator("#amount").fill("0");
  await page.evaluate(() => compare());
  await expect(page.locator("#resultCard")).toBeHidden();
  await verify();
});

test("09 Burial estimator proves the Nigeria 100-guest preset and funding response", async ({ page }) => {
  const verify = await openApp(page, "/tools/burial-cost/");
  await page.locator("#guestSlider").fill("100");
  await page.getByRole("button", { name: /Estimate Costs/ }).click();
  await expect(page.locator("#resTotal")).toHaveText("₦1,200,000");
  await expect(page.locator("#resMonthlySave")).toHaveText("₦100,000");
  await page.locator("#availableFund").fill("1200000");
  await page.getByRole("button", { name: /Estimate Costs/ }).click();
  await expect(page.locator("#familyFundingPlan")).toContainText(/funded|gap/i);
  await verify();
});

test("10 Staple basket validates a complete evidence submission without sending it", async ({ page }) => {
  const verify = await openApp(page, "/tools/staple-basket/");
  await page.locator("#report_product_name").fill("Rice 1kg");
  await page.locator("#report_product_category").selectOption("Food Staples");
  await page.locator("#report_price").fill("2500");
  await page.locator("#report_unit").fill("1kg");
  await page.locator("#mdReportMerchant").fill("Synthetic market");
  await page.locator("#mdProofUrl").fill("https://example.test/receipt");
  await expect(page.locator("#basketQuality")).toContainText("6/6");
  await page.locator("#report_unit").fill("");
  await expect(page.locator("#basketQuality")).toContainText("5/6");
  await verify();
});

test("11 Wholesale-retail desk proves margin, markup, target price and invalid clearing", async ({ page }) => {
  const verify = await openApp(page, "/tools/wholesale-retail-spread/");
  for (const [selector, value] of [
    ["#deskWholesale", "100"],
    ["#deskRetail", "150"],
    ["#deskTargetMargin", "20"],
    ["#deskShrinkage", "10"],
    ["#deskUnits", "10"],
  ]) {
    await page.locator(selector).fill(value);
  }
  await expect(page.locator("#spreadDeskOutput")).toContainText("26.7%");
  await expect(page.locator("#spreadDeskOutput")).toContainText("36.4%");
  await expect(page.locator("#spreadDeskOutput")).toContainText("NGN 138");
  await page.locator("#deskWholesale").fill("");
  await expect(page.locator("#spreadDeskOutput")).not.toContainText("26.7%");
  await verify();
});

test("12 Land-size calculator proves area, valuation and planning buffer", async ({ page }) => {
  const verify = await openApp(page, "/tools/land-size/");
  await page.locator("#dimLength").fill("20");
  await page.locator("#dimWidth").fill("30");
  await page.locator("#pricePerUnit").fill("1000");
  await expect(page.locator("#priceResult")).toHaveText("Total: ₦600,000.00");
  await expect(page.locator("#landPlanOutput")).toContainText("510.00Sellable sqm");
  await expect(page.locator("#landPlanOutput")).toContainText("₦48,000Buffer");
  await page.locator("#dimLength").fill("");
  await expect(page.locator("#priceResult")).toBeHidden();
  await verify();
});

for (const fixture of [
  {
    number: "13",
    route: "/tools/naira-to-words/",
    words: "One Thousand Two Hundred and Thirty-Four Naira and Fifty-Six Kobo Only",
    figures: "NGN 1,234.56",
    result: "#result",
  },
  {
    number: "14",
    route: "/tools/amount-words-ke/",
    words: "KENYA SHILLINGS ONE THOUSAND TWO HUNDRED AND THIRTY-FOUR AND CENTS FIFTY-SIX ONLY",
    figures: "KES 1,234.56",
    result: "#wordsResult",
  },
  {
    number: "15",
    route: "/tools/amount-words-gh/",
    words: "GHANA CEDIS ONE THOUSAND TWO HUNDRED AND THIRTY-FOUR AND PESEWAS FIFTY-SIX ONLY",
    figures: "GHS 1,234.56",
    result: "#wordsResult",
  },
]) {
  test(`${fixture.number} amount-to-words route proves subunit conversion and empty clearing`, async ({ page }) => {
    const verify = await openApp(page, fixture.route);
    await page.locator("#amount").fill("1234.56");
    await expect(page.locator(fixture.result)).toContainText(fixture.words);
    await expect(page.locator("#resultCard")).toContainText(fixture.figures);
    await page.locator("#amount").fill("");
    await expect(page.locator("#resultCard")).toBeHidden();
    await verify();
  });
}

test("16 Susu tracker proves a four-member rotation and CSV export", async ({ page }) => {
  const verify = await openApp(page, "/tools/susu-tracker/");
  await page.locator("#members").fill("4");
  await page.locator("#contribution").fill("100");
  await page.locator("#frequency").selectOption("monthly");
  await page.locator("#memberNames").fill("Ama, Kojo, Esi, Kofi");
  await page.locator("#startDate").fill("2026-01-01");
  await page.getByRole("button", { name: "Generate Schedule" }).click();
  await expect(page.locator("#summaryGrid")).toContainText("400");
  await expect(page.locator("#scheduleTable")).toContainText("Ama");
  await expect(page.locator("#scheduleTable")).toContainText("Kofi");
  expect(await page.evaluate(() => scheduleData.length)).toBe(4);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/susu|schedule/i);
  await page.locator("#members").fill("1");
  await page.getByRole("button", { name: "Generate Schedule" }).click();
  await expect(page.locator("#resultCard")).toBeHidden();
  await verify();
});

test("17 WhatsApp generator encodes a Nigerian number/message and clears state", async ({ page }) => {
  const verify = await openApp(page, "/tools/whatsapp-link/");
  await page.locator("#countryCode").selectOption("234");
  await page.locator("#phoneNumber").fill("08012345678");
  await page.locator("#message").fill("Hello test");
  await page.getByRole("button", { name: "Generate Link" }).click();
  await expect(page.locator("#linkDisplay")).toContainText(
    "https://wa.me/2348012345678?text=Hello%20test",
  );
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.locator("#resultArea")).toBeHidden();
  await verify();
});

test("18 Remittance comparator proves recipient value and rejects empty amount", async ({ page }) => {
  const verify = await openApp(page, "/tools/remittance-compare/");
  await page.locator("#rcAmount").fill("500");
  await page.locator("#rcFrom").selectOption("US");
  await page.locator("#rcTo").selectOption("NG");
  await page.locator("#rcCompareBtn").click();
  await expect(page.locator("#rcResultsTitle")).toHaveText("Sending $ 500 to Nigeria");
  await expect(page.locator("#rcSavings")).toContainText("₦ 33,766");
  await page.locator("#rcAmount").fill("");
  await page.locator("#rcCompareBtn").click();
  await expect(page.locator("#rcResults")).not.toHaveClass(/\bactive\b/);
  await verify();
});

test("19 Informal FX desk proves midpoint, spread, quote and invalid clearing", async ({ page }) => {
  const verify = await openApp(page, "/tools/informal-fx-watch/");
  await page.locator("#fxAmount").fill("100");
  await page.locator("#fxBuy").fill("1500");
  await page.locator("#fxSell").fill("1600");
  await expect(page.locator("#fxDeskOutput")).toContainText("1550.00");
  await expect(page.locator("#fxDeskOutput")).toContainText("6.45%");
  await expect(page.locator("#fxDeskOutput")).toContainText("150,000");
  await page.locator("#fxBuy").fill("");
  await expect(page.locator("#fxDeskOutput")).not.toContainText("1550.00");
  await verify();
});

test("20 Remittance v2 proves the editable scenario model and invalid amount state", async ({ page }) => {
  const verify = await openApp(page, "/tools/remittance-v2/");
  await page.locator("#fromCountry").selectOption("US");
  await page.locator("#toCountry").selectOption("NG");
  await page.locator("#amount").fill("1000");
  await page.locator("#providerFee").fill("10");
  await page.locator("#fxMargin").fill("2");
  await page.getByRole("button", { name: "Compare" }).click();
  await expect(page.locator("#results")).toContainText(/recipient|effective|cost/i);
  await page.locator("#amount").fill("0");
  await page.getByRole("button", { name: "Compare" }).click();
  await expect(page.locator("#results")).toBeHidden();
  await verify();
});

test("21 Cost-of-living comparator proves city totals and household budget response", async ({ page }) => {
  const verify = await openApp(page, "/tools/cost-of-living/");
  await page.locator("#city1").selectOption("nairobi");
  await page.locator("#city2").selectOption("joburg");
  await page.locator("#incomeUsd").fill("2000");
  await page.evaluate(() => compare());
  await expect(page.locator("#summary")).toContainText("$796/mo");
  await expect(page.locator("#summary")).toContainText("$1,093/mo");
  await expect(page.locator("#budgetPlan")).toContainText("$1,204 monthly buffer");
  await page.locator("#householdSize").fill("4");
  await page.evaluate(() => compare());
  await expect(page.locator("#budgetPlan")).not.toContainText("$1,204 monthly buffer");
  await verify();
});

test("22 AfroAtlas generates a Nigeria investment brief and clears on unknown selection", async ({ page }) => {
  const verify = await openApp(page, "/tools/afroatlas/");
  await page.locator("#aa-brief-country").selectOption("NG");
  await page.locator("#aa-brief-angle").selectOption("investment");
  await page.locator("#aa-brief-budget").fill("1000");
  await page.locator("#aa-brief-generate").click();
  await expect(page.locator("#aa-brief-status")).toHaveText("Brief generated");
  await expect(page.locator("#aa-brief-output")).toContainText("GDP$363B");
  await expect(page.locator("#aa-brief-output")).toContainText("Population224M");
  await page.locator("#aa-brief-country").evaluate((element) => {
    element.value = "";
  });
  await page.locator("#aa-brief-generate").click();
  await expect(page.locator("#aa-brief-status")).not.toHaveText("Brief generated");
  await verify();
});

test("23 AfroPoints planner independently proves points gap, report count and timeline", async ({ page }) => {
  const verify = await openApp(page, "/tools/afropoints/");
  await page.locator("#apPlanCurrent").fill("100");
  await page.locator("#apPlanGoal").selectOption("2000");
  await page.locator("#apPlanWeekly").fill("5");
  await expect(page.locator("#apPlanResult")).toContainText("1,900 pts");
  await expect(page.locator("#apPlanResult")).toContainText("136");
  await expect(page.locator("#apPlanResult")).toContainText("28 weeks");
  await page.locator("#apPlanWeekly").fill("0");
  await expect(page.locator("#apPlanResult")).not.toContainText("28 weeks");
  await verify();
});

test("24 AfroKitchen builds three distinct days and reopens its text export", async ({ page }) => {
  const verify = await openApp(page, "/tools/afrokitchen/");
  await expect(page.locator("#cook-this-week")).toBeVisible();
  await expect(page.locator("#ak-plan-result")).toContainText("generate a 3-day or 7-day plan", {
    timeout: 30000,
  });
  await page.locator("#ak-plan-days").selectOption("3");
  await page.locator("#ak-plan-time").selectOption("999");
  await page.locator("#ak-plan-servings").fill("5");
  await page.locator("#ak-plan-generate").click();
  await expect(page.locator("#ak-plan-result")).toContainText("3-day plan ready", {
    timeout: 30000,
  });
  await expect(page.locator(".ak-plan-day")).toHaveCount(3);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#ak-plan-export").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("afrokitchen-3-day-plan.txt");
  const content = require("node:fs").readFileSync(await download.path(), "utf8");
  expect(content).toContain("AfroKitchen 3-day recipe plan");
  expect(content).toContain("Shopping list");
  await page.locator("#ak-plan-diet").selectOption("vegan");
  await page.locator("#ak-plan-country").selectOption("SS");
  await page.locator("#ak-plan-occasion").selectOption("street-food");
  await page.locator("#ak-plan-generate").click();
  await expect(page.locator("#ak-plan-status")).toContainText("No complete plan generated", {
    timeout: 30000,
  });
  await verify();
});

test("25 Africa Conflict builds a bounded brief and reopens its JSON export", async ({ page }) => {
  const verify = await openApp(page, "/tools/africa-conflict/");
  await page.locator("#acd-brief-conflict").selectOption({ index: 1 });
  await page.locator("#acd-brief-audience").selectOption("ngo");
  await page.locator("#acd-brief-length").selectOption("one-page");
  await page.locator("#acd-brief-conflict").dispatchEvent("change");
  await expect(page.locator("#acd-brief-result")).toContainText("Caveat:");
  await expect(page.locator("#acd-brief-result")).toContainText("Not security advice");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#acd-brief-export-json").click();
  const parsed = JSON.parse(
    require("node:fs").readFileSync(await (await downloadPromise).path(), "utf8"),
  );
  expect(parsed).toHaveProperty("conflict");
  expect(JSON.stringify(parsed)).toMatch(/source|caveat|method/i);
  await verify();
});

test("26 Bride-price advisor proves the Kenya planning target without pricing culture", async ({ page }) => {
  const verify = await openApp(page, "/tools/brideprice-advisor/");
  await page.locator("#country").selectOption("KE");
  await page.locator("#bpSaved").fill("100000");
  await page.locator("#bpMonths").fill("6");
  await page.locator("#bpHouseholds").fill("2");
  await page.locator("#country").dispatchEvent("change");
  await expect(page.locator("#bpPlanOutput")).toContainText("KSh330,000");
  await expect(page.locator("#bpPlanOutput")).toContainText("KSh230,000");
  await expect(page.locator("#bpPlanOutput")).toContainText("KSh38,334");
  await expect(page.locator("#bpPlanOutput")).toContainText(/starting point|respect|family/i);
  await page.locator("#bpSaved").fill("330000");
  await expect(page.locator("#bpPlanOutput")).not.toContainText("KSh230,000");
  await verify();
});

test("27 Ajo interest calculator proves pool, fee, position and invalid clearing", async ({ page }) => {
  const verify = await openApp(page, "/tools/ajo-interest/");
  await page.locator("#members").fill("4");
  await page.locator("#position").fill("2");
  await page.locator("#contribution").fill("100");
  await page.locator("#fee").fill("10");
  await page.getByRole("button", { name: "Calculate Rotation" }).click();
  await expect(page.locator("#rTotal")).toHaveText("₦400");
  await expect(page.locator("#results")).toContainText("₦360");
  await expect(page.locator("#results")).toContainText("month 2");
  await page.locator("#contribution").fill("0");
  await page.getByRole("button", { name: "Calculate Rotation" }).click();
  await expect(page.locator("#results")).toBeHidden();
  await verify();
});

test("28 Diaspora guide returns the Nigeria-UK treaty checklist and official links", async ({ page }) => {
  const verify = await openApp(page, "/tools/diaspora-guide/");
  await page.locator("#homeCountry").selectOption("NG");
  await page.locator("#resCountry").selectOption("UK");
  await page.getByRole("button", { name: "Get Guide" }).click();
  await expect(page.locator("#taxPlanOutput")).toContainText("Nigeria -> United Kingdom");
  await expect(page.locator("#taxPlanOutput")).toContainText("DTA in force");
  await expect(page.locator("#taxPlanOutput")).toContainText("January 31");
  await expect(page.locator("#taxPlanOutput a")).toHaveCount(2);
  await page.locator("#resCountry").evaluate((element) => {
    element.value = "";
  });
  await page.getByRole("button", { name: "Get Guide" }).click();
  await expect(page.locator("#results")).toContainText("Select both a home country");
  await verify();
});

test("29 Nollywood pitch proves budget buckets, funding gap and shoot-day cost", async ({ page }) => {
  const verify = await openApp(page, "/tools/nollywood-pitch/");
  await page.locator("#country").selectOption("NG");
  await page.locator("#pitchDays").fill("10");
  await page.locator("#pitchFunded").fill("30");
  await page.locator("#country").dispatchEvent("change");
  await expect(page.locator("#summaryGrid")).toContainText("₦5,890,500");
  await expect(page.locator("#pitchOutput")).toContainText("₦4,123,350");
  await expect(page.locator("#pitchOutput")).toContainText("₦589,050");
  await page.locator("#pitchFunded").fill("100");
  await expect(page.locator("#pitchOutput")).not.toContainText("₦4,123,350");
  await verify();
});

test("30 Okada income tracker proves daily-to-monthly arithmetic and invalid clearing", async ({ page }) => {
  const verify = await openApp(page, "/tools/okada-income/");
  await page.locator("#trips").fill("10");
  await page.locator("#fare").fill("1000");
  await page.locator("#days").fill("5");
  await page.locator("#fuel").fill("10000");
  await page.getByRole("button", { name: "Calculate Income" }).click();
  await expect(page.locator("#resultGrid")).toContainText("186,500");
  await expect(page.locator("#resultGrid")).toContainText("-4,165");
  await expect(page.locator("#riderPlan")).toContainText("11 trips/day");
  await page.locator("#trips").fill("0");
  await page.getByRole("button", { name: "Calculate Income" }).click();
  await expect(page.locator("#resultCard")).toBeHidden();
  await verify();
});

test("31 Market-days calendar proves the 2026 cycle and a named-market trip brief", async ({ page }) => {
  const verify = await openApp(page, "/tools/market-days/");
  await page.locator("#lookupDate").fill("2026-01-01");
  await page.locator("#lookupDate").dispatchEvent("change");
  await expect(page.locator("#calendarGrid")).toContainText("1Ori");
  await page.locator("#tripMarket").selectOption({ index: 1 });
  await page.locator("#buildTripPlan").click();
  await expect(page.locator("#tripPlannerOutput")).toContainText("Sat, 3 Jan 2026");
  await expect(page.locator("#tripPlannerOutput")).toContainText("Awka (Wikipedia)");
  await page.locator("#marketSearch").fill("Emene");
  await expect(page.locator("#resultsCount")).toHaveText("1 result");
  await verify();
});

test("32 Ajo-Chama calculator proves four rounds, reserve and reset", async ({ page }) => {
  const verify = await openApp(page, "/tools/ajo-chama/");
  await page.locator("#numMembers").fill("4");
  await page.locator("#contribution").fill("100");
  await page.locator("#startDate").fill("2026-01-01");
  await page.getByRole("button", { name: "Generate Schedule" }).click();
  await expect(page.locator("#resultsCard")).toContainText("4Members");
  await expect(page.locator("#resultsCard")).toContainText("₦ 400");
  await expect(page.locator("#scheduleBody tr")).toHaveCount(4);
  await expect(page.locator("#constitutionPlan")).toContainText("₦ 80");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#resultsCard")).toBeHidden();
  await expect(page.locator("#scheduleCard")).toBeHidden();
  await verify();
});

test("33 AfroPrices search proves fixture ranking and clears an empty query", async ({ page }) => {
  const verify = await openApp(page, "/tools/afroprices/");
  await page.locator("#apSearchInput").fill("rice");
  await page.locator("#apSearchBtn").click();
  await expect(page.locator("#apResultsTitle")).toHaveText('1 result for "rice"');
  await expect(page.locator("#apDecisionOutput")).toContainText("₦75,000");
  await expect(page.locator("#apDecisionOutput")).toContainText("₦82,000");
  await page.locator("#apSearchInput").fill("");
  await page.locator("#apSearchBtn").click();
  await expect(page.locator("#apResultsSection")).toBeHidden();
  await verify();
});

test("34 Ankara-Kente calculator proves fabric and three-piece production quote", async ({ page }) => {
  const verify = await openApp(page, "/tools/ankara-kente-cost/");
  await page.locator("#pricePerYard").fill("1000");
  await page.locator("#yards").fill("5");
  await page.getByRole("button", { name: "Calculate Fabric Cost" }).click();
  await expect(page.locator("#totalCost")).toHaveText("₦5,000");
  await expect(page.locator("#productionQuote")).toContainText("₦22,725");
  await expect(page.locator("#productionQuote")).toContainText("₦68,175");
  await page.locator("#yards").fill("0");
  await page.getByRole("button", { name: "Calculate Fabric Cost" }).click();
  await expect(page.locator("#results")).toBeHidden();
  await verify();
});

test("35 Fabric-cost calculator proves wastage, notions, quote and invalid clearing", async ({ page }) => {
  const verify = await openApp(page, "/tools/fabric-cost/");
  await page.locator("#pricePerYard").fill("1000");
  await page.locator("#yardsNeeded").fill("5");
  await page.getByRole("button", { name: "Calculate Material Cost" }).click();
  await expect(page.locator("#totalPerPiece")).toHaveText("₦6,950");
  await expect(page.locator("#garmentQuote")).toContainText("₦16,950");
  await expect(page.locator("#garmentQuote")).toContainText("₦23,730");
  await page.locator("#pricePerYard").fill("0");
  await page.getByRole("button", { name: "Calculate Material Cost" }).click();
  await expect(page.locator("#results")).toBeHidden();
  await verify();
});
