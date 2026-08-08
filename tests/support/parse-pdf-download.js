"use strict";

const fs = require("node:fs");
const path = require("node:path");
const pdfjs = require("../../assets/vendor/pdfjs/pdf.min.js");

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("PDF file path is required.");
  pdfjs.GlobalWorkerOptions.workerSrc = path.resolve(__dirname, "../../assets/vendor/pdfjs/pdf.worker.min.js");
  console.log = function () {};
  console.warn = function () {};
  const parsed = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)) }).promise;
  const firstPage = await parsed.getPage(1);
  const text = await firstPage.getTextContent();
  process.stdout.write(JSON.stringify({ numpages: parsed.numPages, textItems: text.items.length }));
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
