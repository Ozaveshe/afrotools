const { test, expect } = require("@playwright/test");

const routes = [
  {
    path: "/tools/ke-cgt/",
    lang: "en",
    width: 320,
    heading: "Estimate Kenya CGT with the formula and evidence in view.",
    button: "Calculate CGT estimate",
  },
  {
    path: "/fr/tools/ke-plus-value/",
    lang: "fr",
    width: 360,
    heading: "Estimez la CGT kenyane avec la formule et les preuves en vue.",
    button: "Calculer la CGT estimée",
  },
];

function channel(value) {
  value /= 255;
  return value <= 0.03928
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}
function contrast(a, b) {
  const parse = (value) => value.match(/\d+/g).slice(0, 3).map(Number),
    x = parse(a),
    y = parse(b);
  const lx =
    0.2126 * channel(x[0]) + 0.7152 * channel(x[1]) + 0.0722 * channel(x[2]);
  const ly =
    0.2126 * channel(y[0]) + 0.7152 * channel(y[1]) + 0.0722 * channel(y[2]);
  return (Math.max(lx, ly) + 0.05) / (Math.min(lx, ly) + 0.05);
}

for (const route of routes) {
  test(`${route.lang} Kenya CGT is native, local, dark and mobile-safe`, async ({
    page,
  }) => {
    const errors = [],
      writes = [],
      apiRequests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (request.method() !== "GET")
        writes.push(`${request.method()} ${request.url()}`);
      if (/\.netlify\/functions|\/api\//i.test(request.url()))
        apiRequests.push(request.url());
    });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width: route.width, height: 820 });
    await page.goto(route.path, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", route.lang);
    await expect(page.locator("h1")).toHaveText(route.heading);
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(3);
    await page.locator('[name="scopeConfirmed"]').check();
    await page.getByRole("button", { name: route.button }).click();
    await expect(page.locator("[data-result]")).toBeVisible();
    await expect(page.locator("[data-tax]")).toHaveAttribute(
      "data-amount",
      "825000",
    );
    await page.locator('[name="transferValue"]').focus();
    expect(
      parseFloat(
        await page
          .locator('[name="transferValue"]')
          .evaluate((node) => getComputedStyle(node).outlineWidth),
      ),
    ).toBeGreaterThanOrEqual(3);
    const colors = await page
      .locator(".ke-button")
      .first()
      .evaluate((node) => {
        const style = getComputedStyle(node);
        return { fg: style.color, bg: style.backgroundColor };
      });
    expect(contrast(colors.fg, colors.bg)).toBeGreaterThanOrEqual(4.5);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    expect(await page.locator("body").innerText()).not.toMatch(
      /\uFFFD|\u00C3.|\u00C2.|\u00E2\u20AC/,
    );
    expect(apiRequests).toEqual([]);
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `artifacts/day3-finance-ke-cgt/ke-cgt-${route.lang}-${route.width}-dark.png`,
      fullPage: true,
    });
  });
}

test("exemption needs explicit evidence confirmation and TXT export is local", async ({
  page,
}) => {
  await page.goto("/tools/ke-cgt/");
  await page.getByRole("button", { name: "Calculate CGT estimate" }).click();
  await expect(page.locator('[name="scopeConfirmed"]')).toBeFocused();
  await page.locator('[name="scopeConfirmed"]').check();
  await page.locator('[name="exemptionClaimed"]').check();
  await page.getByRole("button", { name: "Calculate CGT estimate" }).click();
  await expect(page.locator('[name="exemptionConfirmed"]')).toBeFocused();
  await page.locator('[name="exemptionConfirmed"]').check();
  await page.getByRole("button", { name: "Calculate CGT estimate" }).click();
  await expect(page.locator("[data-tax]")).toHaveAttribute("data-amount", "0");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download TXT" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("kenya-cgt-estimate.txt");
  const stream = await download.createReadStream();
  let text = "";
  for await (const chunk of stream) text += chunk.toString("utf8");
  expect(text).toContain("Confirmed exemption applied");
  expect(text).toContain("Planning estimate only");
});

test("manual theme overrides system theme and 200% text reflows", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 820 });
  await page.goto("/tools/ke-cgt/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.fontSize = "200%";
  });
  const light = await page
    .locator(".ke-card")
    .first()
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(light).toBe("rgb(255, 255, 255)");
  expect(
    await page
      .locator("main")
      .evaluate((node) => node.scrollWidth - node.clientWidth),
  ).toBeLessThanOrEqual(0);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
    document.documentElement.dataset.theme = "dark";
  });
  const dark = await page
    .locator(".ke-card")
    .first()
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(dark).not.toBe("rgb(255, 255, 255)");
  await page.screenshot({
    path: "artifacts/day3-finance-ke-cgt/ke-cgt-en-375-manual-dark.png",
    fullPage: true,
  });
});
