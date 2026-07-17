"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const registryPath = path.join(root, "tools", "cv-builder", "js", "cv-template-registry.js");
const galleryPath = path.join(root, "tools", "cv-builder", "js", "cv-template-gallery.js");
const legacyTemplatesPath = path.join(root, "tools", "cv-builder", "js", "cv-templates.js");
const studioTemplatesPath = path.join(root, "tools", "cv-builder", "js", "cv-template-studio.js");
const productionTemplatesPath = path.join(root, "tools", "cv-builder", "js", "cv-pdf-templates.js");
const studioRegistryPath = path.join(root, "tools", "cv-builder", "js", "cv-template-registry-studio.js");
const expandedRenderersPath = path.join(root, "tools", "cv-builder", "js", "cv-template-expanded-renderers.js");
const expandedRegistryPath = path.join(root, "tools", "cv-builder", "js", "cv-template-registry-expanded.js");

const { templates } = require(registryPath);

const requiredFields = [
  "id",
  "name",
  "category",
  "countryFit",
  "industryFit",
  "experienceFit",
  "atsFriendly",
  "photoSupport",
  "layoutType",
  "colorAccent",
  "previewRenderer",
  "pdfRenderer",
  "printClass",
  "supportedSections",
  "maxRecommendedPages",
  "description",
  "status"
];

const validStatuses = new Set(["ready", "beta", "hidden"]);
const validLayouts = new Set(["one-column", "two-column", "sidebar", "executive", "graduate", "ats-plain"]);
const legacySource = fs.readFileSync(legacyTemplatesPath, "utf8");
const studioSource = fs.readFileSync(studioTemplatesPath, "utf8");
const productionSource = fs.readFileSync(productionTemplatesPath, "utf8");
const studioRegistrySource = fs.readFileSync(studioRegistryPath, "utf8");
const expandedRenderersSource = fs.readFileSync(expandedRenderersPath, "utf8");
const expandedRegistrySource = fs.readFileSync(expandedRegistryPath, "utf8");
const gallerySource = fs.readFileSync(galleryPath, "utf8");
const productionSandbox = {
  CVTemplates: {},
  CVApp: {},
  globalThis: {}
};
productionSandbox.window = productionSandbox;
vm.runInNewContext(productionSource, productionSandbox, { filename: productionTemplatesPath });
const productionRenderers = productionSandbox.CVTemplates || {};

function fail(message) {
  console.error("CV template registry verification failed: " + message);
  process.exit(1);
}

function rendererExists(id) {
  const safe = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const directFunction = new RegExp(safe + "\\s*:\\s*function").test(legacySource);
  const studioAssignment = new RegExp(safe + "\\s*=\\s*function").test(studioSource);
  const productionAssignment = typeof productionRenderers[id] === "function";
  return directFunction || studioAssignment || productionAssignment;
}

if (!Array.isArray(templates) || !templates.length) {
  fail("registry exports no templates");
}

const ids = new Set();
const visible = [];
const rendererIds = new Set();

templates.forEach((template, index) => {
  requiredFields.forEach((field) => {
    if (!(field in template)) fail(`template at index ${index} is missing ${field}`);
  });

  if (!template.id || typeof template.id !== "string") fail(`template at index ${index} has invalid id`);
  if (ids.has(template.id)) fail(`duplicate template id ${template.id}`);
  ids.add(template.id);

  if (!validStatuses.has(template.status)) fail(`${template.id} has invalid status ${template.status}`);
  if (!validLayouts.has(template.layoutType)) fail(`${template.id} has invalid layoutType ${template.layoutType}`);

  ["countryFit", "industryFit", "experienceFit", "supportedSections"].forEach((field) => {
    if (!Array.isArray(template[field]) || !template[field].length) fail(`${template.id} has invalid ${field}`);
  });

  if (typeof template.atsFriendly !== "boolean") fail(`${template.id} atsFriendly must be boolean`);
  if (typeof template.photoSupport !== "boolean") fail(`${template.id} photoSupport must be boolean`);
  if (!Number.isFinite(template.maxRecommendedPages) || template.maxRecommendedPages < 1) fail(`${template.id} has invalid maxRecommendedPages`);
  if (!template.printClass || typeof template.printClass !== "string") fail(`${template.id} has no printClass`);
  if (!template.previewRenderer || typeof template.previewRenderer !== "string") fail(`${template.id} has no previewRenderer`);
  if (template.status !== "hidden" && !rendererExists(template.previewRenderer)) fail(`${template.id} visible template renderer ${template.previewRenderer} was not found`);
  if (template.status !== "hidden" && rendererIds.has(template.previewRenderer)) fail(`${template.id} reuses renderer ${template.previewRenderer}; visible production templates must render differently`);
  if (template.status !== "hidden") rendererIds.add(template.previewRenderer);

  if (template.status === "ready" || template.status === "beta") visible.push(template);
});

if (visible.length !== 8) fail(`expected exactly 8 visible production templates, found ${visible.length}`);
const notReady = visible.filter((template) => template.status !== "ready");
if (notReady.length) fail(`all visible production templates must be ready; not ready: ${notReady.map((template) => template.id).join(", ")}`);

if (!gallerySource.includes("CVTemplateRegistry")) fail("gallery is not wired to CVTemplateRegistry");
if (/22 real templates/.test(gallerySource)) fail("gallery still contains unsupported '22 real templates' copy");
if (!/export-ready templates/.test(gallerySource)) fail("gallery does not use honest export-ready template count copy");

const hiddenIds = templates.filter((template) => template.status === "hidden").map((template) => template.id);
hiddenIds.forEach((id) => {
  const advertisedCard = new RegExp(`data-(tmpl|template-preview)=["']${id}["']`).test(gallerySource);
  if (advertisedCard) fail(`hidden template ${id} is hardcoded into the gallery`);
});

const expandedSandbox = {
  CVTemplates: {},
  CVApp: {},
  console,
  globalThis: null
};
expandedSandbox.window = expandedSandbox;
expandedSandbox.globalThis = expandedSandbox;
vm.runInNewContext(productionSource, expandedSandbox, { filename: productionTemplatesPath });
vm.runInNewContext(registrySource(), expandedSandbox, { filename: registryPath });
vm.runInNewContext(expandedRenderersSource, expandedSandbox, { filename: expandedRenderersPath });
vm.runInNewContext(expandedRegistrySource, expandedSandbox, { filename: expandedRegistryPath });

function registrySource() {
  return fs.readFileSync(registryPath, "utf8");
}

const expandedRegistry = expandedSandbox.CVTemplateRegistry;
if (!expandedRegistry || typeof expandedRegistry.visible !== "function") fail("expanded registry did not install");
const expandedVisible = expandedRegistry.visible();
const requiredExpandedIds = [
  "pan-african-minimal",
  "ats-plain",
  "global-compact",
  "lagos-corporate",
  "nairobi-tech",
  "accra-graduate",
  "cape-town-modern",
  "abuja-government",
  "kigali-developer",
  "cairo-bilingual",
  "francophone-standard",
  "morocco-french-arabic",
  "boardroom-executive",
  "ngo-impact",
  "me-officer",
  "teacher-education",
  "healthcare-clinical",
  "finance-admin",
  "sales-retail",
  "customer-support",
  "hospitality",
  "trade-skills",
  "driver-logistics",
  "construction-hse",
  "oil-gas-technical",
  "remote-assistant",
  "scholarship-academic",
  "creative-portfolio",
  "founder-consultant",
  "diaspora-relocation"
];

if (expandedVisible.length !== 30) fail(`expected exactly 30 expanded visible templates, found ${expandedVisible.length}`);
const expandedIds = new Set(expandedVisible.map((template) => template.id));
requiredExpandedIds.forEach((id) => {
  if (!expandedIds.has(id)) fail(`expanded registry is missing ${id}`);
});
expandedVisible.forEach((template) => {
  if (template.status !== "ready") fail(`${template.id} is not ready`);
  if (template.pdfRenderer !== "print-class") fail(`${template.id} does not use print-class PDF export`);
  if (!template.printClass) fail(`${template.id} is missing printClass`);
  if (!expandedRegistry.hasRenderer(template.id)) fail(`${template.id} has no expanded renderer`);
  const rendered = expandedRegistry.render(template.id, {
    fn: "Longlonglong",
    ln: "Applicant-Name-Example",
    email: "very.long.email.address@examplecareers.africa",
    phone: "+234 812 345 6789 / +254 712 345 678",
    summary: "Synthetic verification profile for export renderer checks.",
    exps: [{ t: "Role", c: "Company", d: "Improved reporting by 30%." }]
  });
  if (!rendered || !rendered.includes("cv-expanded-template")) fail(`${template.id} renderer returned unexpected output`);
});

if (!expandedRegistry.render("ats-plain", {}).includes('data-layout="text-first"')) fail("ATS Plain must render as text-first");
if (!expandedRegistry.render("global-compact", {}).includes('data-layout="text-first"')) fail("Global Compact must render as text-first");
const creativeTemplate = expandedRegistry.get("creative-portfolio");
if (!creativeTemplate || !creativeTemplate.warnings.join(" ").includes("Less ATS-safe")) fail("Creative Portfolio is not labeled less ATS-safe");

console.log(`CV template registry verified: base ${templates.length} registered, expanded ${expandedVisible.length} visible export-ready templates.`);
