#!/usr/bin/env node
/**
 * AfroTools Sitemap Generator
 * ============================
 * Reads tool-registry.json and generates a complete sitemap.xml
 * Run as part of Netlify build command or standalone.
 *
 * Usage:
 *   node generate-sitemap.js                    # Output to stdout
 *   node generate-sitemap.js --out sitemap.xml  # Write to file
 */

const fs = require("fs");
const path = require("path");

const REGISTRY_PATH = path.join(__dirname, "..", "sentinel", "tool-registry.json");
const BASE_URL = "https://afrotools.com";

function getPriority(tier) {
  switch (tier) {
    case 1: return "0.9";
    case 2: return "0.7";
    case 3: return "0.5";
    default: return "0.5";
  }
}

function getChangefreq(tool) {
  if (tool.liveData) return "hourly";
  if (tool.category === "fuel-energy" || tool.category === "currency-fx") return "daily";
  if (tool.tier === 1) return "weekly";
  return "monthly";
}

function generateSitemap() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
  const tools = registry.tools.filter(t => t.status === "live");
  const today = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <!-- Homepage -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- All Tools Directory -->
  <url>
    <loc>${BASE_URL}/all-tools/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Blog -->
  <url>
    <loc>${BASE_URL}/blog/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

`;

  // Group tools by country for organized output
  const byCountry = {};
  for (const tool of tools) {
    const country = tool.country || "ALL";
    if (!byCountry[country]) byCountry[country] = [];
    byCountry[country].push(tool);
  }

  for (const [country, countryTools] of Object.entries(byCountry).sort()) {
    xml += `  <!-- ${country === "ALL" ? "Pan-African / Global Tools" : country + " Tools"} -->\n`;

    for (const tool of countryTools.sort((a, b) => a.tier - b.tier)) {
      const lastmod = tool.lastVerified || today;
      xml += `  <url>
    <loc>${BASE_URL}${tool.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${getChangefreq(tool)}</changefreq>
    <priority>${getPriority(tool.tier)}</priority>
  </url>\n`;
    }
    xml += "\n";
  }

  xml += "</urlset>\n";

  return xml;
}

// Main
const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const sitemap = generateSitemap();

if (outIndex !== -1 && args[outIndex + 1]) {
  const outPath = args[outIndex + 1];
  fs.writeFileSync(outPath, sitemap);
  console.log(`✅ Sitemap written to ${outPath}`);

  // Count URLs
  const urlCount = (sitemap.match(/<url>/g) || []).length;
  console.log(`   ${urlCount} URLs generated`);
} else {
  process.stdout.write(sitemap);
}
