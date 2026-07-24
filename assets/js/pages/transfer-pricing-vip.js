(function () {
  "use strict";
  const app = document.querySelector("[data-tp-app]");
  const engine = window.AfroTools && window.AfroTools.TransferPricingPlanner;
  if (!app || !engine) return;
  const form = app.querySelector("[data-form]");
  const locale = app.dataset.locale === "fr" ? "fr" : "en";
  const text = {
    en: {
      ready: "Comparison ready.",
      status: { below: "Below the user-supplied range", inside: "Inside the user-supplied range", above: "Above the user-supplied range" },
      names: { tnmm: "TNMM operating margin", costPlus: "Cost-plus markup", resale: "Resale gross margin", cup: "Controlled unit price", loan: "Applied annual interest rate" },
      labels: {
        tnmm: ["Revenue / sales", "Operating costs"],
        costPlus: ["Intercompany remuneration", "Relevant cost base"],
        resale: ["Independent resale revenue", "Controlled purchase price"],
        cup: ["Controlled unit price", "Reference note (enter 0)"],
        loan: ["Loan principal", "Applied annual interest rate (%)"],
      },
      errors: {},
      copied: "Memo copied.", txt: "TXT downloaded.", json: "JSON downloaded.",
      title: "Transfer pricing comparability worksheet", filename: "transfer-pricing-comparability",
    },
    fr: {
      ready: "Comparaison prête.",
      status: { below: "Sous la plage fournie", inside: "Dans la plage fournie", above: "Au-dessus de la plage fournie" },
      names: { tnmm: "Marge opérationnelle TNMM", costPlus: "Marge coût majoré", resale: "Marge brute de revente", cup: "Prix unitaire contrôlé", loan: "Taux d'intérêt annuel appliqué" },
      labels: {
        tnmm: ["Chiffre d'affaires / ventes", "Coûts opérationnels"],
        costPlus: ["Rémunération intragroupe", "Base de coûts pertinente"],
        resale: ["Ventes indépendantes", "Prix d'achat contrôlé"],
        cup: ["Prix unitaire contrôlé", "Note de référence (saisir 0)"],
        loan: ["Principal du prêt", "Taux d'intérêt annuel appliqué (%)"],
      },
      errors: {
        "Choose a supported comparison method.": "Choisissez une méthode de comparaison prise en charge.",
        "Name the jurisdiction whose domestic rules you will verify.": "Indiquez la juridiction dont vous vérifierez les règles nationales.",
        "Enter the transaction or tested period.": "Saisissez la période de transaction ou la période testée.",
        "Confirm that the range is user-supplied and not an AfroTools benchmark.": "Confirmez que la plage vient de votre source et non d'AfroTools.",
        "Describe the source and period of the comparable range.": "Décrivez la source et la période de la plage comparable.",
        "Enter a positive primary amount.": "Saisissez un montant principal positif.",
        "Enter a valid secondary amount.": "Saisissez un second montant valide.",
        "Enter the low, median and high values from your comparable source.": "Saisissez le bas, la médiane et le haut issus de votre source.",
        "Comparable values must be ordered low, median, then high.": "La plage doit être ordonnée : bas, médiane, haut.",
        "Cost base must be greater than zero for cost plus.": "La base de coûts doit être supérieure à zéro.",
      },
      copied: "Mémo copié.", txt: "TXT téléchargé.", json: "JSON téléchargé.",
      title: "Feuille de comparabilité prix de transfert", filename: "comparabilite-prix-transfert",
    },
  }[locale];
  let last = null;

  function values() {
    const data = new FormData(form);
    return {
      jurisdiction: data.get("jurisdiction"), period: data.get("period"), transactionType: data.get("transactionType"), currency: data.get("currency"),
      method: data.get("method"), amountA: data.get("amountA"), amountB: form.elements.amountB.value,
      rangeLow: data.get("rangeLow"), rangeMedian: data.get("rangeMedian"), rangeHigh: data.get("rangeHigh"),
      comparableSource: data.get("comparableSource"), scopeConfirmed: data.get("scopeConfirmed") === "on",
    };
  }
  function formatNumber(value, unit) {
    if (unit === "percent") return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value) + "%";
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value) + " " + form.elements.currency.value;
  }
  function memo(result) {
    return [
      text.title,
      "Jurisdiction: " + form.elements.jurisdiction.value.trim(),
      "Period: " + form.elements.period.value.trim(),
      "Transaction: " + form.elements.transactionType.value.trim(),
      "Method: " + form.elements.method.options[form.elements.method.selectedIndex].text,
      "Indicator: " + formatNumber(result.indicator, result.unit),
      "User range: " + formatNumber(result.range.low, result.unit) + " / " + formatNumber(result.range.median, result.unit) + " / " + formatNumber(result.range.high, result.unit),
      "Position: " + text.status[result.status],
      "Difference to user median: " + formatNumber(result.differenceToMedian, result.unit),
      "Comparable source: " + result.comparableSource,
      "Boundary: Planning worksheet only. Not an arm's-length conclusion, filing, audit report, tax adjustment or documentation study.",
      "Source version: " + result.sourceVersion,
    ].join("\n");
  }
  function render(result) {
    const error = app.querySelector("[data-error]");
    if (!result.ok) {
      last = null;
      error.textContent = text.errors[result.error] || result.error;
      app.querySelector("[data-result]").hidden = true;
      return;
    }
    error.textContent = "";
    last = result;
    app.querySelector("[data-position]").textContent = text.status[result.status];
    app.querySelector("[data-indicator]").textContent = formatNumber(result.indicator, result.unit);
    app.querySelector("[data-indicator-name]").textContent = text.names[result.method];
    app.querySelector("[data-range]").textContent = [result.range.low, result.range.median, result.range.high].map((n) => formatNumber(n, result.unit)).join(" / ");
    app.querySelector("[data-difference]").textContent = formatNumber(result.differenceToMedian, result.unit);
    app.querySelector("[data-source]").textContent = result.comparableSource;
    app.querySelector("[data-result]").hidden = false;
    app.querySelector("[data-status]").textContent = text.ready;
  }
  function updateMethod() {
    const labels = text.labels[form.elements.method.value];
    app.querySelector("[data-label-a]").textContent = labels[0];
    app.querySelector("[data-label-b]").textContent = labels[1];
    app.querySelector("[data-secondary-field]").hidden = form.elements.method.value === "cup";
    form.elements.amountB.disabled = form.elements.method.value === "cup";
    if (form.elements.method.value === "cup") form.elements.amountB.value = "0";
  }
  function download(content, type, suffix) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a"); link.href = url; link.download = text.filename + suffix; link.click(); URL.revokeObjectURL(url);
  }
  form.addEventListener("submit", (event) => { event.preventDefault(); render(engine.analyze(values())); });
  form.elements.method.addEventListener("change", updateMethod);
  app.querySelector("[data-copy]").addEventListener("click", async () => { if (!last) return; await navigator.clipboard.writeText(memo(last)); app.querySelector("[data-status]").textContent = text.copied; });
  app.querySelector("[data-txt]").addEventListener("click", () => { if (!last) return; download(memo(last), "text/plain;charset=utf-8", ".txt"); app.querySelector("[data-status]").textContent = text.txt; });
  app.querySelector("[data-json]").addEventListener("click", () => { if (!last) return; download(JSON.stringify({ input: values(), result: last }, null, 2), "application/json", ".json"); app.querySelector("[data-status]").textContent = text.json; });
  app.querySelector("[data-print]").addEventListener("click", () => last && window.print());
  updateMethod();
})();
