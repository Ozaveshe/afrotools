(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.smallBusinessParity = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const n = (value) => Number(value || 0);
  const finite = (value) => Number.isFinite(Number(value));
  const sum = (values) => values.reduce((total, value) => total + n(value), 0);
  const fail = (error) => ({ ok: false, error });
  const ready = (values, boundary) => ({ ok: true, values, boundary });

  function startupRunway(input) {
    const cash = n(input.cashBalance);
    const revenue = n(input.monthlyRevenue);
    const grossBurn = n(input.monthlyCosts);
    if (cash <= 0 || grossBurn <= 0 || revenue < 0) return fail("Saisissez une trésorerie et des coûts mensuels supérieurs à zéro.");
    const netBurn = grossBurn - revenue;
    const runwayMonths = netBurn > 0 ? cash / netBurn : null;
    return ready({ cash, revenue, grossBurn, netBurn, runwayMonths, monthlyGap: grossBurn - revenue }, "Scénario de trésorerie, pas une prévision garantie.");
  }

  function tamSamSom(input) {
    const customers = n(input.customers);
    const arpu = n(input.arpu);
    const accessiblePct = n(input.accessiblePct);
    const sharePct = n(input.sharePct);
    const growthPct = n(input.growthPct);
    if (!String(input.segment || "").trim() || customers <= 0 || arpu <= 0 || accessiblePct <= 0 || accessiblePct > 100 || sharePct <= 0 || sharePct > 100 || growthPct < 0) {
      return fail("Définissez le segment, le nombre de clients, l’ARPU et des pourcentages valides.");
    }
    const tam = customers * arpu;
    const sam = tam * accessiblePct / 100;
    const som = sam * sharePct / 100;
    return ready({ tam, sam, som, tamCustomers: customers, samCustomers: Math.round(customers * accessiblePct / 100), somCustomers: Math.round(customers * accessiblePct / 100 * sharePct / 100), growthPct }, "Dimensionnement à partir de vos hypothèses, pas une étude de marché.");
  }

  function unitEconomics(input) {
    const price = n(input.price);
    const cogs = n(input.variableCost);
    const other = n(input.otherVariableCost);
    const fixed = n(input.fixedCosts);
    const units = n(input.units);
    const refundPct = n(input.refundPct);
    const cac = n(input.cac);
    const lifetimeUnits = n(input.lifetimeUnits);
    if (price <= 0 || units <= 0 || [cogs, other, fixed, cac, lifetimeUnits].some((value) => value < 0) || refundPct < 0 || refundPct >= 100) {
      return fail("Le prix et les unités doivent être positifs; les coûts doivent être non négatifs.");
    }
    const realisedPrice = price * (1 - refundPct / 100);
    const contributionUnit = realisedPrice - cogs - other;
    const monthlyRevenue = units * realisedPrice;
    const monthlyProfit = units * contributionUnit - fixed;
    const breakEvenUnits = contributionUnit > 0 ? Math.ceil(fixed / contributionUnit) : null;
    const ltv = contributionUnit > 0 && lifetimeUnits > 0 ? contributionUnit * lifetimeUnits : 0;
    return ready({ realisedPrice, contributionUnit, contributionMarginPct: realisedPrice ? contributionUnit / realisedPrice * 100 : 0, monthlyRevenue, monthlyProfit, breakEvenUnits, breakEvenRevenue: breakEvenUnits == null ? null : breakEvenUnits * realisedPrice, ltv, ltvCacRatio: cac > 0 ? ltv / cac : 0 }, "Modèle unitaire fondé uniquement sur vos coûts et volumes.");
  }

  function churn(input) {
    const start = n(input.customersStart);
    const added = n(input.customersAdded);
    const end = n(input.customersEnd);
    const churned = input.method === "direct" ? n(input.customersChurned) : start + added - end;
    const mrrStart = n(input.mrrStart);
    const mrrChurned = n(input.mrrChurned);
    const contraction = n(input.mrrContraction);
    const expansion = n(input.mrrExpansion);
    if (start <= 0 || churned < 0 || churned > start || mrrStart <= 0 || mrrChurned < 0 || contraction < 0 || expansion < 0 || mrrChurned + contraction > mrrStart) {
      return fail("Les clients perdus et le revenu perdu doivent se rapprocher de la base de départ.");
    }
    const customerChurnPct = churned / start * 100;
    const revenueChurnPct = mrrChurned / mrrStart * 100;
    const nrrPct = (mrrStart - mrrChurned - contraction + expansion) / mrrStart * 100;
    return ready({ churned, customerChurnPct, revenueChurnPct, nrrPct, customerLifetimePeriods: customerChurnPct > 0 ? 100 / customerChurnPct : null }, "Lecture de la période saisie; conservez la même méthode de mesure.");
  }

  function cashFlow(input) {
    const opening = n(input.openingBalance);
    const firstRevenue = n(input.month1Revenue);
    const growth = n(input.monthlyGrowthPct) / 100;
    const cogs = n(input.cogsPct) / 100;
    const fixed = n(input.fixedMonthly);
    const taxRate = n(input.taxRatePct) / 100;
    const oneTime = n(input.oneTimeCost);
    if (opening < 0 || firstRevenue <= 0 || growth <= -1 || cogs < 0 || cogs > 1 || fixed < 0 || taxRate < 0 || taxRate > 1 || oneTime < 0) return fail("Vérifiez la trésorerie, les recettes, les coûts et les taux.");
    const rows = [];
    let balance = opening;
    for (let month = 1; month <= 12; month += 1) {
      const revenue = firstRevenue * Math.pow(1 + growth, month - 1);
      const variableCosts = revenue * cogs;
      const exceptional = month === 1 ? oneTime : 0;
      const preTaxCash = revenue - variableCosts - fixed - exceptional;
      const taxProvision = preTaxCash > 0 ? preTaxCash * taxRate : 0;
      const netCashFlow = preTaxCash - taxProvision;
      balance += netCashFlow;
      rows.push({ month, revenue, variableCosts, fixedCosts: fixed, oneTimeCosts: exceptional, taxProvision, netCashFlow, closingBalance: balance });
    }
    return ready({ rows, yearRevenue: sum(rows.map((row) => row.revenue)), yearEndBalance: balance, negativeMonths: rows.filter((row) => row.closingBalance < 0).length }, "Prévision à scénario constant; elle ne remplace pas un plan de trésorerie daté.");
  }

  function posAgent(input) {
    const dailyTransactions = n(input.dailyTransactions);
    const averageTransaction = n(input.averageTransaction);
    const days = n(input.operatingDays);
    const commissionPct = n(input.commissionPct);
    const commissionCap = n(input.commissionCap);
    const failurePct = n(input.failurePct);
    const setup = n(input.deviceCost) + n(input.floatCapital);
    const monthlyCosts = n(input.monthlyRent) + n(input.otherMonthlyCosts);
    if (dailyTransactions <= 0 || averageTransaction <= 0 || days <= 0 || days > 31 || commissionPct <= 0 || commissionPct > 100 || failurePct < 0 || failurePct >= 100 || [commissionCap, setup, monthlyCosts].some((value) => value < 0)) return fail("Saisissez des transactions, jours et commissions valides.");
    const completed = dailyTransactions * (1 - failurePct / 100);
    const perTransaction = commissionCap > 0 ? Math.min(averageTransaction * commissionPct / 100, commissionCap) : averageTransaction * commissionPct / 100;
    const monthlyRevenue = perTransaction * completed * days;
    const monthlyProfit = monthlyRevenue - monthlyCosts;
    return ready({ completedDailyTransactions: completed, commissionPerTransaction: perTransaction, monthlyRevenue, monthlyCosts, monthlyProfit, marginPct: monthlyRevenue ? monthlyProfit / monthlyRevenue * 100 : 0, setupPaybackMonths: setup > 0 && monthlyProfit > 0 ? setup / monthlyProfit : null }, "Les commissions et frais saisis doivent être confirmés auprès du fournisseur.");
  }

  function miniImport(input) {
    const supplierUsd = n(input.supplierPriceUsd);
    const units = n(input.units);
    const fxRate = n(input.fxRate);
    const shipping = n(input.shipping);
    const dutyPct = n(input.dutyPct);
    const other = n(input.otherCharges);
    const clearing = n(input.clearingFee);
    const sellingPrice = n(input.sellingPrice);
    if (supplierUsd <= 0 || units <= 0 || fxRate <= 0 || sellingPrice <= 0 || [shipping, dutyPct, other, clearing].some((value) => value < 0)) return fail("Saisissez le prix fournisseur, les unités, le taux exécuté et le prix de vente.");
    const productCost = supplierUsd * units * fxRate;
    const duty = (productCost + shipping) * dutyPct / 100;
    const landedCost = productCost + shipping + duty + other + clearing;
    const revenue = sellingPrice * units;
    const profit = revenue - landedCost;
    return ready({ productCost, duty, landedCost, landedCostPerUnit: landedCost / units, revenue, profit, roiPct: landedCost ? profit / landedCost * 100 : 0, marginPct: revenue ? profit / revenue * 100 : 0 }, "Devis d’achat et de douane à confirmer avant paiement.");
  }

  function mamaPut(input) {
    const price = n(input.dishPrice);
    const portions = n(input.portions);
    const ingredient = n(input.ingredientCost);
    const fixed = sum([input.rent, input.staff, input.utilities, input.otherCosts]);
    const days = n(input.workingDays);
    if (price <= 0 || portions <= 0 || ingredient < 0 || fixed < 0 || days <= 0) return fail("Saisissez un plat vendu, ses portions et les jours d’activité.");
    const revenue = price * portions;
    const ingredientTotal = ingredient * portions;
    const dailyProfit = revenue - ingredientTotal - fixed;
    const contribution = price - ingredient;
    return ready({ revenue, ingredientTotal, fixedCosts: fixed, dailyProfit, monthlyProfit: dailyProfit * days, marginPct: revenue ? dailyProfit / revenue * 100 : 0, breakEvenPortions: contribution > 0 ? Math.ceil(fixed / contribution) : null }, "Scénario de menu constant; contrôlez les pertes et invendus.");
  }

  function marketplace(input) {
    const price = n(input.salePrice);
    const feePct = n(input.feePct);
    const fixedFee = n(input.fixedFee);
    const shipping = n(input.shipping);
    const ads = n(input.ads);
    const other = n(input.otherFees);
    if (!String(input.marketplace || "").trim() || price <= 0 || [feePct, fixedFee, shipping, ads, other].some((value) => value < 0)) return fail("Saisissez un prix de vente et un devis de frais marketplace.");
    const fees = price * feePct / 100 + fixedFee + shipping + ads + other;
    return ready({ price, fees, netProceeds: price - fees, feeSharePct: price ? fees / price * 100 : 0 }, "Comparaison fondée sur le devis saisi; vérifiez TVA, retours et délais.");
  }

  function brandRoi(input) {
    const budget = n(input.budget);
    const impressions = n(input.impressions);
    const revenue = n(input.revenue);
    const marginPct = n(input.grossMarginPct);
    const conversions = n(input.conversions);
    if (budget <= 0 || impressions <= 0 || revenue < 0 || marginPct < 0 || marginPct > 100 || conversions < 0) return fail("Saisissez coût, impressions, revenu, marge et conversions valides.");
    const grossProfit = revenue * marginPct / 100;
    const contribution = grossProfit - budget;
    return ready({ grossProfit, contribution, roiPct: contribution / budget * 100, cpm: budget / impressions * 1000, cpa: conversions > 0 ? budget / conversions : null }, "Attribution déclarative; elle ne prouve pas la causalité de la campagne.");
  }

  function continuity(input) {
    const name = String(input.businessName || "").trim();
    const threats = String(input.threats || "").split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
    if (!name || threats.length === 0) return fail("Indiquez l’entreprise et au moins une menace.");
    const documentText = [
      "BROUILLON DE PLAN DE CONTINUITÉ",
      `Entreprise : ${name}`,
      `Pays : ${input.country || "non indiqué"}`,
      `Secteur : ${input.sector || "non indiqué"}`,
      `RTO : ${input.rto || "à confirmer"}`,
      `RPO : ${input.rpo || "à confirmer"}`,
      `Menaces : ${threats.join(", ")}`,
      "À compléter : responsables, contacts, preuves de sauvegarde, date d’exercice et approbation."
    ].join("\n");
    return ready({ threatCount: threats.length, rto: input.rto, rpo: input.rpo, documentText }, "Brouillon non vérifié; attribuez les responsables et testez le plan.");
  }

  function decoration(input) {
    const guests = n(input.guests);
    const subtotal = sum([n(input.balloonArches) * n(input.balloonUnitCost), n(input.floral) * n(input.floralUnitCost), n(input.centerpieces) * n(input.centerpieceUnitCost), input.draping, input.lighting, input.signage, n(input.chairs) * n(input.chairUnitCost), input.setupLabour, input.transport]);
    const contingencyPct = n(input.contingencyPct);
    if (guests <= 0 || subtotal <= 0 || contingencyPct < 0) return fail("Saisissez les invités et au moins un devis de décoration.");
    const contingency = subtotal * contingencyPct / 100;
    return ready({ subtotal, contingency, total: subtotal + contingency, perGuest: (subtotal + contingency) / guests }, "Budget construit uniquement à partir des devis saisis.");
  }

  function factory(input) {
    const area = n(input.area);
    const workingCapital = n(input.monthlyOperatingCash) * n(input.workingCapitalMonths);
    const subtotal = sum([input.land, input.building, input.machinery, input.utilities, input.permits, workingCapital]);
    const contingencyPct = n(input.contingencyPct);
    if (area <= 0 || subtotal <= 0 || contingencyPct < 0) return fail("Saisissez la surface et au moins un coût d’installation.");
    const contingency = subtotal * contingencyPct / 100;
    const total = subtotal + contingency;
    return ready({ subtotal, workingCapital, contingency, total, costPerM2: total / area }, "Modèle CAPEX fondé sur vos devis, sans prix de marché implicite.");
  }

  function fashion(input) {
    const pieces = n(input.pieces);
    const retail = n(input.retailPrice);
    const monthlyUnits = n(input.monthlyUnits);
    const cogs = sum([input.fabricCost, input.labourCost, input.notionsCost, input.packagingCost]);
    const setup = sum([input.brandingCost, input.websiteCost, input.photoCost, input.showCost, input.marketingCost, input.equipmentCost]);
    if (pieces <= 0 || cogs <= 0 || retail <= cogs || monthlyUnits < 0) return fail("Le nombre de pièces et les coûts doivent être positifs; le prix doit dépasser le coût unitaire.");
    const contribution = retail - cogs;
    return ready({ cogs, setup, inventory: cogs * pieces, totalInvestment: setup + cogs * pieces, contribution, marginPct: contribution / retail * 100, breakEvenUnits: Math.ceil(setup / contribution), monthlyGrossProfit: contribution * monthlyUnits }, "Scénario constant de ventes; hors invendus, taxes et retours.");
  }

  function freelanceContract(input) {
    const freelancer = String(input.freelancerName || "").trim();
    const client = String(input.clientName || "").trim();
    const project = String(input.projectTitle || "").trim();
    const deliverables = String(input.deliverables || "").trim();
    if (!freelancer || !client || !project || !deliverables) return fail("Indiquez les parties, le projet et les livrables.");
    const documentText = [
      "CONTRAT DE PRESTATION FREELANCE — BROUILLON",
      `Freelance : ${freelancer}`,
      `Client : ${client}`,
      `Projet : ${project}`,
      `Livrables : ${deliverables}`,
      `Début : ${input.startDate || "à convenir"}`,
      `Livraison : ${input.deliveryDate || "à convenir"}`,
      `Honoraires : ${input.currency || ""} ${n(input.totalFee).toFixed(2)}`,
      `Paiement : ${input.paymentSchedule || "à préciser"}`,
      `Révisions : ${input.revisions || "à préciser"}`,
      `Propriété intellectuelle : ${input.ipOwner || "à préciser"}`,
      `Droit choisi : ${input.jurisdiction || "à confirmer"}`,
      "Faire relire les clauses, la responsabilité, l’annulation et le règlement des litiges avant signature."
    ].join("\n");
    return ready({ fee: n(input.totalFee), documentText }, "Modèle éducatif; faites valider le contrat selon le droit applicable.");
  }

  function freelancerRate(input) {
    const income = n(input.income);
    const overhead = n(input.overhead);
    const reservePct = n(input.reservePct);
    const days = n(input.billableDays);
    const hours = n(input.hoursPerDay);
    if (income <= 0 || days <= 0 || hours <= 0 || overhead < 0 || reservePct < 0 || reservePct >= 100) return fail("Saisissez le revenu cible, les jours, les heures et une réserve inférieure à 100 %.");
    const requiredBilling = (income + overhead) / (1 - reservePct / 100);
    return ready({ requiredBilling, dayRate: requiredBilling / days, hourlyRate: requiredBilling / days / hours }, "La réserve est votre hypothèse, pas un calcul fiscal.");
  }

  function designPricing(input) {
    const hours = n(input.hours);
    const hourly = n(input.hourlyFloor);
    const expenses = n(input.expenses);
    const bufferPct = n(input.scopeBufferPct);
    if (hours <= 0 || hourly <= 0 || expenses < 0 || bufferPct < 0) return fail("Saisissez les heures, le taux plancher et des coûts non négatifs.");
    const labour = hours * hourly;
    const subtotal = labour + expenses;
    const buffer = subtotal * bufferPct / 100;
    return ready({ labour, expenses, buffer, totalQuote: subtotal + buffer }, "Devis fondé sur votre coût et votre périmètre, sans tarif de marché inventé.");
  }

  function guardCost(input) {
    const posts = n(input.posts);
    const guardsPerPost = n(input.guardsPerPost);
    const companyPerGuard = n(input.companyQuote);
    const wage = n(input.directWage);
    const oncost = n(input.directOncost);
    const other = n(input.otherCosts);
    if (posts <= 0 || guardsPerPost <= 0 || companyPerGuard <= 0 || wage <= 0 || oncost < 0 || other < 0) return fail("Saisissez les postes, effectifs, devis société et coûts d’embauche.");
    const guards = posts * guardsPerPost;
    const company = companyPerGuard * guards + other;
    const direct = (wage + oncost) * guards + other;
    return ready({ guards, companyMonthly: company, directMonthly: direct, difference: company - direct }, "Vérifiez agréments, salaires légaux, relève, assurance et exclusions.");
  }

  function influencer(input) {
    const hours = n(input.hours);
    const hourly = n(input.hourlyFloor);
    const production = n(input.production);
    const rights = n(input.usageRights);
    const exclusivity = n(input.exclusivity);
    const deals = n(input.dealsPerMonth);
    if (hours <= 0 || hourly <= 0 || [production, rights, exclusivity, deals].some((value) => value < 0)) return fail("Saisissez le temps, le taux plancher et des frais non négatifs.");
    const labour = hours * hourly;
    const quote = labour + production + rights + exclusivity;
    return ready({ labour, production, rights, exclusivity, quote, monthlyScenario: quote * deals, annualScenario: quote * deals * 12 }, "Carte tarifaire construite à partir de vos coûts et droits.");
  }

  function madeInAfrica(input) {
    const origin = String(input.originCountry || "").trim();
    const destination = String(input.destinationCountry || "").trim();
    const hsCode = String(input.hsCode || "").trim();
    const exWorks = n(input.exWorks);
    const nonOriginating = n(input.nonOriginating);
    if (!origin || !destination || !hsCode || exWorks <= 0 || nonOriginating < 0 || nonOriginating > exWorks) return fail("Indiquez les pays, le code SH et des valeurs matières cohérentes.");
    return ready({ originatingValue: exWorks - nonOriginating, originatingPct: (exWorks - nonOriginating) / exWorks * 100, nonOriginatingPct: nonOriginating / exWorks * 100, ruleEvidencePresent: Boolean(String(input.ruleReference || "").trim() && input.ruleDate) }, "Feuille de préparation; elle ne décide ni l’origine ni le tarif préférentiel.");
  }

  function registration(input) {
    const product = String(input.product || "").trim();
    const applications = n(input.applications);
    const officialFee = n(input.officialFee);
    if (!product || !Number.isInteger(applications) || applications < 1 || officialFee < 0 || !String(input.source || "").trim() || !input.sourceDate) return fail("Saisissez le produit, le nombre de dossiers, le tarif officiel et sa source datée.");
    const officialTotal = applications * officialFee;
    const support = sum([input.testing, input.facility, input.labels, input.adviser, input.other]);
    return ready({ officialTotal, supportCosts: support, totalBudget: officialTotal + support }, "Budget de preuve; il ne prédit ni délai ni autorisation.");
  }

  function oee(input) {
    const scheduled = n(input.scheduledMinutes);
    const excluded = n(input.excludedMinutes);
    const downtime = n(input.downtimeMinutes);
    const cycleSeconds = n(input.idealCycleSeconds);
    const produced = n(input.producedUnits);
    const rejects = n(input.rejectUnits);
    if (scheduled <= 0 || excluded < 0 || excluded >= scheduled || downtime < 0 || downtime > scheduled - excluded || cycleSeconds <= 0 || produced < 0 || rejects < 0 || rejects > produced) return fail("Vérifiez temps planifié, arrêts, cycle idéal, production et rejets.");
    const planned = scheduled - excluded;
    const runtime = planned - downtime;
    const availability = runtime / planned;
    const idealDuringRun = runtime * 60 / cycleSeconds;
    const performance = idealDuringRun > 0 ? produced / idealDuringRun : produced === 0 ? 0 : NaN;
    if (!Number.isFinite(performance)) return fail("Aucune production ne peut être enregistrée avec un temps de marche nul.");
    const quality = produced > 0 ? (produced - rejects) / produced : 0;
    const oeeValue = availability * performance * quality;
    return ready({ plannedMinutes: planned, runMinutes: runtime, availabilityPct: availability * 100, performancePct: performance * 100, qualityPct: quality * 100, oeePct: oeeValue * 100, goodUnits: produced - rejects }, "Comparez seulement des périodes avec la même politique de mesure.");
  }

  function packaging(input) {
    const volume = n(input.volume);
    const perCarton = n(input.unitsPerCarton);
    const amortUnits = n(input.setupAllocationUnits);
    const wastePct = n(input.wastePct);
    if (!String(input.currency || "").trim() || !String(input.product || "").trim() || volume <= 0 || perCarton <= 0 || amortUnits <= 0 || wastePct < 0 || wastePct > 100 || !String(input.source || "").trim() || !input.sourceDate) return fail("Saisissez produit, volume, allocations, pertes et devis daté.");
    const base = sum([input.primaryUnit, input.printUnit, input.closureUnit]) + n(input.cartonQuote) / perCarton + n(input.freight) / volume + n(input.setup) / amortUnits;
    const wasteCost = base * wastePct / 100;
    const unitCost = base + wasteCost;
    return ready({ baseUnitCost: base, wasteCost, unitCost, monthlyCost: unitCost * volume, annualCost: unitCost * volume * 12, percentOfSellingPrice: n(input.sellingPrice) > 0 ? unitCost / n(input.sellingPrice) * 100 : null }, "Coût issu du devis daté et des allocations saisies.");
  }

  function production(input) {
    const units = n(input.units);
    const wastePct = n(input.wastePct);
    const costs = [input.rawMaterials, input.packaging, input.labour, input.energy, input.rent, input.depreciation, input.transport, input.other].map(n);
    const price = n(input.sellingPrice);
    if (units <= 0 || wastePct < 0 || wastePct >= 100 || costs.some((value) => value < 0) || price < 0) return fail("Saisissez des unités positives, des coûts non négatifs et des pertes inférieures à 100 %.");
    const totalCost = sum(costs);
    if (totalCost <= 0) return fail("Ajoutez au moins un coût de production.");
    const goodUnits = units * (1 - wastePct / 100);
    const unitCost = totalCost / goodUnits;
    const revenue = price * goodUnits;
    return ready({ startedUnits: units, goodUnits, totalCost, unitCost, revenue, grossProfit: revenue - totalCost, grossMarginPct: price > 0 ? (price - unitCost) / price * 100 : null }, "Périmètre COGM saisi; vérifiez stocks, taxes, finance et distribution séparément.");
  }

  function sampling(input) {
    const lot = n(input.lotSize);
    const sample = n(input.sampleSize);
    const accept = n(input.acceptNumber);
    const reject = n(input.rejectNumber);
    const defects = n(input.defects);
    if (![lot, sample, accept, reject, defects].every(Number.isInteger) || lot < 1 || sample < 1 || sample > lot || accept < 0 || reject <= accept || reject > sample || defects < 0 || defects > sample || !String(input.planReference || "").trim() || !input.planDate) return fail("Saisissez un plan daté, un échantillon valide et des seuils Ac/Re cohérents.");
    const outcome = defects <= accept ? "ACCEPTER selon le plan saisi" : defects >= reject ? "REJETER selon le plan saisi" : "POURSUIVRE / ESCALADER selon le plan saisi";
    return ready({ outcome, samplePct: sample / lot * 100, defectPct: defects / sample * 100, inspectionCost: sample * n(input.costPerUnit) }, "Le plan contrôlé, la méthode aléatoire et les règles de disposition restent l’autorité.");
  }

  function tailoring(input) {
    const hours = n(input.hours);
    const labourRate = n(input.labourRate);
    const costs = sum([input.fabricCost, input.notionsCost, input.overheadCost]);
    const bufferPct = n(input.scopeBufferPct);
    const markupPct = n(input.markupPct);
    const rushFee = n(input.rushFee);
    const orders = n(input.monthlyOrders);
    if (hours <= 0 || labourRate <= 0 || costs < 0 || bufferPct < 0 || bufferPct > 100 || markupPct < 0 || rushFee < 0 || orders < 0) return fail("Saisissez temps, main-d’œuvre, coûts et pourcentages valides.");
    const direct = hours * labourRate + costs;
    const costFloor = direct * (1 + bufferPct / 100);
    const markup = costFloor * markupPct / 100;
    const quote = costFloor + markup + rushFee;
    return ready({ labourCost: hours * labourRate, costFloor, markup, quote, monthlyRevenue: quote * orders }, "Devis fondé sur vos coûts et choix de prix; hors impôts et temps non facturé.");
  }

  function youtube(input) {
    const views = n(input.views);
    const rpm = n(input.analyticsRpm);
    const recorded = n(input.recordedYoutube);
    const reservePct = n(input.reservePct);
    if (!String(input.period || "").trim() || !String(input.currency || "").trim() || !input.checkedDate || !String(input.evidenceReference || "").trim() || views <= 0 || reservePct < 0 || reservePct > 100 || (recorded <= 0 && rpm <= 0)) return fail("Saisissez période, devise, vues, preuve datée et revenu enregistré ou RPM Analytics.");
    const youtubeRevenue = recorded > 0 ? recorded : views / 1000 * rpm;
    const gross = youtubeRevenue + sum([input.sponsorship, input.memberships, input.affiliate, input.otherRevenue]);
    const reserve = gross * reservePct / 100;
    const costs = n(input.channelCosts);
    return ready({ youtubeRevenue, effectiveRpm: youtubeRevenue / views * 1000, grossRevenue: gross, costs, reserve, planningNet: gross - costs - reserve }, "Rapprochement de vos preuves; la réserve n’est pas un conseil fiscal.");
  }

  const calculators = Object.freeze({
    "startup-runway": startupRunway,
    "tam-sam-som": tamSamSom,
    "unit-economics": unitEconomics,
    "churn-rate": churn,
    "burn-rate": startupRunway,
    "cash-flow-forecast": cashFlow,
    "pos-agent": posAgent,
    "mini-importation": miniImport,
    "mama-put": mamaPut,
    "marketplace-fees": marketplace,
    "brand-collab-roi": brandRoi,
    "business-continuity": continuity,
    "event-decoration-cost": decoration,
    "factory-setup-cost": factory,
    "fashion-brand-startup": fashion,
    "freelance-contract": freelanceContract,
    "freelancer-rate": freelancerRate,
    "graphic-design-pricing": designPricing,
    "guard-service-cost": guardCost,
    "influencer-rate": influencer,
    "made-in-africa-label": madeInAfrica,
    "nafdac-registration": registration,
    "oee-calculator": oee,
    "packaging-cost": packaging,
    "production-cost": production,
    "quality-sampling": sampling,
    "tailoring-pricing": tailoring,
    "youtube-revenue": youtube
  });

  function calculate(id, input) {
    const calculator = calculators[id];
    return calculator ? calculator(input || {}) : fail("Outil non pris en charge.");
  }

  return { calculators, calculate };
});
