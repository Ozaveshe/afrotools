(() => {
  "use strict";
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
