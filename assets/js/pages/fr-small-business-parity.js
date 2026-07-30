(function () {
  "use strict";

  const form = document.querySelector("[data-sme-form]");
  const status = document.querySelector("[data-sme-status]");
  const results = document.querySelector("[data-sme-results]");
  const metrics = document.querySelector("[data-sme-metrics]");
  const boundary = document.querySelector("[data-sme-boundary]");
  const documentNode = document.querySelector("[data-sme-document]");
  const copyButton = document.querySelector("[data-sme-copy]");
  const exportButton = document.querySelector("[data-sme-export]");
  const printButton = document.querySelector("[data-sme-print]");
  const configNode = document.getElementById("sme-parity-config");
  if (!form || !status || !results || !metrics || !boundary || !configNode) return;

  const config = JSON.parse(configNode.textContent);
  const engine = window.AfroTools && window.AfroTools.smallBusinessParity;
  let current = null;

  const labels = {
    cash: "Trésorerie",
    revenue: "Encaissements",
    grossBurn: "Consommation brute",
    netBurn: "Consommation nette",
    runwayMonths: "Runway (mois)",
    monthlyGap: "Écart mensuel",
    tam: "TAM",
    sam: "SAM",
    som: "SOM",
    tamCustomers: "Clients TAM",
    samCustomers: "Clients SAM",
    somCustomers: "Clients SOM",
    realisedPrice: "Prix réalisé",
    contributionUnit: "Contribution unitaire",
    contributionMarginPct: "Marge de contribution",
    monthlyRevenue: "Revenu mensuel",
    monthlyProfit: "Profit mensuel",
    breakEvenUnits: "Unités au seuil",
    breakEvenRevenue: "Revenu au seuil",
    ltv: "LTV contributive",
    ltvCacRatio: "Ratio LTV/CAC",
    churned: "Clients perdus",
    customerChurnPct: "Attrition clients",
    revenueChurnPct: "Attrition revenu",
    nrrPct: "Rétention nette",
    customerLifetimePeriods: "Durée de vie en périodes",
    yearRevenue: "Encaissements sur 12 mois",
    yearEndBalance: "Solde fin d’année",
    negativeMonths: "Mois négatifs",
    completedDailyTransactions: "Transactions réussies / jour",
    commissionPerTransaction: "Commission / transaction",
    monthlyCosts: "Coûts mensuels",
    marginPct: "Marge",
    setupPaybackMonths: "Récupération du capital (mois)",
    productCost: "Coût produits",
    duty: "Droits estimés",
    landedCost: "Coût rendu total",
    landedCostPerUnit: "Coût rendu unitaire",
    profit: "Profit brut",
    roiPct: "ROI",
    ingredientTotal: "Ingrédients / jour",
    fixedCosts: "Coûts fixes / jour",
    dailyProfit: "Profit quotidien",
    breakEvenPortions: "Portions au seuil",
    price: "Prix de vente",
    fees: "Frais totaux",
    netProceeds: "Produit net",
    feeSharePct: "Part des frais",
    grossProfit: "Marge brute attribuée",
    contribution: "Contribution incrémentale",
    cpm: "CPM",
    cpa: "CPA",
    threatCount: "Menaces retenues",
    rto: "RTO",
    rpo: "RPO",
    subtotal: "Sous-total",
    contingency: "Contingence",
    total: "Total",
    perGuest: "Coût par invité",
    workingCapital: "Fonds de roulement",
    costPerM2: "Coût par m²",
    cogs: "Coût unitaire",
    setup: "Coûts de lancement",
    inventory: "Stock initial",
    totalInvestment: "Investissement initial",
    breakEvenUnits: "Unités au seuil",
    monthlyGrossProfit: "Marge brute mensuelle",
    fee: "Honoraires",
    requiredBilling: "Facturation mensuelle requise",
    dayRate: "Tarif journalier",
    hourlyRate: "Tarif horaire",
    labour: "Main-d’œuvre",
    expenses: "Frais",
    buffer: "Tampon de périmètre",
    totalQuote: "Devis total",
    guards: "Agents du plan",
    companyMonthly: "Devis société / mois",
    directMonthly: "Embauche directe / mois",
    difference: "Écart",
    production: "Production",
    rights: "Droits d’usage",
    exclusivity: "Exclusivité",
    quote: "Devis",
    monthlyScenario: "Scénario mensuel",
    annualScenario: "Scénario annuel",
    originatingValue: "Valeur originaire",
    originatingPct: "Part originaire",
    nonOriginatingPct: "Part non originaire",
    ruleEvidencePresent: "Règle datée présente",
    officialTotal: "Tarifs officiels",
    supportCosts: "Coûts d’appui",
    totalBudget: "Budget total",
    plannedMinutes: "Temps de production planifié",
    runMinutes: "Temps de marche",
    availabilityPct: "Disponibilité",
    performancePct: "Performance",
    qualityPct: "Qualité",
    oeePct: "OEE / TRS",
    goodUnits: "Unités bonnes",
    baseUnitCost: "Coût unitaire avant pertes",
    wasteCost: "Coût des pertes / unité",
    unitCost: "Coût unitaire complet",
    annualCost: "Coût annuel",
    percentOfSellingPrice: "Part du prix de vente",
    startedUnits: "Unités lancées",
    totalCost: "Coût total de production",
    grossMarginPct: "Marge brute",
    outcome: "Décision selon le plan",
    samplePct: "Part du lot inspectée",
    defectPct: "Taux observé de défauts",
    inspectionCost: "Coût d’inspection",
    labourCost: "Coût de main-d’œuvre",
    costFloor: "Plancher de coût",
    markup: "Marge ajoutée",
    monthlyRevenue: "Revenu mensuel",
    youtubeRevenue: "Revenu YouTube",
    effectiveRpm: "RPM effectif",
    grossRevenue: "Revenu brut total",
    costs: "Coûts de chaîne",
    reserve: "Réserve choisie",
    planningNet: "Net de planification"
  };

  function collect() {
    const values = {};
    new FormData(form).forEach((value, key) => {
      const control = form.elements.namedItem(key);
      values[key] = control && control.type === "number" ? (value === "" ? "" : Number(value)) : value;
    });
    return values;
  }

  function humanize(key) {
    return labels[key] || key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
  }

  function isPercent(key) {
    return /Pct$/.test(key) || /(Margin|roi|churn|nrr|oee|availability|performance|quality|sample|defect)/i.test(key);
  }

  function format(key, value) {
    if (value == null) return "Non applicable";
    if (typeof value === "boolean") return value ? "Oui" : "Non";
    if (typeof value === "number") {
      const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
      return isPercent(key) ? `${formatted} %` : formatted;
    }
    return String(value);
  }

  function visibleEntries(values) {
    return Object.entries(values).filter(([key, value]) => key !== "rows" && key !== "documentText" && (typeof value !== "object" || value == null));
  }

  function summaryText() {
    if (!current) return "";
    const lines = [config.title, `Outil : ${config.id}`];
    visibleEntries(current.values).forEach(([key, value]) => lines.push(`${humanize(key)} : ${format(key, value)}`));
    if (current.values.documentText) lines.push("", current.values.documentText);
    lines.push("", `Limite : ${current.boundary}`, "Source : valeurs saisies par l’utilisateur", "Traitement : local dans ce navigateur");
    return lines.join("\n");
  }

  function render(result) {
    current = result;
    metrics.innerHTML = visibleEntries(result.values).map(([key, value]) => `<div class="sme-metric"><dt>${humanize(key)}</dt><dd>${format(key, value)}</dd></div>`).join("");
    boundary.textContent = result.boundary;
    if (result.values.documentText) {
      documentNode.hidden = false;
      documentNode.textContent = result.values.documentText;
    } else {
      documentNode.hidden = true;
      documentNode.textContent = "";
    }
    results.hidden = false;
    copyButton.disabled = false;
    exportButton.disabled = false;
    if (printButton) printButton.disabled = false;
    status.dataset.state = "ready";
    status.textContent = "Résultat prêt. Vous pouvez le copier ou le télécharger.";
    results.focus({ preventScroll: true });
    results.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  }

  async function copy() {
    const value = summaryText();
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    status.textContent = "Résultat copié.";
  }

  function csvCell(value) {
    const string = String(value == null ? "" : value);
    return `"${string.replace(/"/g, '""')}"`;
  }

  function exportPayload() {
    if (config.export === "json") return { mime: "application/json;charset=utf-8", extension: "json", content: `${JSON.stringify({ tool: config.id, result: current, exportedAt: new Date().toISOString() }, null, 2)}\n` };
    if (config.export === "csv") {
      const rows = current.values.rows;
      if (Array.isArray(rows) && rows.length) {
        const keys = Object.keys(rows[0]);
        const content = [keys.map(csvCell).join(","), ...rows.map((row) => keys.map((key) => csvCell(row[key])).join(","))].join("\r\n") + "\r\n";
        return { mime: "text/csv;charset=utf-8", extension: "csv", content };
      }
      const content = ["indicateur,valeur", ...visibleEntries(current.values).map(([key, value]) => `${csvCell(humanize(key))},${csvCell(value)}`)].join("\r\n") + "\r\n";
      return { mime: "text/csv;charset=utf-8", extension: "csv", content };
    }
    return { mime: "text/plain;charset=utf-8", extension: "txt", content: `${summaryText()}\n` };
  }

  function download() {
    const payload = exportPayload();
    const blob = new Blob([payload.content], { type: payload.mime });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${config.id}-fr.${payload.extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    status.textContent = `Fichier ${payload.extension.toUpperCase()} téléchargé.`;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!engine || typeof engine.calculate !== "function") {
      status.dataset.state = "error";
      status.textContent = "Le moteur de calcul local n’est pas disponible.";
      return;
    }
    const result = engine.calculate(config.id, collect());
    if (!result.ok) {
      current = null;
      results.hidden = true;
      copyButton.disabled = true;
      exportButton.disabled = true;
      if (printButton) printButton.disabled = true;
      status.dataset.state = "error";
      status.textContent = result.error;
      return;
    }
    render(result);
  });
  copyButton.addEventListener("click", copy);
  exportButton.addEventListener("click", download);
  if (printButton) printButton.addEventListener("click", () => window.print());
})();
