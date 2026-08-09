"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {
  localizeVisibleLanguage,
} = require("./lib/french-visible-language");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "tools", "creator-captions", "app.html");
const outputDir = path.join(root, "fr", "tools", "legendes-createur");
const output = path.join(outputDir, "app.html");
const assetVersion = (relativePath) => crypto.createHash("md5")
  .update(fs.readFileSync(path.join(root, relativePath), "utf8").replace(/\r\n?/g, "\n"))
  .digest("hex")
  .slice(0, 8);
const frLocalizerVersion = assetVersion("assets/js/pages/creative/fr-creator-captions-localizer.js");
const frProofCssVersion = assetVersion("assets/css/fr-creative-route-real-proof.css");
const frReflowVersion = assetVersion("assets/js/pages/creative/fr-creative-route-real-reflow.js");

let html = fs.readFileSync(source, "utf8");
html = html
  .replace('lang="en"', 'lang="fr"')
  .replace("<title>CaptionCraft Workspace | AfroTools</title>", "<title>Atelier de légendes créateur | AfroTools</title>")
  .replace('href="style.css?v=9083b950"', 'href="/tools/creator-captions/style.css?v=9083b950"')
  .replace(
    [
      '<link rel="canonical" href="https://afrotools.com/tools/creator-captions/app">',
      '<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/creator-captions/app">',
      '<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/legendes-createur/app">',
      '<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/caption-za-maudhui/app">',
      '<link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/creator-captions/app">'
    ].join("\n"),
    [
      '<link rel="canonical" href="https://afrotools.com/fr/tools/legendes-createur/app">',
      '<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/creator-captions/app">',
      '<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/legendes-createur/app">',
      '<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/caption-za-maudhui/app">',
      '<link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/creator-captions/app">'
    ].join("\n")
  )
  .replace(
    '<meta property="og:url" content="https://afrotools.com/tools/creator-captions/app">',
    '<meta property="og:url" content="https://afrotools.com/fr/tools/legendes-createur/app">\n<meta property="og:locale" content="fr_FR">'
  )
  .replaceAll('href="index.html"', 'href="/fr/tools/legendes-createur/"')
  .replace(/\s*<script src="\/assets\/js\/pages\/creative\/fr-creator-captions-localizer\.js(?:\?v=[a-f0-9]+)?"><\/script>\s*/g, "\n")
  .replace(
    /(<script src="\/assets\/js\/pages\/creative\/creator-captions-app-controller\.js(?:\?v=[a-f0-9]+)?"><\/script>)/,
    `<script src="/assets/js/pages/creative/fr-creator-captions-localizer.js?v=${frLocalizerVersion}"></script>\n$1`
  );

if (!html.includes("/assets/css/fr-creative-route-real-proof.css")) {
  html = html.replace(
    "</head>",
    `<link rel="stylesheet" href="/assets/css/fr-creative-route-real-proof.css?v=${frProofCssVersion}">\n</head>`
  );
}
if (!html.includes("/assets/js/pages/creative/fr-creative-route-real-reflow.js")) {
  html = html.replace(
    "</body>",
    `<script src="/assets/js/pages/creative/fr-creative-route-real-reflow.js?v=${frReflowVersion}" defer></script>\n</body>`
  );
}

const STATIC_FRENCH_COPY = new Map([
  ["Hook First Line", "Accroche en première ligne"],
  ["Include a question", "Inclure une question"],
  ["Include a hook", "Inclure une accroche"],
  ["Optional AI assist", "Assistance IA facultative"],
  ["When checked, your topic, platform, tone and selected options are sent to AfroToolsâ€™ caption service. Leave unchecked to generate locally in this browser.", "Si cette option est cochée, votre sujet, la plateforme, le ton et les options choisies sont envoyés au service de légendes AfroTools. Laissez-la décochée pour générer localement dans ce navigateur."],
  ["Generate Captions", "Créer les légendes"],
  ["Your captions will appear here", "Vos légendes apparaîtront ici"],
  ["Describe your post, pick a platform and tone, then hit Generate.", "Décrivez votre publication, choisissez une plateforme et un ton, puis lancez la création."],
  ["Paste your existing caption", "Collez votre légende actuelle"],
  ["Paste the caption you want to improve...", "Collez la légende à améliorer…"],
  ["When checked, the pasted caption and platform are sent to AfroToolsâ€™ caption service. Leave unchecked to rewrite locally in this browser.", "Si cette option est cochée, la légende collée et la plateforme sont envoyées au service de légendes AfroTools. Laissez-la décochée pour réécrire localement dans ce navigateur."],
  ["When checked, your topic, platform, tone and selected options are sent to AfroTools’ caption service. Leave unchecked to generate locally in this browser.", "Si cette option est cochée, votre sujet, la plateforme, le ton et les options choisies sont envoyés au service de légendes AfroTools. Laissez-la décochée pour générer localement dans ce navigateur."],
  ["When checked, the pasted caption and platform are sent to AfroTools’ caption service. Leave unchecked to rewrite locally in this browser.", "Si cette option est cochée, la légende collée et la plateforme sont envoyées au service de légendes AfroTools. Laissez-la décochée pour réécrire localement dans ce navigateur."],
  ["Rewrite Caption", "Réécrire la légende"]
]);

let localized = localizeVisibleLanguage(html);
for (const [english, french] of STATIC_FRENCH_COPY) {
  localized = localized.split(english).join(french);
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(output, localized);
console.log(`Wrote ${path.relative(root, output)}`);
