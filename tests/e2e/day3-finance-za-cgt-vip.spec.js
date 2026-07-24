const { test, expect } = require("@playwright/test");

const route = "/tools/za-cgt/";

test("calculates the reviewed individual example without console errors", async ({
  page,
}) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(route);
  await page.getByLabel(/in-scope 2027 disposal/i).check();
  await page.getByRole("button", { name: "Calculate CGT estimate" }).click();
  await expect(page.locator("[data-tax]")).toHaveText("R 101 816,00");
  await expect(page.locator("[data-taxable]")).toHaveText("R 280 000,00");
  await expect(page.locator("[data-result]")).toBeVisible();
  expect(errors).toEqual([]);
});

test("residence controls, source links and local TXT export are truthful", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByLabel("Asset treatment").selectOption("residence");
  await expect(page.getByLabel(/qualifying primary residence/i)).toBeVisible();
  await page.getByLabel(/qualifying primary residence/i).check();
  await page.getByLabel(/in-scope 2027 disposal/i).check();
  await page.getByRole("button", { name: "Calculate CGT estimate" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download TXT" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    "south-africa-cgt-2027-estimate.txt",
  );
  await expect(
    page.locator(
      '[data-tool-verification-panel] .za-cgt-list a[href*="sars.gov.za"]',
    ),
  ).toHaveCount(3);
  await expect(page.getByText(/No PDF is offered/)).toBeVisible();
});

test("mobile layout has no horizontal overflow and keyboard labels remain available", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(route);
  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
  await expect(page.getByLabel("Disposal proceeds (R)")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Calculate CGT estimate" }),
  ).toHaveCSS("min-height", "44px");
});

test("manual dark and explicit light themes both render readable controls", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(route);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  const dark = await page.locator("[data-za-cgt-app]").evaluate((node) => ({
    page: getComputedStyle(document.body).backgroundColor,
    card: getComputedStyle(node).backgroundColor,
    ink: getComputedStyle(node).color,
  }));
  expect(dark.page).not.toBe("rgb(243, 248, 244)");
  expect(dark.card).toBe("rgb(21, 32, 25)");
  expect(dark.ink).not.toBe("rgb(21, 32, 25)");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
  });
  await expect(page.locator("[data-za-cgt-app]")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
});

test("out-of-year dates and unconfirmed scope fail closed", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Calculate CGT estimate" }).click();
  await expect(page.locator("[data-error]")).toContainText(
    "Confirm the calculator scope",
  );
  await page.getByLabel(/in-scope 2027 disposal/i).check();
  await page.getByLabel("Disposal date").evaluate((node) => {
    node.removeAttribute("min");
    node.value = "2026-02-28";
  });
  await page.getByRole("button", { name: "Calculate CGT estimate" }).click();
  await expect(page.locator("[data-error]")).toContainText(
    "Choose a disposal date",
  );
});
