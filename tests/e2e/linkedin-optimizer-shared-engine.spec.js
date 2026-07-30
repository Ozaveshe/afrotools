const { expect, test } = require("@playwright/test");

const ROUTES = [
  {
    locale: "English",
    route: "/tools/linkedin-optimizer/",
    button: /Optimise My Profile/i,
    lang: /^en/,
    canonical: "https://afrotools.com/tools/linkedin-optimizer/",
  },
  {
    locale: "French",
    route: "/fr/tools/optimiseur-linkedin/",
    button: /Optimiser mon profil/i,
    lang: /^fr/,
    canonical: "https://afrotools.com/fr/tools/optimiseur-linkedin/",
  },
];

for (const owner of ROUTES) {
  test(`${owner.locale} LinkedIn optimizer shares the frozen engine contract`, async ({
    page,
  }) => {
    const errors = [];
    const unsafeRequests = [];
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
        return route.continue();
      }
      return route.fulfill({ status: 204, body: "" });
    });
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (
        request.method() !== "GET" &&
        /capture-lead|workspace|supabase|\/api\//i.test(request.url())
      ) {
        unsafeRequests.push(`${request.method()} ${request.url()}`);
      }
    });

    await page.setViewportSize({ width: 320, height: 844 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    const response = await page.goto(owner.route, { waitUntil: "domcontentloaded" });
    expect(response && response.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", owner.lang);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      owner.canonical
    );
    await expect(page.locator("#profileScore")).toHaveText("0%");
    const invalid = await page.evaluate(() =>
      window.AfroTools.LinkedInOptimizerEngine.calculate({
        industry: "__invalid__",
        level: "__invalid__",
        connections: "__invalid__",
        checks: { chk_photo: "yes" },
      })
    );
    expect(invalid.score).toBe(0);
    expect(invalid.input).toMatchObject({
      industry: "software",
      level: "student",
      connections: "0",
    });
    expect(invalid.growthTip).not.toContain("undefined");

    await page.getByRole("button", { name: owner.button }).first().click();
    await expect(page.locator("#profileScore")).toHaveText("0%");
    await expect(page.locator("#checklistStatus .check-row")).toHaveCount(12);
    await expect(page.locator("#headlines .headline-card")).toHaveCount(6);
    await expect(page.locator("#keywords .kw-tag")).toHaveCount(13);
    await expect(page.locator("#growthStrategy")).not.toContainText("undefined");

    await page.locator("#industry").selectOption("data");
    await page.locator("#level").selectOption("mid");
    await page.locator("#connections").selectOption("2");
    for (const id of [
      "chk_photo",
      "chk_headline",
      "chk_about",
      "chk_experience",
      "chk_education",
      "chk_skills",
      "chk_endorsements",
      "chk_recommendations",
      "chk_featured",
      "chk_creator",
      "chk_banner",
    ]) {
      await page.locator(`#${id}`).check();
    }
    await page.getByRole("button", { name: owner.button }).first().click();
    await expect(page.locator("#profileScore")).toHaveText("90%");
    await expect(page.locator("#allStarBadge")).toContainText(/ALL-STAR/i);
    await expect(page.locator("#keywords")).toContainText("Data Analyst");
    await expect(page.locator("#growthStrategy")).toContainText(
      /quality over quantity/i
    );

    expect(unsafeRequests).toEqual([]);
    expect(errors).toEqual([]);
  });

  for (const width of [320, 375]) {
    test(`${owner.locale} LinkedIn optimizer reflows at ${width}px and 200% text`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.goto(owner.route, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => {
        document.documentElement.setAttribute("data-theme", "dark");
        document.documentElement.style.fontSize = "200%";
      });
      const audit = await page.evaluate(() => {
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rect.width > 0 &&
            rect.height > 0
          );
        };
        const controls = Array.from(
          document.querySelectorAll("button, input, select, textarea")
        ).filter(visible);
        return {
          overflow:
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
          unnamed: controls.filter(
            (control) =>
              !(
                (control.textContent || "").trim() ||
                control.getAttribute("aria-label") ||
                control.getAttribute("title") ||
                (control.labels &&
                  Array.from(control.labels).some((label) =>
                    label.textContent.trim()
                  ))
              )
          ).length,
          theme: document.documentElement.getAttribute("data-theme"),
        };
      });

      expect(audit.overflow).toBeLessThanOrEqual(1);
      expect(audit.unnamed).toBe(0);
      expect(audit.theme).toBe("dark");
    });
  }
}
