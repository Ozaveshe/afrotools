(function () {
  "use strict";

  var engine = window.AfroZaDividendTax;
  var app = document.querySelector("[data-za-dividend-tax-app]");
  if (!engine || !app) return;
  var isFrench = document.documentElement.lang === "fr";

  var form = app.querySelector("[data-form]");
  var result = app.querySelector("[data-result]");
  var error = app.querySelector("[data-error]");
  var status = app.querySelector("[data-status]");
  var reducedField = app.querySelector("[data-reduced-field]");
  var documentationCheck = app.querySelector("[data-documentation-check]");
  var lastSummary = "";

  function field(name) {
    return form.elements.namedItem(name);
  }

  function money(value) {
    return new Intl.NumberFormat(isFrench ? "fr-ZA" : "en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(value);
  }

  function date(value) {
    return new Intl.DateTimeFormat(isFrench ? "fr-ZA" : "en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(value + "T00:00:00Z"));
  }

  function updateTreatment() {
    var treatment = field("treatment").value;
    reducedField.hidden = treatment !== "reduced";
    documentationCheck.hidden = treatment === "standard";
    field("reducedRatePercent").required = treatment === "reduced";
    field("documentationConfirmed").required = treatment !== "standard";
  }

  function input() {
    return {
      grossDividend: field("grossDividend").value,
      paymentCount: field("paymentCount").value,
      paymentDate: field("paymentDate").value,
      treatment: field("treatment").value,
      reducedRatePercent: field("reducedRatePercent").value,
      documentationConfirmed: field("documentationConfirmed").checked,
      scopeConfirmed: field("scopeConfirmed").checked,
    };
  }

  function treatmentLabel(value) {
    if (isFrench) {
      if (value === "reduced") return "Taux réduit confirmé par l’utilisateur";
      if (value === "exempt") return "Exonération confirmée par l’utilisateur";
      return "Taux national standard";
    }
    if (value === "reduced") return "User-confirmed reduced rate";
    if (value === "exempt") return "User-confirmed exemption";
    return "Standard domestic rate";
  }

  function render(out) {
    app.querySelector("[data-tax]").textContent = money(out.taxPerPayment);
    app.querySelector("[data-net]").textContent = money(out.netPerPayment);
    app.querySelector("[data-rate]").textContent = (out.rate * 100).toFixed(2) + "%";
    app.querySelector("[data-scenario-gross]").textContent = money(out.scenarioGross);
    app.querySelector("[data-scenario-tax]").textContent = money(out.scenarioTax);
    app.querySelector("[data-scenario-net]").textContent = money(out.scenarioNet);
    app.querySelector("[data-due-date]").textContent = date(out.indicativeRemittanceDate);
    app.querySelector("[data-treatment]").textContent = treatmentLabel(out.treatment);

    var steps = isFrench
      ? [
          "Dividende brut en numéraire par paiement : " + money(out.grossDividend) + ".",
          treatmentLabel(out.treatment) + " appliqué à " + (out.rate * 100).toFixed(2) + " %.",
          "Retenue estimée par paiement : " + money(out.taxPerPayment) + ".",
          "Montant net estimé par paiement : " + money(out.netPerPayment) + ".",
          out.paymentCount + " paiement(s) identique(s) donnent une retenue de scénario de " + money(out.scenarioTax) + ".",
        ]
      : [
          "Gross cash dividend per payment: " + money(out.grossDividend) + ".",
          treatmentLabel(out.treatment) + " applied at " + (out.rate * 100).toFixed(2) + "%.",
          "Estimated withholding per payment: " + money(out.taxPerPayment) + ".",
          "Estimated net cash per payment: " + money(out.netPerPayment) + ".",
          out.paymentCount + " equal payment(s) produce scenario withholding of " + money(out.scenarioTax) + ".",
        ];
    app.querySelector("[data-steps]").innerHTML = steps
      .map(function (step) {
        return "<li>" + step + "</li>";
      })
      .join("");

    lastSummary = (isFrench
      ? [
          "Estimation AfroTools de l’impôt sud-africain sur les dividendes",
          "Date de paiement : " + out.paymentDate,
          "Traitement : " + treatmentLabel(out.treatment),
          "Brut par paiement : " + money(out.grossDividend),
          "Taux : " + (out.rate * 100).toFixed(2) + " %",
          "Retenue estimée par paiement : " + money(out.taxPerPayment),
          "Net estimé par paiement : " + money(out.netPerPayment),
          "Nombre de paiements du scénario : " + out.paymentCount,
          "Brut du scénario : " + money(out.scenarioGross),
          "Retenue du scénario : " + money(out.scenarioTax),
          "Net du scénario : " + money(out.scenarioNet),
          "Date indicative de versement par l’agent : " + out.indicativeRemittanceDate,
          "Estimation uniquement. Vérifiez le bénéficiaire effectif, les déclarations, la convention applicable et les dossiers de l’agent de retenue.",
          "Il ne s’agit ni d’une déclaration SARS, ni d’un certificat fiscal, ni d’un avis juridique.",
        ]
      : [
          "AfroTools South Africa dividends tax planning estimate",
          "Payment date: " + out.paymentDate,
          "Treatment: " + treatmentLabel(out.treatment),
          "Gross per payment: " + money(out.grossDividend),
          "Rate: " + (out.rate * 100).toFixed(2) + "%",
          "Estimated withholding per payment: " + money(out.taxPerPayment),
          "Estimated net per payment: " + money(out.netPerPayment),
          "Scenario payment count: " + out.paymentCount,
          "Scenario gross: " + money(out.scenarioGross),
          "Scenario withholding: " + money(out.scenarioTax),
          "Scenario net: " + money(out.scenarioNet),
          "Indicative withholding-agent remittance date: " + out.indicativeRemittanceDate,
          "Planning estimate only. Verify beneficial-owner status, declarations, the applicable DTA and the withholding agent's records.",
          "Not a SARS return, tax certificate, legal opinion or filing instruction.",
        ]).join("\n");

    result.hidden = false;
    result.focus({ preventScroll: true });
    result.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }

  function showError(failure) {
    var message = failure && failure.message;
    if (message === "scope confirmation is required") {
      return isFrench
        ? "Confirmez qu’il s’agit d’une estimation de dividende en numéraire dans le périmètre."
        : "Confirm that this is an in-scope cash-dividend estimate before calculating.";
    }
    if (message === "documentation confirmation is required") {
      return isFrench
        ? "Confirmez que l’agent de retenue dispose de la déclaration d’exonération ou de taux réduit requise."
        : "Confirm that the withholding agent has the required exemption or reduced-rate declaration.";
    }
    if (message && message.indexOf("reducedRatePercent") !== -1) {
      return isFrench
        ? "Saisissez un taux réduit vérifié compris entre 0 % et moins de 20 %."
        : "Enter a verified reduced rate from 0% up to, but below, 20%.";
    }
    return isFrench
      ? "Vérifiez la date, le montant et le nombre de paiements, puis réessayez."
      : "Check the payment date, amount and payment count, then try again.";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    error.textContent = "";
    status.textContent = "";
    try {
      render(engine.calculate(input()));
    } catch (failure) {
      result.hidden = true;
      error.textContent = showError(failure);
    }
  });

  app.querySelector("[data-copy]").addEventListener("click", function () {
    if (!lastSummary) return;
    navigator.clipboard.writeText(lastSummary).then(
      function () {
        status.textContent = isFrench ? "Résumé copié." : "Summary copied.";
      },
      function () {
        status.textContent = isFrench
          ? "Copie indisponible ; sélectionnez les étapes manuellement."
          : "Copy unavailable; select the calculation steps manually.";
      },
    );
  });

  app.querySelector("[data-download]").addEventListener("click", function () {
    if (!lastSummary) return;
    var url = URL.createObjectURL(
      new Blob([lastSummary], { type: "text/plain;charset=utf-8" }),
    );
    var link = document.createElement("a");
    link.href = url;
    link.download = isFrench
      ? "estimation-impot-dividendes-afrique-du-sud.txt"
      : "south-africa-dividends-tax-estimate.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = isFrench ? "Résumé TXT téléchargé." : "TXT summary downloaded.";
  });

  app.querySelector("[data-print]").addEventListener("click", function () {
    if (!lastSummary) return;
    status.textContent = isFrench
      ? "Ouverture de l’impression locale ; choisissez Enregistrer au format PDF si nécessaire."
      : "Opening the local print dialog; choose Save as PDF if needed.";
    window.print();
  });

  field("treatment").addEventListener("change", updateTreatment);
  updateTreatment();
})();
