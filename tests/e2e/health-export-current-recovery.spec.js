"use strict";
const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const pdfParse = require("pdf-parse");
const probes = require("../support/health-export-recovery-probes");
const fixtures = require("../fixtures/health-export-recovery/expected.json");

const normalizedPdf = (text) => text.replace(/\s+/g, " ").trim();
for (const [name, probe] of Object.entries(probes)) {
  test(`${name}: native downloaded reports and result validity`, async ({ page, baseURL }, testInfo) => {
    test.setTimeout(240000);
    const directory = testInfo.outputPath("downloads");
    fs.mkdirSync(directory, { recursive: true });
    const expected = fixtures[name];
    const result = await probe(page, baseURL, directory, expected);
    expect(result.rows).toHaveLength(expected.expectedRows);
    for (const row of result.rows) {
      expect(row.overflow).toBe(0);
      if (row.errors) expect(row.errors).toEqual([]);
      if (row.result && name !== "cycle") {
        const key = name === "fluid" ? `${row.lang}-${row.target}` : name === "waist" ? `${row.lang}-${row.input.id}` : row.lang;
        expect(row.result).toEqual(expected.engines[key]);
      }
      if (row.edits) for (const edit of row.edits) {
        expect(edit.disabled).toBe(true);
        expect(edit.printDisabled).toBe(true);
      }
    }
    if (name === "blood_pressure") {
      expect(result.asyncRows).toHaveLength(3);
      for (const row of result.asyncRows) {
        expect(row.downloads).toBe(0);
        expect(row.afterEdit).toBeNull();
      }
    }
    const actualFiles = fs.readdirSync(directory).sort();
    expect(actualFiles).toEqual([...Object.keys(expected.textFiles), ...Object.keys(expected.pdfTextFiles)].sort());
    for (const [file, text] of Object.entries(expected.textFiles)) {
      expect(fs.readFileSync(path.join(directory, file), "utf8")).toBe(text);
    }
    for (const [file, text] of Object.entries(expected.pdfTextFiles)) {
      const parsed = await pdfParse(fs.readFileSync(path.join(directory, file)));
      expect(normalizedPdf(parsed.text)).toBe(normalizedPdf(text));
    }
    await testInfo.attach("native-proof", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
  });
}
