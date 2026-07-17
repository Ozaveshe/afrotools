#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const APPS_DIR = path.join(ROOT, "pro", "apps");
const EXCLUDED = new Set(["payroll"]);

function titleFromSlug(slug) {
  return slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function inject(file, slug) {
  let html = fs.readFileSync(file, "utf8");
  let changed = false;
  if (!html.includes("/assets/js/components/pro-waitlist.js")) {
    html = html.replace(/<\/body>/i, '<script src="/assets/js/components/pro-waitlist.js"></script>\n</body>');
    changed = true;
  }
  if (!html.includes("data-pro-waitlist-host")) {
    const host = '  <div data-pro-waitlist-host data-app-label="' + titleFromSlug(slug) + '" data-source-route="/pro/apps/' + slug + '/"></div>\n';
    html = html.replace(/(<main\b[^>]*>)/i, "$1\n" + host);
    changed = true;
  }
  if (changed) fs.writeFileSync(file, html);
  return changed;
}

let touched = 0;
for (const entry of fs.readdirSync(APPS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory() || EXCLUDED.has(entry.name)) continue;
  const file = path.join(APPS_DIR, entry.name, "index.html");
  if (!fs.existsSync(file)) continue;
  if (inject(file, entry.name)) touched += 1;
}

console.log("Injected Pro waitlist into " + touched + " app routes.");
