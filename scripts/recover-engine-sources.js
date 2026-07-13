#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { minify } = require("terser");
const { getEngineRecoveryOptions, getEngineTerserOptions } = require("./lib/engine-build");
const { renameSyncWithRetry, writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const ENGINE_DIR = path.join(ROOT, "engines");
const SOURCE_DIR = path.join(ENGINE_DIR, "src");
const force = process.argv.includes("--force");

function engineFiles() {
  return fs.readdirSync(ENGINE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => entry.name)
    .sort();
}

function atomicWrite(filePath, contents) {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    writeFileSyncWithRetry(tempPath, contents, "utf8");
    renameSyncWithRetry(tempPath, filePath);
  } finally {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {}
  }
}

async function canonical(code, filename) {
  const result = await minify({ [filename]: code }, getEngineTerserOptions());
  if (!result.code) throw new Error(`${filename}: Terser produced no canonical output`);
  return result.code;
}

async function main() {
  const files = engineFiles();
  if (files.length !== 128) throw new Error(`Expected 128 top-level engines, found ${files.length}`);
  const existing = fs.existsSync(SOURCE_DIR)
    ? fs.readdirSync(SOURCE_DIR).filter((name) => name.endsWith(".js"))
    : [];
  if (existing.length && !force) {
    throw new Error(`engines/src already contains ${existing.length} JavaScript files; use --force only for deliberate recovery`);
  }
  fs.mkdirSync(SOURCE_DIR, { recursive: true });

  let sourceBytes = 0;
  for (const filename of files) {
    const outputPath = path.join(ENGINE_DIR, filename);
    const sourcePath = path.join(SOURCE_DIR, filename);
    const output = fs.readFileSync(outputPath, "utf8");
    const recovered = await minify({ [filename]: output }, getEngineRecoveryOptions());
    if (!recovered.code) throw new Error(`${filename}: Terser produced no recovered source`);
    const readable = `${recovered.code.trim().replace(/[ \t]+$/gm, "")}\n`;
    const [before, after] = await Promise.all([
      canonical(output, filename),
      canonical(readable, filename),
    ]);
    if (before !== after) throw new Error(`${filename}: recovered source changed canonical semantics`);
    atomicWrite(sourcePath, readable);
    sourceBytes += Buffer.byteLength(readable);
  }

  console.log(`Recovered ${files.length} engine sources into engines/src (${sourceBytes} bytes)`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
