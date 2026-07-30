const { test, expect } = require("@playwright/test");
const pdfParse = require("pdf-parse");

const cases = [
  {
    route: "/fr/tools/cout-rendu/",
    id: "landed-cost",
    values: { destCountry: "NG", fobUSD: "10000", freightUSD: "900", insuranceUSD: "100", dutyRate: "20", fxRate: "1500", quantity: "10", brokerFeeLocal: "100000", handlingLocal: "50000", haulageLocal: "75000", sellPriceLocal: "4000000" }
  },
  {
    route: "/fr/tools/calculateur-credit-documentaire/",
    id: "lc-fees",
    values: { lcValue: "25000", countryCode: "KE", lcType: "usance90", amendments: "2" },
    checks: ["confirmed", "includeMargin"]
  },
  {
    route: "/fr/tools/documents-export/",
    id: "export-documents",
    values: { exportCountry: "CI", productCat: "cocoa", exportDest: "ECOWAS" }
  },
  {
    route: "/fr/tools/comparateur-financement-commerce/",
    id: "trade-finance",
    values: { tradeValue: "50000", countryCode: "KE", instrumentId: "lc_usance", tenorDays: "90" },
    checks: ["confirmed", "firstTime", "intraAfrica"]
  },
  {
    route: "/fr/tools/suivi-matieres-premieres/",
    id: "commodity-tracker",
    values: { country: "NG", commodity: "" }
  },
  {
    route: "/fr/tools/comparateur-paiements/",
    id: "payment-comparator",
    values: { amount: "10000", frequency: "weekly", scenarioProvider: "papss" }
  },
  {
    route: "/fr/tools/regles-origine-sadc/",
    id: "sadc-roo",
    values: { hsChapter: "28", exportCountry: "ZA", importCountry: "BW", exWorksPrice: "10000", nonSadcCost: "4000" },
    checks: ["hasCTH"]
  },
  {
    route: "/fr/tools/recherche-code-sh/",
    id: "hs-code-lookup",
    values: { query: "0901", dutyCountry: "CI" }
  },
  {
    route: "/fr/tools/estimateur-fret/",
    id: "shipping-estimator",
    values: { originPort: "CNSHA", destPort: "NGAPP", containerType: "LCL", cbm: "4", weightKg: "250" }
  },
  {
    route: "/fr/tools/impact-fx-import/",
    id: "fx-import-impact",
    values: { countryCode: "NG", usdAmount: "10000", fxRate: "1660", sellPrice: "19000000", otherCosts: "500000" }
  },
  {
    route: "/fr/tools/calculateur-surestaries/",
    id: "demurrage-calculator",
    values: { portCode: "NGAPP", containerType: "20ft", daysAtPort: "12", fxRate: "1660" }
  },
  {
    route: "/fr/tools/calculateur-incoterms/",
    id: "incoterms-calculator",
    values: { termCode: "CIF", compareCode: "FOB", cost_packaging: "100", cost_loading_origin: "50", cost_export_customs: "100", cost_inland_origin: "200", cost_loading_vessel: "50", cost_freight: "900", cost_insurance: "100", cost_unloading_dest: "100", cost_import_customs: "150", cost_duties_taxes: "2000", cost_inland_dest: "300", cost_delivery: "100" }
  },
  {
    route: "/fr/tools/suivi-zlecaf/",
    id: "afcfta-tracker",
    values: { originCountry: "NG", destinationCountry: "KE", hsCode: "0901", tariffCategory: "A", baseDuty: "20", scenarioYear: "2026" }
  },
  {
    route: "/fr/tools/generateur-certificat-origine/",
    id: "coo-generator",
    values: {
      templateId: "afcfta", exporter_name: "Exportateur synthétique", exporter_address: "Adresse test",
      exporter_country: "CI", consignee_name: "Destinataire synthétique", consignee_address: "Adresse test",
      consignee_country: "SN", transport_details: "Abidjan vers Dakar", country_of_origin: "Côte d’Ivoire",
      goods_description: "Cacao synthétique", hs_code: "1801", quantity: "100 sacs", gross_weight: "6500",
      fob_value: "25000", invoice_number: "INV-TEST", invoice_date: "2026-07-01",
      afcfta_ref_number: "AFCFTA-TEST", declaration_place: "Abidjan", declaration_date: "2026-07-02",
      authorized_signatory: "Signataire test", exWorksPrice: "25000", nonOriginatingMaterialsCost: "5000"
    },
    checks: ["hasCTH"]
  },
  {
    route: "/fr/tools/facture-proforma/",
    id: "proforma-invoice",
    values: { reference: "PF-TEST", issueDate: "2026-07-02", validity: "2026-12-31", seller: "Vendeur synthétique", buyer: "Acheteur synthétique", incoterm: "CIF Dakar", paymentTerms: "30 jours", item1: "Cacao", qty1: "12", price1: "80", freight: "120", insurance: "30" }
  },
  {
    route: "/fr/tools/generateur-connaissement/",
    id: "bill-of-lading",
    values: { shipper: "Chargeur synthétique", consignee: "Destinataire synthétique", loadPort: "Tema", dischargePort: "Dakar", cargo: "Cacao d’essai", grossWeight: "240", volume: "4.2" }
  },
  {
    route: "/fr/tools/checklist-transfert-donnees/",
    id: "cross-border-data",
    values: { countryCode: "SN" }
  },
  {
    route: "/fr/tools/delai-dedouanement/",
    id: "customs-time",
    values: { country: "senegal", goodsType: "food", documentStatus: "partial", cargoValue: "10000" }
  },
  {
    route: "/fr/tools/calculateur-de-poids-d-expedition/",
    id: "shipping-weight",
    values: { packages: "2", actualWeight: "4", length: "50", width: "40", height: "30", divisor: "5000", rate: "3", fuelRate: "10", declaredValue: "1000", insuranceRate: "1", fixedCharges: "5", contingencyRate: "10" }
  },
  {
    route: "/fr/tools/liste-colisage/",
    id: "packing-list",
    values: {
      reference: "PL-TEST", packingDate: "2026-07-02", shipper: "Chargeur synthétique", consignee: "Destinataire synthétique",
      loadPort: "Tema", dischargePort: "Dakar", description1: "Cacao synthétique",
      count1: "2", net1: "20", gross1: "24", length1: "100", width1: "50", height1: "40"
    }
  }
];

for (const scenario of cases) {
  test(`${scenario.id}: valid workflow and reopened JSON/CSV/TXT/PDF exports`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(scenario.route, { waitUntil: "domcontentloaded" });
    for (const [name, value] of Object.entries(scenario.values)) {
      const field = page.locator(`[name="${name}"]`);
      if (await field.evaluate((element) => element.tagName === "SELECT")) {
        await field.selectOption(value);
      } else {
        await field.fill(value);
      }
    }
    for (const name of scenario.checks || []) await page.locator(`[name="${name}"]`).check();
    await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
    await expect(page.locator("[data-trade-result]")).toBeVisible();
    for (const format of ["json", "csv", "txt", "pdf"]) {
      const downloadPromise = page.waitForEvent("download");
      await page.locator(`[data-export="${format}"]`).click();
      const download = await downloadPromise;
      const path = await download.path();
      const bytes = require("fs").readFileSync(path);
      if (format === "json") {
        const parsed = JSON.parse(bytes.toString("utf8"));
        expect(parsed.locale).toBe("fr");
        expect(parsed.tool).toBe(scenario.id);
        expect(parsed.report.metrics.length).toBeGreaterThan(0);
      } else if (format === "csv") {
        expect(bytes.toString("utf8")).toContain("Section");
      } else if (format === "txt") {
        expect(bytes.toString("utf8")).toContain("AfroTools");
      } else {
        expect(bytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");
        expect(bytes.length).toBeGreaterThan(500);
        const parsed = await pdfParse(bytes);
        expect(parsed.text).toContain("AfroTools");
        expect(parsed.text.length).toBeGreaterThan(80);
      }
    }
    expect(errors).toEqual([]);
  });
}

test("shipping-weight: invalid dimensions fail closed", async ({ page }) => {
  await page.goto("/fr/tools/calculateur-de-poids-d-expedition/");
  await page.locator('[name="actualWeight"]').fill("4");
  await page.locator('[name="length"]').fill("0");
  await page.locator('[name="width"]').fill("0");
  await page.locator('[name="height"]').fill("0");
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
  await expect(page.locator("[data-trade-result]")).toBeHidden();
});

test("cross-border-data: French route uses the shared country-profile owner", async ({ page }) => {
  await page.goto("/fr/tools/checklist-transfert-donnees/");
  await page.locator('[name="countryCode"]').selectOption("MA");
  const expected = await page.evaluate(() => window.TradeUtilityEngine.crossBorderCountryProfile({
    code: "MA",
    name: "Maroc",
    law: "Loi 09-08",
    regulator: "CNDP",
    adequacy: { exists: true, note: "Une autorisation préalable de la CNDP peut être requise avant le transfert." },
    mechanisms: [
      { name: "Protection équivalente / adéquation", status: "disponible" },
      { name: "Clauses contractuelles ou accord de traitement", status: "à documenter" },
      { name: "Consentement explicite et spécifique", status: "conditionnel" },
      { name: "Autorisation de l’autorité", status: "selon le pays et le risque" }
    ],
    steps: [
      { title: "Cartographier le transfert", detail: "Identifier catégories, destinataire, finalité et pays de destination." },
      { title: "Évaluer la destination", detail: "Vérifier la loi du pays destinataire et le niveau de protection." },
      { title: "Choisir le mécanisme", detail: "Documenter l’adéquation, les clauses, le consentement ou l’autorisation." },
      { title: "Évaluer le risque", detail: "Examiner accès public, sous-traitants, sécurité et données sensibles." },
      { title: "Informer et enregistrer", detail: "Mettre à jour l’information des personnes et le registre des traitements." }
    ],
    warnings: ["Ne commencez pas un transfert soumis à autorisation avant la décision de la CNDP."]
  }));
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  await expect(page.locator("[data-trade-result]")).toBeVisible();
  const text = await page.locator("[data-trade-result]").innerText();
  expect(text).toContain(expected.law);
  expect(text).toContain(expected.regulator);
  expect(text).toContain(expected.mechanisms[0].name);
  expect(text).toContain(expected.steps[4].title);
});

test("customs-time: French route equals the English country-depth model", async ({ page }) => {
  await page.goto("/fr/tools/delai-dedouanement/");
  await page.locator('[name="country"]').selectOption("senegal");
  await page.locator('[name="goodsType"]').selectOption("food");
  await page.locator('[name="documentStatus"]').selectOption("partial");
  await page.locator('[name="cargoValue"]').fill("10000");
  const expected = await page.evaluate(() => window.TradeUtilityEngine.customsClearanceModel({
    minimumDays: 7,
    typicalDays: 14,
    maximumDays: 28,
    documentStatus: "partial",
    goodsType: "food",
    cargoValue: 10000,
    agentRate: .015,
    storagePerDay: 40
  }));
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  await expect(page.locator("[data-trade-result]")).toBeVisible();
  const text = await page.locator("[data-trade-result]").innerText();
  expect(text).toContain(`${expected.minimumDays} à ${expected.maximumDays} jours`);
  expect(text).toContain(`${expected.typicalDays} jours`);
  expect(text).toMatch(/150,00\s*\$US/);
  expect(text).toMatch(/1(?: |\s)?080,00\s*\$US/);
  expect(expected.agentFee).toBe(150);
  expect(expected.storageCost).toBe(1080);
});
