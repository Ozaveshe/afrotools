#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const CHECK = process.argv.includes('--check') || !WRITE;
const changed = [];
const failures = [];
const POST_PROCESSED_HTML = new Set([
  'fr/index.html',
  'fr/privacy/index.html',
  'fr/terms-of-use/index.html',
  'fr/terms/index.html',
  'fr/blog/index.html'
]);

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function output(rel, value) {
  const file = path.join(ROOT, rel);
  let normalized = value.normalize('NFC').replace(/\r\n/g, '\n');
  if (rel === 'fr/blog/index.html' && !/name="content-language"/i.test(normalized)) {
    normalized = normalized.replace('<meta charset="utf-8">', '<meta charset="utf-8"><meta name="content-language" content="fr">');
  }
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : '';
  if (!WRITE && rel === 'fr/tools/ng-pension/index.html') {
    const validNativePension = /id="frPensionForm"/.test(current)
      && /NgPensionEngine\.calculateCPS/.test(current)
      && /id="frPensionResult"/.test(current)
      && !/<iframe/i.test(current);
    if (validNativePension) return;
  }
  if (POST_PROCESSED_HTML.has(rel)) {
    const sourceHash = crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
    const contentId = `fr-surface:${rel.replace(/\/index\.html$|\.html$/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`;
    normalized = normalized.replace('<head>', `<head><meta name="afrotools-source-hash" content="${sourceHash}"><meta name="afrotools-content-id" content="${contentId}"><meta name="afrotools-source-owner" content="scripts/build-french-product-surface.js">`);
    if (!WRITE && current.includes(`name="afrotools-source-hash" content="${sourceHash}"`)) return;
  }
  if (current === normalized) return;
  if (WRITE) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, normalized, 'utf8');
    changed.push(rel);
  } else failures.push(`${rel}: generated French product surface is stale`);
}

function repair(rel, transforms) {
  let html = read(rel);
  for (const [from, to] of transforms) html = html.split(from).join(to);
  output(rel, html);
}

function repairNativePensionPage() {
  const rel = 'fr/tools/ng-pension/index.html';
  let html = read(rel);
  const nativeTool = `<section class="fr-card fr-tool-frame" aria-labelledby="pensionToolTitle">
    <div class="fr-card-pad"><h2 class="fr-title" id="pensionToolTitle">Estimer les cotisations de pension CPS</h2><p class="fr-copy">Saisissez les éléments mensuels de rémunération pris en compte et vérifiez les taux avant le calcul.</p>
      <form id="frPensionForm" class="fr-pension-form">
        <label>Salaire de base mensuel (NGN)<input id="frPenBasic" type="number" min="0" step="1000" value="300000" required></label>
        <label>Indemnité logement mensuelle (NGN)<input id="frPenHousing" type="number" min="0" step="1000" value="100000"></label>
        <label>Indemnité transport mensuelle (NGN)<input id="frPenTransport" type="number" min="0" step="1000" value="50000"></label>
        <label>Autres éléments pensionnables (NGN)<input id="frPenOther" type="number" min="0" step="1000" value="0"></label>
        <label>Taux salarié (%)<input id="frPenEmployee" type="number" min="0" max="100" step="0.1" value="8" required></label>
        <label>Taux employeur (%)<input id="frPenEmployer" type="number" min="0" max="100" step="0.1" value="10" required></label>
        <label>Âge actuel<input id="frPenAge" type="number" min="18" max="79" value="35" required></label>
        <label>Âge de départ prévu<input id="frPenRetire" type="number" min="19" max="80" value="60" required></label>
        <label>Rendement annuel estimé (%)<input id="frPenReturn" type="number" min="0" max="30" step="0.1" value="8" required></label>
        <button type="submit">Calculer la projection</button>
      </form>
      <p id="frPensionError" class="fr-pension-error" role="alert" hidden></p>
      <section id="frPensionResult" class="fr-pension-result" aria-live="polite" hidden><h3>Résultat estimatif</h3><dl><div><dt>Rémunération pensionnable</dt><dd id="frPenEmoluments"></dd></div><div><dt>Cotisation mensuelle du salarié</dt><dd id="frPenEmployeeResult"></dd></div><div><dt>Cotisation mensuelle de l’employeur</dt><dd id="frPenEmployerResult"></dd></div><div><dt>Total mensuel</dt><dd id="frPenTotal"></dd></div><div><dt>Solde projeté au départ</dt><dd id="frPenProjected"></dd></div><div><dt>Capital de 25 % indicatif</dt><dd id="frPenLump"></dd></div></dl><p>Estimation de planification fondée sur les valeurs saisies. Vérifiez les éléments pensionnables, les taux et les règles de retrait auprès de PenCom et de votre PFA.</p></section>
    </div></section>`;
  html = html.replace(/<section class="fr-card fr-tool-frame"[\s\S]*?<\/section>/, nativeTool);
  if (!/fr-pension-form/.test(html.slice(0, html.indexOf('</head>')))) {
    html = html.replace('</head>', `<style>.fr-pension-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}.fr-pension-form label{display:grid;gap:6px;font-weight:700;color:#334155}.fr-pension-form input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #cbd5e1;border-radius:10px;font:inherit}.fr-pension-form button{grid-column:1/-1;padding:13px 16px;border:0;border-radius:10px;background:#0062cc;color:#fff;font-weight:800;cursor:pointer}.fr-pension-error{color:#b42318;background:#fff1f0;padding:12px;border-radius:10px}.fr-pension-result{margin-top:20px;padding:18px;border:1px solid #b8d5f2;border-radius:14px;background:#f4f9ff}.fr-pension-result dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.fr-pension-result dl div{padding:10px;background:#fff;border-radius:10px}.fr-pension-result dt{color:#64748b}.fr-pension-result dd{margin:5px 0 0;font-weight:900}@media(max-width:680px){.fr-pension-form,.fr-pension-result dl{grid-template-columns:1fr}}</style></head>`);
  }
  if (!/id="frPensionRuntime"/.test(html)) {
    html = html.replace('</body>', `<script src="/engines/ng-pension-engine.js"></script><script id="frPensionRuntime">(function(){var form=document.getElementById('frPensionForm');if(!form)return;var n=function(id){return Number(document.getElementById(id).value||0)};var money=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'NGN',maximumFractionDigits:0});form.addEventListener('submit',function(event){event.preventDefault();var error=document.getElementById('frPensionError'),result=document.getElementById('frPensionResult'),age=n('frPenAge'),retire=n('frPenRetire');error.hidden=true;if(!window.NgPensionEngine){error.textContent='Le moteur de calcul n’est pas disponible. Réessayez après avoir rechargé la page.';error.hidden=false;result.hidden=true;return}if(age<18||retire<=age){error.textContent='L’âge de départ doit être supérieur à l’âge actuel.';error.hidden=false;result.hidden=true;return}var r=window.NgPensionEngine.calculateCPS(n('frPenBasic'),n('frPenHousing'),n('frPenTransport'),n('frPenOther'),n('frPenEmployee'),n('frPenEmployer'),age,retire,n('frPenReturn'));[['frPenEmoluments',r.emoluments],['frPenEmployeeResult',r.empContrib],['frPenEmployerResult',r.erContrib],['frPenTotal',r.totalMonthly],['frPenProjected',r.projected],['frPenLump',r.lumpSum25]].forEach(function(pair){document.getElementById(pair[0]).textContent=money.format(pair[1])});result.hidden=false});})();</script></body>`);
  }
  output(rel, html);
}

const shared = [
  ['version source', 'calculateur de référence'],
  ['Version source', 'Calculateur de référence'],
  ['Route française canonique', 'Cette adresse a changé'],
  ['Cette ancienne adresse reste disponible comme alias et redirige vers la page française préférée.', 'Vous allez être redirigé vers la page française actuelle.'],
  ['Cette ancienne adresse reste disponible comme alias et redirige vers le hub RDC.', 'Vous allez être redirigé vers la page actuelle de la RDC.'],
  ['Cette ancienne adresse reste disponible comme alias et redirige vers le calculateur salaire net Cap-Vert.', 'Vous allez être redirigé vers le calculateur actuel de salaire net du Cap-Vert.'],
  ['Cette ancienne adresse reste disponible comme alias et redirige vers le calculateur TVA Cap-Vert.', 'Vous allez être redirigé vers le calculateur actuel de TVA du Cap-Vert.'],
  ['Cette ancienne adresse reste disponible comme alias et redirige vers le calculateur salaire net Guinée équatoriale.', 'Vous allez être redirigé vers le calculateur actuel de salaire net de la Guinée équatoriale.'],
  ['Cette ancienne adresse reste disponible comme alias et redirige vers le calculateur TVA Guinée équatoriale.', 'Vous allez être redirigé vers le calculateur actuel de TVA de la Guinée équatoriale.'],
  ['Choisissez un pays. Quand une route française canonique existe, cette page pointe vers elle plutôt que vers un ancien alias.', 'Choisissez un pays pour ouvrir la page française actuelle et accéder aux outils disponibles.'],
  ["Méthodologie: renseignez le pays, le montant et l'objectif; la page transforme ces entrees en résumé de vérification avant d'utiliser l'outil principal. Sources: version source AfroTools, liens et hypothèses visibles sur cette page. Mise à jour 2026.", "Méthodologie : renseignez le pays, le montant et l’objectif. La page prépare un résumé à vérifier avant d’utiliser le calculateur. Sources : hypothèses et liens de référence affichés sur cette page. Mise à jour 2026."],
  ['Nous préparons le module interactif de rénovation. S\'il met trop longtemps à apparaître, vous pourrez ouvrir la version source anglaise en un clic.', 'Nous préparons le module interactif de rénovation. S’il met trop longtemps à apparaître, vous pourrez ouvrir le calculateur complet en anglais après en avoir été informé.'],
  ['Le moteur de calcul charge ci-dessous reste synchronise avec la version source AfroTools pour conserver les regles les plus récentes. La présentation, les reperes et les principaux textes visibles sont adaptés en français.', 'Le calculateur ci-dessous utilise les règles et hypothèses indiquées sur la page. La présentation, les repères et les principaux textes visibles sont adaptés en français.'],
  ['Export: copiez ou téléchargez le brief, puis utilisez la version source pour produire le PDF si vous avez besoin d\'une mise en page document.', 'Export : copiez ou téléchargez le résumé, puis ouvrez le générateur complet pour produire le PDF si vous avez besoin d’une mise en page document.'],
  ['Le brief retraite ci-dessus reste local. Ouvrez la version source pour utiliser le calculateur FIRE complet, puis gardez votre résumé TXT pour vérifier les hypothèses.', 'Le résumé retraite ci-dessus reste local. Ouvrez le calculateur FIRE complet, puis conservez le fichier TXT pour vérifier les hypothèses.'],
  ['Moteur source conservé', 'Calculateur et hypothèses documentés'],
  ['Moteur source localisé', 'Calculateur et hypothèses documentés'],
  ['Moteur de revenu localisé', 'Estimer le revenu net'],
  ['Moteur de négociation localise', 'Préparer une négociation salariale'],
  ['Version française premium', 'Calculateur en français'],
  ['version française premium', 'version française'],
  ['interface française premium', 'interface française'],
  ["Une page premium pour suivre votre CPS, comparer les PFA, simuler l'AVC et relier votre retraite au salaire net. Le moteur source reste fidèle à l'outil anglais, tandis que l'expérience visible est entièrement francisée.", "Suivez votre CPS, comparez les PFA, simulez l’AVC et rapprochez votre projection de retraite du salaire net. Les règles et hypothèses utilisées restent celles indiquées par le calculateur."],
  ['SEO plus propre', 'Navigation mieux structurée'],
  ["Chaque sous-catégorie garde une intention claire pour la recherche, sans multiplier les pages vides ni les doublons sur les mêmes URLs.", "Chaque sous-catégorie correspond à un besoin clair, sans pages vides ni parcours en double."],
  ["Quand de nouveaux outils français arrivent, ils se rangent dans la bonne sous-catégorie sans casser l'entrée produit ni la structure SEO.", "Les nouveaux outils sont ajoutés à la catégorie qui correspond au besoin de l’utilisateur."],
  ['Canonical, hreflang et données structurées propres.', 'Sources, date de mise à jour et limites faciles à retrouver.'],
  ['Canonical, hreflang, schéma, breadcrumbs et texte éditorial sont pensés pour le français.', 'La navigation, les sources et les explications sont présentées en français.'],
  ['Le moteur de calcul reste aligné sur la source anglaise, mais la présentation, les libellés, le SEO et les actions de résultat sont adaptés en français pour une expérience plus nette et plus crédible.', 'Le calcul suit les mêmes règles vérifiées que l’outil de référence. Les libellés, explications et actions sont présentés en français.'],
  ["Une version française pensée pour le SEO francophone, avec un vrai shell local, les bons schémas et un rendu dynamique sans fuite visible d'anglais. ", 'Une interface française conçue pour aller directement au calcul. '],
  ["Le calculateur ci-dessous charge la source nigériane et applique une couche de localisation DOM pour réduire les fuites d'anglais dans les onglets, tableaux, alertes IA, boutons de partage et messages dynamiques.", "Le calculateur applique les règles nigérianes documentées. Les champs, résultats et messages d’état sont présentés en français."],
  ['<strong>Calculateur source</strong>', '<strong>Calculateur de pension</strong>'],
  ['<h2 class="fr-title">Moteur de pension localisé</h2>', '<h2 class="fr-title">Estimer les cotisations de pension</h2>'],
  ["Les libellés runtime, les alertes et les messages IA sont retranscrits après rendu.", "Les libellés, alertes et messages de résultat restent compréhensibles pendant le calcul."],
  ["Non. Le moteur reste la source anglaise, mais la couche française traduit les sorties visibles et les repères éditoriaux.", "Non. La version française conserve les mêmes règles de calcul et adapte uniquement la présentation et les explications."],
  ['<strong>SEO local</strong>', '<strong>Repères clairs</strong>'],
  ['<strong>Maillage fort</strong>', '<strong>Outils associés</strong>'],
  ['Le calculateur ci-dessous charge la version source et applique une couche de localisation DOM pour réduire les fuites d’anglais dans les libellés, les pays, les notes, les observations IA et les sorties dynamiques.', 'Le calculateur applique les hypothèses affichées et présente les libellés, notes et résultats en français.'],
  ['Le calculateur ci-dessous charge la source anglaise et applique une couche de localisation DOM pour réduire les fuites d\'anglais dans les libellés, les tableaux, les alertes dynamiques et les messages de résultat.', 'Le calculateur applique les hypothèses affichées et présente les libellés, tableaux, alertes et résultats en français.'],
  ['Le calculateur ci-dessous charge la source anglaise et applique une couche de localisation DOM pour réduire les fuites d\'anglais dans les menus, les résultats, le script de contre-offre et les messages dynamiques.', 'Le calculateur présente en français les options, résultats, arguments de négociation et messages d’état.'],
  ['SEO propre avec canonical, hreflang et schema FR.', 'Repères, sources et navigation adaptés à ce parcours.'],
  ["Parce que c'est la bonne architecture produit et SEO. Le visiteur comprend d'abord qu'il est dans la sous-categorie PAYE, puis il choisit son pays. C'est plus clair et plus scalable.", "Commencez par choisir le pays dont les règles s’appliquent. Vous pourrez ensuite vérifier le barème, les retenues et la date de la source avant le calcul."]
];

function allFrenchHtml(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...allFrenchHtml(file));
    else if (entry.name.endsWith('.html')) out.push(file);
  }
  return out;
}

for (const file of allFrenchHtml(path.join(ROOT, 'fr'))) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (POST_PROCESSED_HTML.has(rel)) continue;
  repair(rel, shared);
}
repairNativePensionPage();

const prepaidDir = path.join(ROOT, 'fr', 'tools', 'compteur-prepaye');
if (fs.existsSync(prepaidDir)) {
  const prepaidTransforms = [
    ["Calculer how many kWh units you get for your prepaid electricity token in ", "Estimez le nombre d’unités (kWh) obtenu pour une recharge d’électricité prépayée en "],
    [". Enter your recharge amount and see exactly how much power you receive.", ". Saisissez le montant de la recharge pour obtenir une estimation de l’énergie livrée."],
    ['aria-label="Breadcrumb"', 'aria-label="Fil d’Ariane"'],
    ['Find out how many electricity units (kWh) you receive for your prepaid token in ', 'Estimez le nombre d’unités d’électricité (kWh) reçues pour une recharge prépayée en '],
    ['. Calculer service charges and estimated days.', ', ainsi que les frais de service et la durée estimée.'],
    ['Calculer Prepaid Units', 'Calculer les unités prépayées'],
    ['Recharge Amount', 'Montant de la recharge'],
    ['placeholder="e.g. 5000"', 'placeholder="Ex. 5 000"'],
    ['Residential (Accueil)', 'Résidentiel (foyer)'],
    ['Commercial (entreprise)', 'Professionnel (entreprise)'],
    ['Units Received', 'Unités reçues'],
    ['Estimated days: —', 'Jours estimés : —'],
    ['<th>Item</th><th>Amount</th>', '<th>Élément</th><th>Montant</th>'],
    ['Energy Delivered', 'Énergie livrée'],
    ['Service Charge', 'Frais de service'],
    ['Price per kWh', 'Prix par kWh'],
    ['Estimated Days', 'Jours estimés'],
    [' — What You Need to Know', ' — ce qu’il faut vérifier'],
    ['Know exactly how many electricity units you receive when you recharge your prepaid meter in ', 'Estimez les unités d’électricité reçues lors d’une recharge de compteur prépayé en '],
    ['. Our calculator accounts for service charges and gives you the real kWh delivered per token, so you can budget smarter.', '. Le calcul tient compte des frais de service indiqués et fournit une estimation des kWh livrés pour mieux préparer votre budget.'],
    ['<strong>Disclaimer:</strong> These are planning estimates based on AfroTools dataset assumptions and available market context. Actual tariffs, fuel prices, battery prices, and installation costs may vary. Always verify current utility, regulator, installer, and vendor pricing before buying.', '<strong>Limites :</strong> il s’agit d’une estimation de planification fondée sur les hypothèses affichées. Vérifiez le tarif, les frais et les règles en vigueur auprès du fournisseur ou du régulateur avant toute décision.'],
    ['if(r.error){alert(r.error);return;}', 'if(r.error){var errors={"Country data not available.":"Les données de ce pays ne sont pas disponibles.","Please enter a valid recharge amount.":"Saisissez un montant de recharge valide."};alert(errors[r.error]||r.error);return;}'],
    ['document.getElementById("rDays").textContent="Estimated days: "+r.estimatedDays;', 'document.getElementById("rDays").textContent="Jours estimés : "+r.estimatedDays;'],
    ['window.AfroEnergyTools.renderObservations(obs,r.observations,"Notes de calcul");', 'var notes=r.observations.map(function(note){return note.replace("A larger token gives better value because the fixed service charge is spread across more units.","Une recharge plus élevée répartit les frais fixes sur davantage d’unités.").replace("This token may not last a full day at the selected consumption rate.","Cette recharge peut durer moins d’une journée selon la consommation choisie.");});window.AfroEnergyTools.renderObservations(obs,notes,"Notes de calcul");']
  ];
  for (const file of allFrenchHtml(prepaidDir)) repair(path.relative(ROOT, file).replace(/\\/g, '/'), prepaidTransforms);
  repair('fr/tools/compteur-prepaye/central-african-republic/index.html', [
    ['Central African Republic', 'République centrafricaine']
  ]);
}

const solarDir = path.join(ROOT, 'fr', 'tools', 'roi-solaire');
if (fs.existsSync(solarDir)) {
  const solarTransforms = [
    ['Installationationation', 'Installation'],
    ['Installationation', 'Installation'],
    ['peak sun hrs/day', 'heures de soleil utiles/jour'],
    ['peak sun hours/day', 'heures de soleil utiles par jour'],
    ['<div class="icon" aria-hidden="true">Save</div>', '<div class="icon" aria-hidden="true">Éco.</div>'],
    ['Retour solaire — Madagascar starts with grid bills, generator fuel, and outages.', 'Le retour solaire à Madagascar dépend de la facture réseau, du carburant du groupe électrogène et des coupures.'],
    ['Treat the output as a planning estimate, not a quote.', 'Considérez le résultat comme une estimation de planification, et non comme un devis.'],
    ['Use your MGA monthly bill, generator spend, outage hours, system size, battery choice, and finance terms.', 'Utilisez votre facture mensuelle en MGA, vos dépenses de carburant, les heures de coupure, la taille du système, le choix de batterie et les modalités de financement.'],
    ['This page starts with ', 'Cette page utilise comme valeurs initiales '],
    ['Replace each value with local data.', 'Remplacez chaque valeur par des données locales.'],
    ['Not always. A battery is mainly for backup and night-time essential loads, not cheaper solar by default.', 'Pas toujours. Une batterie sert surtout aux besoins essentiels pendant les coupures et la nuit ; elle ne réduit pas automatiquement le coût du solaire.'],
    ['If outages affect stock, safety, médical refrigeration, trading hours, or night power, compare no-battery solar with an essential-load battery using the ', 'Si les coupures affectent le stock, la sécurité, la réfrigération médicale, les horaires d’activité ou l’alimentation de nuit, comparez une installation sans batterie à une batterie réservée aux usages essentiels en utilisant la référence de '],
    [' planning band.', ' comme hypothèse de planification.'],
    ['Quotes in MGA change with panel wattage, inverter brand, battery chemistry, usable capacity, protection devices, mounting, wiring distance, roof work, labour, warranty, maintenance, and finance charges.', 'Les devis en MGA varient selon la puissance des panneaux, l’onduleur, la batterie, les protections, la pose, le câblage, la toiture, la main-d’œuvre, la garantie, la maintenance et le financement.'],
    ['Treat Ar 3,250,000/kW install cost and the Ar 3,250,000 battery band as planning defaults, not a price list.', 'Considérez le coût d’installation de 3 250 000 Ar/kW et la référence batterie de 3 250 000 Ar comme des hypothèses de planification, et non comme une liste de prix.'],
    ['<span class="solar-country-badge">Medium</span>', '<span class="solar-country-badge">Moyenne</span>'],
    ['Mar 1, 2026', '1er mars 2026'],
    ['"Solar yield"', '"Rendement solaire"'],
    ['"Saved in this browser. "', '"Enregistré dans ce navigateur. "'],
    ['"Prepared. "', '"Préparé. "'],
    ['"Opening an email draft you can review before sending."', '"Ouverture d’un brouillon d’e-mail à vérifier avant l’envoi."'],
    ['"Estimate saved in this browser. No account required."', '"Estimation enregistrée dans ce navigateur. Aucun compte requis."'],
    ['"Save was blocked by this browser. Use copy or download instead."', '"L’enregistrement a été bloqué par ce navigateur. Utilisez la copie ou le téléchargement."']
    ,['"Solar yield should be between 1 and 9 peak sun hours per day."', '"Le rendement solaire doit être compris entre 1 et 9 heures de soleil utiles par jour."']
  ];
  for (const file of allFrenchHtml(solarDir)) repair(path.relative(ROOT, file).replace(/\\/g, '/'), solarTransforms);
}

repair('fr/document-pdf/index.html', [
  ['hreflang="fr" href="https://afrotools.com/fr/docs/pdf-tools-hub"', 'hreflang="fr" href="https://afrotools.com/fr/document-pdf/"']
]);
repair('document-pdf/index.html', [
  ['hreflang="fr" href="https://afrotools.com/fr/docs/pdf-tools-hub"', 'hreflang="fr" href="https://afrotools.com/fr/document-pdf/"']
]);

repair('fr/tools/gh-wht/index.html', [
  ['.gh-mini ul{margin:8px 0 0;padding-left:20px}\n</style>\n.gh-seo,', '.gh-mini ul{margin:8px 0 0;padding-left:20px}\n.gh-seo,'],
  ['<h2>Ce que cette version améliore</h2>', '<h2>Avant de calculer</h2>'],
  ['<h2>Pourquoi c\'est utile</h2>', '<h2>Points de contrôle</h2>'],
  ['<li>Lecture naturelle pour un public francophone.</li>', '<li>Vérifiez la nature du paiement et le statut du bénéficiaire.</li>'],
  ['<li>Maillage interne utile dans le cluster fiscalité.</li>', '<li>Confirmez le taux auprès de la GRA pour la période concernée.</li>']
]);

function homePage() {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="content-language" content="fr">
<title>AfroTools en français — outils pratiques pour les marchés africains</title><meta name="description" content="Trouvez un calculateur, un outil PDF, un guide ou un parcours adapté à votre pays, avec sources, hypothèses et limites visibles.">
<link rel="canonical" href="https://afrotools.com/fr/"><link rel="alternate" hreflang="en" href="https://afrotools.com/"><link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/"><link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/"><link rel="alternate" hreflang="yo" href="https://afrotools.com/yo/"><link rel="alternate" hreflang="ha" href="https://afrotools.com/ha/"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/">
<link rel="stylesheet" href="/assets/css/design-system.css"><script src="/assets/js/data/registry-counts.js" defer></script><script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script>
<style>:root{--fr-blue:#0057b8;--fr-ink:#10233d;--fr-muted:#52647a;--fr-line:#dce5ef;--fr-soft:#f4f8fc}.fr-home{color:var(--fr-ink)}.fr-wrap{width:min(1120px,calc(100% - 32px));margin:auto}.fr-hero{padding:72px 0 56px;background:linear-gradient(145deg,#eef6ff,#fff 62%,#f3faf7)}.fr-eyebrow{font-size:.76rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--fr-blue)}.fr-hero h1{max-width:850px;margin:12px 0 18px;font-size:clamp(2.35rem,7vw,5rem);line-height:1.02;letter-spacing:-.045em}.fr-lead{max-width:760px;font-size:clamp(1rem,2vw,1.22rem);line-height:1.72;color:var(--fr-muted)}.fr-search{display:flex;gap:10px;max-width:720px;margin-top:28px}.fr-search label{position:absolute;clip:rect(0 0 0 0)}.fr-search input{flex:1;min-width:0;padding:15px 16px;border:1px solid #b9c9da;border-radius:12px;font:inherit}.fr-search button,.fr-btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 18px;border:0;border-radius:12px;background:var(--fr-blue);color:#fff;font-weight:800;text-decoration:none;cursor:pointer}.fr-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px}.fr-btn.alt{background:#fff;color:var(--fr-blue);border:1px solid #a9c5e6}.fr-counts{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:36px}.fr-count{padding:18px;border:1px solid var(--fr-line);border-radius:16px;background:#fff}.fr-count strong{display:block;font-size:1.65rem}.fr-count span{color:var(--fr-muted)}.fr-section{padding:64px 0}.fr-section.soft{background:var(--fr-soft)}.fr-section h2{margin:8px 0 12px;font-size:clamp(1.65rem,4vw,2.6rem)}.fr-intro{max-width:730px;color:var(--fr-muted);line-height:1.7}.fr-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:28px}.fr-card{display:block;padding:22px;border:1px solid var(--fr-line);border-radius:18px;background:#fff;color:inherit;text-decoration:none}.fr-card:hover{border-color:#8bb2db}.fr-card strong{display:block;font-size:1.08rem;margin-bottom:8px}.fr-card p{margin:0;color:var(--fr-muted);line-height:1.62}.fr-card em{display:block;margin-top:16px;color:var(--fr-blue);font-style:normal;font-weight:800}.fr-context{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:26px}.fr-panel{padding:24px;border:1px solid var(--fr-line);border-radius:18px;background:#fff}.fr-panel h3{margin-top:0}.fr-links{display:flex;flex-wrap:wrap;gap:9px}.fr-links a{padding:9px 12px;border-radius:999px;background:#edf4fb;color:#174d82;text-decoration:none;font-weight:700}.fr-notice{margin-top:20px;padding:16px 18px;border-left:4px solid #d88b00;background:#fff8e7;line-height:1.65}.fr-trust{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:26px}.fr-trust article{padding:20px;border-top:3px solid var(--fr-blue);background:#fff}.fr-trust p{color:var(--fr-muted);line-height:1.65}.fr-noscript{padding:14px 16px;background:#fff8e7;border:1px solid #ebcf91}.skip-link{position:absolute;left:-9999px}.skip-link:focus{left:12px;top:12px;z-index:9999;background:#fff;padding:10px}@media(max-width:760px){.fr-hero{padding-top:48px}.fr-search{flex-direction:column}.fr-counts{grid-template-columns:repeat(2,1fr)}.fr-grid,.fr-context,.fr-trust{grid-template-columns:1fr}.fr-card{min-height:0}}</style></head>
<body><a class="skip-link" href="#contenu">Aller au contenu</a><afro-navbar></afro-navbar><main id="contenu" class="fr-home">
<section class="fr-hero"><div class="fr-wrap"><p class="fr-eyebrow">AfroTools en français</p><h1>Le bon outil, pour le bon pays et la bonne décision.</h1><p class="fr-lead">Trouvez un calculateur, préparez un document ou vérifiez une hypothèse avec le contexte local utile. Les sources, la date des données et les limites sont indiquées lorsque le résultat dépend de règles qui évoluent.</p>
<form class="fr-search" action="/fr/all-tools/" method="get"><label for="frHomeSearch">Rechercher un outil</label><input id="frHomeSearch" name="q" type="search" placeholder="Ex. salaire net Sénégal, TVA Maroc, fusion PDF"><button type="submit">Rechercher</button></form>
<div class="fr-actions"><a class="fr-btn" href="/fr/all-tools/">Parcourir tous les outils</a><a class="fr-btn alt" href="/fr/countries/">Choisir un pays</a><a class="fr-btn alt" href="/fr/ai/">Utiliser l’assistant de recherche</a></div>
<div class="fr-counts" aria-label="Couverture AfroTools"><div class="fr-count"><strong data-registry-count="tools.live_experiences" data-count-format="plus">2 606+</strong><span>expériences d’outils en ligne</span></div><div class="fr-count"><strong data-registry-count="countries.published">54</strong><span>pays publiés</span></div><div class="fr-count"><strong data-registry-count="categories.published">32</strong><span>catégories publiées</span></div><div class="fr-count"><strong data-registry-count="languages.site_published">5</strong><span>langues lancées</span></div></div></div></section>
<noscript><div class="fr-wrap fr-noscript">JavaScript est désactivé. La recherche, les liens et les pages de calcul restent accessibles ; certaines fonctions de filtrage, de sauvegarde ou d’aperçu interactif ne seront pas disponibles.</div></noscript>
<section class="fr-section"><div class="fr-wrap"><p class="fr-eyebrow">Commencer par un besoin</p><h2>Des parcours directs, sans passer par l’IA</h2><p class="fr-intro">L’assistant peut accélérer la recherche, mais chaque famille reste accessible par une navigation classique.</p><div class="fr-grid">
<a class="fr-card" href="/fr/salary-tax/"><strong>Salaire, PAYE et retenues</strong><p>Choisissez le pays, vérifiez la période et estimez le salaire net à partir des règles affichées.</p><em>Ouvrir les outils salaire →</em></a>
<a class="fr-card" href="/fr/document-pdf/"><strong>PDF et documents</strong><p>Fusionnez, compressez, protégez ou préparez des documents avec les outils disponibles en français.</p><em>Ouvrir l’espace PDF →</em></a>
<a class="fr-card" href="/fr/vat-business-tax/"><strong>TVA et gestion d’entreprise</strong><p>Estimez TVA, marge, seuil de rentabilité et autres repères de gestion.</p><em>Explorer les outils entreprise →</em></a>
<a class="fr-card" href="/fr/energy/"><strong>Énergie et services</strong><p>Comparez recharge prépayée, consommation, carburant et projet solaire avec les hypothèses locales.</p><em>Explorer les outils énergie →</em></a>
<a class="fr-card" href="/fr/tools/generateur-factures/"><strong>Factures et exports</strong><p>Préparez une facture avec la devise et la TVA pertinentes, puis exportez-la.</p><em>Créer une facture →</em></a>
<a class="fr-card" href="/fr/blog/"><strong>Guides pratiques en français</strong><p>Lisez uniquement les articles dont la version française a été relue et reliée à un outil utile.</p><em>Lire les guides →</em></a></div></div></section>
<section class="fr-section soft"><div class="fr-wrap"><p class="fr-eyebrow">Pays et langue</p><h2>Deux choix distincts</h2><p class="fr-intro">Le pays change la juridiction, la devise, les unités ou les sources. La langue change l’interface et le contenu disponible. L’un ne modifie pas silencieusement l’autre.</p><div class="fr-context"><div class="fr-panel"><h3>Choisir un contexte pays</h3><div class="fr-links"><a href="/fr/senegal/">Sénégal</a><a href="/fr/cote-divoire/">Côte d’Ivoire</a><a href="/fr/cameroun/">Cameroun</a><a href="/fr/maroc/">Maroc</a><a href="/fr/rdc/">RDC</a><a href="/fr/countries/">Tous les pays</a></div></div><div class="fr-panel"><h3>Changer la langue de l’interface</h3><div class="fr-links"><a href="/">English</a><a href="/fr/" lang="fr" aria-current="page">Français</a><a href="/sw/" lang="sw">Kiswahili</a><a href="/yo/" lang="yo">Yorùbá</a><a href="/ha/" lang="ha">Hausa</a></div><p class="fr-notice">La couverture varie selon la page. Quand une version française n’existe pas, AfroTools doit annoncer le passage vers l’anglais avant la navigation.</p></div></div></div></section>
<section class="fr-section"><div class="fr-wrap"><p class="fr-eyebrow">Confiance</p><h2>Ce que le produit promet réellement</h2><div class="fr-trust"><article><h3>Calculs traçables</h3><p>Les résultats à enjeu reposent sur un moteur déterministe. La juridiction, la version de la formule, les hypothèses et les sources doivent pouvoir être vérifiées.</p></article><article><h3>Données prudentes</h3><p>Une donnée externe n’est qualifiée de « en direct » que si sa source, son horodatage et son état d’échec sont mesurables. Une donnée ancienne doit être signalée comme telle.</p></article><article><h3>Transfert de données annoncé</h3><p>Les calculs locaux restent dans le navigateur. Une fonction de compte, de paiement, d’analyse ou d’IA doit indiquer quand des données quittent l’appareil.</p></article></div><div class="fr-actions"><a class="fr-btn alt" href="/fr/privacy/">Lire la politique de confidentialité</a><a class="fr-btn alt" href="/fr/terms-of-use/">Lire les conditions d’utilisation</a><a class="fr-btn alt" href="/fr/contact/">Contacter AfroTools</a></div></div></section>
<section class="fr-section soft"><div class="fr-wrap"><p class="fr-eyebrow">Compte et fonctions Pro</p><h2>Utilisez d’abord l’outil dont vous avez besoin</h2><p class="fr-intro">Les fonctions essentielles sont accessibles sans abonnement payant. Un compte sert aux fonctions signalées de sauvegarde ou de synchronisation ; certaines capacités avancées peuvent relever d’une offre Pro.</p><p class="fr-notice"><strong>Langue du parcours :</strong> certaines étapes de compte, de tableau de bord ou de paiement peuvent encore s’ouvrir en anglais. Le lien conserve la destination prévue, mais vérifiez l’avertissement affiché avant de continuer.</p><div class="fr-actions"><a class="fr-btn" href="/fr/auth/?mode=login&amp;next=%2Ffr%2Fdashboard%2F">Se connecter</a><a class="fr-btn alt" href="/fr/pro/">Voir les offres Pro</a></div></div></section>
</main><afro-footer></afro-footer></body></html>\n`;
}

function termsPage() {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Conditions d’utilisation — AfroTools</title><meta name="description" content="Conditions d’utilisation d’AfroTools, limites des estimations et règles applicables aux comptes, fonctions payantes et outils assistés par IA.">
<link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css">
<script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script>
<link rel="canonical" href="https://afrotools.com/fr/terms-of-use/"><link rel="alternate" hreflang="en" href="https://afrotools.com/terms/"><link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/terms-of-use/"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/terms/">
<style>.legal-main{max-width:760px;margin:auto;padding:56px 20px 80px}.legal-main h1{font-size:clamp(2rem,6vw,3.2rem)}.legal-main h2{margin-top:2rem}.legal-main p,.legal-main li{line-height:1.75}.legal-note{padding:1rem 1.2rem;border:1px solid #f0c36d;background:#fff8e7;border-radius:12px}.meta{color:#64748b}</style></head>
<body class="top-level-page-ui-refresh"><afro-navbar></afro-navbar><main class="legal-main"><p class="meta">Document juridique · Mise à jour : mars 2026</p><h1>Conditions d’utilisation</h1>
<p class="legal-note"><strong>À retenir :</strong> les calculateurs et guides AfroTools fournissent des estimations à titre informatif. Ils ne remplacent pas l’avis d’une administration compétente ni celui d’un professionnel qualifié.</p>
<h2>1. Acceptation</h2><p>En utilisant AfroTools, vous acceptez les présentes conditions. Si vous ne les acceptez pas, n’utilisez pas le service.</p>
<h2>2. Calculs, sources et actualité</h2><p>Les résultats dépendent des données saisies, des hypothèses affichées, de la juridiction et de la version de la source indiquée. Les règles peuvent changer. Vérifiez les résultats importants auprès de l’autorité compétente ou d’un professionnel qualifié.</p>
<h2>3. Accès gratuit et fonctions payantes</h2><p>Les outils essentiels sont accessibles sans abonnement payant. Certaines fonctions de compte, synchronisation, export avancé, API ou produit Pro peuvent être payantes. La disponibilité et le prix applicables sont indiqués avant tout achat.</p>
<h2>4. Fonctions assistées par IA</h2><p>Lorsqu’une fonction envoie du contenu à un fournisseur d’IA, l’interface doit l’indiquer avant l’envoi. Une réponse générée peut être inexacte et ne doit pas fournir à elle seule un taux, une formule ou un conseil à fort enjeu lorsqu’un moteur déterministe et sourcé existe.</p>
<h2>5. Comptes et données</h2><p>Les fonctions qui restent dans le navigateur sont distinguées de celles qui synchronisent ou traitent des données sur un serveur. Vous êtes responsable de la sécurité de votre compte et des informations que vous choisissez d’enregistrer.</p>
<h2>6. Utilisation interdite</h2><ul><li>contourner les contrôles d’accès ou tenter d’accéder aux données d’un tiers ;</li><li>perturber le service ou l’utiliser à des fins illégales ;</li><li>réutiliser le contenu, les marques ou les moteurs d’AfroTools sans autorisation lorsque la loi l’exige.</li></ul>
<h2>7. Limitation de responsabilité</h2><p>Dans les limites permises par la loi, AfroTools ne garantit pas qu’une estimation conviendra à votre situation particulière et ne répond pas des décisions prises sans vérification appropriée.</p>
<h2>8. Modifications</h2><p>Ces conditions peuvent évoluer avec le produit ou la réglementation. La date de mise à jour affichée identifie la version publiée.</p>
<h2>9. Contact</h2><p>Pour toute question, écrivez à <a href="mailto:hello@afrotools.com">hello@afrotools.com</a>.</p></main><afro-footer></afro-footer></body></html>\n`;
}

function privacyPage() {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Politique de confidentialité — AfroTools</title><meta name="description" content="Politique de confidentialité AfroTools : calculs locaux, compte, IA, paiements, analyses, formulaires, conservation et droits."><link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css"><script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script><link rel="canonical" href="https://afrotools.com/fr/privacy/"><link rel="alternate" hreflang="en" href="https://afrotools.com/privacy/"><link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/privacy/"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/privacy/"><style>.privacy-main{max-width:820px;margin:auto;padding:56px 20px 80px}.privacy-main h1{font-size:clamp(2rem,6vw,3.2rem)}.privacy-main h2{margin-top:2.2rem}.privacy-main p,.privacy-main li{line-height:1.75}.privacy-main table{width:100%;border-collapse:collapse;margin:1rem 0}.privacy-main th,.privacy-main td{padding:10px;border:1px solid #dce5ef;text-align:left;vertical-align:top}.privacy-note{padding:1rem 1.2rem;border-left:4px solid #0062cc;background:#eef6ff}.meta{color:#64748b}@media(max-width:640px){.privacy-main table,.privacy-main tbody,.privacy-main tr,.privacy-main th,.privacy-main td{display:block}.privacy-main th{background:#f4f8fc}}</style></head><body class="top-level-page-ui-refresh"><afro-navbar></afro-navbar><main class="privacy-main"><p class="meta">Confidentialité · Mise à jour : mars 2026</p><h1>Politique de confidentialité</h1><p class="privacy-note"><strong>Résumé :</strong> les calculateurs locaux traitent leurs données dans votre navigateur. Les fonctions d’IA, de compte, de synchronisation, de paiement, d’analyse, de formulaire ou de traitement en ligne sont des flux distincts et doivent être signalées avant l’envoi concerné.</p>
<h2>1. Portée de cette politique</h2><p>Cette politique explique comment AfroTools traite les données liées au site, aux outils et aux fonctions de compte. Elle décrit le produit actuel ; elle ne constitue pas une certification de conformité juridique.</p>
<h2>2. Données et finalités par fonction</h2><table><thead><tr><th>Fonction</th><th>Données et traitement</th><th>Conservation ou contrôle</th></tr></thead><tbody><tr><td>Calculateur local</td><td>Les valeurs saisies et le résultat sont traités dans le navigateur.</td><td>Pas d’envoi au serveur pour ce calcul local. Un brouillon local peut rester sur l’appareil jusqu’à son effacement.</td></tr><tr><td>Outils PDF ou documents locaux</td><td>Le fichier reste dans le navigateur pour les opérations annoncées comme locales.</td><td>Pas de contenu de document dans les analyses. Toute future fonction cloud doit être annoncée avant l’envoi.</td></tr><tr><td>Assistant IA</td><td>Le texte de la demande et le contexte de parcours sélectionné peuvent être envoyés au fournisseur d’IA après l’avertissement affiché.</td><td>N’incluez pas d’identifiants ni de documents sensibles sauf si un parcours l’exige explicitement et que vous choisissez de continuer.</td></tr><tr><td>Compte et synchronisation</td><td>Supabase Auth gère l’authentification. Les services de compte peuvent stocker l’e-mail, le profil, la langue, le statut d’abonnement et les éléments que vous enregistrez.</td><td>Les données synchronisées ne sont pas supprimées par la simple déconnexion. Utilisez les contrôles du compte ou une demande de suppression.</td></tr><tr><td>Paiement</td><td>Les informations de carte sont saisies auprès du prestataire configuré. AfroTools reçoit les métadonnées de transaction et d’abonnement nécessaires au statut du produit.</td><td>Le prestataire applique ses propres obligations de conservation. AfroTools conserve les éléments nécessaires au suivi du droit d’accès et des opérations.</td></tr><tr><td>Mesure d’audience</td><td>Des données limitées sur la page, l’appareil, le pays, la session et les événements produit peuvent être traitées après le consentement d’analyse.</td><td>Les valeurs de calcul et le contenu des documents sont exclus par défaut. Les identifiants techniques du prestataire peuvent néanmoins exister.</td></tr><tr><td>Contact et newsletter</td><td>Le nom, l’e-mail et le message ou l’inscription sont transmis au prestataire du formulaire afin de répondre ou d’envoyer la communication demandée.</td><td>Vous pouvez vous désinscrire de la newsletter et demander la suppression des données éligibles.</td></tr></tbody></table>
<h2>3. Stockage dans le navigateur</h2><p>AfroTools peut utiliser le stockage du navigateur pour retenir le pays, la langue, le thème, le choix de consentement, les favoris, les brouillons ou les outils récents. Ces éléments restent sur l’appareil tant qu’une fonction de synchronisation n’est pas choisie. Vous pouvez les effacer avec les réglages du navigateur ou les contrôles proposés par l’outil.</p>
<h2>4. Prestataires</h2><ul><li><strong>Supabase</strong> : authentification, données de compte, espaces de travail ou coffre lorsque la fonction l’utilise ;</li><li><strong>Netlify</strong> : hébergement, fonctions et formulaires configurés ;</li><li><strong>Paystack ou Stripe</strong> : parcours de paiement configuré ;</li><li><strong>Google Analytics ou Microsoft Clarity</strong> : mesure limitée après consentement lorsque ces services sont configurés ;</li><li><strong>Anthropic ou un autre fournisseur affiché</strong> : traitement d’une demande d’IA après l’avertissement correspondant.</li></ul><p>AfroTools ne vend pas les données personnelles. Les prestataires peuvent recevoir les données limitées nécessaires au flux que vous choisissez.</p>
<h2>5. Sécurité</h2><p>Les échanges réseau utilisent HTTPS. L’autorisation des données de compte doit être contrôlée côté serveur et ne dépend pas uniquement de l’interface. Aucun service ne peut toutefois garantir une sécurité absolue ; utilisez des données minimales et évitez de saisir un contenu sensible dans un flux qui ne le demande pas.</p>
<h2>6. Conservation</h2><p>Les données sont conservées pendant la durée nécessaire à la finalité annoncée, au fonctionnement du compte, au traitement d’une demande ou aux obligations applicables. Les données restées dans le navigateur dépendent de vos réglages locaux. Les données du prestataire suivent aussi ses paramètres et obligations.</p>
<h2>7. Vos choix et droits</h2><p>Selon la loi applicable, vous pouvez demander l’accès, la correction, l’export, l’opposition ou la suppression de données personnelles éligibles, et retirer un consentement pour l’avenir. Certains documents ou justificatifs peuvent être nécessaires pour vérifier une demande. Les droits et exceptions varient selon la juridiction.</p>
<h2>8. Enfants</h2><p>AfroTools est un service généraliste et n’est pas conçu pour collecter sciemment les données personnelles d’un enfant de moins de 13 ans. Signalez toute situation concernée afin qu’elle soit examinée.</p>
<h2>9. Modifications</h2><p>Une modification importante de la collecte, des prestataires ou des droits sera indiquée avec une nouvelle date de mise à jour.</p>
<h2>10. Contact</h2><p>Pour une question ou une demande relative aux données, écrivez à <a href="mailto:privacy@afrotools.com">privacy@afrotools.com</a>. Nous accuserons réception et expliquerons le processus applicable.</p></main><afro-footer></afro-footer></body></html>\n`;
}

function aliasPage() {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conditions d’utilisation — nouvelle adresse</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://afrotools.com/fr/terms-of-use/"><meta http-equiv="refresh" content="0;url=/fr/terms-of-use/"></head><body><main><h1>Cette adresse a été remplacée</h1><p>Les conditions d’utilisation sont disponibles à leur <a href="/fr/terms-of-use/">adresse française actuelle</a>.</p></main></body></html>\n`;
}

function articleTitle(slug) {
  const html = read(`fr/blog/${slug}/index.html`);
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return (match ? match[1] : slug).replace(/\s*\|\s*AfroTools.*$/i, '').replace(/&mdash;/g, '—').replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è');
}

function blogPage(manifest) {
  if (manifest.locale !== 'fr') throw new Error('French blog manifest must declare locale fr.');
  const cards = manifest.articles.map((a) => `<article class="article-card" data-locale="${manifest.locale}" data-cat="${a.category}"><div class="article-card-body"><span class="category-badge">${a.category}</span><h2><a href="/fr/blog/${a.slug}/">${articleTitle(a.slug)}</a></h2><p class="article-card-excerpt">${a.description}</p><span class="featured-read-more">Lire le guide →</span></div></article>`).join('\n');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${manifest.title} | AfroTools</title><meta name="description" content="${manifest.description}"><link rel="canonical" href="https://afrotools.com/fr/blog/"><link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/blog/"><link rel="alternate" hreflang="en" href="https://afrotools.com/blog/"><link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/blogu/"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/blog/"><link rel="alternate" type="application/rss+xml" title="Guides AfroTools en français" href="/fr/blog/feed.xml"><link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/fr/blog/assets/css/blog.css"><script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script></head><body><a class="skip-link" href="#articles">Aller aux articles</a><afro-navbar></afro-navbar><header class="blog-hero"><div class="blog-hero-inner"><nav class="breadcrumb" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> › Blog</nav><span class="eyebrow">Le journal AfroTools</span><h1>${manifest.title}</h1><p class="blog-hero-sub">${manifest.description} Cette sélection n’inclut que les articles dont la version française a été relue.</p><label for="blogSearchInput">Rechercher dans les guides</label><input id="blogSearchInput" class="blog-search-input" type="search" placeholder="Ex. salaire, TVA, Sénégal"></div></header><main class="blog-section" id="articles"><p id="blogStatus" aria-live="polite">${manifest.articles.length} guides en français</p><div class="blog-grid" id="blogGrid">${cards}</div></main><afro-footer></afro-footer><script>(function(){var input=document.getElementById('blogSearchInput'),cards=[].slice.call(document.querySelectorAll('.article-card')),status=document.getElementById('blogStatus');input.addEventListener('input',function(){var q=input.value.toLocaleLowerCase('fr');var shown=0;cards.forEach(function(card){var visible=!q||card.textContent.toLocaleLowerCase('fr').indexOf(q)>=0;card.hidden=!visible;if(visible)shown++;});status.textContent=shown?shown+' guide'+(shown>1?'s':'')+' en français':'Aucun guide ne correspond à cette recherche.';});})();</script></body></html>\n`;
}

function blogFeed(manifest) {
  const items = manifest.articles.map((a) => `<item><title><![CDATA[${articleTitle(a.slug)}]]></title><link>https://afrotools.com/fr/blog/${a.slug}/</link><guid>https://afrotools.com/fr/blog/${a.slug}/</guid><description><![CDATA[${a.description}]]></description><language>fr</language></item>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${manifest.title}</title><link>https://afrotools.com/fr/blog/</link><description>${manifest.description}</description><language>fr</language>${items}</channel></rss>\n`;
}

output('fr/index.html', homePage());
output('fr/privacy/index.html', privacyPage());
output('fr/terms-of-use/index.html', termsPage());
output('fr/terms/index.html', aliasPage());
const blog = JSON.parse(read('data/localization/fr-blog-manifest.json'));
output('fr/blog/index.html', blogPage(blog));
output('fr/blog/feed.xml', blogFeed(blog));

const prohibited = [
  /Version française premium/i,
  /Moteur source conservé/i,
  /localisation DOM/i,
  /SEO plus propre/i,
  /Canonical, hreflang/i
];
for (const file of allFrenchHtml(path.join(ROOT, 'fr'))) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  for (const pattern of prohibited) if (pattern.test(html)) failures.push(`${rel}: user-visible implementation commentary matches ${pattern}`);
}

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<template\b[\s\S]*?<\/template>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&(?:eacute|Eacute);/g, 'é')
    .replace(/\s+/g, ' ')
    .trim();
}

const criticalFrenchFiles = [
  'fr/index.html',
  'fr/all-tools/index.html',
  'fr/salary-tax/index.html',
  'fr/document-pdf/index.html',
  'fr/contact/index.html',
  'fr/blog/index.html',
  'fr/terms-of-use/index.html',
  'fr/privacy/index.html',
  'fr/tools/gh-wht/index.html',
  'fr/tools/ng-pension/index.html',
  'fr/tools/compteur-prepaye/central-african-republic/index.html',
  'fr/tools/roi-solaire/madagascar/index.html'
];
const unexplainedEnglishUi = /\b(?:All Articles|Read article|Loading articles|Privacy Policy|Terms of Use|Data We Collect|Your Rights|Contact us|Recharge Amount|Units Received|Estimated Days|What You Need to Know|Open Madagascar calculator|Search tools|Calculate now|Try again)\b/i;
for (const rel of criticalFrenchFiles) {
  const textValue = visibleText(read(rel));
  const match = textValue.match(unexplainedEnglishUi);
  if (match) {
    const start = Math.max(0, match.index - 70);
    failures.push(`${rel}: unexplained English UI near "${textValue.slice(start, start + 180)}"`);
  }
}

if (failures.length) {
  console.error(`French product surface failed (${failures.length}):`);
  failures.slice(0, 80).forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`${WRITE ? 'Updated' : 'Validated'} French product surface${changed.length ? ` (${changed.length} files)` : ''}.`);
}
