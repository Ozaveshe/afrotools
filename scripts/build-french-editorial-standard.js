#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { localizedGeneratorEquivalent } = require("./lib/localized-generator-equivalence");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const ROUTES = [
  ["ajo-interest-calculation", "Calcul et répartition d’un groupe d’épargne"],
  ["compound-interest-calculator-africa", "Projection des intérêts composés"],
  ["lobola-price-2026", "Préparation responsable d’une discussion de lobola"],
  ["vat-rates-africa-2026", "Vérification d’un taux de TVA en Afrique"]
];

function faq(title) {
  return JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [
    { "@type": "Question", name: `Ce guide sur ${title.toLowerCase()} remplace-t-il une source officielle ?`, acceptedAnswer: { "@type": "Answer", text: "Non. Il organise une méthode de vérification. Contrôlez la règle, la date et l’autorité applicables avant une décision réelle." } },
    { "@type": "Question", name: "Quelles données faut-il conserver ?", acceptedAnswer: { "@type": "Answer", text: "Conservez les hypothèses, la période, la devise, la source consultée et la date de vérification, sans publier de données personnelles." } }
  ] });
}

function block(title) {
  return `<section class="fr-editorial-standard" data-fr-editorial-standard><h2>Contrôle final avant utilisation</h2><p>Relisez le résultat dans son contexte : pays, période, devise, destinataire et objectif. Pour ${title.toLowerCase()}, une ancienne valeur, un exemple ou une estimation ne devient pas une règle actuelle. Ouvrez la source citée, vérifiez sa date et son périmètre, puis notez les hypothèses retenues. Si une donnée changeante n’est pas confirmée, gardez le résultat comme scénario de préparation et non comme chiffre officiel.</p><p>Protégez les informations du groupe, du foyer, du client ou de l’organisation. Utilisez des exemples anonymes, conservez les justificatifs sur un appareil maîtrisé et partagez uniquement le fichier nécessaire. Pour un paiement, un dépôt, une obligation fiscale, un contrat ou une discussion familiale sensible, faites confirmer l’étape finale par l’autorité, le prestataire ou les personnes compétentes.</p><h2>Questions de vérification</h2><details><summary>Ce guide remplace-t-il une source officielle ?</summary><p>Non. Il fournit une méthode de préparation et de contrôle; la source officielle ou l’accord des parties reste déterminant.</p></details><details><summary>Que faut-il archiver avec le résultat ?</summary><p>La date, la source, la période, la devise, les hypothèses et la version du fichier, sans données personnelles inutiles.</p></details></section>`;
}

let changed = 0;
for (const [slug, title] of ROUTES) {
  const file = path.join(ROOT, "fr", "blog", slug, "index.html");
  let current = fs.readFileSync(file, "utf8");
  let expected = current.replace(/<section class="fr-editorial-standard"[\s\S]*?<\/section>/i, "");
  if (!/["']FAQPage["']/i.test(expected)) expected = expected.replace("</head>", `<script type="application/ld+json">${faq(title)}</script></head>`);
  expected = /<afro-footer\b/i.test(expected) ? expected.replace(/<afro-footer\b/i, `${block(title)}<afro-footer`) : expected.replace("</body>", `${block(title)}</body>`);
  if (localizedGeneratorEquivalent(current, expected) && current.includes("data-fr-editorial-standard")) continue;
  changed += 1;
  if (WRITE) fs.writeFileSync(file, expected, "utf8");
  else console.error(`stale: ${path.relative(ROOT, file)}`);
}
console.log(`${WRITE ? "Built" : "Checked"} French editorial standard; ${changed} file(s) ${WRITE ? "updated" : "stale"}.`);
if (changed && !WRITE) process.exitCode = 1;
module.exports = { ROUTES };
