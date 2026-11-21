(() => {
  "use strict";
  const form = document.querySelector(".lesson-sheet");
  const output = document.querySelector(".lesson-result");
  const text = output.querySelector("pre");
  const title = document.querySelector("h1").textContent;
  const lesson = form.dataset.lesson;
  const format = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

  form.addEventListener("input", () => {
    output.hidden = true;
    text.textContent = "";
    for (const control of form.elements) {
      if (control.setCustomValidity) control.setCustomValidity("");
    }
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);
    const value = name => String(data.get(name) || "").trim();
    for (const control of form.querySelectorAll("input[required], textarea[required]")) {
      if (!control.value.trim()) {
        control.setCustomValidity("Précisez votre réponse.");
        control.reportValidity();
        return;
      }
    }
    let lines;
    if (lesson === "setup") {
      const checks = Array.from(form.querySelectorAll("[name=checks]"), box =>
        (box.checked ? "Vérifié : " : "À tester : ") + box.value);
      lines = [...checks, "Solution de secours : " + value("fallback"), "Prochain essai : " + value("next")];
    } else if (lesson === "brand-deals") {
      const inputs = Object.fromEntries(data);
      const estimate = window.AfroTools?.smallBusinessParity?.calculate("influencer-rate", { ...inputs, dealsPerMonth: 1 });
      if (!estimate?.ok || !Number.isFinite(estimate.values.quote)) {
        form.elements.hours.setCustomValidity("Impossible de calculer le devis. Vérifiez les montants et rechargez la page si nécessaire.");
        form.elements.hours.reportValidity();
        return;
      }
      const currency = value("currency").toUpperCase();
      const money = n => format.format(n) + " " + currency;
      const { labour, production, rights, exclusivity, quote } = estimate.values;
      lines = ["Livrables et conditions : " + value("scope"),
        "Création : " + value("hours") + " h × " + money(inputs.hourlyFloor) + "/h = " + money(labour),
        "Production : " + money(production), "Droits de réutilisation : " + money(rights),
        "Exclusivité : " + money(exclusivity), "Devis estimatif : " + money(quote)];
    } else {
      const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" })
        .format(new Date(value("review") + "T00:00:00Z"));
      lines = ["Piste : " + value("channel"), "Offre et public : " + value("offer"),
        "Première action : " + value("action"), "Indicateur : " + value("measure"), "Date du bilan : " + date];
    }
    text.textContent = [title, "", ...lines].join("\n");
    output.hidden = false;
    output.querySelector("h3").focus();
  });
  output.querySelector("button").addEventListener("click", () => {
    if (output.hidden) return;
    const url = URL.createObjectURL(new Blob([text.textContent], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "afrostream-" + lesson + "-fr.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
