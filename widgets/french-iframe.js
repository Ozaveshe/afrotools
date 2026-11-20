(function () {
  const widgets = {

  "json-formatter": {
    "title": "Mise en forme de JSON",
    "tool": "/fr/tools/formateur-json/",
    "frame": "developer-json-formatter",
    "script": "developer/json-formatter.js"
  },
  "hash-generator": {
    "title": "Empreintes SHA d’un texte",
    "tool": "/fr/tools/generateur-hash/",
    "frame": "developer-hash-generator",
    "script": "developer/hash-generator.js"
  },
  "uuid-generator": {
    "title": "Générateur d’identifiants UUID",
    "tool": "/fr/tools/generateur-uuid/",
    "frame": "developer-uuid-generator",
    "script": "developer/uuid-generator.js"
  }
,

  "base64": {
    "title": "Encodeur et décodeur Base64",
    "tool": "/fr/tools/encodeur-base64/",
    "frame": "developer-base64",
    "script": "developer/base64.js"
  },
  "url-encoder": {
    "title": "Encodage des paramètres d’URL",
    "tool": "/fr/tools/encodeur-url/",
    "frame": "developer-url-encoder",
    "script": "developer/url-encoder.js"
  },
  "html-entities": {
    "title": "Encodage des entités HTML",
    "tool": "/fr/tools/entites-html/",
    "frame": "developer-html-entities",
    "script": "developer/html-entities.js"
  }
,

  "break-even-lite": {
    "title": "Seuil de rentabilité",
    "tool": "/fr/tools/seuil-rentabilite/",
    "frame": "business-break-even-lite",
    "script": "financial/break-even.js"
  },
  "break-even": {
    "title": "Seuil de rentabilité",
    "tool": "/fr/tools/seuil-rentabilite/",
    "frame": "financial-break-even",
    "script": "financial/break-even.js"
  }
,

  "inflation-calc": {
    "title": "Simulation de l’inflation",
    "tool": "/fr/tools/calculateur-inflation/",
    "frame": "financial-inflation-calc",
    "script": "financial/inflation-calc.js"
  },
  "savings-goal": {
    "title": "Objectif d’épargne",
    "tool": "/fr/tools/objectif-epargne/",
    "frame": "financial-savings-goal",
    "script": "financial/savings-goal.js"
  },
  "car-loan": {
    "title": "Simulation de prêt automobile",
    "tool": "/fr/tools/pret-automobile/",
    "frame": "financial-car-loan",
    "script": "financial/car-loan.js"
  }
,

  "markup-calc": {
    "title": "Calculateur de majoration",
    "tool": "/fr/tools/calculateur-marge/",
    "frame": "financial-markup-calc",
    "script": "financial/markup-calc.js"
  },
  "percentage-calculator": {
    "title": "Calculateur de pourcentage",
    "tool": "/fr/tools/calculateur-pourcentage/",
    "frame": "financial-percentage-calculator",
    "script": "financial/percentage-calc.js"
  },
  "budget-planner": {
    "title": "Budget mensuel",
    "tool": "/fr/tools/planificateur-budget/",
    "frame": "financial-budget-planner",
    "script": "financial/budget-planner.js"
  }
,
    "discount-calc": {
      title: "Calculateur de remise",
      tool: "/fr/tools/calculateur-remise/",
      frame: "financial-discount-calc",
      script: "financial/discount-calc.js"
    },
    "tip-calculator": {
      title: "Calculateur de pourboire",
      tool: "/fr/tools/calculateur-pourboire/",
      frame: "financial-tip-calculator",
      script: "financial/tip-calc.js"
    }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = widgets;
  if (typeof document === "undefined" || new URLSearchParams(location.search).get("lang") !== "fr") return;
  const filename = location.pathname.split("/").pop().replace(/\.html$/, "");
  const entry = Object.values(widgets).find(widget => widget.frame === filename);
  if (!entry) return;
  document.documentElement.lang = "fr";
  document.documentElement.dataset.afroWidgetLocale = "fr";
  document.title = entry.title + " - AfroTools";
  const link = document.querySelector(".aw-footer a");
  if (link) {
    const target = new URL(entry.tool, location.origin);
    target.search = new URL(link.href).search;
    link.href = target.href;
    link.textContent = "Outil complet sur AfroTools";
  }
})();
