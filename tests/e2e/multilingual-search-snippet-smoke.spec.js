const { test, expect } = require("@playwright/test");

test.use({ viewport: { width: 390, height: 844 } });

const cases = [
  ["en", "/tools/amount-words-gh/", "Ghana Cedis Amount in Words - GHS Cheque Converter", "Ghana Cedis in Words"],
  ["fr", "/fr/tools/suivi-carburant/senegal/", "Prix du carburant — Sénégal | AfroFuel", "Prix du carburant — Sénégal"],
  ["fr", "/fr/tools/contrat-bail/senegal", "Contrat de bail — Sénégal | AfroTools", "Générateur de contrat de bail — Sénégal"],
  ["fr", "/fr/tools/contrat-travail/senegal", "Contrat de travail — Sénégal | AfroTools", "Générateur de contrat de travail — Sénégal"],
  ["fr", "/fr/tools/assurance-obseques/senegal", "Assurance obsèques — Sénégal | AfroTools", "Estimation d’assurance obsèques — Sénégal"],
  ["fr", "/fr/tools/assurance-vie/senegal", "Assurance vie — Sénégal : couverture | AfroTools", "Estimation du besoin d’assurance vie — Sénégal"],
  ["fr", "/fr/tools/calculateur-solaire/", "Calculateur solaire | AfroTools", "Dimensionnement du système solaire"],
  ["sw", "/sw/zana/gharama-za-mafuta-ya-generator/", "Gharama za Mafuta ya Jenereta | AfroTools", "Gharama za Mafuta ya Jenereta"],
  ["sw", "/sw/zana/kigawanya-bili-na-tip/", "Kikokotoo cha Bakshishi na Kodi ya Bili | AfroTools", "Kikokotoo cha bakshishi na kodi ya bili"],
  ["sw", "/sw/zana/kikokotoo-kisayansi/", "Kikokotoo cha kisayansi | AfroTools", "Kikokotoo cha kisayansi"],
  ["sw", "/sw/zana/kilinganisha-maandishi/", "Kilinganisha Maandishi | AfroTools", "Kilinganisha Maandishi"],
  ["sw", "/sw/zana/solar-dhidi-ya-generator/", "Nishati ya Jua dhidi ya Jenereta | AfroTools", "Nishati ya Jua dhidi ya Jenereta"],
  ["sw", "/sw/zana/base64/", "Kisimbaji na Kisimbuzi cha Base64 | AfroTools", "Kisimbaji na Kisimbuzi cha Base64"],
  ["sw", "/sw/zana/kiigaji-ussd/", "Kiigaji cha Menyu za USSD | AfroTools", "Kiigaji cha Menyu za USSD"]
];

for (const [locale, route, title, heading] of cases) {
  test(`${locale} search surface renders ${route}`, async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response && response.ok()).toBeTruthy();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page).toHaveTitle(title);
    await expect(page.locator("h1").first()).toContainText(heading);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://afrotools.com${route}`);

    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description && description.length).toBeGreaterThan(69);
    if (locale === "fr") expect(description).not.toMatch(/\b(?:Fuel prices|Generate an?|Estimate funeral|Calculer your)\b/i);
    if (route === "/fr/tools/calculateur-solaire/") {
      await expect(page.getByRole("heading", { name: /Configuration du système/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /Dimensionner mon système solaire/i })).toBeVisible();
      expect(await page.locator("body").innerText()).not.toMatch(/\b(?:System Setup|Peak Power Demand|Calculate My Solar System|Method notes|Ask a question)\b/i);
    }
    if (locale === "sw") {
      expect(title).not.toMatch(/\b(?:calculator|checker|generator)\b/i);
      expect(description).not.toMatch(/\b(?:calculator|checker|generator|salary)\b/i);
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(pageErrors).toEqual([]);
  });
}
