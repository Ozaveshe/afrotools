"use strict";

const fs = require("fs");
const path = require("path");
const names = {
  "fermented corn dough": "Pâte de maïs fermentée",
  "fermented cassava dough": "Pâte de manioc fermentée",
  water: "Eau (en ajouter selon la consistance)",
  salt: "Sel",
  tilapia: "Tilapia entier, nettoyé et entaillé",
  ginger: "Gingembre râpé",
  garlic: "Ail haché",
  onion: "Petit oignon mixé ou râpé",
  "scotch bonnet pepper": "Piment Scotch bonnet haché",
  "vegetable oil": "Huile végétale",
  "shito or fresh pepper sauce": "Shito ou sauce au piment frais, pour servir"
};
const units = {
  cup: ["tasse", "tasses"], cups: ["tasse", "tasses"],
  tsp: ["c. à café", "c. à café"], tbsp: ["c. à soupe", "c. à soupe"],
  cloves: ["gousse", "gousses"], small: ["", ""], whole: ["", ""], "": ["", ""]
};
const steps = {
  "Season the fish": ["Assaisonner le poisson", "Frottez les tilapias entaillés avec le gingembre, l’ail, l’oignon, le piment si vous en utilisez, l’huile et un peu de sel. Laissez-les mariner pendant que vous commencez le banku."],
  "Start the banku": ["Commencer le banku", "Dans une marmite à fond épais, mélangez au fouet les pâtes de maïs et de manioc avec l’eau et le sel restant jusqu’à obtenir un mélange lisse. Faites cuire à feu moyen en remuant sans arrêt."],
  "Steam the banku": ["Finir la cuisson à la vapeur", "Quand la pâte épaissit, baissez le feu, ajoutez un peu d’eau et couvrez brièvement. Remuez de nouveau avec une cuillère en bois solide. Le banku est prêt quand la pâte est lisse et élastique."],
  "Grill the tilapia": ["Griller les tilapias", "Faites cuire les poissons au gril ou sous le gril du four. Retournez-les une fois. La chair doit être cuite à cœur et la surface légèrement grillée."],
  Plate: ["Dresser les assiettes", "Formez des boules de banku. Servez-les avec le tilapia grillé, le shito ou la sauce au piment frais et des légumes émincés."]
};

function render(entry) {
  const slug = "banku-tilapia-gh";
  const root = path.join(__dirname, "../..");
  const english = `https://afrotools.com/tools/${entry.enSlug}/`;
  const french = `https://afrotools.com/fr/tools/${entry.frSlug}/`;
  const source = fs.readFileSync(path.join(root, "tools", entry.enSlug, "index.html"), "utf8");
  const payload = source.match(/<script>window\.__AK_STATIC_RECIPE\s*=\s*([\s\S]*?);<\/script>/);
  if (!payload) throw new Error("Missing published AfroKitchen recipe source");
  const recipe = JSON.parse(payload[1]);
  if (recipe.slug !== slug || recipe.is_verified !== true || recipe.is_published !== true ||
      recipe.serving_unit !== "plates" || !(recipe.default_servings > 0) || recipe.yield_status === "not-recorded" ||
      recipe.method_review_status === "pending-source-method") {
    throw new Error("Banku recipe publication or source yield requires review");
  }
  const title = "Banku et tilapia grillé du Ghana";
  const description = "Préparez un banku souple à base de pâtes de maïs et de manioc fermentées, accompagné de tilapia grillé et de shito.";
  const image = "/assets/img/kitchen/banku-tilapia-gh.webp";
  if (!source.includes(`src="${image}"`)) throw new Error("Banku artwork changed; review the French recipe");
  const ingredients = recipe.ingredients.map(item => {
    const name = names[item.name], unit = units[item.unit];
    if (!name || !unit) throw new Error("Untranslated Banku ingredient: " + item.name);
    const label = name + (item.is_optional ? " (facultatif)" : "");
    const quantity = item.amount ? [item.amount, unit[item.amount > 1 ? 1 : 0]].filter(Boolean).join(" ") : "";
    return { label, quantity, unit, amount: item.amount };
  });
  const method = recipe.steps.map(item => {
    if (!steps[item.title]) throw new Error("Untranslated Banku step: " + item.title);
    return steps[item.title];
  });
  const servings = recipe.default_servings;
  const schema = { "@context": "https://schema.org", "@type": "Recipe", name: title, description,
    url: french, inLanguage: "fr", image: ["https://afrotools.com" + image], author: { "@type": "Organization", name: "AfroKitchen" },
    recipeCuisine: "Ghanéenne", recipeCategory: "Plat principal", recipeYield: servings + " assiettes",
    prepTime: `PT${recipe.prep_time_minutes}M`, cookTime: `PT${recipe.cook_time_minutes}M`, totalTime: `PT${recipe.total_time_minutes}M`,
    recipeIngredient: ingredients.map(i => [i.quantity, i.label].filter(Boolean).join(" ")),
    recipeInstructions: method.map(([name, text], i) => ({ "@type": "HowToStep", name, text, url: french + "#etape-" + (i + 1) })) };
  const options = Array.from({ length: 50 }, (_, i) => `<option value="${i + 1}"${i + 1 === servings ? " selected" : ""}>${i + 1}</option>`).join("");
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | AfroKitchen</title><meta name="description" content="${description}">
<meta name="afrotools-content-id" content="fr-afrokitchen:${slug}"><meta name="afrotools-source-owner" content="scripts/generate-fr-tool-gap-pages.js">
<meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:image" content="https://afrotools.com${image}"><meta property="og:url" content="${french}"><meta property="og:type" content="article">
<link rel="canonical" href="${french}"><link rel="alternate" hreflang="fr" href="${french}"><link rel="alternate" hreflang="en" href="${english}"><link rel="alternate" hreflang="x-default" href="${english}">
<link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/tools/afrokitchen/style.css">
<style>.recipe-fr{width:min(46rem,calc(100% - 2rem));margin:5rem auto 3rem}.recipe-fr figure{margin:1.25rem 0}.recipe-fr img{display:block;width:100%;height:auto;border-radius:1rem}.recipe-fr section{margin-block:2rem}.recipe-fr label{display:flex;align-items:center;gap:.65rem;min-height:44px}.recipe-fr ol{padding-left:1.6rem}.recipe-fr li{margin-block:.6rem}.recipe-fr select,.recipe-fr button{min-height:44px;font:inherit}.recipe-fr h1{line-height:1.1}.recipe-fr p{line-height:1.6}@media print{afro-navbar,afro-footer,.recipe-fr .screen{display:none}.recipe-fr{margin:0;width:100%}.recipe-fr img{max-width:14rem}}</style>
<script type="application/ld+json">${JSON.stringify(schema)}</script><script src="/assets/js/analytics-bootstrap.js" async></script></head>
<body><afro-navbar></afro-navbar><main class="recipe-fr" data-slug="${slug}" data-id="${recipe.id}" data-published="${recipe.is_published}" data-verified="${recipe.is_verified}" data-base="${servings}">
<nav aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> › <a href="/fr/tools/afrocuisine/">AfroCuisine</a> › Ghana</nav>
<h1>${title}</h1><p>${description}</p>
<p>Préparation : ${recipe.prep_time_minutes} min · Cuisson : ${recipe.cook_time_minutes} min · Total indicatif : ${recipe.total_time_minutes} min</p>
<figure><img src="${image}" width="800" height="600" fetchpriority="high" alt="Tilapia entier grillé, deux boules blanches de banku, rondelles d’oignon, citron vert et sauce au piment"><figcaption>Banku et tilapia grillé.</figcaption></figure>
<p><a href="#ingredients">Voir les ingrédients</a> · <a href="#methode">Passer à la préparation</a></p>
<section id="ingredients"><h2>Ingrédients pour <span id="assiettes">${servings}</span> <span id="yield-unit">assiettes</span></h2>
<label class="screen" for="quantite">Nombre d’assiettes <select id="quantite" disabled>${options}</select></label>
<p id="recipe-status" role="status"></p><div id="liste">${ingredients.map(i => `<label><input type="checkbox" disabled><span>${i.label}${i.quantity ? ` — <span data-base-amount="${i.amount}" data-one="${i.unit[0]}" data-many="${i.unit[1]}">${i.quantity}</span>` : ""}</span></label>`).join("\n")}</div></section>
<section id="methode"><h2>Préparation</h2><ol>${method.map(([heading, text], i) => `<li id="etape-${i + 1}"><h3>${heading}</h3><p>${text}</p></li>`).join("\n")}</ol></section>
<p><a href="${english}" hreflang="en">Consulter la recette en anglais</a></p></main><afro-footer></afro-footer>
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script><script src="/engines/afrokitchen-engine.js" defer></script><script src="/assets/js/pages/fr-banku-recipe.js" defer></script><script src="/assets/js/lazy-analytics.js" defer></script></body></html>
`;
}

module.exports = { render };
