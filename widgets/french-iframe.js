(function () {
  const widgets = {

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
