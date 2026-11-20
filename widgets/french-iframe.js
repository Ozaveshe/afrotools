(function () {
  const widgets = {

  "mortgage-calculator": {
    "title": "Simulation de prêt immobilier",
    "tool": "/fr/tools/calculateur-hypothecaire/",
    "frame": "financial-mortgage-calculator",
    "script": "financial/mortgage.js"
  },
  "investment-return": {
    "title": "Simulation de rendement",
    "tool": "/fr/tools/rendement-investissement/",
    "frame": "financial-investment-return",
    "script": "financial/investment-return.js"
  }
,
    "loan-compare": {"title": "Comparateur de prêts", "tool": "/fr/tools/comparateur-prets/", "frame": "financial-loan-compare", "script": "financial/loan-compare.js"},
    "qr-generator": {"title": "Générateur de codes QR", "tool": "/fr/tools/generateur-qr/", "frame": "image-design-qr-generator", "script": "image-design/qr-generator.js"},
    "color-contrast": {"title": "Contraste des couleurs", "tool": "/fr/tools/contraste-couleurs/", "frame": "image-design-color-contrast", "script": "image-design/color-contrast.js"},
    "ielts-band": {"title": "Note globale IELTS", "tool": "/fr/tools/calculateur-ielts/", "frame": "education-ielts-band", "script": "education/ielts.js"},

  "working-days": {
    "title": "Calculateur de jours ouvrés",
    "tool": "/fr/tools/jours-ouvrables/",
    "frame": "data-productivity-working-days",
    "script": "data-productivity/working-days.js"
  }
,

  "age-calculator": {
    "title": "Calculateur d’âge",
    "tool": "/fr/tools/calculateur-age/",
    "frame": "data-productivity-age-calculator",
    "script": "data-productivity/age-calculator.js"
  }
,

  "random-picker": {
    "title": "Tirage au sort",
    "tool": "/fr/tools/selecteur-aleatoire/",
    "frame": "data-productivity-random-picker",
    "script": "data-productivity/random-picker.js"
  }
,

  "unit-converter": {
    "title": "Convertisseur d’unités",
    "tool": "/fr/tools/convertisseur-unites/",
    "frame": "data-productivity-unit-converter",
    "script": "data-productivity/unit-converter.js"
  }
,

  "time-zone": {
    "title": "Convertisseur de fuseaux horaires",
    "tool": "/fr/tools/fuseaux-horaires/",
    "frame": "data-productivity-time-zone",
    "script": "data-productivity/time-zone.js"
  }
,

  "diff-checker": {
    "title": "Comparer deux textes",
    "tool": "/fr/tools/comparateur-texte/",
    "frame": "document-pdf-diff-checker",
    "script": "document-pdf/diff-checker.js"
  },
  "word-counter": {
    "title": "Compteur de mots",
    "tool": "/fr/tools/compteur-mots/",
    "frame": "document-pdf-word-counter",
    "script": "document-pdf/word-counter.js"
  }
,

  "regex-tester": {
    "title": "Testeur d’expressions régulières",
    "tool": "/fr/tools/testeur-regex/",
    "frame": "developer-regex-tester",
    "script": "developer/regex-tester.js"
  }
,

  "cron-builder": {
    "title": "Planificateur cron",
    "tool": "/fr/tools/constructeur-cron/",
    "frame": "developer-cron-builder",
    "script": "developer/cron-builder.js"
  }
,

  "markdown-editor": {
    "title": "Éditeur Markdown",
    "tool": "/fr/tools/editeur-markdown/",
    "frame": "developer-markdown-editor",
    "script": "developer/markdown-editor.js"
  }
,

  "jwt-decoder": {
    "title": "Décodage d’un jeton JWT",
    "tool": "/fr/tools/decodeur-jwt/",
    "frame": "developer-jwt-decoder",
    "script": "developer/jwt-decoder.js"
  }
,

  "css-gradient": {
    "title": "Générateur de dégradés CSS",
    "tool": "/fr/tools/generateur-degrade-css/",
    "frame": "developer-css-gradient",
    "script": "developer/css-gradient.js"
  },
  "password-generator": {
    "title": "Générateur de mots de passe",
    "tool": "/fr/tools/generateur-mot-de-passe/",
    "frame": "developer-password-generator",
    "script": "developer/password-generator.js"
  },
  "color-picker": {
    "title": "Sélecteur de couleur",
    "tool": "/fr/tools/selecteur-couleur/",
    "frame": "developer-color-picker",
    "script": "developer/color-picker.js"
  }
,

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
