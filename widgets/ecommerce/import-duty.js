!function() {
  "use strict";
  window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.importDuty = function(e) {
    if (e && window.AfroImportDutyNigeriaEngine) {
      const fr = e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr";
      const labels = {
        "Chargeable Weight Planner": "Calcul du poids facturable",
        "Your confirmed divisor and optional user rate. No carrier quote or customs calculation.": "Indiquez le diviseur du transporteur. Ajoutez son tarif pour estimer le fret.",
        Packages: "Nombre de colis",
        "Actual kg each": "Poids réel par colis (kg)",
        "Length cm": "Longueur (cm)",
        "Width cm": "Largeur (cm)",
        "Height cm": "Hauteur (cm)",
        "Confirmed divisor": "Diviseur volumétrique confirmé",
        "Choose after checking": "Choisir le diviseur confirmé",
        "5000 — confirmed": "5000 — confirmé",
        "6000 — confirmed": "6000 — confirmé",
        "Your rate/kg (optional)": "Tarif par kg (facultatif)",
        "Display unit": "Devise ou unité du tarif",
        "Your provider and service determine the divisor and rate. Values shown here are never live quotes.": "Le diviseur et le tarif dépendent du service choisi. Vérifiez-les sur le devis du transporteur.",
        Calculate: "Calculer",
        "Open the full private planner": "Ouvrir le simulateur complet",
        "Actual total": "Poids réel total",
        "Volumetric total": "Poids volumétrique total",
        "Chargeable weight": "Poids facturable",
        "Freight at your rate": "Fret au tarif saisi",
        "Confirm the divisor and enter positive weights and dimensions.": "Confirmez le diviseur et saisissez des poids et dimensions positifs.",
        "Planning result ready. No customs or provider quote is included.": "Estimation calculée. Les frais de douane sont exclus.",
        "Nigeria · Planning estimate": "Nigéria · Simulation",
        "Import duty & landed cost": "Droits de douane et coût rendu",
        "Use the duty rate confirmed for your HS code. No stored FX or category guess.": "Saisissez le taux confirmé pour votre code douanier SH. Les montants sont en dollars américains.",
        "FOB value (USD)": "Valeur FOB (USD)",
        "Freight + insurance (USD)": "Fret et assurance (USD)",
        "Confirmed CET rate": "Taux du tarif extérieur commun confirmé",
        Choose: "Choisir",
        "Other assessed charges (USD)": "Autres prélèvements évalués (USD)",
        "VAT rate": "Taux de TVA (%)",
        "Port + clearing (USD)": "Port et dédouanement (USD)",
        "Calculate planning total": "Calculer le coût estimé",
        "Planning estimate only. Confirm HS classification, customs value and charges with Nigeria Customs Service.": "Vérifiez le classement SH, la valeur en douane et les prélèvements auprès des douanes nigérianes.",
        "Planning landed cost": "Coût rendu estimé",
        Duty: "Droits de douane",
        VAT: "TVA",
        "Calculated locally. Nothing was sent or stored.": "Calcul effectué sur votre appareil."
      };
      const tr = key => fr ? labels[key] || key : key;
      function localize(element) {
        if (!fr) return;
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const item = walker.currentNode, key = item.nodeValue.trim();
          if (labels[key]) item.nodeValue = item.nodeValue.replace(key, labels[key]);
        }
      }
      e.innerHTML = '<section class="aw-card" aria-labelledby="aw-title"><div class="aw-head"><span>Nigeria · Planning estimate</span><h1 id="aw-title">Import duty &amp; landed cost</h1><p>Use the duty rate confirmed for your HS code. No stored FX or category guess.</p></div><form id="aw-form"><div class="aw-grid"><label>FOB value (USD)<input id="aw-fob" type="number" min="0.01" step="0.01" required></label><label>Freight + insurance (USD)<input id="aw-freight" type="number" min="0" step="0.01" value="0" required></label><label>Confirmed CET rate<select id="aw-rate" required><option value="">Choose</option><option value="0">0%</option><option value="5">5%</option><option value="10">10%</option><option value="20">20%</option><option value="35">35%</option></select></label><label>Other assessed charges (USD)<input id="aw-other" type="number" min="0" step="0.01" value="0"></label><label>VAT rate<input id="aw-vat" type="number" min="0" max="100" step="0.01" value="7.5" required></label><label>Port + clearing (USD)<input id="aw-port" type="number" min="0" step="0.01" value="0"></label></div><button type="submit">Calculate planning total</button><p class="aw-status" id="aw-status" role="status" aria-live="polite"></p></form><div class="aw-result" id="aw-result" hidden></div><p class="aw-note">Planning estimate only. Confirm HS classification, customs value and charges with Nigeria Customs Service.</p></section>';
      var t = e.querySelector("#aw-form");
      localize(e);
      t.addEventListener("input", () => {
        e.querySelector("#aw-result").hidden = true;
        e.querySelector("#aw-status").textContent = "";
      });
      t.addEventListener("submit", function(a) {
        if (a.preventDefault(), t.reportValidity()) {
          var i = window.AfroImportDutyNigeriaEngine.calculate({
            fob: e.querySelector("#aw-fob").value,
            freight: e.querySelector("#aw-freight").value,
            insurance: 0,
            customsValue: 0,
            dutyRate: e.querySelector("#aw-rate").value,
            otherImportCharges: e.querySelector("#aw-other").value,
            vatRate: e.querySelector("#aw-vat").value,
            portCharges: e.querySelector("#aw-port").value,
            clearingFee: 0,
            fxRate: 0
          }), r = e.querySelector("#aw-result"), o = function(e) {
            return new Intl.NumberFormat(fr ? "fr" : "en-NG", {
              style: "currency",
              currency: "USD"
            }).format(e);
          };
          r.innerHTML = "<span>Planning landed cost</span><strong>" + o(i.totalUsd) + "</strong><div><b>CIF</b><b>" + o(i.cif) + "</b></div><div><b>Duty</b><b>" + o(i.duty) + "</b></div><div><b>VAT</b><b>" + o(i.vat) + "</b></div>",
          localize(r), r.hidden = !1, e.querySelector("#aw-status").textContent = tr("Calculated locally. Nothing was sent or stored.");
        }
      });
    }
  };
}();
