#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "audit-results", "cv-docx-export");

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
      d: "Improved monthly reporting cycle by 30% using dashboard templates.\nBuilt Power BI reports for 12 regional managers."
    }
  ],
  edus: [{ deg: "BSc Statistics", sch: "University of Lagos", loc: "Lagos, Nigeria", y1: "2016", y2: "2020", g: "Second Class Upper" }],
  skills: { h: "SQL, Excel, Power BI", s: "Communication, stakeholder management", t: "Microsoft 365, Google Sheets" },
  projs: [{ n: "Retail Sales Dashboard", tech: "Power BI", d: "Built a dashboard showing branch sales and weekly trend lines." }],
  certs: [{ n: "Google Data Analytics Certificate", i: "Coursera", y: "2023" }],
  langs: [{ l: "English", lv: "Fluent" }],
  showRefs: false
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readZipEntries(buffer) {
  const entries = new Map();
  let offset = 0;
  while (offset + 30 < buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature === 0x02014b50 || signature === 0x06054b50) break;
    if (signature !== 0x04034b50) {
      offset += 1;
      continue;
    }
    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = buffer.slice(nameStart, nameStart + nameLength).toString("utf8");
    const dataStart = nameStart + nameLength + extraLength;
    entries.set(name, { method, data: buffer.slice(dataStart, dataStart + compressedSize) });
    offset = dataStart + compressedSize;
  }
  return entries;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ timeout: 30000 });
  try {
    console.log("Starting CV export verifier harness...");
    const page = await browser.newPage();
    const requests = [];
    page.on("request", (request) => {
      requests.push({ method: request.method(), url: request.url() });
    });
    page.on("console", (message) => {
      if (message.type() === "error") throw new Error(`Console error: ${message.text()}`);
    });
    await page.setContent(
      [
        "<!doctype html><html><body>",
        '<section class="cv-export-options"><div class="cv-export-actions">',
        '<button data-cv-export="pdf">Download PDF</button>',
        '<button data-cv-export="ats-pdf">Download ATS Plain PDF</button>',
        '<button data-cv-export="text">Download text version</button>',
        '<button data-cv-export="json">JSON Backup</button>',
        "</div></section>",
        '<section class="cv-application-pack-panel"><div class="cv-pack-toolbar"></div>',
        '<input data-pack-role value="Data Analyst"><input data-pack-company value="AfroSystems">',
        '<textarea data-pack-jd>SQL Power BI reporting</textarea><select data-pack-tone><option value="formal">Formal</option></select>',
        '<textarea data-pack-text="coverLetter">Dear Hiring Team, I am applying for the Data Analyst role.</textarea>',
        '<textarea data-pack-text="emailMessage">Please find attached my application pack.</textarea>',
        "</section>",
        "</body></html>"
      ].join("")
    );
    console.log("Harness DOM ready.");
    await page.addScriptTag({
      content: `
        window.__downloads = [];
        window.CVApp = {
          getState: () => ({ data: ${JSON.stringify(FIXTURE)}, country: "NG", template: "creative-portfolio" }),
          showToast: () => {},
          fmtMonth: (value) => value || ""
        };
        window.CVTemplateRegistry = { get: () => ({ atsFriendly: false, atsSafety: "Creative", photoSupport: true, category: "Creative", colorAccent: "#0B63CE" }) };
        window.CVExportUpgrade = {
          filename: (ext, label) => "kelechi-amara-data-analyst-" + (label ? label.toLowerCase() + "-" : "") + "cv." + ext,
          downloadBlob: (blob, name) => { window.__downloads.push({ blob, name }); },
          status: () => {},
          toast: () => {},
          track: () => {},
          handleExport: () => {}
        };
        window.CVExportAtsPlainPdf = {
          buildPdf: (text) => new TextEncoder().encode("%PDF-1.4\\n" + text + "\\n%%EOF"),
          exportAtsPdf: (text) => window.CVExportUpgrade.downloadBlob(new Blob([window.CVExportAtsPlainPdf.buildPdf(text)], { type: "application/pdf" }), "ats.pdf")
        };
        window.CVExportPdfQuality = {
          renderPreviewCanvas: async () => {
            const canvas = document.createElement("canvas");
            canvas.width = 595; canvas.height = 841;
            canvas.getContext("2d").fillRect(0, 0, 595, 841);
            return canvas;
          }
        };
        window.loadPdfLibs = async () => {};
        window.jspdf = { jsPDF: function () {
          return {
            internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
            addImage: () => {},
            addPage: () => {},
            output: () => new Blob(["%PDF-1.4 designed cv %%EOF"], { type: "application/pdf" })
          };
        } };
        window.CVApplicationPack = {
          generatePack: () => ({
            coverLetter: "Dear Hiring Team, I am applying for the Data Analyst role.",
            emailMessage: "Please find attached my application pack."
          })
        };
      `
    });
    await page.addScriptTag({ path: path.join(ROOT, "tools/cv-builder/js/cv-docx-export.js") });
    await page.addScriptTag({ path: path.join(ROOT, "tools/cv-builder/js/cv-ats-plain-mode.js") });
    await page.addScriptTag({ path: path.join(ROOT, "tools/cv-builder/js/cv-application-pack-export.js") });
    console.log("Export modules loaded.");
    await page.waitForFunction(() => window.CVDocxExport && window.CVAtsPlainMode && window.CVApplicationPackExport);

    const atsText = await page.evaluate(() => window.CVAtsPlainMode.buildText());
    for (const heading of ["Summary", "Experience", "Education", "Skills", "Projects", "Certifications"]) {
      assert(atsText.includes(`\n${heading}\n`), `ATS text missing standard heading: ${heading}`);
    }
    assert(atsText.includes("Use this for job portals that prefer simple readable documents."), "ATS note is missing.");
    assert(!/[│┌┐└┘]/.test(atsText), "ATS text contains decorative line characters.");
    assert(!/<table|<img|<canvas/i.test(atsText), "ATS text contains markup-only layout.");
    assert(await page.evaluate(() => window.CVAtsPlainMode.templateWarning()).then(Boolean), "Creative/photo template warning was not produced.");
    console.log("ATS Plain export source verified.");

    const docxBuffer = Buffer.from(await page.evaluate(async () => Array.from(new Uint8Array(await window.CVDocxExport.buildBlob().arrayBuffer()))));
    const docxEntries = readZipEntries(docxBuffer);
    assert(docxEntries.has("word/document.xml"), "DOCX missing editable document XML.");
    assert(docxEntries.has("word/numbering.xml"), "DOCX missing numbering XML.");
    const documentXml = docxEntries.get("word/document.xml").data.toString("utf8");
    assert(documentXml.includes("<w:numPr>"), "DOCX bullets are not real Word bullets.");
    assert(!Array.from(docxEntries.keys()).some((name) => name.startsWith("word/media/")), "DOCX should not embed screenshots or images.");
    console.log("DOCX structure verified.");

    await page.evaluate(() => window.CVExportUpgrade.render && window.CVExportUpgrade.render());
    await page.waitForTimeout(100);
    const labels = await page.$$eval(".cv-export-actions [data-cv-export], [data-pack-download]", (buttons) => buttons.map((button) => button.textContent.trim()));
    for (const label of ["Designed PDF", "ATS Plain PDF", "DOCX", "TXT", "JSON backup", "Download Application Pack"]) {
      assert(labels.includes(label), `Missing export control label: ${label}`);
    }
    console.log("Export controls verified.");

    const pack = await page.evaluate(async () => {
      const result = await window.CVApplicationPackExport.buildApplicationPack(document.querySelector(".cv-application-pack-panel"));
      return { filename: result.filename, entries: result.entries, bytes: Array.from(new Uint8Array(await result.blob.arrayBuffer())) };
    });
    assert(pack.filename === "kelechi-amara-abdulrahman-chukwumereije-data-analyst-application-pack.zip", "Unexpected ZIP filename: " + pack.filename);
    const unsafe = pack.entries.find((name) => /[^a-z0-9._-]/.test(name));
    assert(!unsafe, "Unsafe character in ZIP entry filename: " + unsafe);
    for (const expected of [
      "kelechi-amara-abdulrahman-chukwumereije-data-analyst-cv.pdf",
      "kelechi-amara-abdulrahman-chukwumereije-data-analyst-ats-plain-cv.pdf",
      "kelechi-amara-abdulrahman-chukwumereije-data-analyst-cv.docx",
      "kelechi-amara-abdulrahman-chukwumereije-data-analyst-cv.txt",
      "kelechi-amara-abdulrahman-chukwumereije-data-analyst-cover-letter.txt",
      "kelechi-amara-abdulrahman-chukwumereije-data-analyst-cover-letter.pdf",
      "kelechi-amara-abdulrahman-chukwumereije-data-analyst-application-email.txt",
      "kelechi-amara-abdulrahman-chukwumereije-data-analyst-backup.json"
    ]) {
      assert(pack.entries.includes(expected), `ZIP missing expected entry: ${expected}`);
    }
    const zipPath = path.join(OUT_DIR, pack.filename);
    fs.writeFileSync(zipPath, Buffer.from(pack.bytes));
    const zipEntries = readZipEntries(Buffer.from(pack.bytes));
    assert(zipEntries.get("kelechi-amara-abdulrahman-chukwumereije-data-analyst-cv.txt").data.toString("utf8").includes("Data Analyst"), "ZIP TXT CV content missing.");
    assert(zipEntries.get("kelechi-amara-abdulrahman-chukwumereije-data-analyst-backup.json").data.toString("utf8").includes('"source": "afrotools-cv-builder"'), "ZIP JSON backup missing source.");
    assert(!requests.some((request) => request.method !== "GET"), "Export flow made a non-GET request.");
    console.log("Application Pack ZIP verified.");

    console.log(`CV DOCX, ATS Plain, and Application Pack exports verified: ${path.relative(ROOT, zipPath)}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
