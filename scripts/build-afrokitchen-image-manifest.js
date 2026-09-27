"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const IMAGE_ROOT = path.join(ROOT, "assets", "img", "kitchen");
const OUTPUT = path.join(ROOT, "tools", "afrokitchen", "image-manifest.js");

function imagePaths(directory = IMAGE_ROOT, prefix = "") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return imagePaths(path.join(directory, entry.name), relative);
    return entry.isFile() && /\.(?:webp|jpe?g|png|avif)$/i.test(entry.name)
      ? [`/assets/img/kitchen/${relative}`]
      : [];
  });
}

function buildManifest() {
  const images = imagePaths().sort();
  if (!images.length) throw new Error("AfroKitchen image inventory is empty");
  return {
    images,
    source: `// GENERATED FILE — run node scripts/build-afrokitchen-image-manifest.js\nwindow.AfroKitchenImageManifest = new Set(${JSON.stringify(images)});\n`
  };
}

const manifest = buildManifest();
const expected = manifest.source;
const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, "utf8") : "";
if (process.argv.includes("--check")) {
  if (current !== expected) {
    console.error("AfroKitchen image manifest is stale");
    process.exitCode = 1;
  } else {
    console.log("AfroKitchen image manifest is current");
  }
} else {
  if (current !== expected) fs.writeFileSync(OUTPUT, expected, "utf8");
  console.log(`AfroKitchen image manifest: ${manifest.images.length} local images`);
}
