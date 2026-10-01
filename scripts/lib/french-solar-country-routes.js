"use strict";

const fs = require("fs");
const path = require("path");
const acorn = require("acorn");
const dataset = require("../../data/energy/solar-roi-country-dataset.js");
const ROOT = path.resolve(__dirname, "../..");

function createRouteMap() {
  const routes = new Map();
  for (const slug of ["", ...Object.values(dataset.countries).map(country => country.slug)]) {
    const suffix = slug ? `${slug}/` : "";
    const target = `/fr/tools/roi-solaire/${suffix}`;
    if (!fs.existsSync(path.join(ROOT, target.slice(1), "index.html"))) {
      throw new Error(`Missing French Solar destination: ${target}`);
    }
    for (const prefix of ["/tools/solar-roi/", "/fr/tools/solar-roi/", "/fr/tools/roi-solaire/"]) {
      routes.set(prefix + suffix, target);
    }
  }
  return routes;
}

function localizedRoute(value, routes) {
  const match = String(value).match(/^([^?#]*)([?#].*)?$/);
  const target = routes.get(match[1]);
  return target ? target + (match[2] || "") : value;
}

function rewriteSolarRouteLiterals(source, routes = createRouteMap()) {
  const edits = [];
  const tree = acorn.parse(source, { ecmaVersion: "latest" });
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "Literal" && typeof node.value === "string") {
      const next = localizedRoute(node.value, routes);
      if (next !== node.value) edits.push({ start: node.start, end: node.end, text: JSON.stringify(next) });
    }
    for (const [key, value] of Object.entries(node)) {
      if (["start", "end", "raw"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  }
  visit(tree);
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  }
  return source;
}

function localizeFrenchSolarRoutes(html) {
  const routes = createRouteMap();
  const anchors = fragment => fragment.replace(/<a\b[^>]*>/gi, tag => tag.replace(/\bhref=(["'])(.*?)\1/i,
    (whole, quote, value) => `href=${quote}${localizedRoute(value, routes)}${quote}`));
  let output = "", cursor = 0;
  const protectedBlocks = /<(script|style|textarea|pre|code)\b[\s\S]*?<\/\1\s*>/gi;
  for (const match of html.matchAll(protectedBlocks)) {
    output += anchors(html.slice(cursor, match.index));
    let block = match[0];
    if (match[1].toLowerCase() === "script") {
      block = block.replace(/(<script\b([^>]*)>)([\s\S]*?)(<\/script>)/i,
        (whole, open, attributes, source, close) => {
          if (/\bsrc\s*=|application\/(?:ld\+json|json)/i.test(attributes) || !source.trim()) return whole;
          return open + rewriteSolarRouteLiterals(source, routes) + close;
        });
    }
    output += block;
    cursor = match.index + match[0].length;
  }
  return output + anchors(html.slice(cursor));
}

module.exports = { createRouteMap, localizedRoute, rewriteSolarRouteLiterals, localizeFrenchSolarRoutes };
