#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first === -1) {
    if (source.includes(after)) return source;
    throw new Error(`${label}: expected source fragment was not found`);
  }
  if (source.indexOf(before, first + before.length) !== -1) {
    throw new Error(`${label}: source fragment is not unique`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

function replaceFirst(source, before, after, label) {
  const first = source.indexOf(before);
  if (first === -1) {
    if (source.includes(after)) return source;
    throw new Error(`${label}: expected source fragment was not found`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

function writeIfChanged(file, content) {
  const current = fs.readFileSync(file, "utf8");
  if (current === content) return false;
  fs.writeFileSync(file, content, "utf8");
  return true;
}

function dedupeRepeated(source, fragment) {
  const repeated = `${fragment}\n${fragment}`;
  while (source.includes(repeated)) source = source.replace(repeated, fragment);
  return source;
}

function patchEngineeringRuntime() {
  const file = path.join(ROOT, "assets/js/engineering-toolkit.js");
  const source = fs.readFileSync(file, "utf8");
  const gateStart = source.indexOf("function C(e,a){");
  const gateEnd = source.indexOf("function x(){", gateStart);
  let next = source;
  if (gateStart !== -1 && gateEnd !== -1) {
    next = source.slice(0, gateStart) + "function C(e){e()}" + source.slice(gateEnd);
  } else if (!source.includes("function C(e){e()}function x(){")) {
    throw new Error("engineering runtime: export gate boundary not found");
  }
  next = replaceOnce(
    next,
    'try{localStorage.setItem("afrotools:"+r(window.location.pathname)+":engineering-pack",c)}catch(e){}f(a,!1)',
    "",
    "engineering runtime automatic pack storage"
  );
  return writeIfChanged(file, next);
}

function patchClimateRuntime() {
  const file = path.join(ROOT, "assets/js/climate-tools.js");
  const source = fs.readFileSync(file, "utf8");
  const gateStart = source.indexOf('function(e,a){if(function(){try{if(localStorage.getItem("afrotools-email-gate")');
  const callStart = source.indexOf("}(e,function(){l.disabled=!0", gateStart);
  let next = source;
  if (gateStart !== -1 && callStart !== -1) {
    next = source.slice(0, gateStart) + "function(e,a){a()" + source.slice(callStart);
  } else if (!source.includes("function(e,a){a()}(e,function(){l.disabled=!0")) {
    throw new Error("climate runtime: export gate boundary not found");
  }
  next = replaceOnce(
    next,
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    "/assets/vendor/jspdf/jspdf.umd.min.js",
    "climate runtime jsPDF source"
  );
  return writeIfChanged(file, next);
}

function patchClimateGenerator() {
  const file = path.join(ROOT, "scripts/enhance-climate-section-pass.js");
  let source = fs.readFileSync(file, "utf8");
  source = replaceOnce(
    source,
    '<div><strong>PDF gate</strong><span>${esc(tool.leadMagnet || "Download a gated PDF report when a result is ready.")}</span></div>',
    '<div><strong>Local PDF</strong><span>Generated in this browser with the bundled PDF engine. No email, account, or network submission is required.</span></div>',
    "climate generator PDF method copy"
  );
  const resetAction = '<button class="cl-btn cl-btn-secondary" type="reset" id="resetClimateScenario">Reset scenario</button>';
  const formStatus = '<p class="cl-form-status" id="cl-form-status" role="status" aria-live="polite"></p>';
  source = dedupeRepeated(source, `${resetAction}\n${formStatus}`);
  source = dedupeRepeated(source, resetAction);
  source = dedupeRepeated(source, formStatus);
  if (!source.includes(resetAction)) {
    source = replaceOnce(
      source,
      '<button class="cl-btn cl-btn-secondary" type="button" id="downloadClimatePdf" disabled>Download PDF report</button>',
      `<button class="cl-btn cl-btn-secondary" type="button" id="downloadClimatePdf" disabled>Download PDF report</button>\n${resetAction}\n${formStatus}`,
      "climate generator form actions"
    );
  }
  const guardStyle = '<link rel="stylesheet" href="/assets/css/climate-vip-guardrails.css">';
  const pageHeadStart = source.indexOf("function pageHtml(tool)");
  const pageHeadEnd = source.indexOf("function climateIndexHtml()", pageHeadStart);
  if (!source.slice(pageHeadStart, pageHeadEnd).includes(guardStyle)) {
    const insertion = source.indexOf('<link rel="stylesheet" href="/assets/css/climate.css">', pageHeadStart);
    if (insertion === -1 || insertion > pageHeadEnd) throw new Error("climate generator guardrail style anchor not found");
    const anchor = '<link rel="stylesheet" href="/assets/css/climate.css">';
    source = source.slice(0, insertion) + anchor + guardStyle + source.slice(insertion + anchor.length);
  }
  const guardScript = '<script src="/assets/js/pages/climate-vip-guardrails.js"></script>';
  source = dedupeRepeated(source, guardScript);
  if (!source.slice(pageHeadStart, pageHeadEnd).includes(guardScript)) {
    const anchor = '<script src="/assets/js/climate-tools.js"></script>';
    const insertion = source.indexOf(anchor, pageHeadStart);
    if (insertion === -1 || insertion > pageHeadEnd) throw new Error("climate generator guardrail runtime anchor not found");
    source = source.slice(0, insertion) + guardScript + "\n" + source.slice(insertion);
  }
  return writeIfChanged(file, source);
}

const climateRoutes = [
  "drought-risk",
  "water-scarcity",
  "rainfall-tracker",
  "carbon-credit",
  "flood-risk",
  "air-quality",
  "deforestation",
  "waste-management",
  "recycling-revenue",
  "charcoal-vs-clean",
  "ewaste-value",
  "tree-planting-roi",
  "sustainability-scorecard"
];

function patchClimatePages() {
  let changed = 0;
  for (const slug of climateRoutes) {
    const file = path.join(ROOT, "tools", slug, "index.html");
    let source = fs.readFileSync(file, "utf8");
    const pdfCopy = /<div><strong>PDF gate<\/strong><span>[\s\S]*?<\/span><\/div>/.exec(source);
    if (pdfCopy) {
      source = source.replace(
        pdfCopy[0],
        "<div><strong>Local PDF</strong><span>Generated in this browser with the bundled PDF engine. No email, account, or network submission is required.</span></div>"
      );
    } else if (!source.includes("<strong>Local PDF</strong>")) {
      throw new Error(`${slug}: PDF method copy not found`);
    }
    const resetAction = '<button class="cl-btn cl-btn-secondary" type="reset" id="resetClimateScenario">Reset scenario</button>';
    const formStatus = '<p class="cl-form-status" id="cl-form-status" role="status" aria-live="polite"></p>';
    const guardStyle = '<link rel="stylesheet" href="/assets/css/climate-vip-guardrails.css">';
    const guardScript = '<script src="/assets/js/pages/climate-vip-guardrails.js"></script>';
    source = dedupeRepeated(source, `${resetAction}\n${formStatus}`);
    source = dedupeRepeated(source, resetAction);
    source = dedupeRepeated(source, formStatus);
    source = dedupeRepeated(source, guardStyle);
    source = dedupeRepeated(source, guardScript);
    if (!source.includes(resetAction)) {
      source = replaceOnce(
        source,
        '<button class="cl-btn cl-btn-secondary" type="button" id="downloadClimatePdf" disabled>Download PDF report</button>',
        `<button class="cl-btn cl-btn-secondary" type="button" id="downloadClimatePdf" disabled>Download PDF report</button>\n${resetAction}\n${formStatus}`,
        `${slug} reset action`
      );
    }
    if (!source.includes(guardStyle)) {
      source = replaceOnce(
        source,
        '<link rel="stylesheet" href="/assets/css/design-system.min.css',
        `${guardStyle}\n<link rel="stylesheet" href="/assets/css/design-system.min.css`,
        `${slug} guardrail styles`
      );
    }
    if (!source.includes(guardScript)) {
      source = replaceOnce(
        source,
        '<script src="/assets/js/climate-tools.js',
        `${guardScript}\n<script src="/assets/js/climate-tools.js`,
        `${slug} guardrail runtime`
      );
    }
    if (writeIfChanged(file, source)) changed += 1;
  }
  return changed;
}

console.log(JSON.stringify({
  engineeringRuntime: patchEngineeringRuntime(),
  climateRuntime: patchClimateRuntime(),
  climateGenerator: patchClimateGenerator(),
  climatePages: patchClimatePages()
}, null, 2));
