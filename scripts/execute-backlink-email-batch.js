const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const CAMPAIGN = path.join(ROOT, "reports", "backlinks", "campaign-200-beneficial-2026-07-14.csv");
const EVIDENCE = path.join(ROOT, "reports", "backlinks", "campaign-200-beneficial-email-batch-2026-07-14.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  const headers = (rows[0] || []).map((header, index) => index === 0 ? header.replace(/^\uFEFF/, "") : header);
  return { headers, rows: rows.slice(1).filter((values) => values.some(Boolean)).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]))) };
}

function csvEscape(value) {
  const text = String(value == null ? "" : value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(headers, rows) {
  fs.writeFileSync(CAMPAIGN, [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n") + "\n", "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function composerBody(page) {
  for (const frame of page.frames()) {
    if (await frame.locator('[data-qa="composer-content-body"]:visible').count()) return frame.locator('[data-qa="composer-content-body"]:visible').last();
  }
  throw new Error("Composer body frame was not found");
}

async function discardOpenComposer(page) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const discard = page.locator('[data-qa="composer-discard-draft"]:visible');
    if (!await discard.count()) break;
    await discard.last().click({ force: true });
    const confirm = page.getByRole("button", { name: "Discard", exact: true });
    if (await confirm.count()) await confirm.last().click({ force: true });
    await page.waitForTimeout(500);
  }
}

async function main() {
  const numberArg = process.argv.find((arg) => arg.startsWith("--numbers="));
  if (!numberArg) throw new Error("Usage: node scripts/execute-backlink-email-batch.js --numbers=1,2,3");
  const requested = new Set(numberArg.split("=")[1].split(",").map((value) => value.trim()).filter(Boolean));
  const parsed = parseCsv(fs.readFileSync(CAMPAIGN, "utf8"));
  const targets = parsed.rows.filter((row) => requested.has(row.number) && row.channel === "email" && row.status === "qualified_not_submitted");
  if (!targets.length) throw new Error("No unsent email rows matched the requested numbers");

  const browser = await chromium.connectOverCDP("http://127.0.0.1:9223", { timeout: 60000 });
  const page = browser.contexts().flatMap((context) => context.pages()).find((candidate) => candidate.url().includes("mail.hostinger.com"));
  if (!page) throw new Error("Open Hostinger webmail in Edge before running the batch");
  await discardOpenComposer(page);

  const results = [];
  for (const row of targets) {
    const startedAt = new Date().toISOString();
    try {
      await page.goto("https://mail.hostinger.com/mailboxes/INBOX", { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(900);
      await page.locator('[data-qa="sidebar-new-message"]:visible').click();
      let recipient = page.locator('[data-qa="composer-to-input"]:visible').last();
      try {
        await recipient.waitFor({ state: "visible", timeout: 5000 });
      } catch (_) {
        const summary = page.locator('[data-qa="composer-recipients-summary"]:visible').last();
        await summary.click({ force: true });
        recipient = page.locator('[data-qa="composer-to-input"]:visible').last();
        await recipient.waitFor({ state: "visible", timeout: 5000 });
      }
      await recipient.fill(row.contact_route);
      await recipient.press("Enter");
      const subject = page.locator('[data-qa="composer-subject"]:visible').last();
      await subject.fill(row.subject);
      const body = await composerBody(page);
      await body.fill(row.body);
      const send = page.getByRole("button", { name: "Send", exact: true }).last();
      await send.waitFor({ state: "visible", timeout: 10000 });
      await send.click({ force: true });
      await subject.waitFor({ state: "hidden", timeout: 20000 });
      await page.getByText("Sent", { exact: true }).first().click({ force: true });
      await page.waitForTimeout(16000);
      await page.locator('[data-qa="sidebar-refresh"]').click({ force: true }).catch(() => {});
      await page.waitForTimeout(1200);
      let verifiedSent = "";
      let newestSent = "";
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const sentRows = await page.locator('[data-qa="message-row"]').evaluateAll((elements) => elements.slice(0, 10).map((element) => (element.innerText || "").replace(/\s+/g, " ").trim()));
        newestSent = sentRows[0] || "";
        verifiedSent = sentRows.find((text) => text.includes(row.subject) && text.includes(row.contact_route)) || "";
        if (verifiedSent) break;
        await page.waitForTimeout(1000);
        await page.locator('[data-qa="sidebar-refresh"]').click({ force: true }).catch(() => {});
      }
      if (!verifiedSent) throw new Error(`Sent-folder mismatch after polling: ${newestSent.slice(0, 300)}`);
      const verifiedAt = new Date().toISOString();
      results.push({ number: row.number, recipient: row.contact_route, subject: row.subject, status: "email_sent", started_at: startedAt, completed_at: verifiedAt, verified_at: verifiedAt });
      row.status = "email_sent";
      row.proof = `Hostinger Sent folder verified exact subject and recipient on ${verifiedAt}`;
      writeCsv(parsed.headers, parsed.rows);
    } catch (error) {
      results.push({ number: row.number, recipient: row.contact_route, subject: row.subject, status: "send_failed", error: `${error.name}: ${error.message}`, started_at: startedAt, completed_at: new Date().toISOString() });
      await discardOpenComposer(page);
    }
    fs.writeFileSync(EVIDENCE, JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2) + "\n", "utf8");
    await sleep(3500 + Math.floor(Math.random() * 2500));
  }

  fs.writeFileSync(EVIDENCE, JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ requested: targets.length, sent: results.filter((result) => result.status === "email_sent").length, failed: results.filter((result) => result.status === "send_failed").length, evidence: path.relative(ROOT, EVIDENCE) }, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
