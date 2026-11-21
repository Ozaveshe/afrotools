(() => {
  "use strict";
  const form = document.getElementById("import-budget");
  const result = document.getElementById("import-result");
  const status = document.getElementById("import-status");
  const currency = form.dataset.currency;
  const amounts = new Intl.NumberFormat("fr", { maximumFractionDigits: 2 });
  const feeLabels = { customs: "droits et taxes", handling: "port, transit et livraison", registration: "immatriculation" };
  form.addEventListener("input", () => {
    result.hidden = true;
    status.textContent = "";
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const fields = form.elements;
    const baseUsd = fields.purchase.valueAsNumber + fields.freight.valueAsNumber + fields.insurance.valueAsNumber;
    const baseLocal = baseUsd * fields.fx.valueAsNumber;
    const missing = [];
    let fees = 0;
    for (const [key, label] of Object.entries(feeLabels)) {
      if (fields[key].value === "") missing.push(label);
      else fees += fields[key].valueAsNumber;
    }
    const total = baseLocal + fees;
    if (fields.purchase.valueAsNumber <= 0 || fields.fx.valueAsNumber <= 0 || !Number.isFinite(total)) {
      result.hidden = true;
      status.textContent = "Vérifiez les montants. Le prix du véhicule et le taux de change doivent être strictement positifs.";
      return;
    }
    const money = value => amounts.format(value) + " " + currency;
    const title = result.querySelector("h2");
    title.textContent = missing.length ? "Budget partiel" : "Budget avec tous les postes renseignés";
    document.getElementById("import-base").textContent = "Achat, fret et assurance : " + amounts.format(baseUsd) + " USD, soit " + money(baseLocal) + ".";
    document.getElementById("import-fees").textContent = "Frais à destination renseignés : " + money(fees) + ".";
    document.getElementById("import-total").textContent = "Total des montants renseignés : " + money(total);
    document.getElementById("import-missing").textContent = missing.length ? "À compléter : " + missing.join(" / ") + "." : "";
    result.hidden = false;
    title.focus();
  });
})();
