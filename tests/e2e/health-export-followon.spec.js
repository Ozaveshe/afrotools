"use strict";
const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const pdfParse = require("pdf-parse");
const probes = require("../support/health-export-followon-probes");
const fixtures = require("../fixtures/health-export-followon/expected.json");

const normalizedPdf = (text) => text.replace(/\s+/g, " ").trim();
for (const [name, probe] of Object.entries(probes)) {
  test(`${name}: native health follow-on exports and invalidation`, async ({ page, baseURL }, testInfo) => {
    test.setTimeout(300000);
    const directory = testInfo.outputPath("downloads");
    fs.mkdirSync(directory, { recursive: true });
    const expected = fixtures[name];
    const result = await probe(page, baseURL, directory);
    expect(result.rows).toHaveLength(expected.expectedRows);
    for (const row of result.rows) {
      expect(row.overflow).toBe(0);
      expect(row.errors).toEqual([]);
      if (row.result || row.plan) {
        const id = name === "water" ? row.case : name === "vaccine" ? row.n : row.fixture.id;
        expect(row.result || row.plan).toEqual(expected.engines[`${row.lang}-${id}`]);
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
    if (name === "antenatal") expect(result.snapshots).toHaveLength(1);
    expect(fs.readdirSync(directory).sort()).toEqual([
      ...Object.keys(expected.textFiles), ...Object.keys(expected.calendarFiles), ...Object.keys(expected.pdfTextFiles)
    ].sort());
    for (const [file, text] of Object.entries({ ...expected.textFiles, ...expected.calendarFiles })) {
      expect(fs.readFileSync(path.join(directory, file), "utf8")).toBe(text);
    }
    for (const [file, text] of Object.entries(expected.pdfTextFiles)) {
      const parsed = await pdfParse(fs.readFileSync(path.join(directory, file)));
      expect(normalizedPdf(parsed.text)).toBe(normalizedPdf(text));
    }
    for (const file of Object.keys(expected.calendarFiles)) {
      const text = fs.readFileSync(path.join(directory, file), "utf8");
      expect(text).toContain("BEGIN:VCALENDAR\r\n");
      for (const line of text.split("\r\n")) expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    }
    await testInfo.attach("native-proof", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
  });
}
