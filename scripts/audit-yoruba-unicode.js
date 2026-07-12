#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { TextDecoder } = require("util");
const acorn = require("acorn");

const ROOT = path.resolve(__dirname, "..");
const EXCEPTIONS_PATH = path.join(ROOT, "data", "localization", "yoruba-unicode-exceptions.json");
const MOJIBAKE_RE = /(?:\u00c3[\u0080-\u00ff]|\u00c2[\u0080-\u00ff]|\u00e2(?:\u0080|\u20ac)|\u00f0\u0178|\ufffd)/u;
const CORRUPTED_APOSTROPHE_RE = /(?:â€™|â€˜|Ã¢â‚¬|\u0091|\u0092|\uff07)/u;
const EMBEDDED_QUESTION_RE = /[\p{L}\p{M}]\?+[\p{L}\p{M}]/u;
const ORPHAN_MARK_RE = /(?:^|[^\p{L}\p{M}])\p{M}/u;
const ASCII_TRANSLITERATION_PATTERNS = [
  /\bAkopo\b/iu,
  /\bdaako\b/iu,
  /\birinse\b/iu,
  /\bsayewo\b/iu,
  /\boju Geesi\b/iu,
  /\b(?:ni|oju)\s+Yoruba\b/iu
];

function walk(directory, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file, output);
    else if (entry.isFile() && /\.(?:html|js|json)$/i.test(entry.name)) output.push(file);
  }
  return output;
}

function relative(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function lineFor(content, offset) {
  return content.slice(0, Math.max(0, offset)).split(/\r?\n/).length;
}

function stripMarkup(value) {
  return String(value || "")
    .replace(/https?:\/\/[^\s"'<>]+/gi, " ")
    .replace(/\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:[a-z][a-z0-9]+|#\d+|#x[0-9a-f]+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlSegments(content) {
  const scripts = [];
  const visible = content.replace(/<(head|style|noscript|template|svg|pre|code|kbd|samp)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, function capture(_, script) {
      scripts.push({ script, offset: content.indexOf(script) });
      return " ";
    });
  const segments = [];
  for (const match of visible.matchAll(/[^\r\n]+/g)) {
    const text = stripMarkup(match[0]);
    if (text) segments.push({ text, offset: match.index });
  }
  for (const item of scripts) segments.push(...javascriptSegments(item.script, item.offset));
  return segments;
}

function javascriptSegments(content, baseOffset = 0) {
  const segments = [];
  const ast = acorn.parse(content, { ecmaVersion: "latest", sourceType: "script", allowHashBang: true });
  const seen = new Set();
  function visit(node) {
    if (!node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    if (node.type === "Literal" && typeof node.value === "string") {
      const text = stripMarkup(node.value);
      if (text) segments.push({ text, offset: baseOffset + node.start });
    } else if (node.type === "TemplateElement") {
      const text = stripMarkup(node.value && node.value.cooked);
      if (text) segments.push({ text, offset: baseOffset + node.start });
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  }
  visit(ast);
  return segments;
}

function jsonSegments(content) {
  const parsed = JSON.parse(content);
  const segments = [];
  function visit(value) {
    if (typeof value === "string") {
      const offset = content.indexOf(JSON.stringify(value));
      segments.push({ text: value, offset: offset < 0 ? 0 : offset });
    } else if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(visit);
    }
  }
  visit(parsed);
  return segments;
}

function finding(file, content, code, message, segment) {
  return {
    file: relative(file),
    line: lineFor(content, segment && segment.offset || 0),
    code,
    message,
    text: String(segment && segment.text || "").slice(0, 220)
  };
}

function scanFile(file) {
  const findings = [];
  const bytes = fs.readFileSync(file);
  let content;
  try {
    content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    return [finding(file, "", "INVALID_UTF8", error.message, { text: "" })];
  }
  if (content.charCodeAt(0) === 0xfeff) {
    findings.push(finding(file, content, "UTF8_BOM", "Source files use UTF-8 without a BOM.", { text: "BOM", offset: 0 }));
  }
  const scopedRegistry = relative(file) === "assets/js/components/tool-registry.js";
  if (!scopedRegistry && content !== content.normalize("NFC")) {
    findings.push(finding(file, content, "UNICODE_NOT_NFC", "User-facing Yoruba source is not NFC.", { text: relative(file), offset: 0 }));
  }
  if (content.includes("\ufffd")) {
    findings.push(finding(file, content, "REPLACEMENT_CHARACTER", "Source contains U+FFFD.", { text: "\ufffd", offset: content.indexOf("\ufffd") }));
  }
  if (MOJIBAKE_RE.test(content)) {
    const match = content.match(MOJIBAKE_RE);
    findings.push(finding(file, content, "MOJIBAKE", "Source contains a known UTF-8 decoding signature.", { text: match[0], offset: match.index }));
  }
  if (CORRUPTED_APOSTROPHE_RE.test(content)) {
    const match = content.match(CORRUPTED_APOSTROPHE_RE);
    findings.push(finding(file, content, "CORRUPTED_APOSTROPHE", "Source contains a corrupted apostrophe signature.", { text: match[0], offset: match.index }));
  }

  let segments;
  if (file.endsWith(".html")) segments = htmlSegments(content);
  else if (file.endsWith(".json")) segments = jsonSegments(content);
  else segments = javascriptSegments(content);
  if (relative(file) === "assets/js/components/tool-registry.js") {
    const rows = content.split(/\r?\n/).filter((line) => /lang:\s*['"]yo['"]/.test(line)).join("\n");
    segments = javascriptSegments("[" + rows.replace(/,\s*$/, "") + "]");
  }

  for (const segment of segments) {
    if (segment.text !== segment.text.normalize("NFC")) {
      findings.push(finding(file, content, "UNICODE_NOT_NFC", "A Yoruba string is not NFC.", segment));
    }
    if (EMBEDDED_QUESTION_RE.test(segment.text)) {
      findings.push(finding(file, content, "QUESTION_INSIDE_WORD", "A literal question mark appears inside a word.", segment));
    }
    if (ORPHAN_MARK_RE.test(segment.text)) {
      findings.push(finding(file, content, "ORPHAN_COMBINING_MARK", "A combining mark is detached from a base letter.", segment));
    }
    const opaqueFilename = /^[A-Za-z0-9._-]+\.(?:txt|json|csv|pdf|zip)$/i.test(segment.text);
    if (!opaqueFilename && ASCII_TRANSLITERATION_PATTERNS.some((pattern) => pattern.test(segment.text))) {
      findings.push(finding(file, content, "ASCII_TRANSLITERATION", "High-confidence ASCII Yoruba appears where native orthography is expected.", segment));
    }
  }
  return findings;
}

function isExcepted(entry, exceptions) {
  return exceptions.some((exception) => {
    if (!exception || !exception.file || !exception.code || !exception.reason) return false;
    if (exception.file !== entry.file || exception.code !== entry.code) return false;
    return !exception.text || entry.text.includes(exception.text);
  });
}

function buildReport() {
  const exceptionFile = JSON.parse(fs.readFileSync(EXCEPTIONS_PATH, "utf8"));
  const exceptions = exceptionFile.exceptions || [];
  const files = walk(path.join(ROOT, "yo"));
  files.push(
    path.join(ROOT, "lang", "yo.json"),
    path.join(ROOT, "assets", "js", "yoruba-tool-catalog.js"),
    path.join(ROOT, "assets", "js", "components", "tool-registry.js"),
    path.join(ROOT, "data", "registry", "yoruba-route-manifest.json")
  );
  const uniqueFiles = files.filter((file, index, list) => fs.existsSync(file) && list.indexOf(file) === index).sort();
  const all = uniqueFiles.flatMap(scanFile);
  const active = all.filter((entry) => !isExcepted(entry, exceptions));
  return { filesScanned: uniqueFiles.length, findings: active, excepted: all.length - active.length };
}

function main() {
  const report = buildReport();
  if (report.findings.length) {
    console.error("Yoruba Unicode audit failed:");
    report.findings.forEach((entry) => console.error("  " + entry.file + ":" + entry.line + " [" + entry.code + "] " + entry.message + " " + JSON.stringify(entry.text)));
    process.exitCode = 1;
    return;
  }
  console.log("Yoruba Unicode audit passed across " + report.filesScanned + " source files (" + report.excepted + " reviewed exceptions).");
}

if (require.main === module) main();

module.exports = { buildReport, htmlSegments, javascriptSegments, scanFile };
