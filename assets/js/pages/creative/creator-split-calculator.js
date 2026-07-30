(function () {
  "use strict";
  var root = document.querySelector("[data-creator-split]");
  if (!root || !window.CreatorSplitEngine) return;
  var lang = root.getAttribute("data-lang") === "fr" ? "fr" : "en";
  var copy = lang === "fr" ? {
    total: "Total attribué", invalid: "Vérifiez les champs et assurez-vous que les parts totalisent exactement 100 %.",
    ready: "Répartition calculée. Vérifiez-la avec toutes les parties avant de l'utiliser.",
    copied: "Accord copié.", downloaded: "Fichier téléchargé.", legal: "Note : ce document consigne une compréhension commune ; il ne constitue pas un contrat juridique."
  } : {
    total: "Total allocated", invalid: "Check the fields and make sure the shares total exactly 100%.",
    ready: "Split calculated. Review it with every party before use.",
    copied: "Agreement copied.", downloaded: "File downloaded.", legal: "Note: this records a shared understanding; it is not a legal contract."
  };
  var form = root.querySelector("form");
  var rows = root.querySelector("[data-members]");
  var output = root.querySelector("[data-output]");
  var status = root.querySelector("[data-status]");
  var lastResult = null;

  function memberRow(name, role, percentage) {
    var row = document.createElement("fieldset");
    row.className = "cs-calc-member";
    row.innerHTML =
      '<label>' + (lang === "fr" ? "Nom" : "Name") + '<input name="member-name" required value="' + escapeHtml(name || "") + '"></label>' +
      '<label>' + (lang === "fr" ? "Rôle" : "Role") + '<input name="member-role" value="' + escapeHtml(role || "") + '"></label>' +
      '<label>' + (lang === "fr" ? "Part (%)" : "Share (%)") + '<input name="member-share" type="number" min="0" max="100" step="0.01" required value="' + escapeHtml(percentage == null ? "" : percentage) + '"></label>' +
      '<button type="button" class="cs-calc-remove" aria-label="' + (lang === "fr" ? "Supprimer ce collaborateur" : "Remove this collaborator") + '">×</button>';
    row.querySelector(".cs-calc-remove").addEventListener("click", function () {
      if (rows.children.length > 2) row.remove();
    });
    rows.appendChild(row);
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[character];
    });
  }
  function readMembers() {
    return Array.prototype.map.call(rows.querySelectorAll(".cs-calc-member"), function (row) {
      return {
        name: row.querySelector('[name="member-name"]').value,
        role: row.querySelector('[name="member-role"]').value,
        percentage: row.querySelector('[name="member-share"]').value
      };
    });
  }
  function format(amount, currency) {
    try {
      return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en", {style: "currency", currency: currency, maximumFractionDigits: 2}).format(amount);
    } catch (_) {
      return currency + " " + Number(amount).toLocaleString();
    }
  }
  function agreement(result) {
    var heading = lang === "fr" ? "ACCORD DE RÉPARTITION DES REVENUS" : "REVENUE SPLIT AGREEMENT";
    var project = lang === "fr" ? "Projet" : "Project";
    var revenue = lang === "fr" ? "Revenu à répartir" : "Revenue to split";
    return [heading, "", project + ": " + (result.project || "—"), revenue + ": " + format(result.revenue, result.currency), ""]
      .concat(result.shares.map(function (share) {
        return share.name + (share.role ? " (" + share.role + ")" : "") + ": " + share.percentage + "% — " + format(share.amount, result.currency);
      }))
      .concat(["", copy.legal, "AfroTools CreatorSplit"]).join("\n");
  }
  function render(result) {
    var table = '<div class="cs-calc-summary"><strong>' + copy.total + ': ' + result.totalPercentage + '%</strong><span>' + format(result.revenue, result.currency) + '</span></div>';
    table += '<div class="cs-calc-results">';
    result.shares.forEach(function (share) {
      table += '<article><div><strong>' + escapeHtml(share.name) + '</strong><small>' + escapeHtml(share.role || "—") + '</small></div><span>' + share.percentage + '%</span><b>' + escapeHtml(format(share.amount, result.currency)) + '</b></article>';
    });
    output.innerHTML = table + "</div>";
    output.hidden = false;
    root.querySelector("[data-actions]").hidden = false;
    status.textContent = copy.ready;
  }
  function download(name, type, content) {
    var link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], {type: type}));
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 0);
    status.textContent = copy.downloaded;
  }

  memberRow(lang === "fr" ? "Créateur 1" : "Creator 1", lang === "fr" ? "Artiste" : "Artist", 50);
  memberRow(lang === "fr" ? "Créateur 2" : "Creator 2", lang === "fr" ? "Producteur" : "Producer", 50);
  root.querySelector("[data-add-member]").addEventListener("click", function () { memberRow("", "", ""); });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      lastResult = window.CreatorSplitEngine.calculateShares({
        project: form.elements.project.value,
        projectType: form.elements.projectType.value,
        currency: form.elements.currency.value,
        revenue: form.elements.revenue.value,
        members: readMembers()
      });
      render(lastResult);
    } catch (_) {
      lastResult = null;
      output.hidden = true;
      root.querySelector("[data-actions]").hidden = true;
      status.textContent = copy.invalid;
    }
  });
  root.querySelector("[data-copy]").addEventListener("click", function () {
    if (!lastResult) return;
    var text = agreement(lastResult);
    var fallback = function () {
      var area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(fallback);
    else fallback();
    status.textContent = copy.copied;
  });
  root.querySelector("[data-json]").addEventListener("click", function () {
    if (lastResult) download("creator-split.json", "application/json", JSON.stringify(lastResult, null, 2));
  });
  root.querySelector("[data-txt]").addEventListener("click", function () {
    if (lastResult) download("creator-split.txt", "text/plain;charset=utf-8", agreement(lastResult));
  });
})();
