const { test, expect } = require("@playwright/test");

function collectRuntimeFailures(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  return failures;
}

test("French Burkina Faso VAT uses the shared formula and keeps PDF export free", async ({
  page,
}) => {
  const failures = collectRuntimeFailures(page);
  const sameOriginWrites = [];
  page.on("request", (request) => {
    if (
      request.method() !== "GET" &&
      /^http:\/\/127\.0\.0\.1:\d+\//.test(request.url())
    )
      sameOriginWrites.push(`${request.method()} ${request.url()}`);
  });

  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/fr/burkina-faso/calculateur-tva", {
    waitUntil: "networkidle",
  });

  await page.locator("#amount").fill("100000");
  await page.getByRole("button", { name: /Calculer la TVA/i }).click();
  await expect(page.locator("#resContent")).toContainText("100");
  await expect(page.locator("#resContent")).toContainText("18");
  await expect(page.locator("#resAmount")).toContainText("118");

  const exact = await page.evaluate(() =>
    window.TVAEngine.calculate(118000, 0.18, "remove"),
  );
  expect(exact.ht).toBeCloseTo(100000, 6);
  expect(exact.tva).toBeCloseTo(18000, 6);
  expect(exact.ttc).toBe(118000);

  await expect(
    page.getByRole("button", { name: /Télécharger le PDF/i }),
  ).toBeEnabled();
  await expect(page.locator("afro-email-gate")).toHaveCount(0);
  await expect(page.getByText(/Source officielle à confirmer/i)).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
  expect(sameOriginWrites).toEqual([]);
  expect(failures).toEqual([]);
});

test("French Guinea-Bissau VAT is native, exact, evidence-gated and local", async ({
  page,
}) => {
  const failures = collectRuntimeFailures(page);
  const sameOriginWrites = [];
  page.on("request", (request) => {
    if (
      request.method() !== "GET" &&
      /^http:\/\/127\.0\.0\.1:\d+\//.test(request.url())
    )
      sameOriginWrites.push(`${request.method()} ${request.url()}`);
  });

  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/fr/guinea-bissau/gw-vat", { waitUntil: "networkidle" });

  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "index,follow",
  );
  await expect(page.locator("h1")).toHaveText(
    "Calculateur de TVA Guinée-Bissau",
  );
  await expect(page.locator("#gwvAmount")).toHaveValue("100000");
  await expect(page.locator("#gwvNet")).toContainText("100");
  await expect(page.locator("#gwvVat")).toContainText("19");
  await expect(page.locator("#gwvGross")).toContainText("119");

  await page.getByRole("button", { name: "Extraire la TVA" }).click();
  await page.locator("#gwvAmount").fill("119000");
  await expect(page.locator("#gwvNet")).toContainText("100");
  await expect(page.locator("#gwvVat")).toContainText("19");

  await page.locator("#gwvRate").selectOption("confirmed-annex-1-ten");
  await expect(page.locator("#gwvError")).toContainText(/preuve CIVA/i);
  await page.locator("#gwvEvidence").check();
  await expect(page.locator("#gwvError")).toBeEmpty();

  await expect(
    page.getByRole("button", { name: /Télécharger le PDF local/i }),
  ).toBeEnabled();
  await expect(page.getByRole("heading", { name: "Sources officielles" })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => /gw.?vat/i.test(key)),
    ),
  ).toEqual([]);
  expect(sameOriginWrites).toEqual([]);
  expect(failures).toEqual([]);
});
