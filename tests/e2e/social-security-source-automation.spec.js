const { test, expect } = require("@playwright/test");

test("social security source-backed totals and mobile layout", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/tools/social-security/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#country option")).toHaveCount(35);
  await expect(page.getByRole("link", { name: "Kenya NSSF Year 4 employer notice" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cameroon CNPS 2025 statistical yearbook rate table" })).toBeVisible();

  const cases = [
    { country: "ZA", salary: "50000", employee: "177", employer: "677", absent: "Retirement Fund" },
    { country: "CI", salary: "4000000", employee: "212,625", employer: "266,438" },
    { country: "CM", salary: "1000000", employee: "31,500", employer: "109,000" }
  ];

  for (const item of cases) {
    await page.locator("#country").selectOption(item.country);
    await page.locator("#monthly-salary").fill(item.salary);
    await page.locator("#calc-btn").click();
    await expect(page.locator("#results")).toBeVisible();
    await expect(page.locator("#r-employee-total")).toContainText(item.employee);
    await expect(page.locator("#r-employer-total")).toContainText(item.employer);
    if (item.absent) await expect(page.locator("#r-schemes")).not.toContainText(item.absent);
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
