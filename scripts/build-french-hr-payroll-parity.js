#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { normalizeBuildManagedHtml } = require("./lib/shared-asset-references");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "data/localization/fr-hr-payroll-parity.json");
const CONTRACT_PATH = path.join(ROOT, "data/localization/fr-hr-payroll-field-contracts.json");
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const contractManifest = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
const countries = JSON.parse(fs.readFileSync(path.join(ROOT, "data/registry/countries.json"), "utf8"));
const check = process.argv.includes("--check");
const contractTools = new Map(contractManifest.tools.map((tool) => [tool.id, tool]));

function normalizeGeneratedHtml(html) {
  const normalized = normalizeBuildManagedHtml(html)
    .replace(/\s*<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>\s*/gi, "\n")
    .replace(/\s*<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, "\n")
    .replace(
      /(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
      (full, opening, payload, closing) => {
        try {
          return `${opening}${JSON.stringify(JSON.parse(payload))}${closing}`;
        } catch {
          return full;
        }
      }
    )
    .replace(/<\/main>\s*<afro-footer>/g, "</main>\n<afro-footer>");
  return normalized.match(/<body\b[\s\S]*<\/body>/i)?.[0] || normalized;
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function fileForRoute(route) {
  return path.join(ROOT, route.replace(/^\/|\/$/g, ""), "index.html");
}

function parseAttributes(tag) {
  const attributes = {};
  for (const match of tag.matchAll(/([:\w-]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? true;
  }
  return attributes;
}

function controlContract(tool, name) {
  const owner = contractTools.get(tool.id);
  const contract = owner && owner.controls.find((control) => control.french === name);
  if (!contract) throw new Error(`Missing English/French control contract for ${tool.id}/${name}`);
  return contract;
}

function ownerHtml(tool) {
  const owner = contractTools.get(tool.id);
  if (!owner) throw new Error(`Missing control-contract owner for ${tool.id}`);
  return fs.readFileSync(path.join(ROOT, owner.englishOwner), "utf8");
}

function ownerSelectOptions(tool, contract) {
  const html = ownerHtml(tool);
  if (contract.options === "country-cards") {
    const cards = Array.from(html.matchAll(/<a href="([^"]+)" class="hr-country-card">[\s\S]*?<span class="hr-country-name">([^<]+)<\/span>/g));
    if (cards.length !== 54) throw new Error(`Expected 54 English maternity country values, found ${cards.length}`);
    return cards.map((match) => {
      const value = match[1];
      const slug = value.match(/\/tools\/maternity-leave\/([^/]+)\/$/)?.[1];
      const country = countries.find((entry) => entry.routeSlug === slug)
        || (slug === "republic-of-congo" ? countries.find((entry) => entry.isoCode === "CG") : null);
      if (!country) throw new Error(`No French country label for English selector value ${value}`);
      return [value, country.displayNames.fr || country.displayNames.en];
    });
  }
  const tags = Array.from(html.matchAll(/<(select)\b[^>]*>/gi));
  const opening = tags.find((match) => {
    const attributes = parseAttributes(match[0]);
    return attributes[contract.english.by] === contract.english.value;
  });
  if (!opening) throw new Error(`Missing English selector ${tool.id}/${contract.english.value}`);
  const closingIndex = html.indexOf("</select>", opening.index);
  const block = html.slice(opening.index, closingIndex + "</select>".length);
  return Array.from(block.matchAll(/<option\b[^>]*value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/gi))
    .map((match) => [match[1], match[2].replace(/<[^>]+>/g, "").trim()]);
}

function contractAttributes(contract) {
  const attributes = [];
  for (const key of ["type", "min", "max", "step", "maxlength", "inputmode", "autocomplete", "pattern", "rows"]) {
    if (Object.prototype.hasOwnProperty.call(contract, key)) {
      attributes.push(` ${key}="${escapeHtml(contract[key])}"`);
    }
  }
  if (contract.required) attributes.push(" required");
  return attributes.join("");
}

function inputHtml(tool, field) {
  const [name, label, type, value, optionsOrSettings, selectSettings] = field;
  const id = "fr-hr-" + name.replace(/[A-Z]/g, (match) => "-" + match.toLowerCase());
  const settings = Array.isArray(optionsOrSettings) ? (selectSettings || {}) : (optionsOrSettings || {});
  const contract = controlContract(tool, name);
  const attributes = contractAttributes(contract);
  const expectedElement = type === "select" || type === "country-select" ? "select" : type === "textarea" ? "textarea" : "input";
  if (contract.element !== expectedElement) {
    throw new Error(`Manifest/control element mismatch for ${tool.id}/${name}: ${expectedElement} != ${contract.element}`);
  }
  if (contract.element === "select") {
    const ownerOptions = ownerSelectOptions(tool, contract);
    const options = contract.options === "country-cards" ? ownerOptions : optionsOrSettings;
    const ownerValues = ownerOptions.map((option) => option[0]);
    const frenchValues = options.map((option) => option[0]);
    if (JSON.stringify(ownerValues) !== JSON.stringify(frenchValues)) {
      throw new Error(`Selector values drifted from English owner for ${tool.id}/${name}`);
    }
    if (value !== ownerValues[0]) {
      throw new Error(`Selector default drifted from English owner for ${tool.id}/${name}: ${value} != ${ownerValues[0]}`);
    }
    return `<div class="fr-hr-field"><label for="${id}">${escapeHtml(label)}</label><select id="${id}" name="${name}"${attributes}>${options.map(([optionValue, optionLabel]) => `<option value="${escapeHtml(optionValue)}"${optionValue === value ? " selected" : ""}>${escapeHtml(optionLabel)}</option>`).join("")}</select></div>`;
  }
  if (contract.element === "textarea") {
    const placeholder = settings.placeholder ? ` placeholder="${escapeHtml(settings.placeholder)}"` : "";
    return `<div class="fr-hr-field fr-hr-field-wide"><label for="${id}">${escapeHtml(label)}</label><textarea id="${id}" name="${name}"${attributes}${placeholder}>${escapeHtml(value)}</textarea></div>`;
  }
  const placeholder = settings.placeholder ? ` placeholder="${escapeHtml(settings.placeholder)}"` : "";
  return `<div class="fr-hr-field"><label for="${id}">${escapeHtml(label)}</label><input id="${id}" name="${name}" value="${escapeHtml(value)}"${attributes}${placeholder}></div>`;
}

function sharedInputHtml(tool, name, label, value, placeholder) {
  return inputHtml(tool, [name, label, "text", value, placeholder ? { placeholder } : {}]);
}

function jsonLd(tool) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.title,
    description: tool.description,
    url: "https://afrotools.com" + tool.route,
    image: "https://afrotools.com" + tool.image,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    inLanguage: "fr",
    isBasedOn: "https://afrotools.com" + tool.englishRoute,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "Calcul local dans le navigateur",
      "Source et date obligatoires",
      "Export TXT, JSON et PDF",
      "Réouverture locale d'un fichier JSON"
    ]
  }).replace(/</g, "\\u003c");
}

function pageHtml(tool) {
  const config = JSON.stringify({
    id: tool.id,
    route: tool.route,
    title: tool.title
  }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="fr" data-theme-choice="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-content-id" content="fr-hr-payroll-parity:${escapeHtml(tool.id)}">
  <meta name="afrotools-source-owner" content="scripts/build-french-hr-payroll-parity.js">
  <title>${escapeHtml(tool.title)} — AfroTools</title>
  <meta name="description" content="${escapeHtml(tool.description)} Calcul local, source datée et exports privés.">
  <link rel="canonical" href="https://afrotools.com${tool.route}">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com${tool.route}">
  <link rel="alternate" hreflang="en" href="https://afrotools.com${tool.englishRoute}">
${tool.swahiliRoute ? `  <link rel="alternate" hreflang="sw" href="https://afrotools.com${tool.swahiliRoute}">\n` : ""}
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com${tool.englishRoute}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${escapeHtml(tool.title)} — AfroTools">
  <meta property="og:description" content="${escapeHtml(tool.description)}">
  <meta property="og:url" content="https://afrotools.com${tool.route}">
  <meta property="og:image" content="https://afrotools.com${tool.image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(tool.title)} — AfroTools">
  <meta name="twitter:description" content="${escapeHtml(tool.description)}">
  <meta name="twitter:image" content="https://afrotools.com${tool.image}">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <link rel="stylesheet" href="/assets/css/fr-hr-payroll-parity.css">
  <script type="application/ld+json">${jsonLd(tool)}</script>
  <script>window.AfroDisableAssistant = true;</script>
  <script src="/assets/js/components/tool-registry.js"></script>
  <script src="/assets/js/components/navbar.min.js?v=fe9a88b7" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/assets/vendor/jspdf/jspdf.umd.min.js" defer></script>
  <script src="/assets/js/engines/fr-hr-payroll-parity.js" defer></script>
  <script src="/assets/js/pages/fr-hr-payroll-parity.js" defer></script>
</head>
<body>
  <!-- Generated by scripts/build-french-hr-payroll-parity.js from data/localization/fr-hr-payroll-parity.json. -->
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  <afro-navbar></afro-navbar>
  <main id="contenu" class="fr-hr-shell">
    <nav class="fr-hr-breadcrumb" aria-label="Fil d'Ariane"><a href="/fr/">Accueil</a> · <a href="/fr/hr-payroll/">RH et paie</a> · <span aria-current="page">${escapeHtml(tool.shortTitle)}</span></nav>
    <header class="fr-hr-hero">
      <div>
        <h1>${escapeHtml(tool.title)}</h1>
        <p>${escapeHtml(tool.description)}</p>
        <div class="fr-hr-badges" aria-label="Caractéristiques"><span class="fr-hr-badge">Calcul local</span><span class="fr-hr-badge">Aucune donnée nominative</span><span class="fr-hr-badge">Source datée obligatoire</span></div>
      </div>
      <img src="${tool.image}" width="640" height="360" alt="" loading="eager">
    </header>

    <section class="fr-hr-notice" data-ai-consent-notice data-consent-mode="browser_local_only" data-tool-id="${tool.id}">
      <h2>Privé par défaut, sans IA</h2>
      <p>Les montants et hypothèses restent dans ce navigateur. Cette page n'envoie rien à un modèle, à un serveur ou à un compte. Toute future aide IA exigerait un consentement explicite et conserverait ce calcul local comme solution de repli.</p>
    </section>

    <section class="fr-hr-source" aria-labelledby="source-guide">
      <h2 id="source-guide">Avant de calculer : vérifiez la règle applicable</h2>
      <p>L'outil ne fournit aucun taux légal. Consultez une autorité du travail, un texte officiel ou un professionnel compétent pour votre juridiction. Le répertoire <a href="https://natlex.ilo.org/" rel="noopener noreferrer">NATLEX de l'OIT</a> peut aider à retrouver des textes, sans garantir leur applicabilité à votre situation. Méthode revue le ${escapeHtml(manifest.reviewedAt)}.</p>
    </section>

    <div class="fr-hr-workspace">
      <section class="fr-hr-card" aria-labelledby="form-title">
        <h2 id="form-title">Hypothèses de calcul</h2>
        <p>Utilisez uniquement des montants agrégés. Ne saisissez ni nom, ni adresse, ni identifiant personnel.</p>
        <div id="fr-hr-payroll-errors" class="fr-hr-errors" role="alert" tabindex="-1" hidden></div>
        <form id="fr-hr-payroll-form" novalidate>
          <div class="fr-hr-grid">
            <div class="fr-hr-field"><label for="fr-hr-jurisdiction">Pays ou juridiction applicable</label><input id="fr-hr-jurisdiction" name="jurisdiction" autocomplete="off" required placeholder="Ex. Sénégal"></div>
            ${sharedInputHtml(tool, "currency", "Code ou symbole monétaire", "XOF")}
            ${tool.fields.map((field) => inputHtml(tool, field)).join("\n            ")}
            ${sharedInputHtml(tool, "sourceLabel", "Source officielle ou professionnelle consultée", "", "Titre du texte ou organisme")}
            ${inputHtml(tool, ["sourceDate", "Date de la source ou de sa vérification", "date", ""])}
          </div>
          <div class="fr-hr-actions">
            <button class="btn btn-primary" type="submit">Calculer l'estimation</button>
            <button class="btn btn-secondary" id="fr-hr-payroll-reset" type="button">Réinitialiser</button>
          </div>
        </form>
        <p id="fr-hr-payroll-status" class="fr-hr-status" role="status" aria-live="polite">Aucune donnée n'a été enregistrée.</p>
      </section>

      <section id="fr-hr-payroll-result" class="fr-hr-card fr-hr-result" tabindex="-1" aria-labelledby="result-title" hidden>
        <h2 id="result-title">Estimation de planification</h2>
        <table><tbody id="fr-hr-payroll-result-body"></tbody></table>
        <div id="fr-hr-payroll-workflow" class="fr-hr-workflow" hidden></div>
        <dl class="fr-hr-evidence">
          <dt>Source utilisée</dt><dd id="fr-hr-payroll-source-used"></dd>
          <dt>Fraîcheur</dt><dd id="fr-hr-payroll-freshness"></dd>
          <dt>Niveau de confiance</dt><dd id="fr-hr-payroll-confidence"></dd>
        </dl>
        <p><strong>Limite :</strong> résultat arithmétique basé sur vos hypothèses. Ce n'est ni un calcul officiel, ni un dépôt, ni un conseil juridique, fiscal ou social.</p>
        <div class="fr-hr-actions" aria-label="Exporter le résultat actuel">
          <button class="btn btn-secondary" type="button" data-export="copy" disabled>Copier</button>
          <button class="btn btn-secondary" type="button" data-export="txt" disabled>Télécharger TXT</button>
          <button class="btn btn-secondary" type="button" data-export="json" disabled>Enregistrer JSON</button>
          <button class="btn btn-secondary" type="button" data-export="pdf" disabled>Télécharger PDF</button>
          <button class="btn btn-secondary" id="fr-hr-payroll-open" type="button">Rouvrir un JSON</button>
          <input id="fr-hr-payroll-import" type="file" accept="application/json,.json" hidden>
        </div>
      </section>
    </div>

    <section class="fr-hr-source" aria-labelledby="method-title">
      <h2 id="method-title">Méthode, fraîcheur et confiance</h2>
      <p>La formule reproduit le contrat arithmétique de la version anglaise, sans modifier son moteur. La confiance ne dépasse jamais « moyenne » : elle indique seulement la récence de la source que vous avez saisie, pas sa validité juridique. Une source de plus de 90 jours est signalée comme ancienne.</p>
    </section>
  </main>
  <afro-footer></afro-footer>
  <script id="fr-hr-payroll-config" type="application/json">${config}</script>
</body>
</html>
`;
}

function hubHtml() {
  const cards = manifest.tools.map((tool) => `<a class="fr-hr-tool-card" href="${tool.route}" data-source-id="${tool.id}">
      <img src="${tool.image}" width="640" height="360" alt="" loading="lazy">
      <div><h2>${escapeHtml(tool.shortTitle)}</h2><p>${escapeHtml(tool.description)}</p></div>
      <strong>Ouvrir l'outil →</strong>
    </a>`).join("\n    ");
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Outils RH et paie en français",
    description: "Six outils RH et paie locaux, privés et sourcés.",
    url: "https://afrotools.com/fr/hr-payroll/",
    inLanguage: "fr",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: manifest.tools.length,
      itemListElement: manifest.tools.map((tool, index) => ({
        "@type": "ListItem", position: index + 1, name: tool.shortTitle, url: "https://afrotools.com" + tool.route
      }))
    }
  }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="fr" data-theme-choice="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-content-id" content="fr-hr-payroll-parity:hub">
  <meta name="afrotools-source-owner" content="scripts/build-french-hr-payroll-parity.js">
  <title>Outils RH et paie en français — AfroTools</title>
  <meta name="description" content="Six outils RH et paie en français : calculs locaux, hypothèses explicites, sources datées et exports privés.">
  <link rel="canonical" href="https://afrotools.com/fr/hr-payroll/">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/hr-payroll/">
  <link rel="alternate" hreflang="en" href="https://afrotools.com/hr-payroll/">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/hr-payroll/">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="Outils RH et paie en français — AfroTools">
  <meta property="og:description" content="Six workflows locaux pour budgéter l'emploi, le congé et les indemnités avec vos propres sources.">
  <meta property="og:url" content="https://afrotools.com/fr/hr-payroll/">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/employee-cost.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://afrotools.com/assets/img/tools/employee-cost.webp">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <link rel="stylesheet" href="/assets/css/fr-hr-payroll-parity.css">
  <script type="application/ld+json">${schema}</script>
  <script>window.AfroDisableAssistant = true;</script>
  <script src="/assets/js/components/tool-registry.js"></script>
  <script src="/assets/js/components/navbar.min.js?v=fe9a88b7" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
</head>
<body>
  <!-- Generated by scripts/build-french-hr-payroll-parity.js from data/localization/fr-hr-payroll-parity.json. -->
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  <afro-navbar></afro-navbar>
  <main id="contenu" class="fr-hr-shell">
    <nav class="fr-hr-breadcrumb" aria-label="Fil d'Ariane"><a href="/fr/">Accueil</a> · <span aria-current="page">RH et paie</span></nav>
    <header class="fr-hr-hero"><div><h1>Outils RH et paie en français</h1><p>Six workflows natifs pour comparer les coûts, construire un budget employeur et documenter des estimations de congé ou d'indemnité. Aucun taux légal n'est inventé : vous choisissez la juridiction et fournissez la source datée.</p><div class="fr-hr-badges"><span class="fr-hr-badge">6 outils canoniques</span><span class="fr-hr-badge">Traitement local</span><span class="fr-hr-badge">Exports privés</span></div></div><img src="/assets/img/tools/employee-cost.webp" width="640" height="360" alt="" loading="eager"></header>
    <section class="fr-hr-notice"><h2>Un espace de planification, pas un service de paie</h2><p>Ces outils n'établissent aucune fiche de paie, déclaration ou décision de statut. Ils ne demandent aucune identité et ne transmettent pas vos montants. Vérifiez toujours les règles auprès d'une source officielle ou d'un professionnel compétent.</p></section>
    <div class="fr-hr-hub-grid" id="fr-hr-payroll-grid">${cards}</div>
    <section class="fr-hr-source"><h2>Comment obtenir une estimation défendable</h2><p>Choisissez l'outil, utilisez une juridiction précise, saisissez uniquement les taux ou durées que vous avez vérifiés, puis conservez le JSON avec la source et sa date. La fraîcheur affichée mesure la récence de votre preuve, pas sa valeur juridique.</p></section>
  </main>
  <afro-footer></afro-footer>
</body>
</html>
`;
}

const outputs = [
  [fileForRoute(manifest.hubRoute), hubHtml()],
  ...manifest.tools.map((tool) => [fileForRoute(tool.route), pageHtml(tool)])
];
const selectedOutputs = process.argv.includes("--hub-only") ? outputs.slice(0, 1) : outputs;

let failed = false;
for (const [file, content] of selectedOutputs) {
  if (check) {
    if (
      !fs.existsSync(file)
      || normalizeGeneratedHtml(fs.readFileSync(file, "utf8"))
        !== normalizeGeneratedHtml(content)
    ) {
      console.error("OUT OF DATE " + path.relative(ROOT, file));
      failed = true;
    }
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, "utf8");
    console.log("WROTE " + path.relative(ROOT, file));
  }
}

if (failed) process.exitCode = 1;
else console.log(`French HR & Payroll parity ${check ? "verified" : "built"}: ${manifest.tools.length}/6 apps plus hub.`);
