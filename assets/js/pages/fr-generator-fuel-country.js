(() => {
  "use strict";
  const form = document.getElementById("fuel-form");
  const result = document.getElementById("fuel-result");
  const status = document.getElementById("fuel-status");
  const currency = form.dataset.currency;
  const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 4 });
  const money = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let rows;

  function clear() {
    result.hidden = true;
    status.textContent = "";
    rows = null;
  }

  form.addEventListener("input", clear);
  form.elements.fuel.addEventListener("change", () => {
    form.elements.price.value = "";
    clear();
    status.textContent = "Saisissez le prix par litre du carburant choisi.";
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    clear();
    const fields = form.elements;
    const input = {
      genKVA: fields.namedItem("size").valueAsNumber,
      loadPercent: fields.load.valueAsNumber,
      dailyHours: fields.hours.valueAsNumber,
      fuelType: fields.fuel.value
    };
    const model = window.AfroTools?.GeneratorFuelEngine?.calculate(input, form.dataset.iso)?.operatingModel;
    if (!model) {
      status.textContent = "Le modèle de consommation est indisponible. Rechargez la page.";
      return;
    }
    const price = fields.price.valueAsNumber;
    const days = fields.days.valueAsNumber;
    const daily = model.dailyLitres * price;
    const monthly = daily * days;
    if (!Number.isFinite(monthly)) {
      status.textContent = "Vérifiez la puissance et le prix par litre.";
      return;
    }
    const hourly = model.dailyLitres / input.dailyHours;
    const values = {
      hourly: number.format(hourly) + " L/h", litres: number.format(model.dailyLitres) + " L",
      energy: number.format(model.dailyKwh) + " kWh", daily: money.format(daily) + " " + currency,
      monthly: money.format(monthly) + " " + currency
    };
    for (const [key, value] of Object.entries(values)) {
      result.querySelector('[data-value="' + key + '"]').textContent = value;
    }
    const fuel = fields.fuel.selectedOptions[0].textContent;
    document.getElementById("fuel-basis").textContent =
      fuel + " · prix saisi : " + fields.price.value.replace(".", ",") + " " + currency + "/L · " + days + " jour(s) de marche par mois.";
    rows = [
      ["Pays", form.dataset.iso], ["Devise", currency], ["Carburant", fuel],
      ["Prix saisi par litre", price], ["Puissance (kVA)", input.genKVA], ["Charge (%)", input.loadPercent],
      ["Facteur de puissance", model.powerFactor], ["Consommation (L/kWh)", model.litresPerKwh],
      ["Heures de marche par jour", input.dailyHours], ["Jours de marche par mois", days],
      ["Litres par heure", hourly], ["Litres par jour", model.dailyLitres], ["Énergie par jour (kWh)", model.dailyKwh],
      ["Coût quotidien (" + currency + ")", Number(daily.toFixed(2))],
      ["Coût mensuel (" + currency + ")", Number(monthly.toFixed(2))]
    ];
    result.hidden = false;
    document.getElementById("result-title").focus();
  });
  document.getElementById("fuel-download").addEventListener("click", () => {
    if (!rows) return;
    const format = value => typeof value === "number"
      ? value.toLocaleString("fr-FR", { useGrouping: false, maximumFractionDigits: 12 })
      : value;
    const csv = rows.map(row => row.map(format).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "budget-carburant-" + form.dataset.iso.toLowerCase() + ".csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
