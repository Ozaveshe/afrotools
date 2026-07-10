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
const outputPolishPath = path.join(root, "tools", "cv-builder", "js", "cv-template-output-polish.js");

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
const outputPolishSource = fs.existsSync(outputPolishPath) ? fs.readFileSync(outputPolishPath, "utf8") : "";
const gallerySource = fs.readFileSync(galleryPath, "utf8");
const productionSandbox = {
  CVTemplates: {},
  CVApp: {},
  globalThis: {}
};
productionSandbox.window = productionSandbox;
vm.runInNewContext(productionSource, productionSandbox, { filename: productionTemplatesPath });
if (outputPolishSource) {
  vm.runInNewContext(outputPolishSource, productionSandbox, { filename: outputPolishPath });
}
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

const outputSmokeData = {
  fn: "Amina",
  ln: "Okonkwo",
  title: "Operations Manager",
  email: "amina@example.com",
  phoneCode: "+234",
  phone: "8012345678",
  loc: "Lagos, Nigeria",
  linkedin: "linkedin.com/in/aminaokonkwo",
  summary: "Operations manager with measurable improvements across Nigerian teams. Experienced in vendor operations, reporting, and cross-functional delivery.",
  skills: {
    h: "Operations management, KPI reporting, Inventory control, Vendor onboarding, Process improvement",
    s: "Leadership, Communication, Stakeholder management",
    t: "Excel, Power BI, Notion, Zendesk"
  },
  exps: [
    { t: "Operations Manager", c: "BridgePoint", l: "Lagos", s: "2021-03", cur: true, d: "- Reduced order processing time by 28%.\n- Led a 12-person operations team across vendor support and reporting." },
    { t: "Operations Associate", c: "SwiftPay Africa", l: "Lagos", s: "2018-02", e: "2021-02", d: "- Coordinated onboarding for more than 450 SMEs.\n- Improved quality checks and reduced rejected applications." }
  ],
  edus: [{ deg: "B.Sc", sch: "University of Lagos", loc: "Lagos", y1: "2013", y2: "2017" }],
  certs: [{ n: "Project Management Training", i: "Lagos Business School", y: "2022" }],
  langs: [{ l: "English", lv: "Fluent" }, { l: "Igbo", lv: "Native" }],
  refs: [{ n: "Chinedu Eze", t: "Head of Operations", org: "BridgePoint", e: "chinedu@example.com", p: "+234 800 000 0000" }],
  showRefs: true,
  projs: [{ n: "Vendor Quality Dashboard", tech: "Power BI, Excel", d: "Dashboard for vendor delays, complaint trends, and manager follow-up." }],
  showProjs: true,
  extras: { awards: "Employee Excellence Award, 2023" },
  customSections: [],
  sp: true,
  nat: "Nigerian",
  so: "Anambra State",
  lga: "Awka South",
  nyscStatus: "Completed",
  nyscYear: "2018/2019",
  nyscState: "Lagos State"
};

visible.forEach((template) => {
  const renderer = productionRenderers[template.id] || productionRenderers[template.previewRenderer];
  if (typeof renderer !== "function") fail(`${template.id} has no production renderer after output polish`);
  const html = renderer(outputSmokeData, {}, template.colorAccent);
  if (!/cv-prod/.test(html)) fail(`${template.id} output is missing cv-prod root`);
  if (!/Amina/.test(html) || !/Okonkwo/.test(html)) fail(`${template.id} output does not render candidate name`);
  if (!/(Experience|Leadership|Programme|Engineering)/i.test(html)) fail(`${template.id} output does not render experience section`);
  if (!/(Education|Skills|Projects|Certifications)/i.test(html)) fail(`${template.id} output is missing core CV sections`);
  if (html.length < 4500) fail(`${template.id} output is too thin for a filled CV smoke fixture`);
  if (/tpl-skill-pill/.test(html)) fail(`${template.id} should not use oversized legacy skill pills`);
});

if (typeof productionRenderers.lagosCorporate === "function") {
  const lagosSmoke = productionRenderers.lagosCorporate(outputSmokeData, {}, "#d89b18");
  if (!/color:#ffffff!important/.test(lagosSmoke)) fail("Lagos Corporate header name must keep white contrast on navy");
  if (!/Service/.test(lagosSmoke)) fail("Lagos Corporate should render Nigerian service details when provided");
}

const hiddenIds = templates.filter((template) => template.status === "hidden").map((template) => template.id);
hiddenIds.forEach((id) => {
  const advertisedCard = new RegExp(`data-(tmpl|template-preview)=["']${id}["']`).test(gallerySource);
  if (advertisedCard) fail(`hidden template ${id} is hardcoded into the gallery`);
});

console.log(`CV template registry verified: ${templates.length} registered, ${visible.length} visible export-ready templates, ${templates.length - visible.length} hidden.`);
