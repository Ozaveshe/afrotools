(() => {
  "use strict";
  const ageForm = document.getElementById("ci-age-check");
  if (ageForm) {
    const result = ageForm.querySelector("output");
    ageForm.addEventListener("input", () => { result.textContent = ""; });
    ageForm.addEventListener("submit", event => {
      event.preventDefault();
      const fields = ageForm.elements;
      const check = window.AfroCarPriceIntelligence.assessCiImportAge({
        ordinaryUsedImport: fields.ordinary.checked, vehicleClass: "passenger",
        firstCirculation: fields.firstCirculation.value, shipmentDate: fields.shipmentDate.value
      });
      result.textContent = {
        conditional: "Admissibilité à vérifier. Confirmez la catégorie, les deux dates et l’application du régime ordinaire auprès des douanes.",
        ineligible: "La limite de cinq ans est dépassée pour cette voiture de tourisme en importation ordinaire.",
        "within-age-limit": "La condition d’âge est satisfaite aux dates saisies. Les douanes doivent confirmer les autres conditions."
      }[check.status];
    });
  }
  const form = document.getElementById("car-quote-comparison");
  const output = form.querySelector("output");
  const format = new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: form.dataset.currency, currencyDisplay: "code", maximumFractionDigits: 0
  });
  form.addEventListener("input", () => { output.textContent = ""; });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const first = form.elements["first-quote"].valueAsNumber;
    const second = form.elements["second-quote"].valueAsNumber;
    const amount = [first, second];
    if (!amount.every(value => Number.isSafeInteger(value) && value > 0) || !form.reportValidity()) return;
    if (first === second) {
      output.textContent = `Les deux devis sont identiques : ${format.format(first)} chacun.`;
      return;
    }
    const choices = form.dataset.localOnly === "true" ? ["La première offre locale", "La deuxième offre locale"] : ["L’import", "L’achat local"];
    output.textContent = `${choices[first < second ? 0 : 1]} coûte ${format.format(Math.abs(first - second))} de moins, d’après vos devis.`;
  });
})();
