"use strict";
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const sha = data => crypto.createHash("sha256").update(data).digest("hex");
let sequence = 0;
const prior = [];
function packageIdentity() {
  const entry = require.resolve("pdf-parse"), root = path.dirname(entry);
  const files = ["package.json", "index.js", "lib/pdf-parse.js", "lib/pdf.js/v1.10.100/build/pdf.js", "lib/pdf.js/v1.10.100/build/pdf.worker.js"];
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const ensure = require.resolve("node-ensure", { paths: [root] });
  return { version: pkg.version, files: files.map(file => ({ file, sha256: sha(fs.readFileSync(path.join(root, file))) })), nodeEnsureEntrySha256: sha(fs.readFileSync(ensure)) };
}
async function readHealthPdf(file, testInfo, pdfParse) {
  // Preserve downloaded bytes; the pinned legacy parser requires an exact backing buffer.
  const data = fs.readFileSync(file), preservedBeforeParse = Buffer.from(data);
  // PDF.js v1.10.100 Stream.makeSubStream drops byteOffset when it uses .buffer.
  // Uint8Array.from creates an exact, unpooled backing buffer without changing bytes.
  const parserInput = Uint8Array.from(data);
  const directory = testInfo.outputPath("pdf-reader-diagnostics");
  fs.mkdirSync(directory, { recursive: true });
  const call = ++sequence, filename = "call-" + String(call).padStart(4, "0") + ".json";
  const numericEnv = key => /^\d+$/.test(process.env[key] || "") ? process.env[key] : null;
  const metadata = { phase: "before", observedBeforeParseAt: new Date().toISOString(), sequence: call, pid: process.pid, testId: testInfo.testId,
    titlePathSha256: sha(JSON.stringify(testInfo.titlePath)), workerIndex: testInfo.workerIndex, parallelIndex: testInfo.parallelIndex,
    runId: numericEnv("GITHUB_RUN_ID"), attempt: numericEnv("GITHUB_RUN_ATTEMPT"),
    runtime: { node: process.version, v8: process.versions.v8, platform: process.platform, arch: process.arch },
    parser: packageIdentity(), input: { bytes: data.length, sha256: sha(data), byteOffset: data.byteOffset, backingBufferBytes: data.buffer.byteLength },
    parserInput: { bytes: parserInput.length, sha256: sha(parserInput), byteOffset: parserInput.byteOffset, backingBufferBytes: parserInput.buffer.byteLength },
    priorParserCalls: prior.slice(-80) };
  const write = () => fs.writeFileSync(path.join(directory, filename), JSON.stringify(metadata, null, 2));
  write(); // Evidence must exist before entering the parser.
  prior.push({ sequence: call, testId: testInfo.testId, inputSha256: metadata.input.sha256, bytes: data.length });
  try {
    const result = await pdfParse(parserInput);
    metadata.phase = "success"; metadata.afterInputSha256 = sha(data); metadata.afterParserInputSha256 = sha(parserInput); write();
    return result;
  } catch (error) {
    metadata.phase = "parser-failed"; metadata.errorName = "OtherError";
    try {
      const name = error !== null && (typeof error === "object" || typeof error === "function") ? error.name : null;
      if (["Error", "TypeError", "RangeError", "UnknownErrorException", "InvalidPDFException", "MissingPDFException", "PasswordException", "UnexpectedResponseException", "AbortException"].includes(name)) metadata.errorName = name;
    } catch (_) { /* A hostile name getter must not replace the original rejection. */ }
    try { metadata.afterInputSha256 = sha(data); metadata.afterParserInputSha256 = sha(parserInput); fs.writeFileSync(path.join(directory, "failed-" + String(call).padStart(4, "0") + ".pdf"), preservedBeforeParse); write(); }
    catch (_) { console.error("Health PDF diagnostic persistence failed; original parser error retained."); }
    throw error; // Same original exception; no alternate reader or assertion path.
  }
}
module.exports = { readHealthPdf };
