#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  analyticsVersion,
  bootstrapVersion,
  canonicalLoaderTag,
  earlyBootstrapTag,
} = require('./inject-analytics-loader');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
const COUNTRIES = require('../data/registry/countries.json');
const ANALYTICS_LOADER = canonicalLoaderTag(analyticsVersion());
const ANALYTICS_BOOTSTRAP = earlyBootstrapTag(bootstrapVersion(), analyticsVersion());
const FRENCH_COUNTRY_NAMES = new Map(
  COUNTRIES.map((country) => [country.routeSlug, country.displayNames?.fr || country.title])
);
const FAMILIES = [
  { slug: 'tarifs-electricite', label: "tarif d’électricité" },
  { slug: 'compteur-prepaye', label: 'unités de compteur prépayé' }
];

function bridge(family, countrySlug) {
  const canonical = `https://afrotools.com/fr/tools/${family.slug}/`;
  const countryName = FRENCH_COUNTRY_NAMES.get(countrySlug) || countrySlug.replace(/-/g, ' ');
  return `<!doctype html>
<html lang="fr">
<head>
${ANALYTICS_BOOTSTRAP}
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Calcul ${family.label} — page pays déplacée | AfroTools</title>
<meta name="description" content="Utilisez le calculateur canonique AfroTools pour convertir un montant en unités prépayées ou des kWh en facture avec une source et une date visibles.">
<meta name="robots" content="noindex,follow">
<meta name="afrotools-locale-coverage" content="deprecated">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/design-system.min.css"><link rel="stylesheet" href="/assets/css/energy.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
</head>
<body>
<afro-navbar theme="dark" active="energy"></afro-navbar>
<main class="en-main"><section class="en-hub"><div class="container">
<nav class="breadcrumb" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> <span>›</span> <a href="/fr/energy/">Énergie</a> <span>›</span> ${countryName}</nav>
<h1>Estimation d’électricité — ${countryName}</h1>
<p>Cette ancienne page pays utilisait une moyenne nationale de planification. Elle a été retirée afin qu’un tarif ancien ou attribué au mauvais fournisseur ne paraisse pas actuel.</p>
<p>Le calculateur principal exige un fournisseur, une catégorie et une source à jour. En l’absence de données vérifiées, il propose un tarif personnalisé qui reste dans le navigateur.</p>
<p><a class="en-btn" href="/fr/tools/${family.slug}/">Ouvrir le calculateur principal</a></p>
</div></section></main>
<afro-footer></afro-footer>
${ANALYTICS_LOADER}
</body>
</html>`;
}

let written = 0;
for (const family of FAMILIES) {
  const directory = path.join(ROOT, 'fr', 'tools', family.slug);
  if (!fs.existsSync(directory)) continue;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(directory, entry.name, 'index.html');
    if (!fs.existsSync(file)) continue;
    fs.writeFileSync(file, bridge(family, entry.name), 'utf8');
    written += 1;
  }
}

const registryBefore = fs.readFileSync(REGISTRY_PATH, 'utf8');
const retiredRegistryRow = /^\s*\{ id: '(?:tarifs-electricite|compteur-prepaye)-[^']+-fr',[^\r\n]*\}\s*,?\r?\n/gm;
const registryAfter = registryBefore.replace(retiredRegistryRow, '');
const removedRegistryRows = (registryBefore.match(retiredRegistryRow) || []).length;
if (registryAfter !== registryBefore) fs.writeFileSync(REGISTRY_PATH, registryAfter, 'utf8');

console.log(`Retired ${written} localized electricity compatibility routes as noindex pages.`);
console.log(`Removed ${removedRegistryRows} retired country bridges from the live tool registry.`);
