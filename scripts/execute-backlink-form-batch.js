const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const CAMPAIGN = path.join(ROOT, "reports", "backlinks", "campaign-200-beneficial-2026-07-14.csv");
const EVIDENCE = path.join(ROOT, "reports", "backlinks", "campaign-200-beneficial-form-batch-2026-07-14.json");

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

function visible(locator) {
  return locator.locator(":visible");
}

async function firstVisible(scope, selectors) {
  for (const selector of selectors) {
    const locator = scope.locator(`${selector}:visible`).first();
    if (await locator.count()) return locator;
  }
  return null;
}

async function fillIfPresent(scope, selectors, value) {
  const locator = await firstVisible(scope, selectors);
  if (!locator) return false;
  await locator.fill(value).catch(() => {});
  return true;
}

async function main() {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = Math.max(1, Number(limitArg ? limitArg.split("=")[1] : 20) || 20);
  const parsed = parseCsv(fs.readFileSync(CAMPAIGN, "utf8"));
  const targets = parsed.rows.filter((row) => row.channel === "contact_form" && row.status === "qualified_not_submitted").slice(0, limit);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const results = [];

  for (const row of targets) {
    const result = { number: row.number, domain: row.domain, url: row.contact_route, subject: row.subject, started_at: new Date().toISOString(), status: "form_failed" };
    let latestPost = null;
    const watchResponse = (response) => {
      if (response.request().method() === "POST" && !/google|doubleclick|analytics|facebook/i.test(response.url())) latestPost = { url: response.url(), status: response.status() };
    };
    page.on("response", watchResponse);
    try {
      await page.goto(row.contact_route, { waitUntil: "domcontentloaded", timeout: 35000 });
      await page.waitForTimeout(1200);
      const bodyText = (await page.locator("body").innerText()).slice(0, 40000);
      if (/recaptcha|hcaptcha|verify you are human|cloudflare turnstile|captcha/i.test(bodyText)) {
        result.status = "blocked_captcha";
        result.proof = "Captcha or human-verification challenge detected before submission";
      } else {
        const forms = page.locator("form:visible");
        let form = null;
        for (let index = 0; index < await forms.count(); index += 1) {
          const candidate = forms.nth(index);
          const hasMessage = await candidate.locator("textarea:visible").count() || await candidate.locator('input[name*="message" i]:visible, input[name*="subject" i]:visible').count();
          const hasEmail = await candidate.locator('input[type="email"]:visible, input[name*="email" i]:visible, input[name*="mail" i]:visible').count();
          if (hasMessage && hasEmail) { form = candidate; break; }
        }
        if (!form) {
          result.status = "blocked_no_contact_form";
          result.proof = "No visible message form with an email field was found on the live page";
        } else {
          await fillIfPresent(form, ['input[name="name" i]', 'input[name*="full_name" i]', 'input[name*="fullname" i]', 'input[placeholder*="name" i]'], "AfroTools");
          await fillIfPresent(form, ['input[type="email"]', 'input[name*="email" i]', 'input[name*="mail" i]'], "hello@afrotools.com");
          await fillIfPresent(form, ['input[name*="subject" i]', 'input[placeholder*="subject" i]', 'input[name*="objet" i]'], row.subject);
          await fillIfPresent(form, ['input[name*="company" i]', 'input[name*="organization" i]', 'input[name*="organisation" i]'], "AfroTools");
          await fillIfPresent(form, ['input[type="url"]', 'input[name*="website" i]', 'input[name*="url" i]'], "https://afrotools.com");
          await fillIfPresent(form, ["textarea"], row.body);

          const requiredPhone = form.locator('input[required][type="tel"]:visible, input[required][name*="phone" i]:visible, input[required][name*="tel" i]:visible');
          if (await requiredPhone.count()) {
            result.status = "blocked_required_phone";
            result.proof = "Form requires a phone number; no phone number was invented";
          } else if (/recaptcha|hcaptcha|captcha/i.test(await form.innerText().catch(() => ""))) {
            result.status = "blocked_captcha";
            result.proof = "Captcha detected inside the selected contact form";
          } else {
            const checkboxes = form.locator('input[type="checkbox"][required]:visible');
            for (let index = 0; index < await checkboxes.count(); index += 1) await checkboxes.nth(index).check({ force: true }).catch(() => {});
            const submit = await firstVisible(form, ['button[type="submit"]', 'input[type="submit"]', 'button']);
            if (!submit) {
              result.status = "blocked_no_submit_control";
              result.proof = "Qualified form had no visible submit control";
            } else {
              const beforeUrl = page.url();
              await submit.click({ force: true });
              await page.waitForTimeout(5000);
              const afterText = (await page.locator("body").innerText().catch(() => "")).slice(0, 50000);
              const confirmation = /thank you|thanks for|message (has been )?sent|successfully|we have received|submission received|merci|envoy[ée]|reçu|asante|tumepokea|your inquiry/i.test(afterText);
              const validation = /required field|please fill|is required|invalid email|champ obligatoire|veuillez remplir/i.test(afterText);
              if (confirmation) {
                result.status = "form_submitted";
                result.proof = `Live page displayed a submission confirmation${latestPost ? `; POST ${latestPost.status} ${latestPost.url}` : ""}`;
              } else if (latestPost && latestPost.status < 400) {
                result.status = "form_posted_unconfirmed";
                result.proof = `Contact-form POST returned HTTP ${latestPost.status} without a clear confirmation message: ${latestPost.url}`;
              } else if (page.url() !== beforeUrl && !validation) {
                result.status = "form_posted_unconfirmed";
                result.proof = `Form navigated to ${page.url()} without a clear confirmation message`;
              } else {
                result.status = validation ? "blocked_form_validation" : "form_attempt_unconfirmed";
                result.proof = validation ? "Live form rejected the submission because a required field remained unresolved" : "Submit control was activated but no POST or confirmation could be verified";
              }
            }
          }
        }
      }
    } catch (error) {
      result.status = "form_failed";
      result.proof = `${error.name}: ${error.message}`;
    } finally {
      page.off("response", watchResponse);
    }
    result.completed_at = new Date().toISOString();
    result.final_url = page.url();
    results.push(result);
    row.status = result.status;
    row.proof = result.proof;
    writeCsv(parsed.headers, parsed.rows);
    fs.writeFileSync(EVIDENCE, JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2) + "\n", "utf8");
    await page.goto("about:blank");
    await page.waitForTimeout(1200);
  }

  await browser.close();
  const counts = Object.fromEntries(Array.from(new Set(results.map((result) => result.status))).map((status) => [status, results.filter((result) => result.status === status).length]));
  console.log(JSON.stringify({ attempted: results.length, counts, evidence: path.relative(ROOT, EVIDENCE) }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
