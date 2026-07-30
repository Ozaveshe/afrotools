"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const CONTROLLER_DIR = path.join(
  ROOT,
  "assets",
  "js",
  "pages",
  "creative"
);
const IDS = Object.freeze([
  "african-palette",
  "book-publishing-cost",
  "engagement-rate",
  "linkedin-optimizer",
  "music-royalty-splitter",
  "personal-brand-audit",
  "photography-pricing",
  "podcast-monetization",
  "self-publishing-royalty",
  "social-media-calendar",
  "wedding-photo-package",
]);

const INLINE_SCRIPT =
  /<script(?![^>]*\bsrc\s*=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi;

function normalize(value) {
  return value.replace(/\r\n/g, "\n");
}

function run() {
  fs.mkdirSync(CONTROLLER_DIR, { recursive: true });
  for (const id of IDS) {
    const pageFile = path.join(ROOT, "tools", id, "index.html");
    const controllerFile = path.join(CONTROLLER_DIR, `${id}-controller.js`);
    const page = fs.readFileSync(pageFile, "utf8");
    const matches = Array.from(page.matchAll(INLINE_SCRIPT));

    if (matches.length === 0) {
      const expectedSrc = `/assets/js/pages/creative/${id}-controller.js`;
      if (!page.includes(expectedSrc) || !fs.existsSync(controllerFile)) {
        throw new Error(`${id}: no inline owner and no extracted controller`);
      }
      continue;
    }
    if (matches.length !== 1) {
      throw new Error(`${id}: expected one executable inline script, found ${matches.length}`);
    }

    const match = matches[0];
    const source = `${normalize(match[1]).replace(/^\n/, "").replace(/\s+$/, "")}\n`;
    fs.writeFileSync(controllerFile, source);
    const replacement = `<script src="/assets/js/pages/creative/${id}-controller.js"></script>`;
    const next =
      page.slice(0, match.index) +
      replacement +
      page.slice(match.index + match[0].length);
    fs.writeFileSync(pageFile, next);
    console.log(id);
  }
}

run();
