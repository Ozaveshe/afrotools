const { test, expect } = require("@playwright/test");
const fs = require("fs");

test("Landed Cost: French totals equal the accepted engine and invalid FX fails closed", async ({ page }) => {
  await page.goto("/fr/tools/cout-rendu/");
  const values = {
    destCountry: "NG", fobUSD: "10000", freightUSD: "900", insuranceUSD: "100",
    dutyRate: "20", fxRate: "1500", quantity: "10", brokerFeeLocal: "100000",
    handlingLocal: "50000", haulageLocal: "75000", sellPriceLocal: "4000000"
  };
  for (const [name, input] of Object.entries(values)) {
    const field = page.locator(`[name="${name}"]`);
    if (await field.evaluate((node) => node.tagName === "SELECT")) await field.selectOption(input);
    else await field.fill(input);
  }
  await page.locator("[data-trade-form]").evaluate((form) => {
    form.noValidate = true;
    form.requestSubmit();
  });
  const proof = await page.evaluate(() => {
    const result = window.LandedCostEngine.calculate({
      destCountry: "NG", fobUSD: 10000, freightUSD: 900, insuranceUSD: 100,
      dutyRate: 20, fxRate: 1500, quantity: 10, brokerFeeLocal: 100000,
      handlingLocal: 50000, haulageLocal: 75000
    });
    return {
      expected: new Intl.NumberFormat("fr-FR", { style: "currency", currency: result.currency, maximumFractionDigits: 2 }).format(result.totalLandedLocal),
      text: document.querySelector("[data-trade-result]").textContent
    };
  });
  expect(proof.text).toContain(proof.expected);
  await page.locator('[name="fxRate"]').fill("0");
  await page.locator("[data-trade-form]").evaluate((form) => {
    form.noValidate = true;
    form.requestSubmit();
  });
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
  await expect(page.locator("[data-trade-result]")).toBeHidden();
});

test("LC fees: French totals equal the accepted engine and zero value fails closed", async ({ page }) => {
  await page.goto("/fr/tools/calculateur-credit-documentaire/");
  await page.locator('[name="lcValue"]').fill("25000");
  await page.locator('[name="countryCode"]').selectOption("KE");
  await page.locator('[name="lcType"]').selectOption("usance90");
  await page.locator('[name="amendments"]').fill("2");
  await page.locator('[name="confirmed"]').check();
  await page.locator('[name="includeMargin"]').check();
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  const proof = await page.evaluate(() => {
    const result = window.LcFeeEngine.calculate({
      lcValue: 25000, countryCode: "KE", lcType: "usance90",
      amendments: 2, confirmed: true, includeMargin: true
    });
    return {
      expected: new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(result.totalFees),
      text: document.querySelector("[data-trade-result]").textContent
    };
  });
  expect(proof.text).toContain(proof.expected);
  await page.locator('[name="lcValue"]').fill("0");
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
});

test("Export Documents: French checklist equals the accepted engine", async ({ page }) => {
  await page.goto("/fr/tools/documents-export/");
  await page.locator('[name="exportCountry"]').selectOption("CI");
  await page.locator('[name="productCat"]').selectOption("cocoa");
  await page.locator('[name="exportDest"]').selectOption("ECOWAS");
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  const proof = await page.evaluate(() => {
    const result = window.ExportDocsEngine.getDocList("CI", "cocoa", "ECOWAS");
    return {
      total: result.totalDocs,
      mandatory: result.mandatoryCount,
      text: document.querySelector("[data-trade-result]").textContent
    };
  });
  expect(proof.text).toContain(String(proof.total));
  expect(proof.text).toContain(String(proof.mandatory));
  await page.locator('[name="exportCountry"]').evaluate((select) => {
    select.innerHTML = '<option value=""></option>';
    select.value = "";
  });
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
});

test("Trade Finance: French comparison equals the accepted engine", async ({ page }) => {
  await page.goto("/fr/tools/comparateur-financement-commerce/");
  await page.locator('[name="tradeValue"]').fill("50000");
  await page.locator('[name="countryCode"]').selectOption("KE");
  await page.locator('[name="instrumentId"]').selectOption("lc_usance");
  await page.locator('[name="tenorDays"]').fill("90");
  await page.locator('[name="confirmed"]').check();
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  const proof = await page.evaluate(() => {
    const result = window.TradeFinanceEngine.calculate({
      instrumentId: "lc_usance", tradeValue: 50000, countryCode: "KE", tenorDays: 90, confirmed: true
    });
    return {
      expected: new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(result.totalFee),
      text: document.querySelector("[data-trade-result]").textContent
    };
  });
  expect(proof.text).toContain(proof.expected);
  await page.locator('[name="tradeValue"]').fill("0");
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
});

test("Commodity Tracker: French country summary equals the accepted engine", async ({ page }) => {
  await page.goto("/fr/tools/suivi-matieres-premieres/");
  await page.locator('[name="country"]').selectOption("NG");
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  const proof = await page.evaluate(() => {
    const result = window.CommodityEngine.getCountrySummary("NG");
    return { expected: String(result.tradeBalance || 0), text: document.querySelector("[data-trade-result]").textContent };
  });
  expect(proof.text).toContain(proof.expected);
  await page.locator('[name="country"]').evaluate((select) => {
    select.innerHTML = '<option value=""></option>';
    select.value = "";
  });
  await page.locator("[data-trade-form]").evaluate((form) => {
    form.noValidate = true;
    form.requestSubmit();
  });
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
});

test("Payment Comparator: French ranking and scenario equal the accepted engine", async ({ page }) => {
  await page.goto("/fr/tools/comparateur-paiements/");
  await page.locator('[name="amount"]').fill("10000");
  await page.locator('[name="frequency"]').selectOption("weekly");
  await page.locator('[name="scenarioProvider"]').selectOption("papss");
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  const proof = await page.evaluate(() => {
    const ranked = window.PaymentComparatorEngine.compareAll(10000);
    const scenario = window.PaymentComparatorEngine.calculateScenario(10000, "weekly", "papss");
    return {
      cheapest: ranked[0].shortName,
      annual: new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(scenario.annualFee),
      text: document.querySelector("[data-trade-result]").textContent
    };
  });
  expect(proof.text).toContain(proof.cheapest);
  expect(proof.text).toContain(proof.annual);
  await page.locator('[name="amount"]').fill("0");
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
});

test("SADC rules: French eligibility equals the accepted engine", async ({ page }) => {
  await page.goto("/fr/tools/regles-origine-sadc/");
  await page.locator('[name="hsChapter"]').fill("28");
  await page.locator('[name="exportCountry"]').selectOption("ZA");
  await page.locator('[name="importCountry"]').selectOption("BW");
  await page.locator('[name="exWorksPrice"]').fill("10000");
  await page.locator('[name="nonSadcCost"]').fill("4000");
  await page.locator('[name="hasCTH"]').check();
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  const proof = await page.evaluate(() => {
    const result = window.SadcRooEngine.checkOrigin({
      hsChapter: 28, exportCountry: "ZA", importCountry: "BW",
      exWorksPrice: 10000, nonSadcCost: 4000, whollyObtained: false,
      hasCTH: true, hasFabricFwd: false
    });
    return { eligible: result.eligible, va: result.sadcVA, text: document.querySelector("[data-trade-result]").textContent };
  });
  expect(proof.eligible).toBe(true);
  expect(proof.text).toContain(String(Number(proof.va)));
  await page.locator('[name="nonSadcCost"]').fill("11000");
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
});

test("HS lookup: French first result and duty equal the accepted engine", async ({ page }) => {
  await page.goto("/fr/tools/recherche-code-sh/");
  await page.locator('[name="query"]').fill("0901");
  await page.locator('[name="dutyCountry"]').selectOption("CI");
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  const proof = await page.evaluate(() => {
    const item = window.HsLookupEngine.lookupByCode("0901");
    const duty = window.HsLookupEngine.getDutyRates(item.code, "CI");
    return { code: item.code, duty: duty.dutyTypical, text: document.querySelector("[data-trade-result]").textContent };
  });
  expect(proof.text).toContain(proof.code);
  if (proof.duty !== null) expect(proof.text).toContain(String(proof.duty));
  await page.locator('[name="query"]').fill("?");
  await page.locator("[data-trade-form]").evaluate((form) => {
    form.noValidate = true;
    form.requestSubmit();
  });
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
});

test("Shipping estimator: French corridor equals the accepted engine", async ({ page }) => {
  await page.goto("/fr/tools/estimateur-fret/");
  await page.locator('[name="originPort"]').selectOption("CNSHA");
  await page.locator('[name="destPort"]').selectOption("NGAPP");
  await page.locator('[name="containerType"]').selectOption("LCL");
  await page.locator('[name="cbm"]').fill("4");
  await page.locator('[name="weightKg"]').fill("250");
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  const proof = await page.evaluate(() => {
    const result = window.ShippingEngine.estimate("CNSHA", "NGAPP", "LCL", 4, 250);
    return { min: result.sea.minUSD, max: result.sea.maxUSD, text: document.querySelector("[data-trade-result]").textContent };
  });
  expect(proof.text).toContain(String(proof.min));
  expect(proof.text).toContain(String(proof.max));
  await page.locator('[name="destPort"]').evaluate((select) => {
    select.innerHTML = '<option value="BAD">BAD</option>';
    select.value = "BAD";
  });
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
});

test("FX import impact: French cost and scenarios equal the accepted engine", async ({ page }) => {
  await page.goto("/fr/tools/impact-fx-import/");
  await page.locator('[name="countryCode"]').selectOption("NG");
  await page.locator('[name="usdAmount"]').fill("10000");
  await page.locator('[name="fxRate"]').fill("1660");
  await page.locator('[name="sellPrice"]').fill("19000000");
  await page.locator('[name="otherCosts"]').fill("500000");
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  const proof = await page.evaluate(() => {
    const result = window.FxImpactEngine.calculateImpact(10000, "NG", 1660);
    return {
      cost: new Intl.NumberFormat("fr-FR", { style: "currency", currency: result.currency, maximumFractionDigits: 2 }).format(result.localCost),
      text: document.querySelector("[data-trade-result]").textContent
    };
  });
  expect(proof.text).toContain(proof.cost);
  await page.locator('[name="fxRate"]').fill("0");
  await page.locator("[data-trade-form]").evaluate((form) => {
    form.noValidate = true;
    form.requestSubmit();
  });
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
});

test("Demurrage: French tiers equal the accepted port engine", async ({ page }) => {
  await page.goto("/fr/tools/calculateur-surestaries/");
  await page.locator('[name="portCode"]').selectOption("NGAPP");
  await page.locator('[name="containerType"]').selectOption("20ft");
  await page.locator('[name="daysAtPort"]').fill("12");
  await page.locator('[name="fxRate"]').fill("1660");
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  const proof = await page.evaluate(() => {
    const result = window.DemurrageEngine.calculateDemurrage("NGAPP", "20ft", 12, 1660);
    return { total: result.totalUSD, paid: result.paidDays, text: document.querySelector("[data-trade-result]").textContent };
  });
  expect(proof.text).toContain(String(proof.total));
  expect(proof.text).toContain(String(proof.paid));
  await page.locator('[name="portCode"]').evaluate((select) => {
    select.innerHTML = '<option value="BAD">BAD</option>';
    select.value = "BAD";
  });
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
});

test("Incoterms: French split and comparison equal the accepted engine", async ({ page }) => {
  await page.goto("/fr/tools/calculateur-incoterms/");
  await page.locator('[name="termCode"]').selectOption("CIF");
  await page.locator('[name="compareCode"]').selectOption("FOB");
  const costs = {
    packaging: 100, loading_origin: 50, export_customs: 100, inland_origin: 200,
    loading_vessel: 50, freight: 900, insurance: 100, unloading_dest: 100,
    import_customs: 150, duties_taxes: 2000, inland_dest: 300, delivery: 100
  };
  for (const [id, amount] of Object.entries(costs)) await page.locator(`[name="cost_${id}"]`).fill(String(amount));
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  const proof = await page.evaluate((input) => {
    const result = window.IncotermsEngine.calculateCostSplit("CIF", input);
    const comparison = window.IncotermsEngine.compareTwoTerms("CIF", "FOB", input);
    const fmt = (amount) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount);
    return {
      seller: fmt(result.sellerTotal), buyer: fmt(result.buyerTotal), diff: fmt(comparison.buyerDiff),
      text: document.querySelector("[data-trade-result]").textContent
    };
  }, costs);
  expect(proof.text).toContain(String(proof.seller));
  expect(proof.text).toContain(String(proof.buyer));
  expect(proof.text).toContain(String(proof.diff));
  await page.locator('[name="termCode"]').evaluate((select) => {
    select.innerHTML = '<option value="BAD">BAD</option>';
    select.value = "BAD";
  });
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
});

test("AfCFTA tracker: French corridor equals the accepted schedule owner", async ({ page }) => {
  await page.goto("/fr/tools/suivi-zlecaf/");
  await page.locator('[name="originCountry"]').selectOption("NG");
  await page.locator('[name="destinationCountry"]').selectOption("KE");
  await page.locator('[name="hsCode"]').fill("0901");
  await page.locator('[name="tariffCategory"]').selectOption("A");
  await page.locator('[name="baseDuty"]').fill("20");
  await page.locator('[name="scenarioYear"]').fill("2026");
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  const proof = await page.evaluate(() => {
    const origin = AFCFTA_DATA.memberStates.NG;
    const destination = AFCFTA_DATA.memberStates.KE;
    const reduction = origin.reductionSchedule.catA[2026];
    const effective = 20 * (1 - reduction / 100);
    return {
      active: origin.tradingStatus === "active_GTI" && destination.tradingStatus === "active_GTI",
      reduction, effective, text: document.querySelector("[data-trade-result]").textContent
    };
  });
  expect(proof.active).toBe(true);
  expect(proof.text).toContain(String(proof.reduction));
  expect(proof.text).toContain(String(proof.effective));
  await page.locator('[name="destinationCountry"]').selectOption("NG");
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
});

test("COO generator: French model fields and criteria equal the accepted engine", async ({ page }) => {
  await page.goto("/fr/tools/generateur-certificat-origine/");
  const values = {
    templateId: "afcfta", exporter_name: "Exportateur synthétique", exporter_address: "Adresse test",
    exporter_country: "CI", consignee_name: "Destinataire synthétique", consignee_address: "Adresse test",
    consignee_country: "SN", transport_details: "Abidjan vers Dakar", country_of_origin: "Côte d’Ivoire",
    goods_description: "Cacao synthétique", hs_code: "1801", quantity: "100 sacs", gross_weight: "6500",
    fob_value: "25000", invoice_number: "INV-TEST", invoice_date: "2026-07-01",
    afcfta_ref_number: "AFCFTA-TEST", declaration_place: "Abidjan", declaration_date: "2026-07-02",
    authorized_signatory: "Signataire test", exWorksPrice: "25000", nonOriginatingMaterialsCost: "5000"
  };
  for (const [name, input] of Object.entries(values)) {
    const field = page.locator(`[name="${name}"]`);
    if (await field.evaluate((node) => node.tagName === "SELECT")) await field.selectOption(input);
    else await field.fill(input);
  }
  await page.locator('[name="hasCTH"]').check();
  await page.locator("[data-trade-form]").evaluate((form) => form.requestSubmit());
  const proof = await page.evaluate(() => {
    const criteria = window.CooEngine.checkOriginCriteria({
      hasWhollyObtained: false, hasCTH: true, exWorksPrice: 25000,
      nonOriginatingMaterialsCost: 5000, processType: ""
    });
    const formData = window.CooEngine.generateFormData("afcfta", {
      exporter_name: "Exportateur synthétique", exporter_country: "CI",
      consignee_name: "Destinataire synthétique", consignee_country: "SN"
    });
    return {
      template: formData.templateName,
      authority: formData.issuingAuthority,
      positives: criteria.filter((item) => item.qualifies).length,
      text: document.querySelector("[data-trade-result]").textContent
    };
  });
  expect(proof.text).toContain(proof.template);
  expect(proof.text).toContain(proof.authority);
  expect(proof.text).toContain(String(proof.positives));
  await page.locator('[name="exporter_name"]').fill("");
  await page.locator("[data-trade-form]").evaluate((form) => {
    form.noValidate = true;
    form.requestSubmit();
  });
  await expect(page.locator("[data-trade-status]")).toHaveAttribute("data-state", "error");
});

test("ECOWAS levy: French result equals the accepted engine and invalid CIF fails closed", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/fr/tools/ecowas-levy/");
  await page.locator("#cifValue").fill("10000");
  await page.locator("#fobValue").fill("9500");
  const proof = await page.evaluate(() => {
    selectCountry("NG");
    selectBand(2);
    runCalc();
    const oracle = window.EcowasLevyEngine.calculate({
      cifValue: 10000, fobValue: 9500, cetBand: 2,
      countryCode: "NG", hsCode: "", isEtls: false
    });
    return {
      oracle,
      visible: document.querySelector("#calcResult").textContent
    };
  });
  expect(proof.visible).toContain(
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(proof.oracle.totalLandedCost)
  );
  expect(proof.visible).toContain(
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(proof.oracle.totalCharges)
  );
  await page.locator("#cifValue").fill("0");
  await page.evaluate(() => runCalc());
  await expect(page.locator("#calcResult [role=alert]")).toContainText("supérieure à zéro");
  expect(errors).toEqual([]);
});

test("ECOWAS levy: ETLS checker equals the accepted engine", async ({ page }) => {
  await page.goto("/fr/tools/ecowas-levy/");
  await page.evaluate(() => setTab("etls", null));
  await page.locator("#etlsOrigin").selectOption("NG");
  await page.locator("#etlsCOO").check();
  await page.locator("#etlsVA").fill("35");
  await page.evaluate(() => runEtls());
  const oracle = await page.evaluate(() => window.EcowasLevyEngine.checkEtls({
    originCountry: "NG", hasCOO: true, hasCTH: false, localValuePct: 35
  }));
  expect(oracle.eligible).toBe(true);
  await expect(page.locator("#etlsResult")).toContainText("ADMISSIBLE");
});

test("EAC CET: French totals equal the accepted engine and TXT reopens", async ({ page }) => {
  await page.goto("/fr/tools/tec-eac/");
  await page.locator("#country").selectOption({ label: "Kenya" });
  await page.locator("#origin").selectOption("external");
  await page.locator("#cif").fill("10000");
  await page.locator("#band").selectOption("25");
  await page.locator("#local-fees").fill("350");
  await page.locator("#eac-form").evaluate((form) => form.requestSubmit());
  const oracle = await page.evaluate(() => window.EacCetEngine.calculate({
    cifValue: 10000, cetRate: 25, countryCode: "KE"
  }));
  const expected = new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 2
  }).format(oracle.totalLanded + 350);
  await expect(page.locator("#landed-output")).toHaveText(expected);
  await expect(page.locator("#summary-output")).toContainText("TVA estimée");
  const pending = page.waitForEvent("download");
  await page.locator("#download-result").click();
  const download = await pending;
  const text = fs.readFileSync(await download.path(), "utf8");
  expect(text).toContain(expected);
  expect(text).toContain("Prélèvements nationaux");
});

test("EAC CET: invalid CIF fails closed", async ({ page }) => {
  await page.goto("/fr/tools/tec-eac/");
  await page.locator("#cif").fill("-1");
  await page.locator("#eac-form").evaluate((form) => form.requestSubmit());
  await expect(page.locator("#warning")).toHaveClass(/show/);
  await expect(page.locator("#status")).toContainText("Correction requise");
});
