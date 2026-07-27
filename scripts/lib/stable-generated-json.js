"use strict";

const fs = require("fs");
const path = require("path");

function withoutGeneratedAt(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const copy = { ...value };
  delete copy.generatedAt;
  return copy;
}

function writeStableGeneratedJson(filePath, value) {
  let generatedAt = value && value.generatedAt;
  try {
    const existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const previousContent = JSON.stringify(withoutGeneratedAt(existing));
    const nextContent = JSON.stringify(withoutGeneratedAt(value));
    if (previousContent === nextContent && existing.generatedAt) {
      generatedAt = existing.generatedAt;
    }
  } catch (_) {
    // A missing or invalid prior artifact is replaced by the current build.
  }

  const output = { ...value, generatedAt };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2) + "\n");
  return output;
}

module.exports = {
  writeStableGeneratedJson,
};
