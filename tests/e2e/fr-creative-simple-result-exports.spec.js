const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

const ROUTES = [
  {
    id: "african-palette",
    route: "/fr/tools/palette-couleurs-africaines/",
    action: null,
    resultKey: "palette",
  },
  {
    id: "music-royalty-splitter",
    route: "/fr/tools/partage-redevances-musicales/",
    action: /Calculer le partage des redevances/i,
    prepare: async (page) => page.locator("#totalRoyalties").fill("10000"),
    resultKey: "shares",
  },
  {
    id: "self-publishing-royalty",
    route: "/fr/tools/calculateur-de-droits-d-autoedition/",
    action: /Comparer les redevances/i,
    resultKey: "platforms",
  },
  {
    id: "social-media-calendar",
    route: "/fr/tools/calendrier-medias-sociaux/",
    action: /Générer le calendrier de 30 jours/i,
    resultKey: "posts",
  },
  {
    id: "wedding-photo-package",
    route: "/fr/tools/forfait-photo-mariage/",
    action: /Créer le devis du forfait/i,
    resultKey: "items",
  },
];

for (const owner of ROUTES) {
  test(`${owner.id} exposes private reopened JSON/TXT and copy actions`, async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const nonLocalRequests = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (
        request.method() !== "GET" &&
        url.hostname !== "127.0.0.1" &&
        url.hostname !== "localhost" &&
        /supabase|netlify|\/api\/|ai-advisor|generate/i.test(request.url())
      ) nonLocalRequests.push(`${request.method()} ${request.url()}`);
    });
    await page.goto(owner.route);
    if (owner.prepare) await owner.prepare(page);
    if (owner.action) await page.getByRole("button", { name: owner.action }).first().click();

    const actions = page.locator("[data-creative-result-actions]").first();
    await expect(actions).toBeVisible();
    await expect(actions.getByRole("button", { name: "Copier le résultat" })).toBeVisible();

    const jsonDownload = page.waitForEvent("download");
    await actions.getByRole("button", { name: "Télécharger JSON" }).click();
    const jsonFile = await jsonDownload;
    const parsed = JSON.parse(fs.readFileSync(await jsonFile.path(), "utf8"));
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.locale).toBe("fr");
    expect(parsed.result[owner.resultKey]).toBeTruthy();

    const textDownload = page.waitForEvent("download");
    await actions.getByRole("button", { name: "Télécharger TXT" }).click();
    const textFile = await textDownload;
    const text = fs.readFileSync(await textFile.path(), "utf8");
    expect(text).toContain("Généré localement dans votre navigateur");
    expect(text.length).toBeGreaterThan(100);

    await actions.getByRole("button", { name: "Copier le résultat" }).click();
    await expect(actions.locator("[data-result-status]")).toContainText("Résultat copié");
    expect(nonLocalRequests).toEqual([]);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new RegExp(`${owner.id}\\.webp`));
  });
}

test("music splitter rejects an incomplete split without opening export actions", async ({ page }) => {
  await page.goto("/fr/tools/partage-redevances-musicales/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#cp1").fill("20");
  await page.getByRole("button", { name: /Calculer le partage des redevances/i }).click();
  await expect(page.locator("[data-creative-result-actions]")).toHaveCount(0);
});
