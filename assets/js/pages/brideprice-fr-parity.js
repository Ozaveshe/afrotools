(function () {
  "use strict";

  const byId = id => document.getElementById(id);
  const form = byId("dotForm");
  const draftKey = "afrotools:conseiller-dot-fr";
  const fields = ["tradition", "currency", "symbolicGift", "familyGifts", "ceremonyCost",
    "travelCost", "saved", "familySupport", "contingency", "months", "notes"];
  const checks = ["adultConsent", "coupleHeard", "pauseRespected", "clearKeeper", "registration"];
  const outputIds = ["totalOut", "gapOut", "monthlyOut", "shareOut", "checkOut", "riskBox", "summaryOut"];
  const formatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
  const status = message => { byId("actionStatus").textContent = message; };
  const amount = (number, currency) => formatter.format(number) + " " + currency;

  function calculate(reportErrors) {
    const invalid = Array.from(form.elements).find(field =>
      field.willValidate && (!field.validity.valid ||
        (field.type === "number" && Number(field.value) > 1e15)));
    form.querySelectorAll("[aria-invalid]").forEach(field => field.removeAttribute("aria-invalid"));
    if (invalid) invalid.setAttribute("aria-invalid", "true");

    try {
      if (invalid) throw new Error("INVALID_FIELD");
      const result = window.MarriageConversationEngine.calculate({
        currency: byId("currency").value,
        agreedGift: byId("symbolicGift").value,
        gathering: byId("ceremonyCost").value,
        travel: byId("travelCost").value,
        other: byId("familyGifts").value,
        saved: Number(byId("saved").value) + Number(byId("familySupport").value),
        months: byId("months").value,
        bufferPercent: byId("contingency").value,
        voluntaryConsent: byId("adultConsent").checked,
        coupleHeard: byId("coupleHeard").checked,
        pauseRespected: byId("pauseRespected").checked,
        termsWritten: byId("clearKeeper").checked,
        localGuidance: byId("registration").checked
      });
      byId("totalOut").textContent = amount(result.total, result.currency);
      byId("gapOut").textContent = amount(result.gap, result.currency);
      byId("monthlyOut").textContent = amount(result.monthlyTarget, result.currency);
      byId("checkOut").textContent = result.completedChecks + "/5";
      byId("shareOut").textContent = formatter.format(result.total ?
        100 * (result.agreedGift + result.other) / result.total : 0) + " %";
      byId("riskBox").className = "status-box " + (result.readyForConversation ? "good" : "warn");
      byId("riskBox").dataset.ready = String(result.readyForConversation);
      byId("riskBox").textContent = result.readyForConversation ?
        "Les quatre points essentiels ont été discutés. Chaque personne reste libre de changer d’avis." :
        "Prenez le temps de discuter des points en suspens. Toute personne peut refuser ou demander une pause.";
      byId("summaryOut").textContent = [
        "Plan de discussion familiale",
        "Budget convenu : " + amount(result.total, result.currency),
        "Reste à financer : " + amount(result.gap, result.currency),
        "Épargne mensuelle : " + amount(result.monthlyTarget, result.currency),
        "Points discutés : " + result.completedChecks + "/5",
        byId("riskBox").textContent
      ].join("\n");
      return result;
    } catch {
      outputIds.forEach(id => { byId(id).textContent = ""; });
      delete byId("riskBox").dataset.ready;
      status("Vérifiez la devise, les montants et le nombre de mois avant de continuer.");
      if (reportErrors && invalid) {
        invalid.focus();
        invalid.reportValidity();
      }
      return null;
    }
  }

  function download(contents, type, filename) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (calculate(true)) status("Plan calculé sur cet appareil.");
  });
  form.addEventListener("input", () => { status(""); calculate(false); });
  form.addEventListener("reset", () => setTimeout(() => { calculate(false); status("Formulaire réinitialisé."); }, 0));
  byId("copyBtn").addEventListener("click", async () => {
    if (!calculate(true)) return;
    try {
      await navigator.clipboard.writeText(byId("summaryOut").textContent);
      status("Résumé copié.");
    } catch {
      status("La copie a échoué. Vous pouvez télécharger le résumé au format TXT.");
    }
  });
  byId("downloadBtn").addEventListener("click", () => {
    if (!calculate(true)) return;
    download(byId("summaryOut").textContent, "text/plain;charset=utf-8", "plan-familial.txt");
    status("Résumé TXT téléchargé.");
  });
  byId("jsonBtn").addEventListener("click", () => {
    const result = calculate(true);
    if (!result) return;
    download(JSON.stringify({ schemaVersion: 1, methodology: result.methodology, result }, null, 2),
      "application/json", "plan-familial.json");
    status("Plan JSON téléchargé.");
  });
  byId("saveBtn").addEventListener("click", () => {
    if (!calculate(true)) return;
    const draft = { schemaVersion: 2 };
    fields.forEach(id => { draft[id] = byId(id).value; });
    checks.forEach(id => { draft[id] = byId(id).checked; });
    try {
      localStorage.setItem(draftKey, JSON.stringify(draft));
      status("Brouillon enregistré dans ce navigateur, notes comprises.");
    } catch {
      status("Ce navigateur ne permet pas d’enregistrer le brouillon.");
    }
  });

  try {
    const draft = JSON.parse(localStorage.getItem(draftKey));
    if (draft && typeof draft === "object") {
      // Older drafts described anticipated family support and used different consent questions.
      fields.forEach(id => {
        if (id === "familySupport" && draft.schemaVersion !== 2) return;
        if (typeof draft[id] === "string" || typeof draft[id] === "number") byId(id).value = draft[id];
      });
      if (draft.schemaVersion === 2) checks.forEach(id => { byId(id).checked = draft[id] === true; });
      let message = "Brouillon local restauré.";
      if (draft.schemaVersion !== 2) {
        message = "Ancien brouillon restauré. Discutez de nouveau des cinq points.";
        const anticipated = Number(draft.familySupport);
        if (Number.isFinite(anticipated) && anticipated > 0) {
          message += " Contribution prévue dans l’ancien brouillon : " + amount(anticipated, byId("currency").value) +
            ". Saisissez uniquement la part déjà disponible.";
        }
      }
      status(message);
    }
  } catch {
    status("Impossible de restaurer le brouillon local.");
  }
  calculate(false);
})();
