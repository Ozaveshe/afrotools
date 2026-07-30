const { expect, test } = require("@playwright/test");

const NATIVE_ROUTES = [
  {
    id: "african-palette",
    route: "/fr/tools/palette-couleurs-africaines/",
    canonical:
      "https://afrotools.com/fr/tools/palette-couleurs-africaines/",
    action: /Tailwind Config/i,
    expected: /module\.exports|colors/i,
    result: "#tw-code",
  },
  {
    id: "art-commission",
    route: "/fr/tools/prix-commande-art/",
    canonical: "https://afrotools.com/fr/tools/prix-commande-art/",
    action: /Calculer le prix de la commande/i,
    expected: /29[\s\u202f]?000/,
    result: "#recPrice",
  },
  {
    id: "book-publishing-cost",
    route: "/fr/tools/cout-publication-livre/",
    canonical: "https://afrotools.com/fr/tools/cout-publication-livre/",
    action: /Calculer les coûts de publication/i,
    expected: /\$1[\s,]?200[,.]00/,
    result: "#totalBudget",
  },
  {
    id: "engagement-rate",
    route: "/fr/tools/taux-engagement/",
    canonical: "https://afrotools.com/fr/tools/taux-engagement/",
    action: /Calculer le taux d'engagement/i,
    expected: /3[,.]6\s*%/,
    result: "#erDisplay",
  },
  {
    id: "linkedin-optimizer",
    route: "/fr/tools/optimiseur-linkedin/",
    canonical: "https://afrotools.com/fr/tools/optimiseur-linkedin/",
    action: /Optimiser mon profil/i,
    expected: /score/i,
    result: "#results",
  },
  {
    id: "music-royalty-splitter",
    route: "/fr/tools/partage-redevances-musicales/",
    canonical:
      "https://afrotools.com/fr/tools/partage-redevances-musicales/",
    action: /Calculer le partage des redevances/i,
    expected: /\$10[\s,]?000[,.]00|Redevances/i,
    result: "#results",
    prepare: async (page) => {
      await page.locator("#totalRoyalties").fill("10000");
    },
  },
  {
    id: "personal-brand-audit",
    route: "/fr/tools/audit-marque-personnelle/",
    canonical: "https://afrotools.com/fr/tools/audit-marque-personnelle/",
    action: /Calculer le score de marque/i,
    expected: /2\s*\/\s*100/,
    result: "#results",
  },
  {
    id: "photography-pricing",
    route: "/fr/tools/prix-seance-photo/",
    canonical: "https://afrotools.com/fr/tools/prix-seance-photo/",
    action: /Calculer le prix de la séance/i,
    expected: /100[\s\u202f,]?000/,
    result: "#sessionPrice",
  },
  {
    id: "podcast-monetization",
    route: "/fr/tools/monetisation-podcast/",
    canonical: "https://afrotools.com/fr/tools/monetisation-podcast/",
    action: /Calculer les revenus du podcast/i,
    expected: /\$373|\$372[,.]5/,
    result: "#totalMonthly",
  },
  {
    id: "self-publishing-royalty",
    route: "/fr/tools/calculateur-de-droits-d-autoedition/",
    canonical:
      "https://afrotools.com/fr/tools/calculateur-de-droits-d-autoedition/",
    action: /Comparer les redevances/i,
    expected: /\$559[,.]44/,
    result: "#bestMonthly",
  },
  {
    id: "social-media-calendar",
    route: "/fr/tools/calendrier-medias-sociaux/",
    canonical:
      "https://afrotools.com/fr/tools/calendrier-medias-sociaux/",
    action: /Générer le calendrier de 30 jours/i,
    expected: /13/,
    result: "#postCount",
  },
  {
    id: "wedding-photo-package",
    route: "/fr/tools/forfait-photo-mariage/",
    canonical: "https://afrotools.com/fr/tools/forfait-photo-mariage/",
    action: /Créer le devis du forfait/i,
    expected: /200[\s\u202f,]?000/,
    result: "#totalPrice",
  },
];

for (const [index, owner] of NATIVE_ROUTES.entries()) {
  test(`${owner.id} has a native French workflow and complete browser contract`, async ({
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

    await page.setViewportSize({
      width: index % 2 ? 320 : 375,
      height: 844,
    });
    await page.emulateMedia({
      colorScheme: index % 2 ? "dark" : "light",
      reducedMotion: "reduce",
    });
    const response = await page.goto(owner.route, {
      waitUntil: "domcontentloaded",
    });
    expect(response && response.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", /^fr/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      owner.canonical
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]')
    ).toHaveAttribute("href", new RegExp(`/tools/${owner.id}/$`));
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator("#tool-mount")).toBeVisible();
    if (owner.prepare) await owner.prepare(page);
    await page.getByRole("button", { name: owner.action }).first().click();
    await expect(page.locator(owner.result)).toContainText(owner.expected);

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
      const viewportWidth = document.documentElement.clientWidth;
      return {
        overflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
        overflowOwners: Array.from(document.querySelectorAll("body *"))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${element.classList.length ? `.${Array.from(element.classList).join(".")}` : ""}`,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              scrollWidth: element.scrollWidth,
              clientWidth: element.clientWidth,
            };
          })
          .filter((item) =>
            item.left < -1 ||
            item.right > viewportWidth + 1 ||
            item.scrollWidth > item.clientWidth + 1
          )
          .slice(0, 10),
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
      };
    });

    expect(audit.overflow, JSON.stringify(audit.overflowOwners)).toBeLessThanOrEqual(1);
    expect(audit.unnamed).toBe(0);
    expect(unsafeRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}
