const { test, expect } = require("@playwright/test");

const IDEA = "/sw/zana/kichunguzi-ushahidi-wa-mawazo/";
const PAYSTACK = "/sw/zana/mpangaji-ada-za-paystack/";
const BURKINA = "/sw/burkina-faso/kikokotoo-vat/";

test("Swahili idea evidence explorer is native, local-first and fail-honest", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => requests.push({ method: request.method(), url: request.url() }));
  await page.route("**/.netlify/functions/idea-evidence**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reportedTotal: 1,
        rows: [{
          id: "sw-owner-idea",
          name: "Huduma ya sola ya mfano",
          country_code: "KE",
          country_name: "Kenya",
          sector: "energy",
          risk: "medium",
          currency: "KES",
          startup_cost_min: 1000,
          startup_cost_max: 1500,
          monthly_revenue_min: 300,
          monthly_revenue_max: 500,
          breakeven_months_min: 4,
          breakeven_months_max: 7,
          created_at: "2026-07-23",
        }],
      }),
    }),
  );
  await page.goto(IDEA);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.getByText("Hakuna maandishi yanayotumwa kwa huduma ya AI.")).toBeVisible();
  await expect(page.locator("[data-status]")).toContainText("Hakuna ombi");
  expect(requests.some((request) => request.url.includes("/.netlify/functions/idea-evidence"))).toBe(false);

  await page.locator("[data-search-form]").evaluate((form) => form.requestSubmit());
  await expect(page.locator(".iee-card")).toHaveCount(1);
  await page.locator('[data-action^="add:"]').click();
  await expect(page.locator(".iee-compare-card")).toContainText("Huduma ya sola");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("afrotools:idea-evidence-shortlist:v1")),
  );
  expect(saved.locale).toBe("sw");
  expect(saved.items).toHaveLength(1);
  expect(requests.filter((request) => request.method !== "GET")).toEqual([]);
  expect(requests.some((request) => /(?:ai|chat|router)/i.test(request.url))).toBe(false);
});

test("Swahili Paystack planner preserves oracle, invalid state and local exports", async ({ page }) => {
  await page.goto(PAYSTACK);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  const form = page.locator("[data-form]");
  await form.locator('[name="amount"]').fill("10000");
  await form.locator('[name="count"]').fill("2");
  await form.evaluate((node) => node.requestSubmit());
  await expect(page.locator("[data-status]")).toContainText("yamekokotolewa");
  await expect(page.locator("[data-report]")).toContainText("NGN");
  await expect(page.locator("[data-report]")).toContainText("Ada ya uchakataji: NGN 250");

  await form.locator('[name="amount"]').fill("0");
  await form.evaluate((node) => node.requestSubmit());
  await expect(page.locator("[data-status]")).toContainText("kikubwa kuliko 0");
  await expect(page.locator("[data-results]")).toBeHidden();

  await form.locator('[name="amount"]').fill("10000");
  await form.evaluate((node) => node.requestSubmit());
  for (const kind of ["txt", "csv", "json", "pdf"]) {
    const pending = page.waitForEvent("download");
    await page.locator(`[data-action="${kind}"]`).click();
    const download = await pending;
    expect(await download.path()).toBeTruthy();
  }
});

test("Swahili Burkina Faso VAT calls the shared TVA engine and rejects zero", async ({ page }) => {
  await page.goto(BURKINA);
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await page.evaluate(() => {
    const original = window.TVAEngine.calculate;
    window.__swTvaCalls = 0;
    window.TVAEngine.calculate = function () {
      window.__swTvaCalls += 1;
      return original.apply(this, arguments);
    };
  });
  await page.locator("#amount").fill("10000");
  await page.getByRole("button", { name: "Kokotoa VAT" }).click();
  await expect(page.locator("#vatAmount")).toContainText("1,800");
  expect(await page.evaluate(() => window.__swTvaCalls)).toBeGreaterThan(0);

  await page.locator("#amount").fill("0");
  await page.getByRole("button", { name: "Kokotoa VAT" }).click();
  await expect(page.locator("#formError")).toContainText("kikubwa kuliko sifuri");
  await expect(page.locator("#amount")).toBeFocused();
});
