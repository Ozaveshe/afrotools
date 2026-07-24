(function () {
  "use strict";
  const app = document.querySelector("[data-ke-wht-app]");
  const engine = window.AfroTools && window.AfroTools.KenyaWht;
  if (!app || !engine) return;

  const form = app.querySelector("[data-form]");
  const language = app.dataset.locale === "fr" ? "fr" : "en";
  const copy = {
    en: {
      errors: {
        "Confirm that this is a Kenyan withholding-tax payment before calculating.": "Confirm that this is a Kenyan withholding-tax payment before calculating.",
        "Enter a gross payment greater than zero.": "Enter a gross payment greater than zero.",
        "Choose a supported payment category.": "Choose a supported payment category.",
        "Choose the recipient residency.": "Choose the recipient residency.",
        "This resident/non-resident combination has no general rate in the reviewed KRA table.": "This resident/non-resident combination has no general rate in the reviewed KRA table.",
        "The reviewed resident fee threshold is KSh 24,000 in aggregate for the month; this payment is below it.": "The reviewed resident fee threshold is KSh 24,000 in aggregate for the month; this payment is below it.",
        "Confirm EAC citizenship evidence before applying an EAC rate.": "Confirm EAC citizenship evidence before applying an EAC rate.",
        "The supported EAC reductions apply to a non-resident recipient.": "The supported EAC reductions apply to a non-resident recipient.",
        "The reviewed KRA table does not provide an EAC reduction for this payment category.": "The reviewed KRA table does not provide an EAC reduction for this payment category.",
        "Treaty-rate entry is restricted to non-resident recipients.": "Treaty-rate entry is restricted to non-resident recipients.",
        "Confirm treaty eligibility and documentation before using a reduced rate.": "Confirm treaty eligibility and documentation before using a reduced rate.",
        "Enter an evidenced treaty rate below the standard non-resident rate.": "Enter an evidenced treaty rate below the standard non-resident rate.",
        "Confirm exemption evidence before applying a zero rate.": "Confirm exemption evidence before applying a zero rate.",
        "Confirm eligibility for the residential Monthly Rental Income flow before applying 7.5%.": "Confirm eligibility for the residential Monthly Rental Income flow before applying 7.5%.",
        "The supported controlling-company dividend exemption requires a resident dividend.": "The supported controlling-company dividend exemption requires a resident dividend.",
        "Confirm resident-company voting-power evidence before applying the dividend exemption.": "Confirm resident-company voting-power evidence before applying the dividend exemption.",
        "Confirm that the payer is a public entity before applying the public-goods rate.": "Confirm that the payer is a public entity before applying the public-goods rate.",
      },
      result: "Estimate ready.",
      copied: "Result copied.",
      downloaded: "TXT downloaded.",
      exportTitle: "Kenya WHT planning estimate",
      labels: { gross: "Gross payment", rate: "Applied rate", deduction: "WHT deduction", net: "Net payment", treatment: "Treatment" },
      filename: "kenya-wht-estimate.txt",
    },
    fr: {
      errors: {},
      result: "Estimation prête.",
      copied: "Résultat copié.",
      downloaded: "Fichier TXT téléchargé.",
      exportTitle: "Estimation de retenue à la source au Kenya",
      labels: { gross: "Paiement brut", rate: "Taux appliqué", deduction: "Retenue WHT", net: "Paiement net", treatment: "Traitement" },
      filename: "estimation-retenue-source-kenya.txt",
    },
  }[language];

  const money = new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 2 });
  let lastResult = null;

  function translateError(message) {
    if (language === "en") return copy.errors[message] || message;
    const translations = {
      "Confirm that this is a Kenyan withholding-tax payment before calculating.": "Confirmez qu'il s'agit d'un paiement soumis à la retenue kenyane.",
      "Enter a gross payment greater than zero.": "Saisissez un paiement brut supérieur à zéro.",
      "Choose a supported payment category.": "Choisissez une catégorie de paiement prise en charge.",
      "Choose the recipient residency.": "Choisissez la résidence du bénéficiaire.",
      "This resident/non-resident combination has no general rate in the reviewed KRA table.": "Cette combinaison n'a pas de taux général dans le tableau KRA vérifié.",
      "The reviewed resident fee threshold is KSh 24,000 in aggregate for the month; this payment is below it.": "Le seuil résident vérifié est de 24 000 KSh au total sur le mois ; ce paiement est inférieur.",
      "Confirm EAC citizenship evidence before applying an EAC rate.": "Confirmez la preuve de citoyenneté EAC avant d'appliquer ce taux.",
      "The supported EAC reductions apply to a non-resident recipient.": "Les réductions EAC prises en charge concernent un bénéficiaire non-résident.",
      "The reviewed KRA table does not provide an EAC reduction for this payment category.": "Le tableau KRA vérifié ne prévoit pas de réduction EAC pour cette catégorie.",
      "Treaty-rate entry is restricted to non-resident recipients.": "Le taux conventionnel est réservé aux bénéficiaires non-résidents.",
      "Confirm treaty eligibility and documentation before using a reduced rate.": "Confirmez l'éligibilité et les justificatifs conventionnels.",
      "Enter an evidenced treaty rate below the standard non-resident rate.": "Saisissez un taux conventionnel justifié inférieur au taux standard.",
      "Confirm exemption evidence before applying a zero rate.": "Confirmez la preuve d'exonération avant d'appliquer un taux nul.",
      "Confirm eligibility for the residential Monthly Rental Income flow before applying 7.5%.": "Confirmez l'éligibilité au régime résidentiel MRI avant d'appliquer 7,5 %.",
      "The supported controlling-company dividend exemption requires a resident dividend.": "L'exonération de dividende prise en charge exige un dividende versé à un résident.",
      "Confirm resident-company voting-power evidence before applying the dividend exemption.": "Confirmez la preuve de participation avec plus de 12,5 % des droits de vote.",
      "Confirm that the payer is a public entity before applying the public-goods rate.": "Confirmez que le payeur est une entité publique avant d'appliquer ce taux.",
    };
    return translations[message] || message;
  }

  function values() {
    const data = new FormData(form);
    return {
      grossAmount: data.get("grossAmount"),
      paymentType: data.get("paymentType"),
      residency: data.get("residency"),
      treatment: data.get("treatment"),
      treatyRatePercent: data.get("treatyRatePercent"),
      evidenceConfirmed: data.get("evidenceConfirmed") === "on",
      scopeConfirmed: data.get("scopeConfirmed") === "on",
    };
  }

  function exportText(result) {
    return [
      copy.exportTitle,
      copy.labels.gross + ": " + money.format(result.grossAmount),
      copy.labels.rate + ": " + result.rate.toFixed(2) + "%",
      copy.labels.deduction + ": " + money.format(result.deduction),
      copy.labels.net + ": " + money.format(result.netPayment),
      copy.labels.treatment + ": " + result.treatment,
      "Source version: " + result.sourceVersion,
      "Data reviewed: " + result.dataAsOf,
    ].join("\n");
  }

  function render(result) {
    const error = app.querySelector("[data-error]");
    if (!result.ok) {
      lastResult = null;
      error.textContent = translateError(result.error);
      app.querySelector("[data-result]").hidden = true;
      return;
    }
    error.textContent = "";
    lastResult = result;
    app.querySelector("[data-deduction]").textContent = money.format(result.deduction);
    app.querySelector("[data-gross]").textContent = money.format(result.grossAmount);
    app.querySelector("[data-net]").textContent = money.format(result.netPayment);
    app.querySelector("[data-rate]").textContent = result.rate.toFixed(2) + "%";
    app.querySelector("[data-treatment]").textContent = result.treatment;
    app.querySelector("[data-notes]").textContent = result.notes.join(" ");
    app.querySelector("[data-result]").hidden = false;
    app.querySelector("[data-status]").textContent = copy.result;
    app.querySelectorAll("[data-rate-row]").forEach((row) => {
      row.dataset.active = String(row.dataset.rateRow === result.paymentType);
    });
  }

  function updateTreatment() {
    const treatment = form.elements.treatment.value;
    const evidencePayment = form.elements.paymentType.value === "residentialRent" || form.elements.paymentType.value === "publicGoods";
    app.querySelector("[data-treaty-field]").hidden = treatment !== "treaty";
    app.querySelector("[data-evidence]").hidden = treatment === "standard" && !evidencePayment;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render(engine.calculate(values()));
  });
  form.elements.treatment.addEventListener("change", updateTreatment);
  form.elements.paymentType.addEventListener("change", () => {
    updateTreatment();
    app.querySelectorAll("[data-rate-row]").forEach((row) => {
      row.dataset.active = String(row.dataset.rateRow === form.elements.paymentType.value);
    });
  });
  app.querySelector("[data-copy]").addEventListener("click", async () => {
    if (!lastResult) return;
    await navigator.clipboard.writeText(exportText(lastResult));
    app.querySelector("[data-status]").textContent = copy.copied;
  });
  app.querySelector("[data-download]").addEventListener("click", () => {
    if (!lastResult) return;
    const url = URL.createObjectURL(new Blob([exportText(lastResult)], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = copy.filename;
    link.click();
    URL.revokeObjectURL(url);
    app.querySelector("[data-status]").textContent = copy.downloaded;
  });
  app.querySelector("[data-print]").addEventListener("click", () => lastResult && window.print());
  updateTreatment();
})();
