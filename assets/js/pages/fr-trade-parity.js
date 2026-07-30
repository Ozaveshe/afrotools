(function () {
  "use strict";

  var root = document.querySelector("[data-fr-trade-app]");
  if (!root) return;

  var tool = root.getAttribute("data-tool");
  var form = root.querySelector("[data-trade-form]");
  var status = root.querySelector("[data-trade-status]");
  var result = root.querySelector("[data-trade-result]");
  var summary = root.querySelector("[data-trade-summary]");
  var metrics = root.querySelector("[data-trade-metrics]");
  var rows = root.querySelector("[data-trade-rows]");
  var notes = root.querySelector("[data-trade-notes]");
  var lastReport = null;

  function utilityEngine() {
    if (!window.TradeUtilityEngine) {
      throw new Error("Le moteur de calcul partagé n’a pas pu être chargé.");
    }
    return window.TradeUtilityEngine;
  }

  var CROSS_BORDER_COUNTRIES = {
    NG: { name: "Nigeria", law: "NDPA 2023", regulator: "NDPC", adequacy: false, note: "Aucune liste formelle d’adéquation n’est publiée; vérifiez les orientations actuelles de la NDPC." },
    ZA: { name: "Afrique du Sud", law: "POPIA", regulator: "Information Regulator", adequacy: false, note: "Le niveau de protection du destinataire doit être évalué au cas par cas." },
    KE: { name: "Kenya", law: "DPA 2019", regulator: "ODPC", adequacy: false, note: "Vérifiez l’équivalence de protection et les éventuelles autorisations auprès de l’ODPC." },
    GH: { name: "Ghana", law: "Act 843", regulator: "Data Protection Commission", adequacy: false, note: "Aucune liste d’adéquation n’est publiée; documentez le fondement et les garanties." },
    RW: { name: "Rwanda", law: "Law 058/2021", regulator: "NCSA", adequacy: false, note: "Le cadre évolue; confirmez les exigences des transferts à risque élevé auprès de la NCSA." },
    MA: { name: "Maroc", law: "Loi 09-08", regulator: "CNDP", adequacy: true, note: "Une autorisation préalable de la CNDP peut être requise avant le transfert.", warning: "Ne commencez pas un transfert soumis à autorisation avant la décision de la CNDP." },
    MU: { name: "Maurice", law: "DPA 2017", regulator: "Data Protection Office", adequacy: true, note: "Évaluez l’adéquation du destinataire et utilisez des garanties documentées si nécessaire." },
    EG: { name: "Égypte", law: "Law 151/2020", regulator: "PDPC", adequacy: false, note: "Le cadre d’adéquation est en développement; vérifiez l’autorisation réglementaire applicable." },
    TZ: { name: "Tanzanie", law: "PDPA 2022", regulator: "Personal Data Protection Commission", adequacy: false, note: "Les garanties contractuelles et le consentement font partie des mécanismes à vérifier." },
    UG: { name: "Ouganda", law: "DPA 2019", regulator: "PDPO", adequacy: false, note: "Vérifiez la protection équivalente ou un consentement explicite adapté au transfert." },
    TN: { name: "Tunisie", law: "Loi organique 63-2004", regulator: "INPDP", adequacy: false, note: "Une autorisation préalable peut être nécessaire lorsque la protection n’est pas équivalente." },
    SN: { name: "Sénégal", law: "Loi 2008-12", regulator: "CDP", adequacy: false, note: "Vérifiez l’équivalence de protection, le consentement et les formalités auprès de la CDP." },
    CI: { name: "Côte d’Ivoire", law: "Ordonnance 2013-451", regulator: "ARTCI", adequacy: false, note: "Documentez les garanties contractuelles et le fondement du transfert." },
    CM: { name: "Cameroun", law: "Cadre général de protection", regulator: "Autorité compétente", adequacy: false, note: "Le cadre dédié reste limité; obtenez un avis local et appliquez des garanties contractuelles." },
    AO: { name: "Angola", law: "Loi 22/11", regulator: "ANPD", adequacy: false, note: "Vérifiez la protection équivalente ou l’autorisation de l’ANPD." }
  };

  var CUSTOMS_COUNTRIES = {
    nigeria: { min: 15, typical: 25, max: 45, port: "Port d’Apapa, Lagos", agentRate: .015, storage: 50, inspection: 300, portFee: 400 },
    kenya: { min: 5, typical: 10, max: 20, port: "Port de Mombasa", agentRate: .012, storage: 35, inspection: 200, portFee: 250 },
    kenya_icd: { min: 3, typical: 6, max: 12, port: "Nairobi ICD", agentRate: .012, storage: 30, inspection: 180, portFee: 200 },
    southafrica: { min: 3, typical: 7, max: 15, port: "Durban / Le Cap", agentRate: .01, storage: 25, inspection: 150, portFee: 200 },
    ghana: { min: 10, typical: 18, max: 35, port: "Port de Tema", agentRate: .015, storage: 40, inspection: 250, portFee: 300 },
    ethiopia: { min: 14, typical: 30, max: 60, port: "Djibouti (transit) → Addis-Abeba", agentRate: .02, storage: 60, inspection: 400, portFee: 600 },
    tanzania: { min: 5, typical: 12, max: 25, port: "Port de Dar es Salaam", agentRate: .013, storage: 38, inspection: 220, portFee: 280 },
    rwanda: { min: 3, typical: 6, max: 10, port: "Kigali Dry Port", agentRate: .01, storage: 20, inspection: 120, portFee: 150 },
    egypt: { min: 5, typical: 12, max: 25, port: "Port-Saïd / Alexandrie", agentRate: .013, storage: 35, inspection: 200, portFee: 280 },
    senegal: { min: 7, typical: 14, max: 28, port: "Port de Dakar", agentRate: .015, storage: 40, inspection: 220, portFee: 300 }
  };

  var CUSTOMS_DOCUMENTS = {
    commercial: ["Connaissement / lettre de transport aérien", "Facture commerciale", "Liste de colisage", "Certificat d’origine", "Déclaration d’importation", "Garantie douanière"],
    personal: ["Liste de colisage", "Déclaration d’effets personnels", "Copie du passeport", "Preuve de résidence à l’étranger", "Permis d’importation si requis"],
    vehicles: ["Titre original", "Connaissement", "Facture commerciale", "Certificat d’origine", "Déclaration d’importation", "Certificat de contrôle technique"],
    food: ["Connaissement", "Facture commerciale", "Liste de colisage", "Certificat d’origine", "Certificat phytosanitaire", "Certificat sanitaire", "Permis d’importation"],
    pharma: ["Connaissement", "Facture commerciale", "Certificat d’analyse", "Certificat BPF", "Permis d’importation", "Enregistrement du produit"],
    electronics: ["Connaissement", "Facture commerciale", "Liste de colisage", "Certificat d’origine", "Homologation", "Certificat de conformité"]
  };

  function number(name, fallback) {
    var field = form.elements.namedItem(name);
    var parsed = field ? Number(String(field.value).replace(",", ".")) : NaN;
    return Number.isFinite(parsed) ? parsed : (fallback || 0);
  }

  function value(name) {
    var field = form.elements.namedItem(name);
    return field ? String(field.value || "").trim() : "";
  }

  function checked(name) {
    var field = form.elements.namedItem(name);
    return Boolean(field && field.checked);
  }

  function money(amount, currency) {
    var safe = Number.isFinite(amount) ? amount : 0;
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: currency || "EUR",
        maximumFractionDigits: 2
      }).format(safe);
    } catch (_) {
      return safe.toFixed(2) + " " + (currency || "");
    }
  }

  function decimal(amount, suffix) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(amount) + (suffix || "");
  }

  function report(title, text, metricList, rowList, noteList) {
    return {
      title: title,
      generatedAt: new Date().toISOString(),
      summary: text,
      metrics: metricList || [],
      rows: rowList || [],
      notes: noteList || []
    };
  }

  function landedCost() {
    if (!window.LandedCostEngine) throw new Error("Le moteur de coût rendu n’est pas disponible.");
    if (number("fobUSD") <= 0) throw new Error("Indiquez une valeur FOB supérieure à zéro.");
    if (number("fxRate") <= 0) throw new Error("Indiquez un taux de change supérieur à zéro.");
    var result = window.LandedCostEngine.calculate({
      destCountry: value("destCountry"),
      port: value("port"),
      fobUSD: number("fobUSD"),
      freightUSD: number("freightUSD"),
      insuranceUSD: number("insuranceUSD"),
      dutyRate: number("dutyRate"),
      quantity: number("quantity", 1),
      fxRate: number("fxRate"),
      brokerFeeLocal: number("brokerFeeLocal"),
      handlingLocal: number("handlingLocal"),
      haulageLocal: number("haulageLocal")
    });
    if (!result) throw new Error("Choisissez un pays de destination pris en charge.");
    var margin = result.getMarginAnalysis(number("sellPriceLocal"));
    return report(
      "Estimation du coût rendu",
      "Le moteur partagé applique la structure de taxes du pays sélectionné et vos valeurs. Confirmez le code SH, les taux et les frais avec la déclaration ou l’autorité douanière.",
      [
        ["Valeur CIF", money(result.cifUSD, "USD")],
        ["Droits estimés", money(result.importDutyUSD, "USD")],
        ["TVA estimée", money(result.vatUSD, "USD")],
        ["Coût rendu total", money(result.totalLandedLocal, result.currency)],
        ["Coût par unité", money(result.perUnitLocal, result.currency)]
      ],
      [
        ["FOB", money(result.fobUSD, "USD")],
        ["Fret", money(result.freightUSD, "USD")],
        ["Assurance", money(result.insuranceUSD, "USD")],
        ["Prélèvements", money(result.totalLeviesUSD, "USD")],
        ["Frais locaux", money(result.localChargesUSD, "USD")],
        ["Marge au prix saisi", margin.sellPrice > 0 ? decimal(margin.margin, " %") : "Prix de vente non saisi"]
      ].concat(result.levyBreakdown.map(function (item) {
        return [item.name, money(item.amountUSD, "USD"), decimal(item.rate, " %"), item.base];
      })),
      ["TVA du moteur : " + decimal(result.vatRate, " %") + ". Taux effectif des taxes : " + result.effectiveTaxRate + " %. Vérifiez les exonérations et la base applicable."]
    );
  }

  function lcFees() {
    if (!window.LcFeeEngine) throw new Error("Le moteur de crédit documentaire n’est pas disponible.");
    var result = window.LcFeeEngine.calculate({
      lcValue: number("lcValue"),
      countryCode: value("countryCode"),
      lcType: value("lcType"),
      amendments: Math.max(0, Math.floor(number("amendments"))),
      confirmed: checked("confirmed"),
      includeMargin: checked("includeMargin")
    });
    if (!result) throw new Error("Indiquez une valeur documentaire supérieure à zéro.");
    return report(
      "Estimation des frais de crédit documentaire",
      "Résultat du même moteur que l’application anglaise. Demandez la grille tarifaire écrite de la banque avant émission.",
      [
        ["Type", result.lcTypeLabel],
        ["Durée", result.tenorDays + " jours"],
        ["Frais totaux", money(result.totalFees, "USD")],
        ["Coût effectif", result.feePercentage + " %"],
        ["Dépôt de marge", money(result.marginDeposit, "USD")]
      ],
      result.breakdown.map(function (item) {
        return [item.label, money(item.amount, "USD"), item.basis, item.note];
      }),
      [result.marginNote, "Les banques peuvent appliquer minimums, taxes, marges de change et conditions différentes."]
    );
  }

  function exportDocuments() {
    if (!window.ExportDocsEngine) throw new Error("Le moteur documentaire n’est pas disponible.");
    var result = window.ExportDocsEngine.getDocList(value("exportCountry"), value("productCat"), value("exportDest"));
    if (!result.countryInfo) throw new Error("Choisissez un pays exportateur pris en charge.");
    var items = result.universal.concat(result.countrySpecific).concat(result.destinationSpecific);
    return report(
      "Checklist documentaire export",
      "Checklist du moteur partagé pour " + result.countryInfo.name + ". Elle ne remplace pas les exigences du portail douanier, de la banque ou du transporteur.",
      [
        ["Documents recensés", String(result.totalDocs)],
        ["Documents obligatoires", String(result.mandatoryCount)],
        ["Autorité export", result.countryInfo.exportAuthority || "À confirmer"],
        ["Autorité douanière", result.countryInfo.customsAuthority || "À confirmer"]
      ],
      items.map(function (item) {
        return [item.name, item.mandatory === true ? "Obligatoire" : "Si applicable", item.description || "", item.source];
      }),
      result.prohibited.concat(result.tips).concat(["Vérifiez le code SH, la destination, les sanctions, licences et exigences client avant expédition."])
    );
  }

  function hsCodeLookup() {
    if (!window.HsLookupEngine) throw new Error("Le moteur SH n’est pas disponible.");
    var query = value("query").trim();
    if (query.length < 2) throw new Error("Saisissez au moins deux caractères ou un code SH.");
    var exact = window.HsLookupEngine.lookupByCode(query);
    var matches = exact ? [exact] : window.HsLookupEngine.searchByProduct(query);
    if (!matches.length) throw new Error("Aucun code trouvé. Décrivez autrement le produit ou vérifiez le code.");
    var selected = matches[0];
    var duty = window.HsLookupEngine.getDutyRates(selected.code, value("dutyCountry"));
    return report(
      "Résultats de recherche SH",
      "Pistes produites par le moteur partagé. La première correspondance n’est pas une décision douanière.",
      [
        ["Première piste", selected.code],
        ["Description", selected.description],
        ["Pays comparé", duty ? duty.country : "Non disponible"],
        ["Droit typique", duty && duty.dutyTypical !== null ? decimal(duty.dutyTypical, " %") : "Non disponible"]
      ],
      matches.slice(0, 20).map(function (item) {
        return [item.code, item.description, item.chapterTitle || ""];
      }),
      [duty && duty.notes ? duty.notes : "Vérifiez la sous-position nationale.", "Confirmez le classement, les droits, la TVA, les prélèvements et les restrictions avant déclaration."]
    );
  }

  function shippingEstimator() {
    if (!window.ShippingEngine) throw new Error("Le moteur de fret n’est pas disponible.");
    var result = window.ShippingEngine.estimate(
      value("originPort"), value("destPort"), value("containerType"),
      number("cbm", 1), number("weightKg", 100)
    );
    if (!result || !result.found) throw new Error(result && result.message ? result.message : "Corridor indisponible.");
    var rows = [];
    if (result.sea) rows.push(["Mer", money(result.sea.minUSD, "USD"), money(result.sea.maxUSD, "USD"), result.sea.transitDays.min + "–" + result.sea.transitDays.max + " jours", result.sea.type]);
    if (result.air) rows.push(["Air", money(result.air.minUSD, "USD"), money(result.air.maxUSD, "USD"), result.air.transitDays.min + "–" + result.air.transitDays.max + " jours", String(result.air.weightKg) + " kg"]);
    return report(
      "Fourchettes de fret",
      "Résultat du registre partagé de corridors. Il s’agit d’un repère pré-fret, pas d’un devis.",
      [
        ["Origine", value("originPort")],
        ["Destination", value("destPort")],
        ["Chargement", value("containerType")],
        ["Options disponibles", String(rows.length)]
      ],
      rows,
      window.ShippingEngine.getObservations(value("originPort"), value("destPort"), value("containerType"), result).map(function (item) {
        return item.text || String(item);
      })
    );
  }

  function fxImportImpact() {
    if (!window.FxImpactEngine) throw new Error("Le moteur de change n’est pas disponible.");
    var usdAmount = number("usdAmount");
    var fxRate = number("fxRate");
    if (usdAmount <= 0 || fxRate <= 0) throw new Error("Indiquez un montant USD et un taux de change supérieurs à zéro.");
    var result = window.FxImpactEngine.calculateImpact(usdAmount, value("countryCode"), fxRate);
    if (!result) throw new Error("Choisissez un pays pris en charge.");
    var scenarios = window.FxImpactEngine.modelScenarios(usdAmount, value("countryCode"), fxRate);
    var breakeven = window.FxImpactEngine.calcBreakeven(number("sellPrice"), usdAmount, number("otherCosts"));
    return report(
      "Impact du change sur l’importation",
      "Coût local calculé par le même moteur que l’application anglaise à partir de votre taux saisi.",
      [
        ["Montant USD", money(usdAmount, "USD")],
        ["Taux saisi", decimal(fxRate)],
        ["Coût local", money(result.localCost, result.currency)],
        ["Taux de rentabilité", breakeven ? decimal(breakeven.breakevenRate) : "Prix de vente insuffisant"]
      ],
      scenarios.map(function (item) {
        return [decimal(item.changePercent, " %"), decimal(item.rate), money(item.localCost, result.currency), money(item.delta, result.currency)];
      }),
      window.FxImpactEngine.getObservations(value("countryCode"), usdAmount, fxRate).map(function (item) {
        return item.text || String(item);
      })
    );
  }

  function demurrageCalculator() {
    if (!window.DemurrageEngine) throw new Error("Le moteur de surestaries n’est pas disponible.");
    var result = window.DemurrageEngine.calculateDemurrage(
      value("portCode"), value("containerType"), number("daysAtPort"), number("fxRate", 1)
    );
    if (!result) throw new Error("Choisissez un port pris en charge.");
    return report(
      "Estimation des surestaries",
      "Calcul par paliers du moteur portuaire partagé. Vérifiez la franchise et la grille contractuelle.",
      [
        ["Port", result.portName],
        ["Jours gratuits", String(result.freeDays)],
        ["Jours payants", String(result.paidDays)],
        ["Total estimé", money(result.totalUSD, "USD")]
      ],
      result.breakdown.map(function (item) {
        return [item.tier, String(item.daysInTier), money(item.ratePerDay, item.currency), money(item.cost, item.currency)];
      }).concat(result.additionalBreakdown.map(function (item) {
        return [item.name, "", money(item.amount, item.currency), item.description];
      })),
      window.DemurrageEngine.getObservations(result).map(function (item) { return item.text || String(item); })
    );
  }

  function incotermsCalculator() {
    if (!window.IncotermsEngine) throw new Error("Le moteur Incoterms n’est pas disponible.");
    var costs = {};
    ["packaging", "loading_origin", "export_customs", "inland_origin", "loading_vessel", "freight", "insurance", "unloading_dest", "import_customs", "duties_taxes", "inland_dest", "delivery"].forEach(function (id) {
      costs[id] = number("cost_" + id);
    });
    var result = window.IncotermsEngine.calculateCostSplit(value("termCode"), costs);
    var comparison = window.IncotermsEngine.compareTwoTerms(value("termCode"), value("compareCode"), costs);
    if (!result || !comparison) throw new Error("Choisissez deux Incoterms pris en charge.");
    return report(
      "Répartition Incoterms 2020",
      "Répartition et comparaison issues du moteur Incoterms partagé. Écrivez toujours le lieu nommé dans le contrat.",
      [
        ["Terme principal", result.termCode],
        ["Coût vendeur", money(result.sellerTotal, "USD")],
        ["Coût acheteur", money(result.buyerTotal, "USD")],
        ["Écart acheteur", money(comparison.buyerDiff, "USD")]
      ],
      result.breakdown.map(function (item) {
        return [item.label, money(item.amount, "USD"), item.paidBy];
      }),
      window.IncotermsEngine.getObservations(value("termCode"), { transportMode: "sea", isAfrican: true }).map(function (item) {
        return item.text || String(item);
      })
    );
  }

  function afcftaTracker() {
    if (typeof AFCFTA_DATA === "undefined") throw new Error("Le registre ZLECAf n’est pas disponible.");
    var origin = AFCFTA_DATA.memberStates[value("originCountry")];
    var destination = AFCFTA_DATA.memberStates[value("destinationCountry")];
    if (!origin || !destination) throw new Error("Choisissez deux pays pris en charge.");
    if (value("originCountry") === value("destinationCountry")) throw new Error("Choisissez deux pays différents.");
    var year = Math.max(2021, Math.min(2033, Math.floor(number("scenarioYear", 2026))));
    var category = value("tariffCategory");
    var generalA = Math.max(0, Math.min(100, (year - 2020) * 10));
    var generalB = year < 2026 ? 0 : Math.max(0, Math.min(100, (year - 2025) * 12.5));
    var schedule = origin.reductionSchedule || {};
    var reduction = category === "A"
      ? (schedule.catA && schedule.catA[year] !== undefined ? schedule.catA[year] : generalA)
      : category === "B"
        ? (schedule.catB && schedule.catB[year] !== undefined ? schedule.catB[year] : generalB)
        : 0;
    var active = origin.tradingStatus === "active_GTI" && destination.tradingStatus === "active_GTI";
    var baseDuty = number("baseDuty");
    var effectiveDuty = active && category !== "C" ? baseDuty * (1 - reduction / 100) : baseDuty;
    var sensitive = (origin.sensitiveProducts || []).concat(destination.sensitiveProducts || []).filter(function (item, index, list) {
      return list.indexOf(item) === index;
    });
    return report(
      "Évaluation du corridor ZLECAf",
      active ? "Les deux pays sont marqués actifs dans le registre local. La préférence reste soumise à la ligne tarifaire et à l’origine." : "La préférence n’est pas confirmée dans le registre local pour ce corridor.",
      [
        ["Corridor", origin.name + " → " + destination.name],
        ["État", active ? "Actif dans le registre" : "Préférence non confirmée"],
        ["Réduction de planification", decimal(reduction, " %")],
        ["Droit indicatif après réduction", decimal(effectiveDuty, " %")],
        ["Code SH", value("hsCode") || "Non saisi"]
      ],
      [
        [origin.name, origin.ratified ? "Ratifié" : "Non ratifié", origin.scheduleFiled ? "Barème déposé" : "Barème non déposé", origin.tradingStatus],
        [destination.name, destination.ratified ? "Ratifié" : "Non ratifié", destination.scheduleFiled ? "Barème déposé" : "Barème non déposé", destination.tradingStatus]
      ].concat(sensitive.map(function (item) { return ["Produit sensible signalé", item]; })),
      ["Confirmez la concession de la ligne, la règle d’origine et le certificat auprès des autorités des deux pays."]
    );
  }

  function cooGenerator() {
    if (!window.CooEngine) throw new Error("Le moteur de certificat d’origine n’est pas disponible.");
    var requiredCore = ["exporter_name", "exporter_address", "consignee_name", "consignee_address", "goods_description", "hs_code", "invoice_number", "authorized_signatory"];
    if (requiredCore.some(function (name) { return !value(name); })) throw new Error("Complétez les parties, la marchandise, le code SH, la facture et le signataire.");
    var fields = {};
    Array.prototype.forEach.call(form.elements, function (input) {
      if (!input.name || ["exWorksPrice", "nonOriginatingMaterialsCost", "hasWhollyObtained", "hasCTH", "processType"].indexOf(input.name) !== -1) return;
      fields[input.name] = input.type === "checkbox" ? input.checked : input.value;
    });
    var formData = window.CooEngine.generateFormData(value("templateId"), fields);
    if (!formData) throw new Error("Choisissez un modèle pris en charge.");
    var criteria = window.CooEngine.checkOriginCriteria({
      hasWhollyObtained: checked("hasWhollyObtained"),
      hasCTH: checked("hasCTH"),
      exWorksPrice: number("exWorksPrice"),
      nonOriginatingMaterialsCost: number("nonOriginatingMaterialsCost"),
      processType: checked("processType") ? "SP" : ""
    });
    var fieldRows = Object.keys(formData.fields).map(function (key) {
      var item = formData.fields[key];
      return [item.label, item.value || "À compléter", item.required ? "Requis" : "Facultatif"];
    });
    return report(
      "Brouillon de certificat d’origine",
      formData.templateName + ". Ce brouillon doit être revu et émis par l’autorité compétente.",
      [
        ["Modèle", formData.templateName],
        ["Autorité d’émission", formData.issuingAuthority || "À confirmer"],
        ["Critères testés", String(criteria.length)],
        ["Critères positifs", String(criteria.filter(function (item) { return item.qualifies; }).length)]
      ],
      fieldRows.concat(criteria.map(function (item) {
        return ["Critère " + item.criteria, item.qualifies ? "Satisfait" : "Non satisfait", item.desc];
      })),
      window.CooEngine.getObservations(value("templateId"), value("exporter_country"), value("consignee_country")).map(function (item) {
        return item.text || String(item);
      })
    );
  }

  function tradeFinance() {
    if (!window.TradeFinanceEngine) throw new Error("Le moteur de financement n’est pas disponible.");
    var amount = number("tradeValue");
    if (amount <= 0) throw new Error("Indiquez une valeur commerciale supérieure à zéro.");
    var result = window.TradeFinanceEngine.calculate({
      instrumentId: value("instrumentId"),
      tradeValue: amount,
      countryCode: value("countryCode"),
      tenorDays: number("tenorDays"),
      confirmed: checked("confirmed")
    });
    var comparisons = window.TradeFinanceEngine.compareAll(amount, value("countryCode"));
    var advice = window.TradeFinanceEngine.advise({
      smallOrder: amount < 5000,
      firstTime: checked("firstTime"),
      needDeferred: checked("needDeferred"),
      regular: checked("regular"),
      intraAfrica: checked("intraAfrica")
    });
    if (!result) throw new Error("Choisissez un instrument pris en charge.");
    return report(
      "Comparaison du financement commercial",
      "Comparaison du même moteur pays/instrument que l’application anglaise. Le coût le plus bas n’est pas automatiquement le meilleur niveau de protection.",
      [
        ["Instrument détaillé", result.instrument.abbreviation],
        ["Frais estimés", money(result.totalFee, "USD")],
        ["Coût effectif", result.feePct + " %"],
        ["Valeur", money(amount, "USD")],
        ["Orientation", advice.recommended]
      ],
      comparisons.map(function (item) {
        return [item.name, money(item.totalFee, "USD"), item.feePct + " %"];
      }).concat(result.breakdown.map(function (item) {
        return [item.label, money(item.amount, "USD"), item.basis];
      })),
      [advice.reason].concat(result.observations || []).concat(["Comparez aussi garanties, délais, documents, risque de contrepartie et trésorerie immobilisée."])
    );
  }

  function commodityTracker() {
    var country = value("country");
    var query = value("commodity").toLowerCase();
    if (!window.CommodityEngine) throw new Error("Le moteur de données commerciales n’a pas pu être chargé.");
    var countryData = window.CommodityEngine.getCountrySummary(country);
    if (!countryData) throw new Error("Choisissez un pays disponible.");
    var commodities = window.CommodityEngine.getRankedList(country, "exports", null);
    if (query) {
      commodities = commodities.filter(function (item) {
        return JSON.stringify(item).toLowerCase().indexOf(query) !== -1;
      });
    }
    var table = commodities.slice(0, 25).map(function (item) {
      return [item.name || item.commodity || "Produit", item.type || item.direction || "—", String(item.value || item.valueUSD || "—"), item.share ? String(item.share) : "—"];
    });
    return report(
      "Repère de matières premières",
      "Instantané de planification issu du jeu de données AfroTools daté de 2024. Il ne s’agit ni de cours en direct ni d’une cotation exécutable.",
      [
        ["Pays", countryData.name || country],
        ["Éléments trouvés", String(commodities.length)],
        ["Millésime", "2024"],
        ["Solde commercial", String(countryData.tradeBalance || 0) + " M USD"]
      ],
      table,
      ["Confirmez prix, volumes et disponibilité auprès d’une bourse, d’une douane, d’une agence statistique ou d’un fournisseur officiel."]
    );
  }

  function paymentComparator() {
    var amount = number("amount");
    if (amount <= 0) throw new Error("Indiquez un montant supérieur à zéro.");
    if (!window.PaymentComparatorEngine) throw new Error("Le moteur de paiement n’est pas disponible.");
    var providers = window.PaymentComparatorEngine.compareAll(amount);
    var scenario = window.PaymentComparatorEngine.calculateScenario(amount, value("frequency"), value("scenarioProvider"));
    if (!providers.length || !scenario) throw new Error("Choisissez un prestataire pris en charge.");
    return report(
      "Comparaison des paiements",
      "Comparaison issue du même registre de prestataires que l’application anglaise. Vérifiez les tarifs et le corridor à la date du paiement.",
      [
        ["Option la moins coûteuse", providers[0].shortName],
        ["Frais estimés", money(providers[0].estimatedFee, "USD")],
        ["Coût total", money(providers[0].totalCost, "USD")],
        ["Frais mensuels du scénario", money(scenario.monthlyFee, "USD")],
        ["Frais annuels du scénario", money(scenario.annualFee, "USD")]
      ],
      providers.map(function (item) {
        return [item.name, money(item.estimatedFee, "USD"), item.feePct + " %", item.speed, item.africaCoverage];
      }),
      window.PaymentComparatorEngine.getObservations(amount, providers).concat(["Vérifiez la disponibilité du corridor, le change appliqué, les plafonds, le remboursement et le délai avant de payer."])
    );
  }

  function sadcRules() {
    var exWorks = number("exWorksPrice");
    var nonSadc = number("nonSadcCost");
    if (exWorks <= 0) throw new Error("Indiquez une valeur départ usine supérieure à zéro.");
    if (nonSadc > exWorks) throw new Error("La valeur des matières non-SADC ne peut pas dépasser la valeur départ usine.");
    if (!window.SadcRooEngine) throw new Error("Le moteur des règles SADC n’est pas disponible.");
    var result = window.SadcRooEngine.checkOrigin({
      hsChapter: number("hsChapter"),
      exportCountry: value("exportCountry"),
      importCountry: value("importCountry"),
      exWorksPrice: exWorks,
      nonSadcCost: nonSadc,
      whollyObtained: checked("whollyObtained"),
      hasCTH: checked("hasCTH"),
      hasFabricFwd: checked("hasFabricFwd")
    });
    var resultLabel = result.eligible ? "Admissibilité indicative positive" : "Critères non satisfaits";
    return report(
      "Pré-vérification de l’origine SADC",
      resultLabel + ". Ce résultat vient de la règle produit du moteur partagé et ne remplace pas la décision de l’autorité.",
      [
        ["Part de valeur SADC", decimal(result.sadcVA, " %")],
        ["Part non-SADC", decimal(result.nonSadcPct, " %")],
        ["Règle applicable", result.rule ? result.rule.ruleLabel : "Non trouvée"],
        ["Conclusion", resultLabel]
      ],
      result.checks.map(function (item) { return [item.label, item.pass ? "Conforme" : "Non conforme", item.detail]; }),
      (result.observations || []).concat(["Consultez l’annexe SADC applicable au code SH et demandez une décision aux autorités compétentes si nécessaire."])
    );
  }

  function proformaInvoice() {
    var currency = value("currency") || "USD";
    if (!value("seller") || !value("buyer")) throw new Error("Indiquez le vendeur et l’acheteur.");
    var totals = utilityEngine().proformaTotals({
      items: Array.from({ length: 10 }, function (_, index) { return index + 1; }).map(function (index) {
        return {
          description: value("item" + index),
          quantity: number("qty" + index),
          unitPrice: number("price" + index)
        };
      }),
      freight: number("freight"),
      insurance: number("insurance")
    });
    if (!totals.itemCount) throw new Error("Ajoutez au moins une ligne d’article avec quantité et prix.");
    return report(
      "Projet de facture proforma",
      "Document commercial préparatoire, non fiscal et non douanier. Vérifiez l’identité des parties, le code SH, l’Incoterm, la devise et les conditions avant envoi.",
      [
        ["Vendeur", value("seller")],
        ["Acheteur", value("buyer")],
        ["Sous-total marchandises", money(totals.subtotal, currency)],
        ["Total proforma", money(totals.total, currency)],
        ["Validité", value("validity") || "À préciser"]
      ],
      totals.items.map(function (item, index) {
        var inputIndex = index + 1;
        return [item.description, value("itemHs" + inputIndex) || "—", String(item.quantity), value("unit" + inputIndex) || "pcs", money(item.unitPrice, currency), money(item.total, currency)];
      }).concat([["Fret", "", "", money(totals.freight, currency)], ["Assurance", "", "", money(totals.insurance, currency)]]),
      [
        "Référence : " + (value("reference") || "à attribuer") + ". Émission : " + (value("issueDate") || "à préciser") + ". Validité : " + (value("validity") || "à préciser") + ".",
        "Incoterm : " + (value("incoterm") || "à préciser") + ". Trajet : " + (value("loadPort") || "—") + " → " + (value("dischargePort") || "—") + ".",
        "Paiement : " + (value("paymentTerms") || "à préciser") + ". Livraison : " + (value("deliveryTerms") || "à préciser") + ".",
        "Marques : " + (value("marks") || "aucune").slice(0, 500) + ". Conditions : " + (value("conditions") || "aucune").slice(0, 500) + "."
      ]
    );
  }

  function billOfLading() {
    var draft = utilityEngine().billOfLadingDraft({
      shipper: value("shipper"), consignee: value("consignee"), cargo: value("cargo"),
      loadPort: value("loadPort"), dischargePort: value("dischargePort"),
      grossWeight: number("grossWeight"), volume: number("volume"), freight: number("freight")
    });
    if (!draft.valid) {
      throw new Error("Indiquez au minimum le chargeur, le destinataire et la marchandise.");
    }
    var currency = value("currency") || "USD";
    return report(
      "Brouillon de connaissement",
      "Brouillon de préparation uniquement. Seul le transporteur ou son agent autorisé peut émettre le connaissement négociable ou final.",
      [
        ["Chargeur", value("shipper")],
        ["Destinataire", value("consignee")],
        ["Trajet", draft.route || "À confirmer"],
        ["Poids brut", decimal(draft.grossWeight, " kg")],
        ["Volume", decimal(draft.volume, " m³")]
      ],
      [
        ["Numéro / réservation", [value("blNumber"), value("bookingReference")].filter(Boolean).join(" / ") || "À confirmer"],
        ["Réception / livraison", [value("placeReceipt"), value("placeDelivery")].filter(Boolean).join(" → ") || "À confirmer"],
        ["Transporteur / navire", [value("carrier"), value("vessel")].filter(Boolean).join(" / ") || "À confirmer"],
        ["Voyage", value("voyage") || "À confirmer"],
        ["Conteneur / scellé", [value("container"), value("seal")].filter(Boolean).join(" / ") || "À confirmer"],
        ["Marchandise", value("cargo")],
        ["Colis", value("packages") || "À confirmer"],
        ["Fret déclaré", money(draft.freight, currency)],
        ["Fret payable", value("freightPayable") || "À confirmer"],
        ["Originaux", value("originals") || "À confirmer"],
        ["Juridiction", value("jurisdiction") || "À confirmer"],
        ["Instructions", value("instructions") || "Aucune instruction saisie"]
      ],
      ["Relisez la description, les marques, les poids, le nombre d’originaux et les instructions de remise avec le transporteur."]
    );
  }

  function crossBorderData() {
    var country = CROSS_BORDER_COUNTRIES[value("countryCode")];
    if (!country) throw new Error("Choisissez un pays pris en charge.");
    var profile = utilityEngine().crossBorderCountryProfile({
      code: value("countryCode"),
      name: country.name,
      law: country.law,
      regulator: country.regulator,
      adequacy: { exists: country.adequacy, note: country.note },
      mechanisms: [
        { name: "Protection équivalente / adéquation", status: country.adequacy ? "disponible" : "à vérifier" },
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
      warnings: country.warning ? [country.warning] : []
    });
    return report(
      "Transferts de données — " + profile.name,
      profile.law + " · autorité : " + profile.regulator + ". Cette fiche reprend le modèle pays partagé; elle ne constitue ni une autorisation ni un avis juridique.",
      [
        ["Pays d’origine", profile.name],
        ["Loi principale", profile.law],
        ["Autorité", profile.regulator],
        ["Cadre d’adéquation", profile.adequacy.exists ? "Existe / à confirmer" : "Pas de liste formelle"]
      ],
      profile.mechanisms.map(function (item) { return [item.name, item.status]; }).concat(
        profile.steps.map(function (item, index) { return ["Étape " + (index + 1) + " — " + item.title, item.detail]; })
      ),
      [profile.adequacy.note].concat(profile.warnings).concat([
        "Confirmez les règles du pays destinataire, les exigences sectorielles et la validité du mécanisme auprès des autorités ou d’un conseil qualifié."
      ])
    );
  }

  function customsTime() {
    var country = CUSTOMS_COUNTRIES[value("country")];
    if (!country) throw new Error("Choisissez un pays ou corridor pris en charge.");
    if (number("cargoValue") <= 0) throw new Error("Indiquez une valeur CAF supérieure à zéro.");
    var model = utilityEngine().customsClearanceModel({
      minimumDays: country.min,
      typicalDays: country.typical,
      maximumDays: country.max,
      documentStatus: value("documentStatus"),
      goodsType: value("goodsType"),
      cargoValue: number("cargoValue"),
      agentRate: country.agentRate,
      storagePerDay: country.storage
    });
    var documents = CUSTOMS_DOCUMENTS[value("goodsType")] || CUSTOMS_DOCUMENTS.commercial;
    return report(
      "Fourchette de dédouanement",
      "Modèle pays partagé appliqué à " + country.port + ". Les valeurs sont des hypothèses de planification sans connexion au port ni à la douane.",
      [
        ["Fourchette estimée", model.minimumDays + " à " + model.maximumDays + " jours"],
        ["Délai typique", model.typicalDays + " jours"],
        ["Port / corridor", country.port],
        ["Frais d’agent estimés", money(model.agentFee, "USD")],
        ["Stockage estimé", money(model.storageCost, "USD")]
      ],
      documents.map(function (documentName, index) {
        return [index < 4 ? "Document essentiel" : "Document à confirmer", documentName];
      }).concat([
        ["Inspection de référence", money(country.inspection, "USD")],
        ["Manutention portuaire de référence", money(country.portFee, "USD")]
      ]),
      ["Demandez un délai et un devis écrits au transitaire; vérifiez la mainlevée, les permis, le paiement, l’inspection et les risques de surestaries."]
    );
  }

  function shippingWeight() {
    var weight = utilityEngine().shippingWeight({
      packages: number("packages", 1), actualWeight: number("actualWeight"),
      length: number("length"), width: number("width"), height: number("height"),
      divisor: number("divisor", 5000), rate: number("rate"),
      fuelRate: number("fuelRate"), declaredValue: number("declaredValue"),
      insuranceRate: number("insuranceRate"), fixedCharges: number("fixedCharges"),
      contingencyRate: number("contingencyRate")
    });
    if (weight.actualWeight <= 0 || number("length") <= 0 || number("width") <= 0 || number("height") <= 0) {
      throw new Error("Indiquez le poids et les trois dimensions de chaque colis.");
    }
    var currency = value("currency") || "USD";
    return report(
      "Poids facturable et budget d’expédition",
      (weight.volumetricWeight > weight.actualWeight ? "Le poids volumétrique" : "Le poids réel") + " détermine le poids facturable selon vos saisies.",
      [
        ["Poids réel total", decimal(weight.actualWeight, " kg")],
        ["Poids volumétrique", decimal(weight.volumetricWeight, " kg")],
        ["Poids facturable", decimal(weight.chargeableWeight, " kg")],
        ["Budget estimé", money(weight.total, currency)]
      ],
      [
        ["Fret", money(weight.freight, currency)],
        ["Surcharge carburant", money(weight.fuel, currency)],
        ["Assurance", money(weight.insurance, currency)],
        ["Frais fixes", money(weight.fixedCharges, currency)],
        ["Marge de sécurité", money(weight.contingency, currency)]
      ],
      ["Confirmez le diviseur volumétrique, l’arrondi du poids, les minimums, la devise et les suppléments avec le transporteur."]
    );
  }

  function packingList() {
    if (!value("shipper") || !value("consignee") || !value("description1")) {
      throw new Error("Indiquez le chargeur, le destinataire et au moins une ligne de colisage.");
    }
    var packageRows = Array.from({ length: 10 }, function (_, index) { return index + 1; }).map(function (index) {
      var lengthCm = number("length" + index);
      var widthCm = number("width" + index);
      var heightCm = number("height" + index);
      return {
        description: value("description" + index),
        count: number("count" + index),
        netWeight: number("net" + index),
        grossWeight: number("gross" + index),
        lengthCm: lengthCm,
        widthCm: widthCm,
        heightCm: heightCm,
        cbm: lengthCm * widthCm * heightCm / 1000000
      };
    }).filter(function (row) { return row.description && row.count > 0; });
    var totals = utilityEngine().packingTotals({
      weightsAreTotals: true,
      packages: packageRows
    });
    if (!packageRows.length) throw new Error("Ajoutez au moins une ligne avec un nombre de colis positif.");
    if (totals.grossWeight < totals.netWeight) {
      throw new Error("Le poids brut total ne peut pas être inférieur au poids net total.");
    }
    return report(
      "Brouillon de liste de colisage",
      "Brouillon local à rapprocher de la facture commerciale et du document de transport avant expédition.",
      [
        ["Trajet", value("loadPort") + " → " + value("dischargePort")],
        ["Nombre total de colis", String(totals.packageCount)],
        ["Poids net total", decimal(totals.netWeight, " kg")],
        ["Poids brut total", decimal(totals.grossWeight, " kg")],
        ["Volume total", decimal(totals.cbm, " m³")]
      ],
      packageRows.map(function (row) {
        return [row.description, String(row.count), decimal(row.netWeight, " kg"), decimal(row.grossWeight, " kg")];
      }),
      [
        "Référence : " + value("reference") + ". Date : " + (value("packingDate") || "à confirmer") + ". Facture : " + (value("invoiceReference") || "à confirmer") + ".",
        "Chargeur : " + value("shipper") + ". Destinataire : " + value("consignee") + ". Notification : " + (value("notify") || "non saisie") + ".",
        "Navire / voyage : " + (value("vessel") || "à confirmer") + ". Origine : " + (value("originCountry") || "à confirmer") + ".",
        "Utilisation indicative : 20 pieds " + Math.round(totals.cbm / 33 * 100) +
          " %, 40 pieds " + Math.round(totals.cbm / 67 * 100) +
          " %, 40 pieds HC " + Math.round(totals.cbm / 76 * 100) + " %."
      ]
    );
  }

  var handlers = {
    "hs-code-lookup": hsCodeLookup,
    "shipping-estimator": shippingEstimator,
    "fx-import-impact": fxImportImpact,
    "demurrage-calculator": demurrageCalculator,
    "incoterms-calculator": incotermsCalculator,
    "afcfta-tracker": afcftaTracker,
    "coo-generator": cooGenerator,
    "landed-cost": landedCost,
    "lc-fees": lcFees,
    "export-documents": exportDocuments,
    "trade-finance": tradeFinance,
    "commodity-tracker": commodityTracker,
    "payment-comparator": paymentComparator,
    "sadc-roo": sadcRules,
    "proforma-invoice": proformaInvoice,
    "bill-of-lading": billOfLading,
    "cross-border-data": crossBorderData,
    "customs-time": customsTime,
    "shipping-weight": shippingWeight,
    "packing-list": packingList
  };

  function render(reportData) {
    lastReport = reportData;
    summary.textContent = reportData.summary;
    metrics.replaceChildren();
    reportData.metrics.forEach(function (item) {
      var card = document.createElement("div");
      card.className = "fr-trade-metric";
      var label = document.createElement("span");
      var output = document.createElement("strong");
      label.textContent = item[0];
      output.textContent = item[1];
      card.append(label, output);
      metrics.appendChild(card);
    });
    rows.replaceChildren();
    if (reportData.rows.length) {
      var wrap = document.createElement("div");
      wrap.className = "fr-trade-table-wrap";
      var table = document.createElement("table");
      table.className = "fr-trade-table";
      var body = document.createElement("tbody");
      reportData.rows.forEach(function (row) {
        var tr = document.createElement("tr");
        row.forEach(function (cell) {
          var td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
      table.appendChild(body);
      wrap.appendChild(table);
      rows.appendChild(wrap);
    }
    notes.replaceChildren();
    reportData.notes.forEach(function (note) {
      var li = document.createElement("li");
      li.textContent = note;
      notes.appendChild(li);
    });
    result.hidden = false;
    status.dataset.state = "success";
    status.textContent = "Résultat calculé localement. Aucun champ n’a été envoyé.";
    result.focus();
  }

  function currentPayload() {
    var fields = {};
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || /^(submit|button)$/i.test(field.type)) return;
      fields[field.name] = field.type === "checkbox" ? field.checked : field.value;
    });
    return { tool: tool, locale: "fr", inputs: fields, report: lastReport };
  }

  function textReport() {
    var data = currentPayload();
    var lines = [lastReport.title, lastReport.summary, ""];
    lastReport.metrics.forEach(function (item) { lines.push(item[0] + " : " + item[1]); });
    if (lastReport.rows.length) {
      lines.push("");
      lastReport.rows.forEach(function (row) { lines.push(row.join(" | ")); });
    }
    if (lastReport.notes.length) {
      lines.push("", "Limites et vérifications");
      lastReport.notes.forEach(function (note) { lines.push("- " + note); });
    }
    lines.push("", "Généré localement sur AfroTools. Données saisies non envoyées.");
    return { data: data, text: lines.join("\n") };
  }

  function saveBlob(blob, extension) {
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "afrotools-" + tool + "-" + new Date().toISOString().slice(0, 10) + "." + extension;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 500);
    status.textContent = "Export " + extension.toUpperCase() + " créé localement.";
  }

  function exportFile(format) {
    if (!lastReport) {
      status.dataset.state = "error";
      status.textContent = "Calculez d’abord un résultat.";
      return;
    }
    var output = textReport();
    if (format === "json") {
      saveBlob(new Blob([JSON.stringify(output.data, null, 2)], { type: "application/json;charset=utf-8" }), "json");
    } else if (format === "txt") {
      saveBlob(new Blob([output.text], { type: "text/plain;charset=utf-8" }), "txt");
    } else if (format === "csv") {
      var csvRows = [["Section", "Libellé", "Valeur"]];
      lastReport.metrics.forEach(function (item) { csvRows.push(["Indicateur", item[0], item[1]]); });
      lastReport.rows.forEach(function (row) { csvRows.push(["Détail"].concat(row)); });
      var csv = csvRows.map(function (row) {
        return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(",");
      }).join("\r\n");
      saveBlob(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), "csv");
    } else if (format === "pdf") {
      var JsPdf = window.jspdf && window.jspdf.jsPDF;
      if (!JsPdf) {
        status.dataset.state = "error";
        status.textContent = "Le module PDF local n’est pas disponible. Réessayez après rechargement.";
        return;
      }
      var pdf = new JsPdf({ unit: "mm", format: "a4" });
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text(lastReport.title, 15, 18);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      var lines = pdf.splitTextToSize(output.text, 180);
      var y = 27;
      lines.forEach(function (line) {
        if (y > 282) { pdf.addPage(); y = 15; }
        pdf.text(line, 15, y);
        y += 5;
      });
      pdf.save("afrotools-" + tool + "-" + new Date().toISOString().slice(0, 10) + ".pdf");
      status.dataset.state = "success";
      status.textContent = "PDF créé localement.";
    }
  }

  function reopenJson(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.addEventListener("load", function () {
      try {
        var payload = JSON.parse(String(reader.result || ""));
        if (!payload || payload.tool !== tool || payload.locale !== "fr" || !payload.inputs || !payload.report) {
          throw new Error("Format JSON AfroTools non reconnu pour ce parcours.");
        }
        Array.prototype.forEach.call(form.elements, function (field) {
          if (!field.name || !Object.prototype.hasOwnProperty.call(payload.inputs, field.name)) return;
          if (field.type === "checkbox") field.checked = Boolean(payload.inputs[field.name]);
          else field.value = String(payload.inputs[field.name]);
        });
        render(payload.report);
        status.dataset.state = "success";
        status.textContent = "Export JSON rouvert localement. Vérifiez les champs et le résultat avant utilisation.";
      } catch (error) {
        result.hidden = true;
        status.dataset.state = "error";
        status.textContent = error && error.message ? error.message : "Impossible de rouvrir ce fichier JSON.";
        status.focus();
      }
    });
    reader.addEventListener("error", function () {
      status.dataset.state = "error";
      status.textContent = "Impossible de lire ce fichier JSON local.";
    });
    reader.readAsText(file);
  }

  function initializeCommoditySelect() {
    if (tool !== "commodity-tracker" || !window.CommodityEngine) return;
    var select = form.elements.namedItem("country");
    if (!select || select.options.length > 1) return;
    window.CommodityEngine.getAllCountries().forEach(function (country) {
      var option = document.createElement("option");
      option.value = country.code || country.id;
      option.textContent = country.name;
      select.appendChild(option);
    });
  }

  function fillSelect(name, items, valueKey, labelBuilder) {
    var select = form.elements.namedItem(name);
    if (!select || select.options.length) return;
    items.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item[valueKey];
      option.textContent = labelBuilder(item);
      select.appendChild(option);
    });
  }

  function updateLandedPorts() {
    if (tool !== "landed-cost" || !window.LandedCostEngine) return;
    var select = form.elements.namedItem("port");
    if (!select) return;
    select.replaceChildren();
    window.LandedCostEngine.getCountryPorts(value("destCountry")).forEach(function (port) {
      var option = document.createElement("option");
      option.value = port.code || port.name;
      option.textContent = port.name + (port.city ? " — " + port.city : "");
      select.appendChild(option);
    });
  }

  function updateShippingDestinations() {
    if (tool !== "shipping-estimator" || !window.ShippingEngine) return;
    var select = form.elements.namedItem("destPort");
    if (!select) return;
    select.replaceChildren();
    window.ShippingEngine.getDestinations(value("originPort")).forEach(function (port) {
      var option = document.createElement("option");
      option.value = port.code;
      option.textContent = port.name;
      select.appendChild(option);
    });
  }

  function initializeOwnerSelects() {
    if (tool === "landed-cost" && window.LandedCostEngine) {
      fillSelect("destCountry", window.LandedCostEngine.getAllCountries(), "code", function (item) {
        return (item.flag ? item.flag + " " : "") + item.name + " (" + item.currency + ")";
      });
      updateLandedPorts();
      form.elements.namedItem("destCountry").addEventListener("change", updateLandedPorts);
    }
    if (tool === "export-documents" && window.ExportDocsEngine) {
      fillSelect("exportCountry", window.ExportDocsEngine.getAllCountries(), "code", function (item) {
        return (item.flag ? item.flag + " " : "") + item.name;
      });
      fillSelect("productCat", window.ExportDocsEngine.getProductCategories(), "id", function (item) { return item.name; });
      fillSelect("exportDest", window.ExportDocsEngine.getDestinations(), "code", function (item) { return item.name; });
    }
    if (tool === "payment-comparator" && window.PaymentComparatorEngine) {
      fillSelect("scenarioProvider", window.PaymentComparatorEngine.getAllProviders(), "id", function (item) {
        return item.name + " — " + item.speed;
      });
    }
    if (tool === "sadc-roo" && window.SadcRooEngine) {
      var members = window.SadcRooEngine.getMemberStates();
      fillSelect("exportCountry", members, "code", function (item) {
        return (item.flag ? item.flag + " " : "") + item.name;
      });
      fillSelect("importCountry", members, "code", function (item) {
        return (item.flag ? item.flag + " " : "") + item.name;
      });
    }
    if (tool === "shipping-estimator" && window.ShippingEngine) {
      fillSelect("originPort", window.ShippingEngine.getOriginPorts(), "code", function (item) { return item.name; });
      fillSelect("containerType", window.ShippingEngine.getContainerTypes(), "code", function (item) { return item.name; });
      updateShippingDestinations();
      form.elements.namedItem("originPort").addEventListener("change", updateShippingDestinations);
    }
    if (tool === "fx-import-impact" && window.FX_HISTORY) {
      fillSelect("countryCode", Object.keys(window.FX_HISTORY).map(function (code) {
        return Object.assign({ code: code }, window.FX_HISTORY[code]);
      }), "code", function (item) { return (item.flag ? item.flag + " " : "") + item.currency; });
      var fxSelect = form.elements.namedItem("countryCode");
      var updateRate = function () {
        var current = window.FxImpactEngine.getCurrentRate(value("countryCode"));
        if (current) form.elements.namedItem("fxRate").value = current;
      };
      updateRate();
      fxSelect.addEventListener("change", updateRate);
    }
    if (tool === "demurrage-calculator" && window.DemurrageEngine) {
      fillSelect("portCode", window.DemurrageEngine.getAllPorts(), "code", function (item) {
        return (item.flag ? item.flag + " " : "") + item.name + " — " + item.country;
      });
    }
    if (tool === "incoterms-calculator" && window.IncotermsEngine) {
      var terms = window.IncotermsEngine.getAllTerms();
      fillSelect("termCode", terms, "code", function (item) { return item.code + " — " + item.name; });
      fillSelect("compareCode", terms, "code", function (item) { return item.code + " — " + item.name; });
      if (form.elements.namedItem("compareCode").options.length > 1) form.elements.namedItem("compareCode").selectedIndex = 1;
    }
    if (tool === "afcfta-tracker" && typeof AFCFTA_DATA !== "undefined") {
      var states = Object.keys(AFCFTA_DATA.memberStates).map(function (code) {
        return Object.assign({ code: code }, AFCFTA_DATA.memberStates[code]);
      }).filter(function (item) { return item.ratified; });
      fillSelect("originCountry", states, "code", function (item) { return (item.flag ? item.flag + " " : "") + item.name; });
      fillSelect("destinationCountry", states, "code", function (item) { return (item.flag ? item.flag + " " : "") + item.name; });
      if (form.elements.namedItem("destinationCountry").options.length > 1) form.elements.namedItem("destinationCountry").selectedIndex = 1;
    }
    if (tool === "coo-generator" && window.CooEngine) {
      fillSelect("templateId", window.CooEngine.getAllTemplates(), "id", function (item) { return item.name; });
      var countryNames = {
        NG: "Nigeria", KE: "Kenya", ZA: "Afrique du Sud", GH: "Ghana", EG: "Égypte", TZ: "Tanzanie",
        RW: "Rwanda", ET: "Éthiopie", UG: "Ouganda", CI: "Côte d’Ivoire", SN: "Sénégal", CM: "Cameroun",
        MA: "Maroc", TN: "Tunisie", AO: "Angola", ZM: "Zambie", ZW: "Zimbabwe", BJ: "Bénin",
        BF: "Burkina Faso", CV: "Cabo Verde", GM: "Gambie", GN: "Guinée", GW: "Guinée-Bissau",
        LR: "Liberia", ML: "Mali", NE: "Niger", SL: "Sierra Leone", TG: "Togo", BI: "Burundi",
        SS: "Soudan du Sud", CD: "RDC", BW: "Botswana", LS: "Lesotho", NA: "Namibie", SZ: "Eswatini",
        MZ: "Mozambique", MW: "Malawi", MG: "Madagascar", MU: "Maurice", SC: "Seychelles", KM: "Comores"
      };
      var countries = Object.keys(countryNames).map(function (code) { return { code: code, name: countryNames[code] }; });
      fillSelect("exporter_country", countries, "code", function (item) { return item.name; });
      fillSelect("consignee_country", countries, "code", function (item) { return item.name; });
      if (form.elements.namedItem("consignee_country").options.length > 1) form.elements.namedItem("consignee_country").selectedIndex = 1;
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    status.dataset.state = "";
    try {
      render(handlers[tool]());
    } catch (error) {
      result.hidden = true;
      status.dataset.state = "error";
      status.textContent = error && error.message ? error.message : "Vérifiez les champs et réessayez.";
      status.focus();
    }
  });

  form.addEventListener("reset", function () {
    window.setTimeout(function () {
      lastReport = null;
      result.hidden = true;
      status.dataset.state = "";
      status.textContent = "Formulaire réinitialisé.";
    }, 0);
  });

  root.addEventListener("click", function (event) {
    var button = event.target.closest("[data-export]");
    if (button) exportFile(button.getAttribute("data-export"));
  });
  root.addEventListener("change", function (event) {
    if (event.target.matches("[data-import-json]")) {
      reopenJson(event.target.files && event.target.files[0]);
      event.target.value = "";
    }
  });

  initializeCommoditySelect();
  initializeOwnerSelects();
}());
