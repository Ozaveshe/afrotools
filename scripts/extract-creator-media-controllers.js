"use strict";

const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const root = path.resolve(__dirname, "..");
const ids = ["creator-clip", "creator-record", "creator-voice"];

for (const id of ids) {
  const appFile = path.join(root, "tools", id, "app.html");
  const controllerFile = path.join(
    root,
    "assets/js/pages/creative",
    `${id}-app-controller.js`
  );
  let html = fs.readFileSync(appFile, "utf8");
  const src = `/assets/js/pages/creative/${id}-app-controller.js`;
  const frozenHtml = childProcess.execFileSync(
    "git",
    [
      "show",
      `8ce5cac175e42201968b1f7540752d6acf92d4ca:tools/${id}/app.html`,
    ],
    { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
  );
  const scripts = Array.from(
    frozenHtml.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)
  ).filter((match) => match[1].trim());
  if (!scripts.length) throw new Error(`${id}: no inline runtime found`);
  scripts.sort((left, right) => right[1].length - left[1].length);
  const runtime = scripts[0];
  if (runtime[1].length < 5_000) {
    throw new Error(`${id}: selected runtime is unexpectedly small`);
  }
  fs.writeFileSync(
    controllerFile,
    `${runtime[1].replace(/^\n/, "").replace(/\s+$/, "")}\n`
  );
  if (!html.includes(src)) {
    html = html.replace(runtime[0], `<script src="${src}"></script>`);
    fs.writeFileSync(appFile, html);
  }
  process.stdout.write(`${id}: ${runtime[1].length} runtime bytes extracted\n`);
}
