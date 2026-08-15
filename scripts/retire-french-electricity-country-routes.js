#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FAMILIES = [
  { slug: 'tarifs-electricite', label: "tarif d’électricité" },
  { slug: 'compteur-prepaye', label: 'unités de compteur prépayé' }
];

function bridge(family, countrySlug) {
  const canonical = `https://afrotools.com/fr/tools/${family.slug}/${countrySlug}/`;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Calcul ${family.label} — page pays déplacée | AfroTools</title>
<meta name="description" content="Utilisez le calculateur canonique AfroTools pour convertir un montant en unités prépayées ou des kWh en facture avec une source et une date visibles.">
<meta name="robots" content="noindex,follow">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/design-system.min.css"><link rel="stylesheet" href="/assets/css/energy.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
</head>
<body>
<afro-navbar theme="dark" active="energy"></afro-navbar>
<main class="en-main"><section class="en-hub"><div class="container">
<nav class="breadcrumb" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> <span>›</span> <a href="/fr/energy/">Énergie</a> <span>›</span> ${countrySlug.replace(/-/g, ' ')}</nav>
<h1>Estimation d’électricité — ${countrySlug.replace(/-/g, ' ')}</h1>
<p>Cette ancienne page pays utilisait une moyenne nationale de planification. Elle a été retirée afin qu’un tarif ancien ou attribué au mauvais fournisseur ne paraisse pas actuel.</p>
<p>Le calculateur principal exige un fournisseur, une catégorie et une source à jour. En l’absence de données vérifiées, il propose un tarif personnalisé qui reste dans le navigateur.</p>
<p><a class="en-btn" href="/fr/tools/${family.slug}/">Ouvrir le calculateur principal</a></p>
</div></section></main>
<afro-footer></afro-footer>
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

const frenchPrepaidRoot = path.join(ROOT, 'fr', 'tools', 'compteur-prepaye', 'index.html');
if (fs.existsSync(frenchPrepaidRoot)) {
  fs.writeFileSync(frenchPrepaidRoot, `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Calculateur compteur prépayé déplacé | AfroTools</title><meta name="description" content="Le calcul des unités prépayées fait maintenant partie du calculateur canonique des coûts d’électricité."><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://afrotools.com/fr/tools/compteur-prepaye/"><link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/energy.css"><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script></head><body><afro-navbar theme="dark" active="energy"></afro-navbar><main class="en-main"><section class="en-hub"><div class="container"><h1>Calculateur compteur prépayé</h1><p>Le calcul montant → unités et kWh → facture appartient désormais à une seule page canonique avec source et fraîcheur visibles.</p><p><a class="en-btn" href="/fr/tools/tarifs-electricite/">Ouvrir le calculateur d’électricité</a></p></div></section></main><afro-footer></afro-footer></body></html>`, 'utf8');
  written += 1;
}

const swahiliPrepaidRoot = path.join(ROOT, 'sw', 'zana', 'kikokotoo-luku-ya-umeme', 'index.html');
if (fs.existsSync(swahiliPrepaidRoot)) {
  fs.writeFileSync(swahiliPrepaidRoot, `<!doctype html><html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kikokotoo cha umeme wa kulipia kabla kimehamishwa | AfroTools</title><meta name="description" content="Hesabu ya uniti za kulipia kabla sasa iko ndani ya kikokotoo kimoja cha gharama za umeme."><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://afrotools.com/sw/zana/kikokotoo-luku-ya-umeme/"><link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/energy.css"><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script></head><body><afro-navbar theme="dark" active="energy"></afro-navbar><main class="en-main"><section class="en-hub"><div class="container"><h1>Kikokotoo cha umeme wa kulipia kabla</h1><p>Hesabu ya fedha kwenda uniti na uniti kwenda bili sasa inamilikiwa na ukurasa mmoja wenye chanzo na tarehe ya uhakiki.</p><p><a class="en-btn" href="/sw/zana/kikokotoo-tariff-ya-umeme/">Fungua kikokotoo cha gharama ya umeme</a></p></div></section></main><afro-footer></afro-footer></body></html>`, 'utf8');
  written += 1;
}

console.log(`Retired ${written} localized electricity compatibility routes as noindex pages.`);
