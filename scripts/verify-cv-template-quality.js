#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const pdfParse = require("pdf-parse");
const { chromium } = require("@playwright/test");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "audit-results", "cv-template-quality");
const PROGRESS_PATH = path.join(OUT_DIR, "progress.log");
const REQUESTED_PORT = Number(process.env.CV_TEMPLATE_QUALITY_PORT || 0);
let activePort = REQUESTED_PORT;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf"
};

const FIXTURE = {
  fn: "Kelechi-Amara Oluwaseun Nkeiruka",
  ln: "Abdulrahman-Chukwumereije",
  name: "Kelechi-Amara Oluwaseun Nkeiruka Abdulrahman-Chukwumereije",
  title: "Senior Programme Operations and Data Systems Specialist",
  email: "kelechi.abdulrahman-chukwumereije.long.email@examplecareers.africa",
  phoneCode: "+234",
  phone: "812 345 6789",
  altPhone: "+254 712 345 678",
  loc: "Lagos, Nigeria / Nairobi, Kenya",
  linkedin: "https://linkedin.com/in/kelechi-amara-abdulrahman-chukwumereije",
  li: "https://linkedin.com/in/kelechi-amara-abdulrahman-chukwumereije",
  github: "https://github.com/kelechi-amara-systems",
  web: "https://github.com/kelechi-amara-systems",
  portfolio: "https://github.com/kelechi-amara-systems",
  summary: "Operations and data systems specialist with experience coordinating multi-country programmes, building reporting dashboards, and improving field delivery across African markets. Strong record in stakeholder management, compliance documentation, training, analytics, and practical implementation support.",
  skills: {
    h: "SQL, Excel, Power BI, Looker Studio, data cleaning, dashboard design, project coordination, monitoring and evaluation",
    s: "Stakeholder communication, training facilitation, documentation, problem solving, team coordination, vendor management",
    t: "Google Workspace, Microsoft 365, Airtable, Jira, Notion, KoboToolbox, CRM reporting, GitHub issue tracking"
  },
  exps: [
    {
      t: "Regional Operations Lead",
      c: "AfroSystems Analytics and Programme Delivery Ltd",
      l: "Lagos / Remote",
      s: "2023-02",
      e: "",
      cur: true,
      d: "Improved monthly reporting cycle by 38% using dashboard templates and weekly data-quality reviews.\nCoordinated 12 country launch checklists with field teams, vendors, and programme managers.\nBuilt onboarding documentation for 86 staff and partner users across Nigeria, Kenya, Ghana, and Rwanda.\nManaged weekly risk reviews covering data quality, training gaps, vendor blockers, and unresolved support issues.\nPrepared country-by-country implementation notes for senior programme leads and local delivery teams.\nReduced duplicate reporting requests by introducing a shared evidence folder and naming convention.\nSupported budget tracking, field logistics, and stakeholder updates during multi-market launch periods."
    },
    {
      t: "Monitoring and Evaluation Officer",
      c: "GreenBridge Development Initiative",
      l: "Accra, Ghana",
      s: "2020-04",
      e: "2023-01",
      cur: false,
      d: "Managed indicator tracking for education and livelihood projects serving 14,500 learners and community members.\nReduced late field reports by 29% through simple mobile templates, validation checks, and supervisor reminders.\nPrepared donor-ready summaries, lessons learned, and evidence packs for quarterly reviews.\nReviewed attendance, training, stipend, and beneficiary feedback data before monthly programme meetings.\nCreated simple charts that helped field coordinators identify districts needing additional coaching.\nDocumented assumptions, data gaps, and follow-up actions so donor reports were easier to audit.\nWorked with finance and operations colleagues to reconcile activity records against payment schedules."
    },
    {
      t: "Customer Operations Analyst",
      c: "Nairobi Market Support Hub",
      l: "Nairobi, Kenya",
      s: "2017-08",
      e: "2020-03",
      cur: false,
      d: "Analysed 42,000 support tickets to identify repeated onboarding, payment, and fulfilment issues.\nCreated weekly quality reports that helped managers improve first-contact resolution from 63% to 81%.\nTrained 24 agents on practical documentation, escalation notes, and customer follow-up workflows.\nBuilt a simple issue taxonomy used by support leads to group refund, delivery, payment, and account problems.\nPrepared daily summaries for operations managers during high-volume campaign and seasonal sales periods.\nReduced repeated escalation notes by introducing a short checklist for agents and quality reviewers.\nWorked with product teams to prioritise fixes based on customer impact, frequency, and revenue risk."
    }
  ],
  edus: [
    {
      deg: "MSc Development Management and Data Systems",
      sch: "University of Manchester",
      loc: "United Kingdom",
      y1: "2021",
      y2: "2023",
      g: "Merit",
      d: "Dissertation focused on practical data systems for programme delivery, reporting quality, and field team decision-making."
    },
    {
      deg: "BSc Statistics",
      sch: "University of Lagos",
      loc: "Lagos, Nigeria",
      y1: "2013",
      y2: "2017",
      g: "Second Class Upper",
      d: "Coursework included statistical modelling, survey methods, database management, and applied business analysis."
    }
  ],
  projects: [
    {
      name: "Pan-African Programme Dashboard",
      n: "Pan-African Programme Dashboard",
      tech: "Power BI, SQL, KoboToolbox",
      desc: "Reusable dashboard pack for programme managers comparing delivery, risk, training completion, and reporting quality.",
      d: "Reusable dashboard pack for programme managers comparing delivery, risk, training completion, and reporting quality."
    },
    {
      name: "Field Training Playbook",
      n: "Field Training Playbook",
      tech: "Notion, Google Docs, Airtable",
      desc: "Simple training library with onboarding modules, checklists, and country-specific field notes.",
      d: "Simple training library with onboarding modules, checklists, and country-specific field notes."
    }
  ],
  projs: [
    {
      n: "Pan-African Programme Dashboard",
      tech: "Power BI, SQL, KoboToolbox",
      d: "Reusable dashboard pack for programme managers comparing delivery, risk, training completion, and reporting quality."
    },
    {
      n: "Field Training Playbook",
      tech: "Notion, Google Docs, Airtable",
      d: "Simple training library with onboarding modules, checklists, and country-specific field notes."
    }
  ],
  certs: [
    { name: "Google Data Analytics Certificate", n: "Google Data Analytics Certificate", issuer: "Google", i: "Google", year: "2024", y: "2024" },
    { name: "Project Management Certificate", n: "Project Management Certificate", issuer: "PMI Chapter", i: "PMI Chapter", year: "2023", y: "2023" }
  ],
  languages: ["English - fluent", "French - working proficiency", "Yoruba - fluent", "Swahili - basic"],
  langs: [
    { l: "English", lv: "Fluent" },
    { l: "French", lv: "Working proficiency" },
    { l: "Yoruba", lv: "Fluent" },
    { l: "Swahili", lv: "Basic" }
  ],
  references: ["Available on request"],
  refs: [
    {
      name: "References available on request",
      n: "References available on request",
      t: "Provided when requested",
      org: "Professional references",
      p: "",
      e: ""
    }
  ]
};

const CRITICAL_TEXT = [
  "Kelechi",
  "Regional Operations Lead",
  "Monitoring and Evaluation Officer",
  "Customer Operations Analyst",
  "University of Lagos",
  "References available on request"
];

function serveFile(req, res) {
  const requestUrl = new URL(req.url, `http://127.0.0.1:${activePort || 4173}`);
  let target = decodeURIComponent(requestUrl.pathname);
  if (target.endsWith("/")) target += "index.html";
  if (!path.extname(target)) target += "/index.html";
  const file = path.normalize(path.join(ROOT, target));
  if (!file.toLowerCase().startsWith(ROOT.toLowerCase())) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(data);
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(serveFile);
    server.on("error", reject);
    server.listen(REQUESTED_PORT, "127.0.0.1", () => {
      activePort = server.address().port;
      resolve(server);
    });
  });
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true, timeout: 15000 });
  } catch (error) {
    return chromium.launch({ headless: true, channel: "chrome", timeout: 15000 });
  }
}

function slug(value) {
  return String(value || "cv").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "cv";
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(message);
  fs.appendFileSync(PROGRESS_PATH, line + "\n");
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function setFixture(page, templateId) {
  await page.evaluate(({ fixture, templateId }) => {
    const state = window.CVApp.getState();
    state.data = Object.assign({}, state.data || {}, JSON.parse(JSON.stringify(fixture)));
    state.template = templateId;
    state.country = "NG";
    if (window.CVApp.setTopState) window.CVApp.setTopState("template", templateId);
    if (window.CVApp.renderAll) window.CVApp.renderAll();
    else if (window.CVApp.renderPreview) window.CVApp.renderPreview();
    if (window.CVTemplateRegistry && window.CVTemplateRegistry.hasRenderer(templateId)) {
      const preview = document.querySelector("#cvpreview");
      if (preview) {
        preview.innerHTML = window.CVTemplateRegistry.render(templateId, state.data, state.country);
        window.CVTemplateRegistry.decoratePreview(preview, templateId);
      }
    }
  }, { fixture: FIXTURE, templateId });
  await page.waitForFunction((id) => {
    const preview = document.querySelector("#cvpreview");
    return preview && preview.getAttribute("data-template-id") === id && preview.innerText.includes("Kelechi-Amara");
  }, templateId, { timeout: 10000 });
}

async function collectLayout(page, templateId) {
  return page.evaluate((templateId) => {
    function cleanText(value) {
      return String(value || "").replace(/\s+/g, " ").trim();
    }

    function rectOf(el) {
      const rect = el.getBoundingClientRect();
      return {
        selector: el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(/\s+/).filter(Boolean).slice(0, 2).join(".") : ""),
        text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 90),
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
    }

    function intersects(a, b) {
      const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return x > 4 && y > 4;
    }

    const preview = document.querySelector("#cvpreview");
    const root = preview && (preview.querySelector(".cv-expanded-template") || preview.firstElementChild);
    const issues = [];
    if (!root) return { templateId, issues: ["Preview root not found"], height: 0, text: "" };

    const rootRect = root.getBoundingClientRect();
    const elements = Array.from(root.querySelectorAll("h1,h2,p,li,.cvx-contact,.cvx-role,.cvx-muted,.cvx-row,.cvx-chips span,.cvx-strip span,.cvx-item,.cvx-section"))
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 1 && rect.height > 1 && style.visibility !== "hidden" && style.display !== "none";
      });

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > rootRect.right + 3 || rect.left < rootRect.left - 3) {
        issues.push("Content extends outside page width: " + rectOf(el).text);
      }
      if (el.scrollWidth > el.clientWidth + 3 && getComputedStyle(el).overflowX === "hidden") {
        issues.push("Horizontal text clipping: " + rectOf(el).text);
      }
      if (el.scrollHeight > el.clientHeight + 3 && getComputedStyle(el).overflowY === "hidden") {
        issues.push("Vertical text clipping: " + rectOf(el).text);
      }
    });

    const blocks = elements.filter((el) => /^(H1|H2|P|LI|SECTION|ARTICLE)$/.test(el.tagName) || el.classList.contains("cvx-contact") || el.classList.contains("cvx-role"));
    for (let i = 0; i < blocks.length; i += 1) {
      for (let j = i + 1; j < blocks.length; j += 1) {
        const a = blocks[i];
        const b = blocks[j];
        if (a.contains(b) || b.contains(a)) continue;
        const ar = rectOf(a);
        const br = rectOf(b);
        if (!ar.text || !br.text) continue;
        if (intersects(ar, br)) {
          issues.push("Possible text overlap: " + ar.text + " / " + br.text);
        }
      }
    }

    Array.from(root.querySelectorAll(".cvx-row")).forEach((row) => {
      const strong = row.querySelector("strong");
      const date = row.querySelector("span");
      if (!strong || !date || !/\b(19|20)\d{2}|Present|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i.test(date.textContent || "")) return;
      const sr = strong.getBoundingClientRect();
      const dr = date.getBoundingClientRect();
      if (Math.abs(sr.top - dr.top) > 18) {
        issues.push("Date baseline misaligned: " + (strong.textContent || "").trim());
      }
      if (dr.width < 20 || dr.right > rootRect.right + 3) {
        issues.push("Date clipped or outside page: " + (date.textContent || "").trim());
      }
    });

    const rootStyle = getComputedStyle(root);
    if (rootStyle.overflowY === "hidden" || rootStyle.overflow === "hidden") {
      issues.push("Template root hides overflow; long CVs may clip instead of flowing to another page.");
    }

    const text = root.innerText || "";
    ["Regional Operations Lead", "Monitoring and Evaluation Officer", "Customer Operations Analyst", "University of Lagos", "References available on request"].forEach((token) => {
      if (!text.includes(token)) issues.push("Missing fixture text in preview: " + token);
    });

    return {
      templateId,
      issues,
      height: Math.round(rootRect.height),
      pageCountEstimate: Math.max(1, Math.ceil(rootRect.height / 841)),
      text: cleanText(text).slice(0, 4000)
    };
  }, templateId);
}

async function verifyPdf(pdfPage, template, html, outDir) {
  const fileName = `${slug(template.id)}-${slug(template.name)}.pdf`;
  const pdfPath = path.join(outDir, fileName);
  await pdfPage.setContent(`<!doctype html><html><head><meta charset="utf-8"><title>${template.name}</title><style>@page{size:A4;margin:0}body{margin:0;background:#fff}</style></head><body>${html}</body></html>`, { waitUntil: "load" });
  await pdfPage.emulateMedia({ media: "print" });
  await pdfPage.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" }
  });
  const parsed = await pdfParse(fs.readFileSync(pdfPath));
  const text = normalizeText(parsed.text || "");
  const missing = [
    "Kelechi",
    "Regional Operations Lead",
    "Monitoring and Evaluation Officer",
    "Customer Operations Analyst",
    "University of Lagos"
  ].filter((token) => !text.includes(token));
  return {
    path: path.relative(ROOT, pdfPath).replace(/\\/g, "/"),
    pages: parsed.numpages || 0,
    textLength: text.length,
    selectable: text.length > 800 && missing.length === 0,
    missing
  };
}

async function verify() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(PROGRESS_PATH, "");
  const server = await startServer();
  const appUrl = `http://127.0.0.1:${activePort}/tools/cv-builder/`;
  log(`CV template quality server: ${appUrl}`);
  const browser = await launchBrowser();
  log("Browser launched for CV template quality checks.");
  const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1440, height: 1200 } });
  const pdfPage = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const report = {
    url: appUrl,
    fixture: {
      fullName: FIXTURE.name,
      phones: [`${FIXTURE.phoneCode} ${FIXTURE.phone}`, FIXTURE.altPhone],
      skills: 15,
      jobs: FIXTURE.exps.length,
      education: FIXTURE.edus.length,
      references: "Available on request"
    },
    templates: []
  };

  try {
    log("Opening CV Builder...");
    await page.goto(appUrl, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.CVTemplateRegistry && window.CVApp && window.CVExpandedTemplateCatalog, null, { timeout: 15000 });
    const templates = await page.evaluate(() => window.CVTemplateRegistry.visible().map((template) => ({
      id: template.id,
      name: template.name,
      layoutType: template.layoutType,
      pdfRenderer: template.pdfRenderer
    })));
    assert(templates.length === 30, `Expected 30 templates, found ${templates.length}`);

    for (const template of templates) {
      log(`Checking ${template.id}...`);
      await setFixture(page, template.id);
      const screenLayout = await collectLayout(page, template.id);
      const screenText = await page.locator("#cvpreview").innerText();
      const screenshotPath = path.join(OUT_DIR, `${String(templates.indexOf(template) + 1).padStart(2, "0")}-${slug(template.id)}.png`);
      await page.locator("#cvpreview").screenshot({ path: screenshotPath });

      await page.emulateMedia({ media: "print" });
      const printText = await page.locator("#cvpreview").innerText();
      await page.emulateMedia({ media: "screen" });
      const printMissing = CRITICAL_TEXT.filter((token) => !normalizeText(printText).includes(token));
      const printDelta = printMissing.length ? [`Print preview is missing critical screen text: ${printMissing.join(", ")}`] : [];

      const previewHtml = await page.locator("#cvpreview").evaluate((el) => el.innerHTML);
      const pdf = await verifyPdf(pdfPage, template, previewHtml, OUT_DIR);
      const issues = screenLayout.issues.concat(printDelta);
      if (!pdf.selectable) issues.push(`PDF text is not fully selectable/extractable; missing: ${pdf.missing.join(", ") || "none"}, textLength=${pdf.textLength}`);
      if (pdf.pages < 2) issues.push("Long fixture did not produce a multi-page PDF.");

      report.templates.push({
        id: template.id,
        name: template.name,
        layoutType: template.layoutType,
        pageCountEstimate: screenLayout.pageCountEstimate,
        previewHeight: screenLayout.height,
        screenshot: path.relative(ROOT, screenshotPath).replace(/\\/g, "/"),
        pdf,
        issues
      });
    }

    report.consoleErrors = consoleErrors;
    const failures = report.templates.filter((template) => template.issues.length);
    if (consoleErrors.length) failures.push({ id: "console", issues: consoleErrors });
    fs.writeFileSync(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));
    if (failures.length) {
      throw new Error(`CV template quality failed for ${failures.length} item(s). See ${path.relative(ROOT, path.join(OUT_DIR, "report.json"))}`);
    }
    log(`CV template quality verified: ${templates.length} templates, ${templates.length} PDF render exports, ${templates.length} screenshots.`);
    log(`Report: ${path.relative(ROOT, path.join(OUT_DIR, "report.json"))}`);
  } finally {
    await browser.close().catch(() => {});
    await new Promise((resolve) => server.close(resolve));
  }
}

verify().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
