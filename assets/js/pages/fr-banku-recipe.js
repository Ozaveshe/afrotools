(() => {
  "use strict";
  const root = document.querySelector(".recipe-fr");
  const chooser = document.getElementById("quantite");
  const status = document.getElementById("recipe-status");
  const boxes = [...document.querySelectorAll("#liste input")];
  const base = Number(root.dataset.base);
  const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 });

  chooser.addEventListener("change", () => {
    const count = Number(chooser.value);
    if (!Number.isInteger(count) || count < 1 || count > 50) return;
    root.querySelectorAll("[data-base-amount]").forEach(node => {
      const amount = Number(node.dataset.baseAmount) * count / base;
      node.textContent = [number.format(amount), amount > 1 ? node.dataset.many : node.dataset.one].filter(Boolean).join(" ");
    });
    document.getElementById("assiettes").textContent = count;
    document.getElementById("yield-unit").textContent = count === 1 ? "assiette" : "assiettes";
    boxes.forEach(box => { box.checked = false; });
    status.textContent = "Quantités ajustées. Vérifiez les ingrédients pour ce nombre d’assiettes.";
  });
  boxes.forEach(box => box.addEventListener("change", () => {
    status.textContent = "Ingrédients réunis : " + boxes.filter(item => item.checked).length + " sur " + boxes.length + ".";
  }));
  async function enableRecipe() {
    const engine = window.AfroKitchenEngine;
    try {
      const state = await engine.checkRecipePublication({
        id: root.dataset.id, slug: root.dataset.slug,
        is_published: root.dataset.published === "true", is_verified: root.dataset.verified === "true"
      });
      if (state.kind === "eligible") {
        chooser.disabled = false;
        boxes.forEach(box => { box.disabled = false; });
        status.textContent = "";
        return;
      }
      if (state.kind === "withheld") {
        root.querySelector("#methode").hidden = true;
        root.querySelector("#liste").hidden = true;
        status.textContent = "Cette recette a été retirée du catalogue public.";
        return;
      }
    } catch {
      // A temporarily unavailable catalogue does not establish withdrawal.
    }
    status.textContent = "La vérification du catalogue est indisponible. Rechargez la page pour ajuster les quantités.";
  }
  enableRecipe();
})();
