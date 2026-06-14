#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("@playwright/test");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "audit-results", "cv-docx-export");
const REQUESTED_PORT = Number(process.env.CV_DOCX_EXPORT_PORT || 0);

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
  ".woff2": "font/woff2"
};

const FIXTURE = {
  fn: "Kelechi-Amara",
  ln: "Abdulrahman-Chukwumereije",
  title: "Data Analyst",
  email: "kelechi.abdulrahman.long.email@examplecareers.africa",
  phoneCode: "+234",
  phone: "812 345 6789",
  altPhone: "+254 712 345 678",
  loc: "Lagos, Nigeria",
  linkedin: "https://linkedin.com/in/kelechi-amara-demo",
  github: "https://github.com/kelechi-demo",
  summary: "Data analyst with experience cleaning operational data, building dashboards, and improving reporting workflows for African teams.",
  exps: [
    {
      t: "Data Analyst",
      c: "AfroSystems Analytics",
      l: "Lagos, Nigeria",
      s: "2022-03",
      e: "",
      cur: true,
      d: "Improved monthly reporting cycle by 30% using dashboard templates.\nBuilt Power BI reports for 12 regional managers.\nCleaned weekly sales data from 18 branches."
    },
    {
      t: "Operations Intern",
      c: "Market Support Hub",
      l: "Nairobi, Kenya",
      s: "2020-01",
      e: "2022-02",
      cur: false,
      d: "Prepared weekly customer support summaries.\nTracked fulfilment issues and shared trends with team leads."
    }
  ],
  edus: [
    {
      deg: "BSc Statistics",
      sch: "University of Lagos",
      loc: "Lagos, Nigeria",
      y1: "2016",
      y2: "2020",
      g: "Second Class Upper"
    }
  ],
  skills: {
    h: "SQL, Excel, Power BI, data cleaning, dashboard design",
    s: "Communication, stakeholder management, problem solving",
    t: "Microsoft 365, Google Sheets, Looker Studio"
  },
  projs: [
    {
      n: "Retail Sales Dashboard",
      tech: "Power BI, Excel",
      d: "Built a dashboard showing branch sales, stock gaps, and weekly trend lines."
    }
  ],
  certs: [{ n: "Google Data Analytics Certificate", i: "Coursera", y: "2023" }],
  langs: [
    { l: "English", lv: "Fluent" },
    { l: "Yoruba", lv: "Native" }
  ],
  showRefs: false
};

function serveFile(req, res) {
  const requestUrl = new URL(req.url, "http://127.0.0.1");
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/") pathname = "/index.html";
  if (pathname.endsWith("/")) pathname += "index.html";
  const safePath = path.normalize(path.join(ROOT, pathname));
  if (!safePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(safePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(safePath)] || "application/octet-stream" });
    res.end(data);
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(serveFile);
    server.on("error", reject);
    server.listen(REQUESTED_PORT, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
  });
}

function readUInt(buffer, offset) {
  return buffer.readUInt32LE(offset);
}

function unzipStoredDocx(buffer) {
  const entries = new Map();
  let offset = 0;
  while (offset + 30 < buffer.length) {
    const signature = readUInt(buffer, offset);
    if (signature === 0x02014b50 || signature === 0x06054b50) break;
    if (signature !== 0x04034b50) {
      offset += 1;
      continue;
    }
    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = readUInt(buffer, offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = buffer.slice(nameStart, nameStart + nameLength).toString("utf8");
    const dataStart = nameStart + nameLength + extraLength;
    const data = buffer.slice(dataStart, dataStart + compressedSize);
    entries.set(name, { method, data });
    offset = dataStart + compressedSize;
  }
  return entries;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { server, port } = await startServer();
  const browser = await chromium.launch();
  const requests = [];
  try {
    const page = await browser.newPage();
    page.on("request", (request) => {
      requests.push({ method: request.method(), url: request.url() });
    });
    page.on("console", (message) => {
      if (message.type() === "error") {
        throw new Error(`Console error during DOCX export: ${message.text()}`);
      }
    });
    await page.addInitScript((fixture) => {
      localStorage.setItem(
        "afro_cv_data",
        JSON.stringify({
          data: fixture,
          country: "NG",
          template: "global-compact",
          accentColor: "var(--color-primary)",
          accentHex: "#0B63CE"
        })
      );
    }, FIXTURE);
    await page.goto(`http://127.0.0.1:${port}/tools/cv-builder/`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.CVDocxExport && window.CVExportUpgrade && window.CVApp);
    await page.evaluate(() => window.CVExportUpgrade.render());
    await page.waitForSelector('[data-cv-export="docx"]');

    const labels = await page.$$eval(".cv-export-actions [data-cv-export]", (buttons) =>
      buttons.map((button) => button.textContent.trim())
    );
    for (const label of ["Designed PDF", "ATS Plain PDF", "DOCX", "TXT", "JSON backup"]) {
      assert(labels.includes(label), `Missing export option label: ${label}`);
    }
    const docxDisabled = await page.$eval('[data-cv-export="docx"]', (button) => button.disabled);
    assert(!docxDisabled, "DOCX button should be enabled when browser DOCX writer is available.");

    const downloadPromise = page.waitForEvent("download");
    await page.click('[data-cv-export="docx"]');
    const download = await downloadPromise;
    const downloadPath = path.join(OUT_DIR, download.suggestedFilename());
    await download.saveAs(downloadPath);

    const buffer = fs.readFileSync(downloadPath);
    const entries = unzipStoredDocx(buffer);
    for (const name of [
      "[Content_Types].xml",
      "_rels/.rels",
      "word/document.xml",
      "word/styles.xml",
      "word/numbering.xml",
      "docProps/core.xml",
      "docProps/app.xml"
    ]) {
      assert(entries.has(name), `DOCX missing required part: ${name}`);
      assert(entries.get(name).method === 0, `Unexpected compression method for ${name}`);
    }
    const documentXml = entries.get("word/document.xml").data.toString("utf8");
    const numberingXml = entries.get("word/numbering.xml").data.toString("utf8");
    for (const text of [
      "Kelechi-Amara",
      "Data Analyst",
      "Summary",
      "Experience",
      "Education",
      "Skills",
      "Projects",
      "Certifications",
      "Languages",
      "References"
    ]) {
      assert(documentXml.includes(text), `DOCX document XML missing expected text: ${text}`);
    }
    assert(documentXml.includes("<w:numPr>"), "DOCX bullets are not using Word numbering.");
    assert(numberingXml.includes('<w:numFmt w:val="bullet"/>'), "DOCX numbering does not define real bullets.");
    assert(!Array.from(entries.keys()).some((name) => name.startsWith("word/media/")), "DOCX should not embed images.");
    assert(!/<w:drawing|<a:blip|<w:pict/.test(documentXml), "DOCX should not use image/drawing fallback.");

    const rawMarkers = [FIXTURE.email, FIXTURE.phone, FIXTURE.linkedin];
    const leakedRequest = requests.find((request) => {
      if (request.method !== "POST") return false;
      return rawMarkers.some((marker) => request.url.includes(marker));
    });
    assert(!leakedRequest, "DOCX export sent private CV content to a server request.");

    console.log(`CV DOCX export verified: ${path.relative(ROOT, downloadPath)}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
