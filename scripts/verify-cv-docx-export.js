#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

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

function fakeElement() {
  return {
    dataset: {},
    style: {},
    disabled: false,
    textContent: "",
    value: "",
    type: "",
    className: "",
    setAttribute() {},
    removeAttribute() {},
    appendChild() {},
    insertBefore() {},
    remove() {},
    click() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };
}

function createContext() {
  const downloads = [];
  const document = {
    readyState: "complete",
    documentElement: fakeElement(),
    body: fakeElement(),
    addEventListener() {},
    createElement() {
      return fakeElement();
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };
  const context = {
    console,
    Blob,
    TextEncoder,
    Uint8Array,
    Array,
    Date,
    Math,
    RegExp,
    String,
    Object,
    JSON,
    Error,
    URL: {
      createObjectURL() {
        return "blob:local";
      },
      revokeObjectURL() {}
    },
    setTimeout() {},
    clearTimeout() {},
    document,
    navigator: { clipboard: { writeText: async () => undefined } }
  };
  context.window = context;
  context.CVApp = {
    getState: () => ({ data: FIXTURE, country: "NG", template: "creative-portfolio" }),
    showToast() {},
    fmtMonth: (value) => value || ""
  };
  context.CVTemplateRegistry = {
    get: () => ({ atsFriendly: false, atsSafety: "Creative", photoSupport: true, category: "Creative", colorAccent: "#0B63CE" })
  };
  context.CVExportUpgrade = {
    filename: (ext, label) => "kelechi-amara-data-analyst-" + (label ? label.toLowerCase() + "-" : "") + "cv." + ext,
    downloadBlob: (blob, name) => downloads.push({ blob, name }),
    status() {},
    toast() {},
    track() {},
    handleExport() {}
  };
  context.CVExportAtsPlainPdf = {
    buildPdf: (plainText) => new TextEncoder().encode("%PDF-1.4\n" + plainText + "\n%%EOF"),
    exportAtsPdf: (plainText) => context.CVExportUpgrade.downloadBlob(new Blob([context.CVExportAtsPlainPdf.buildPdf(plainText)], { type: "application/pdf" }), "ats.pdf")
  };
  context.CVExportPdfQuality = {
    renderPreviewCanvas: async () => ({ width: 595, height: 841, toDataURL: () => "data:image/jpeg;base64,AAAA" })
  };
  context.loadPdfLibs = async () => undefined;
  context.jspdf = {
    jsPDF: function jsPDF() {
      return {
        internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
        addImage() {},
        addPage() {},
        output: () => new Blob(["%PDF-1.4 designed cv %%EOF"], { type: "application/pdf" })
      };
    }
  };
  context.CVApplicationPack = {
    generatePack: () => ({
      coverLetter: "Dear Hiring Team, I am applying for the Data Analyst role.",
      emailMessage: "Please find attached my application pack."
    })
  };
  return { context: vm.createContext(context), downloads };
}

function runModule(context, relativePath) {
  const filePath = path.join(ROOT, relativePath);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context, { filename: relativePath });
}

function packPanel() {
  const fields = {
    "[data-pack-role]": { value: "Data Analyst" },
    "[data-pack-company]": { value: "AfroSystems" },
    "[data-pack-jd]": { value: "SQL Power BI reporting" },
    "[data-pack-tone]": { value: "formal" }
  };
  return {
    querySelector(selector) {
      return fields[selector] || null;
    },
    querySelectorAll(selector) {
      if (selector !== "[data-pack-text]") return [];
      return [
        { dataset: { packText: "coverLetter" }, value: "Dear Hiring Team, I am applying for the Data Analyst role." },
        { dataset: { packText: "emailMessage" }, value: "Please find attached my application pack." }
      ];
    }
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { context } = createContext();
  runModule(context, "tools/cv-builder/js/cv-docx-export.js");
  runModule(context, "tools/cv-builder/js/cv-ats-plain-mode.js");
  runModule(context, "tools/cv-builder/js/cv-application-pack-export.js");

  const html = fs.readFileSync(path.join(ROOT, "tools/cv-builder/index.html"), "utf8");
  for (const script of ["cv-docx-export.js", "cv-ats-plain-mode.js", "cv-application-pack-export.js"]) {
    assert(html.includes(script), `CV Builder page does not load ${script}.`);
  }

  const exportSource = fs.readFileSync(path.join(ROOT, "tools/cv-builder/js/cv-docx-export.js"), "utf8");
  const packSource = fs.readFileSync(path.join(ROOT, "tools/cv-builder/js/cv-application-pack-export.js"), "utf8");
  for (const label of ["Designed PDF", "ATS Plain PDF", "DOCX", "TXT", "JSON backup"]) {
    assert(exportSource.includes(label), `Export panel source missing label: ${label}`);
  }
  assert(packSource.includes("Download Application Pack"), "Application Pack source missing download button label.");

  const atsText = context.CVAtsPlainMode.buildText();
  for (const heading of ["Summary", "Experience", "Education", "Skills", "Projects", "Certifications"]) {
    assert(atsText.includes(`\n${heading}\n`), `ATS text missing standard heading: ${heading}`);
  }
  assert(atsText.includes("Use this for job portals that prefer simple readable documents."), "ATS note is missing.");
  assert(!/[│┌┐└┘]/.test(atsText), "ATS text contains decorative line characters.");
  assert(!/<table|<img|<canvas/i.test(atsText), "ATS text contains markup-only layout.");
  assert(context.CVAtsPlainMode.templateWarning(), "Creative/photo template warning was not produced.");

  const docxBuffer = Buffer.from(await context.CVDocxExport.buildBlob().arrayBuffer());
  const docxEntries = readZipEntries(docxBuffer);
  assert(docxEntries.has("word/document.xml"), "DOCX missing editable document XML.");
  assert(docxEntries.has("word/numbering.xml"), "DOCX missing numbering XML.");
  const documentXml = docxEntries.get("word/document.xml").data.toString("utf8");
  assert(documentXml.includes("<w:numPr>"), "DOCX bullets are not real Word bullets.");
  assert(!Array.from(docxEntries.keys()).some((name) => name.startsWith("word/media/")), "DOCX should not embed screenshots or images.");

  const pack = await context.CVApplicationPackExport.buildApplicationPack(packPanel());
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
  fs.writeFileSync(zipPath, Buffer.from(await pack.blob.arrayBuffer()));
  const zipEntries = readZipEntries(fs.readFileSync(zipPath));
  assert(zipEntries.get("kelechi-amara-abdulrahman-chukwumereije-data-analyst-cv.txt").data.toString("utf8").includes("Data Analyst"), "ZIP TXT CV content missing.");
  assert(zipEntries.get("kelechi-amara-abdulrahman-chukwumereije-data-analyst-backup.json").data.toString("utf8").includes('"source": "afrotools-cv-builder"'), "ZIP JSON backup missing source.");

  console.log(`CV DOCX, ATS Plain, and Application Pack exports verified: ${path.relative(ROOT, zipPath)}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
