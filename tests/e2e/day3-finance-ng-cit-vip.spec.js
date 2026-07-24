const { test, expect } = require("@playwright/test");

const routes = [
  {
    name: "en",
    path: "/tools/ng-cit/",
    lang: "en",
    width: 320,
    heading: "Model company tax without mixing the old and new regimes.",
    button: "Calculate CIT estimate",
    other: "Other company",
  },
  {
    name: "fr",
    path: "/fr/tools/ng-impot-societes/",
    lang: "fr",
    width: 360,
    heading: "Estimez l’impôt société sans mélanger les deux régimes.",
    button: "Calculer l’estimation CIT",
    other: "Autre société",
  },
  {
    name: "ha",
    path: "/ha/kayan-aiki/cit-najeriya/",
    lang: "ha",
    width: 375,
    heading:
      "Kimanta harajin kamfani ba tare da haɗa tsohon tsari da sabon tsari ba.",
    button: "Lissafa kimanta CIT",
    other: "Wani kamfani",
  },
  {
    name: "yo",
    path: "/yo/awon-ise/cit-naijiria/",
    lang: "yo",
    width: 390,
    heading: "Ṣe àfojúsùn owó-orí ilé-iṣẹ́ láì da ètò àtijọ́ pọ̀ mọ́ tuntun.",
    button: "Ṣe àfojúsùn CIT",
    other: "Ilé-iṣẹ́ mìíràn",
  },
];

function channel(value) {
  value /= 255;
  return value <= 0.03928
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}
function contrast(a, b) {
  const parse = (value) => value.match(/\d+/g).slice(0, 3).map(Number);
  const x = parse(a),
    y = parse(b);
  const lx =
    0.2126 * channel(x[0]) + 0.7152 * channel(x[1]) + 0.0722 * channel(x[2]);
  const ly =
    0.2126 * channel(y[0]) + 0.7152 * channel(y[1]) + 0.0722 * channel(y[2]);
  return (Math.max(lx, ly) + 0.05) / (Math.min(lx, ly) + 0.05);
}

for (const route of routes) {
  test(`${route.name} Nigeria CIT route is native, local and mobile-safe`, async ({
    page,
  }) => {
    const errors = [],
      nonGet = [],
      dataRequests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (request.method() !== "GET")
        nonGet.push(`${request.method()} ${request.url()}`);
      if (/\.netlify\/functions|\/api\//i.test(request.url()))
        dataRequests.push(request.url());
    });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.setViewportSize({ width: route.width, height: 820 });
    await page.goto(route.path, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", route.lang);
    await expect(page.locator("h1")).toHaveText(route.heading);
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(5);
    await expect(page.locator('a[href="undefined"]')).toHaveCount(0);
    await expect(
      page.locator(
        'a[href="https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf"]',
      ),
    ).toBeVisible();
    const before = await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }));
    await page.locator('[name="scopeConfirmed"]').check();
    await page.getByRole("button", { name: route.button }).press("Enter");
    await expect(page.locator("[data-result]")).toBeVisible();
    await expect(page.locator("[data-total]")).toHaveAttribute(
      "data-amount",
      "2500000",
    );
    await expect(page.locator("[data-classification]")).toHaveText(route.other);
    await expect(page.locator("[data-formula]")).toContainText("30%");
    await expect(page.locator("[data-formula]")).toContainText("4%");
    expect(
      await page.evaluate(() => ({
        local: { ...localStorage },
        session: { ...sessionStorage },
      })),
    ).toEqual(before);
    await page.locator('[name="turnover"]').focus();
    expect(
      parseFloat(
        await page
          .locator('[name="turnover"]')
          .evaluate((node) => getComputedStyle(node).outlineWidth),
      ),
    ).toBeGreaterThanOrEqual(3);
    const colors = await page
      .locator(".cit-button")
      .first()
      .evaluate((node) => {
        const s = getComputedStyle(node);
        return { fg: s.color, bg: s.backgroundColor };
      });
    expect(contrast(colors.fg, colors.bg)).toBeGreaterThanOrEqual(4.5);
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/\uFFFD|\u00C3.|\u00C2.|\u00E2\u20AC/);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    expect(await page.locator("button,a").allTextContents()).not.toContain(
      "Download PDF",
    );
    expect(dataRequests).toEqual([]);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `artifacts/day3-finance-ng-cit/ng-cit-${route.name}-${route.width}-dark.png`,
      fullPage: true,
    });
  });
}

test("statutory boundaries, professional-services exclusion and ETR review are explicit", async ({
  page,
}) => {
  await page.goto("/tools/ng-cit/");
  await page.locator('[name="turnover"]').fill("50000000");
  await page.locator('[name="fixedAssets"]').fill("250000000");
  await page.locator('[name="totalProfits"]').fill("10000000");
  await page.locator('[name="assessableProfits"]').fill("12000000");
  await page.locator('[name="scopeConfirmed"]').check();
  await page.getByRole("button", { name: "Calculate CIT estimate" }).click();
  await expect(page.locator("[data-classification]")).toHaveText(
    "Qualifying small company",
  );
  await expect(page.locator("[data-total]")).toHaveAttribute(
    "data-amount",
    "0",
  );
  await page.locator('[name="professionalServices"]').check();
  await page.getByRole("button", { name: "Calculate CIT estimate" }).click();
  await expect(page.locator("[data-classification]")).toHaveText(
    "Other company",
  );
  await expect(page.locator("[data-total]")).toHaveAttribute(
    "data-amount",
    "3480000",
  );
  await page.locator('[name="professionalServices"]').uncheck();
  await page.locator('[name="turnover"]').fill("20000000000");
  await page.getByRole("button", { name: "Calculate CIT estimate" }).click();
  await expect(page.locator("[data-etr-warning]")).toBeVisible();
  await expect(page.locator("[data-etr-warning]")).toContainText(
    "does not invent",
  );
});

test("scope validation is keyboard-visible and TXT export preserves formula and caveat", async ({
  page,
}) => {
  await page.goto("/tools/ng-cit/");
  await page.getByRole("button", { name: "Calculate CIT estimate" }).click();
  await expect(page.locator("[data-error]")).toContainText(
    "Confirm the calculator scope",
  );
  await expect(page.locator('[name="scopeConfirmed"]')).toBeFocused();
  await page.locator('[name="scopeConfirmed"]').check();
  await page.getByRole("button", { name: "Calculate CIT estimate" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download TXT" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("nigeria-cit-estimate.txt");
  const stream = await download.createReadStream();
  let text = "";
  for await (const chunk of stream) text += chunk.toString("utf8");
  expect(text).toContain("Formula:");
  expect(text).toContain("Planning estimate only");
  expect(text).toContain("Development levy");
});

test("English calculator reflows at 200% text in light mode", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/tools/ng-cit/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page
      .locator("main")
      .evaluate((node) => node.scrollWidth - node.clientWidth),
  ).toBeLessThanOrEqual(0);
  expect(
    await page
      .locator("main *")
      .evaluateAll((nodes) =>
        nodes
          .filter(
            (node) =>
              node.getClientRects().length &&
              (node.getBoundingClientRect().left < 0 ||
                node.getBoundingClientRect().right > innerWidth),
          )
          .map((node) => node.tagName),
      ),
  ).toEqual([]);
  await expect(
    page.getByRole("button", { name: "Calculate CIT estimate" }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/day3-finance-ng-cit/ng-cit-en-320-light-200pct.png",
    fullPage: true,
  });
});

test("manual dark theme wins over a light operating-system preference", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/tools/ng-cit/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  const colors = await page.locator(".cit-page").evaluate((node) => {
    const styles = getComputedStyle(node);
    return { foreground: styles.color, background: styles.backgroundColor };
  });
  expect(contrast(colors.foreground, colors.background)).toBeGreaterThanOrEqual(
    4.5,
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
