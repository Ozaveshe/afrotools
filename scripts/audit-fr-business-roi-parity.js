const fs = require("fs");
const path = require("path");
const manifest = require("../data/localization/fr-business-roi-parity.json");
const frenchRouteMap = require("../assets/js/ai/french-route-map.generated.js");

const root = path.resolve(__dirname, "..");
const failures = [];

for (const route of manifest.routes) {
  const relative = path.join(route.french.replace(/^\/|\/$/g, ""), "index.html");
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    failures.push(`${route.id}: missing ${relative}`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const checks = [
    [html.includes('lang="fr"'), "French lang"],
    [html.includes(`rel="canonical" href="https://afrotools.com${route.french}"`), "self canonical"],
    [html.includes(`hreflang="en" href="https://afrotools.com${route.english}"`), "English hreflang"],
    [html.includes(`og:image" content="https://afrotools.com/${route.artwork}`), "semantic artwork"],
    [html.includes('type="application/ld+json"'), "AI/search structured context"],
    [/<meta name="description" content="[^"]{80,}"/.test(html), "French discovery context"],
    [html.includes('src="/engines/business-roi-engine.js"'), "shared owner"],
    [html.includes('src="/assets/js/pages/fr-business-roi-parity.js"'), "French controller"],
    [html.includes('data-business-status role="status" aria-live="polite"'), "live status"],
    [html.includes("Aucun compte, téléversement ni envoi à une IA"), "privacy boundary"],
    [!/<iframe\b/i.test(html), "no iframe"],
    [!/fetch\s*\(\s*['"]\/tools\//i.test(html), "no English transplant"],
    [!/<html[^>]+lang="en"/i.test(html), "no English runtime shell"]
  ];
  for (const [passed, name] of checks) if (!passed) failures.push(`${route.id}: ${name}`);
  if (frenchRouteMap.routes[route.english] !== route.french) {
    failures.push(`${route.id}: French AI route map`);
  }
  if (!fs.existsSync(path.join(root, route.artwork))) failures.push(`${route.id}: missing artwork ${route.artwork}`);
}

const accepted = manifest.routes.filter((route) => route.state === "accepted").length;
if (manifest.routes.length !== manifest.denominator) failures.push(`denominator ${manifest.routes.length}/${manifest.denominator}`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`French Business & ROI static contract: ${manifest.routes.length}/${manifest.denominator}; accepted ${accepted}/${manifest.denominator}.`);
