"use strict";

const { findFrenchEnergyApp } = require("./french-energy-parity-contract");

const FRENCH_SOLAR_FILE = "fr/tools/roi-solaire/index.html";
const RELATED_IDS = Object.freeze([
  "generator-fuel", "electricity-tariff", "solar-vs-generator",
  "electricity-bill-verify", "solar-sizing", "battery-sizing",
]);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

// Only this source-owned panel is localized. The component already reads its
// data-name/data-desc for the visible cards and accessible link names.
function isFrenchSolarRoot(html) {
  return /<html\b[^>]*\blang=["']fr(?:-[^"']*)?["']/i.test(html)
    && /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']https:\/\/afrotools\.com\/fr\/tools\/roi-solaire\/["'])[^>]*>/i.test(html);
}

function protectedBlocks(html) {
  return [...html.matchAll(/<(script|style|pre|code|textarea)\b[\s\S]*?<\/\1\s*>/gi)];
}

function hasProtectedRelatedHost(html) {
  return protectedBlocks(html).some(match => /<afro-related-tools\b/i.test(match[0]));
}

function localizeFrenchSolarRelatedTools(html) {
  if (!isFrenchSolarRoot(html)) return html;
  const protectedRanges = protectedBlocks(html);
  const hosts = [...html.matchAll(/<afro-related-tools\b[^>]*>[\s\S]*?<\/afro-related-tools>/gi)]
    .filter(match => !protectedRanges.some(block => match.index >= block.index && match.index < block.index + block[0].length));
  if (!hosts.length) return html;
  if (hosts.length !== 1 || !/\bcurrent=["']solar-roi["']/.test(hosts[0][0])) {
    throw new Error("Ambiguous French Solar related-tools host");
  }
  const host = hosts[0][0];
  if (/<(?:script|style|pre|code|textarea)\b/i.test(host)) throw new Error("Unexpected French Solar related-tools content");
  const anchors = [...host.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)];
  if (anchors.length !== RELATED_IDS.length) throw new Error("Expected six French Solar related tools");
  const seen = new Set();
  const edits = anchors.map(match => {
    const anchor = match[0], open = anchor.slice(0, anchor.indexOf(">") + 1);
    const id = open.match(/\bdata-id=["']([^"']+)["']/)?.[1];
    if (!RELATED_IDS.includes(id) || seen.has(id)) throw new Error("Unknown or duplicate French Solar related tool");
    seen.add(id);
    const app = findFrenchEnergyApp(id);
    if (!app || !app.title || !app.description || !app.frRoute) throw new Error("Missing owned French Energy copy: " + id);
    const href = open.match(/\bhref=(["'])(.*?)\1/);
    const destination = href && href[2].match(/^([^?#]*)([?#].*)?$/);
    if (!destination || ![app.enRoute, "/fr/tools/" + id + "/", app.frRoute].includes(destination[1])) {
      throw new Error("Unexpected French Solar related destination: " + id);
    }
    if (!/\bdata-name=["'][^"']*["']/.test(open) || !/\bdata-desc=["'][^"']*["']/.test(open)
      || /<[^>]+>/.test(anchor.slice(open.length, -4))) throw new Error("Malformed French Solar related tool: " + id);
    const nextOpen = open
      .replace(/\bhref=(["'])(.*?)\1/, 'href="' + escapeHtml(app.frRoute + (destination[2] || "")) + '"')
      .replace(/\bdata-name=(["'])(.*?)\1/, 'data-name="' + escapeHtml(app.title) + '"')
      .replace(/\bdata-desc=(["'])(.*?)\1/, 'data-desc="' + escapeHtml(app.description) + '"');
    return { start: match.index, end: match.index + anchor.length,
      value: nextOpen + escapeHtml(app.title) + "</a>" };
  });
  let localized = host;
  for (const edit of edits.reverse()) localized = localized.slice(0, edit.start) + edit.value + localized.slice(edit.end);
  localized = localized.replace(/aria-label=["'](?:Related tools|Outils associés)["']/, 'aria-label="Outils associés"')
    .replace(/(<h2\b[^>]*class=["']seo-links-title["'][^>]*>)(?:Related tools|Outils associés)(<\/h2>)/, "$1Outils associés$2");
  return html.slice(0, hosts[0].index) + localized + html.slice(hosts[0].index + host.length);
}

module.exports = { FRENCH_SOLAR_FILE, RELATED_IDS, isFrenchSolarRoot, hasProtectedRelatedHost, localizeFrenchSolarRelatedTools };
