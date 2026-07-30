const fs = require("node:fs/promises");
const { expect, test } = require("@playwright/test");

const ROUTES = [
  {
    id: "book-publishing-cost",
    slug: "cout-publication-livre",
    invalid: "#retailPrice",
    result: "#totalBudget",
    expected: /1[\s\u202f,.]?200/,
    title: "Calculateur du coût de publication d'un livre",
  },
  {
    id: "engagement-rate",
    slug: "taux-engagement",
    invalid: "#followers",
    result: "#erDisplay",
    expected: /3[,.]6\s*%/,
    title: "Calculateur du taux d'engagement",
  },
  {
    id: "personal-brand-audit",
    slug: "audit-marque-personnelle",
    invalid: "#industry",
    result: "#brandSummary",
    expected: /marque|profil|LinkedIn/i,
    title: "Audit de marque personnelle",
  },
  {
    id: "photography-pricing",
    slug: "prix-seance-photo",
    invalid: "#shootHours",
    result: "#sessionPrice",
    expected: /100[\s\u202f,.]?000/,
    title: "Calculateur du prix d'une séance photo",
  },
  {
    id: "podcast-monetization",
    slug: "monetisation-podcast",
    invalid: "#downloads",
    result: "#totalMonthly",
    expected: /\$[\s\u202f]?373|\$[\s\u202f]?372[,.]5/,
    title: "Calculateur de monétisation de podcast",
  },
];

for (const owner of ROUTES) {
  test(`${owner.id}: strict French output, invalid state, export and UI contract`, async ({
    page,
  }) => {
    const errors = [];
    const writes = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.method() !== "GET") {
        writes.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.route("**/*", async (route) => {
      const host = new URL(route.request().url()).hostname;
      if (host === "127.0.0.1" || host === "localhost") {
        return route.continue();
      }
      return route.fulfill({ status: 204, body: "" });
    });

    await page.setViewportSize({ width: 320, height: 844 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    const response = await page.goto(`/fr/tools/${owner.slug}/`, {
      waitUntil: "domcontentloaded",
    });
    expect(response && response.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", /^fr/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://afrotools.com/fr/tools/${owner.slug}/`
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `https://afrotools.com/fr/tools/${owner.slug}/`
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      new RegExp(`/assets/img/tools/${owner.id}\\.webp$`)
    );
    const schema = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(schema.some((value) => /SoftwareApplication/.test(value))).toBe(true);

    await page.locator(owner.invalid).evaluate((element) => {
      element.value = "";
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.locator(".en-btn-full").click();
    await expect(page.locator("[data-creative-result-status]")).not.toBeEmpty();
    await expect(page.locator(owner.invalid)).toHaveAttribute(
      "aria-invalid",
      "true"
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator(".en-btn-full").click();
    await expect(page.locator(owner.result)).toContainText(owner.expected);
    await expect(page.locator("[data-creative-result-export]")).toBeVisible();
    const resultCopy = await page.locator("#results").innerText();
    expect(resultCopy).not.toMatch(
      /Editing Costs|Setup Costs|Print Run|Monthly Revenue|total interactions|You qualify|Monetization Status|Quick wins|Day rate|Daily Overhead|Session Hours|Hourly Rate|\bActive\b|Not yet unlocked|more downloads needed/i
    );

    const downloadPromise = page.waitForEvent("download");
    await page.locator("[data-creative-result-export]").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/-resultat\.txt$/);
    const path = await download.path();
    const exported = await fs.readFile(path, "utf8");
    expect(exported).toContain(owner.title);
    expect(exported).toMatch(owner.expected);
    expect(exported).toContain("Généré localement");

    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
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
        offenders: Array.from(document.querySelectorAll("body *"))
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return (
              visible(element) &&
              (rect.right > innerWidth + 1 ||
                element.scrollWidth > element.clientWidth + 1)
            );
          })
          .slice(0, 8)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName,
              id: element.id,
              className:
                typeof element.className === "string" ? element.className : "",
              right: Math.round(rect.right),
              width: Math.round(rect.width),
              scrollWidth: element.scrollWidth,
              clientWidth: element.clientWidth,
            };
          }),
      };
    });
    expect(
      audit.overflow,
      JSON.stringify(audit.offenders, null, 2)
    ).toBeLessThanOrEqual(1);
    expect(audit.unnamed).toBe(0);

    await page.setViewportSize({ width: 375, height: 844 });
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
  });
}
