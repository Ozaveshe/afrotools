"use strict";

const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const root = path.resolve(__dirname, "..");
const id = "creator-captions";
const appFile = path.join(root, "tools", id, "app.html");
const controllerFile = path.join(
  root,
  "assets/js/pages/creative/creator-captions-app-controller.js"
);
const src = "/assets/js/pages/creative/creator-captions-app-controller.js";
const frozen = childProcess.execFileSync(
  "git",
  [
    "show",
    "8ce5cac175e42201968b1f7540752d6acf92d4ca:tools/creator-captions/app.html",
  ],
  { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
);
const scripts = Array.from(
  frozen.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)
).filter((match) => match[1].trim()).sort((a, b) => b[1].length - a[1].length);
const runtime = scripts[0];
if (!runtime || runtime[1].length < 10_000) {
  throw new Error("Creator Captions runtime boundary changed");
}
fs.writeFileSync(
  controllerFile,
  `${runtime[1].replace(/^\n/, "").replace(/\s+$/, "")}\n`
);
let html = fs.readFileSync(appFile, "utf8");
if (!html.includes(src)) {
  html = html.replace(runtime[0], `<script src="${src}"></script>`);
  fs.writeFileSync(appFile, html);
}
process.stdout.write(`${runtime[1].length} Creator Captions bytes extracted\n`);
