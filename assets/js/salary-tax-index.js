(function () {
  "use strict";

  var lang = (document.documentElement.lang || "en").toLowerCase();
  var isSw = lang.indexOf("sw") === 0;

  var copy = {
    noToolsFound: isSw ? "Hakuna zana zilizopatikana — jaribu utafutaji mwingine." : "No tools found — try a different search.",
    open: isSw ? "Fungua" : "Open",
    tools: isSw ? "zana" : "tools",
    hubLabels: {
      paye: isSw ? "💰 Vikokotoo vya PAYE" : "💰 PAYE Calculators",
      payroll: isSw ? "👔 Mishahara na HR" : "👔 Payroll & HR",
      biztax: isSw ? "🏢 Kodi ya Biashara" : "🏢 Business & Capital Tax",
      property: isSw ? "🏠 Mali na Mikopo" : "🏠 Property & Loans",
      savings: isSw ? "📈 Akiba na Uwekezaji" : "📈 Savings & Investment",
      crypto: isSw ? "₿ Crypto" : "₿ Crypto Suite",
      fx: isSw ? "💱 Sarafu na FX" : "💱 Currency & FX",
      francophone: isSw ? "🇫🇷 Zana za Kifaransa" : "🇫🇷 Outils Francophones",
    },
  };

  var HUB_TOOL_IDS = {
    paye: [
      "ng-paye", "ke-paye", "gh-paye", "za-paye", "eg-paye", "tz-paye", "ug-paye", "rw-paye",
      "et-paye", "sn-paye", "ci-paye", "cm-paye", "ma-paye", "dz-paye", "tn-paye", "ly-paye",
      "sd-paye", "ao-paye", "mz-paye", "zm-paye", "zw-paye", "bw-paye", "na-paye", "sz-paye",
      "ls-paye", "mw-paye", "mg-paye", "mu-paye", "sc-paye", "bi-paye", "cd-paye", "cg-paye",
      "ga-paye", "gq-paye", "cf-paye", "td-paye", "ne-paye", "ml-paye", "bf-paye", "gn-paye",
      "gw-paye", "sl-paye", "lr-paye", "mr-paye", "gm-paye", "cv-paye", "st-paye", "tg-paye",
      "bj-paye", "so-paye", "dj-paye", "er-paye", "ss-paye", "km-paye", "paye-calculator",
      "ke-paye-sw", "tz-paye-sw", "ug-paye-sw", "rw-paye-sw", "bi-paye-sw",
    ],
    payroll: [
      "minimum-wage", "overtime-calc", "leave-calculator", "social-security", "pension-projection",
      "payslip-generator", "staff-cost", "salary-compare", "ng-pension", "ke-nssf", "za-gepf",
      "gh-ssnit", "za-uif", "job-offer-evaluator",
    ],
    biztax: [
      "gh-paye-2", "ng-cit", "ng-cgt", "ke-cgt", "za-cgt", "za-dividend-tax", "ng-wht",
      "ke-wht", "transfer-pricing", "import-duty", "side-hustle-tax",
    ],
    property: [
      "mortgage-calculator", "loan-compare", "za-transfer-duty", "compound-interest",
      "first-home-buyer", "home-loan-eligibility", "mortgage-affordability", "property-roi",
      "property-transfer-cost", "rent-vs-buy", "ng-land-use", "ke-stamp-duty", "car-loan",
      "student-loan", "microfinance-calc",
    ],
    savings: [
      "investment-return", "inflation-calc", "savings-goal", "retirement-planner",
      "startup-valuation", "business-planner", "crypto-cgt",
    ],
    crypto: [
      "crypto-p2p", "crypto-prices", "crypto-stablecoins", "crypto-remittance",
      "crypto-arbitrage", "crypto-portfolio", "crypto-dca", "crypto-tax", "crypto-cgt",
      "crypto-profit", "crypto-mining", "crypto-scam", "crypto-address", "crypto-exchange",
      "crypto-contract", "crypto-quiz",
    ],
    fx: [
      "currency-converter", "afrorates", "interest-rate-ref", "forex-profit",
      "bank-charges", "fuel-tracker",
    ],
    francophone: [
      "ci-paye-fr", "sn-paye-fr", "cm-paye-fr", "cd-paye-fr", "ma-paye-fr", "dz-paye-fr",
      "tn-paye-fr", "ml-paye-fr", "bf-paye-fr", "ne-paye-fr", "gn-paye-fr", "cg-paye-fr",
      "ga-paye-fr", "tg-paye-fr", "mg-paye-fr", "bj-paye-fr", "td-paye-fr", "bi-paye-fr",
      "mr-paye-fr", "cf-paye-fr", "dj-paye-fr", "km-paye-fr", "cv-paye-fr", "gq-paye-fr",
      "sn-vs-ci-fr", "ci-tva-fr", "sn-tva-fr", "cm-tva-fr", "cd-tva-fr", "ma-tva-fr",
      "dz-tva-fr", "tn-tva-fr", "ml-tva-fr", "bf-tva-fr", "ne-tva-fr", "gn-tva-fr",
      "cg-tva-fr", "ga-tva-fr", "tg-tva-fr", "calculateur-tva-fr", "convertisseur-devises-fr",
      "generateur-factures-fr", "droits-douane-fr", "frais-mobile-money-fr", "transfert-argent-fr",
      "ci-salaire", "sn-salaire", "cm-salaire", "cd-salaire", "ma-salaire", "dz-salaire",
      "tn-salaire", "ml-salaire", "bf-salaire", "ne-salaire", "gn-salaire", "cg-salaire",
      "ga-salaire", "tg-salaire",
    ],
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initSalaryTaxIndex() {
    var totalNode = document.getElementById("s-total");
    var resultsNode = document.getElementById("find-results");
    var searchInput = document.getElementById("tool-search");

    var allFinancialTools = (window.AFRO_TOOLS || []).filter(function (tool) {
      return tool.category === "financial";
    });

    var liveFinancialTools = allFinancialTools.filter(function (tool) {
      return tool.status === "live" || tool.status === "new";
    });

    if (totalNode) {
      totalNode.textContent = allFinancialTools.length;
    }

    if (!resultsNode) {
      return;
    }

    var hubSets = {};
    Object.keys(HUB_TOOL_IDS).forEach(function (key) {
      hubSets[key] = new Set(HUB_TOOL_IDS[key]);
    });

    function renderResults(tools, heading) {
      if (!tools.length) {
        resultsNode.innerHTML = '<div class="fr-empty">' + copy.noToolsFound + "</div>";
        resultsNode.style.display = "block";
        return;
      }

      var html = "";

      if (heading) {
        html +=
          '<div class="fr-hub-label">' +
          escapeHtml(heading) +
          '<span class="fr-count">' +
          tools.length +
          " " +
          copy.tools +
          "</span></div>";
      }

      tools.slice(0, 30).forEach(function (tool) {
        html +=
          '<a href="' + escapeHtml(tool.href || "#") + '" class="fr-item">' +
            '<span class="fr-icon">' + escapeHtml(tool.icon || "") + "</span>" +
            '<div class="fr-info">' +
              '<div class="fr-name">' + escapeHtml(tool.name || "") + "</div>" +
              '<div class="fr-desc">' + escapeHtml(tool.desc || "") + "</div>" +
            "</div>" +
            '<span class="fr-cta">' + copy.open + " &rarr;</span>" +
          "</a>";
      });

      if (tools.length > 30) {
        html +=
          '<div class="fr-empty fr-more">' +
          tools.length +
          " " +
          copy.tools +
          "</div>";
      }

      resultsNode.innerHTML = html;
      resultsNode.style.display = "block";
    }

    window.filterHub = function (hubKey) {
      if (searchInput) {
        searchInput.value = "";
      }

      var allowed = hubSets[hubKey];
      renderResults(
        liveFinancialTools.filter(function (tool) {
          return allowed && allowed.has(tool.id);
        }),
        copy.hubLabels[hubKey] || hubKey
      );
    };

    if (!searchInput) {
      return;
    }

    searchInput.addEventListener("input", function () {
      var query = this.value.toLowerCase().trim();
      if (!query) {
        resultsNode.style.display = "none";
        resultsNode.innerHTML = "";
        return;
      }

      renderResults(
        liveFinancialTools.filter(function (tool) {
          var countries = Array.isArray(tool.countries) ? tool.countries.join(" ").toLowerCase() : "";
          return (
            (tool.name || "").toLowerCase().indexOf(query) !== -1 ||
            (tool.desc || "").toLowerCase().indexOf(query) !== -1 ||
            (tool.id || "").toLowerCase().indexOf(query) !== -1 ||
            countries.indexOf(query) !== -1
          );
        }),
        ""
      );
    });
  }

  if (typeof onRegistryReady === "function") {
    onRegistryReady(initSalaryTaxIndex);
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      if (typeof AFRO_TOOLS !== "undefined") {
        initSalaryTaxIndex();
      } else {
        document.addEventListener("afrotools:registry-ready", initSalaryTaxIndex);
      }
    });
  }
})();
