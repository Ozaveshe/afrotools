const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUTPUT = path.join(ROOT, "reports", "backlinks", "campaign-200-beneficial-2026-07-14.csv");
const DISCOVERY_OUTPUT = path.join(ROOT, "reports", "backlinks", "campaign-200-beneficial-2026-07-14.discovery.json");
const USER_AGENT = "Mozilla/5.0 (compatible; AfroToolsResourceResearch/1.0; +https://afrotools.com/)";

const COUNTRIES = [
  { name: "Ghana", language: "English", search: "Ghana", quota: 24 },
  { name: "South Africa", language: "English", search: "South Africa", quota: 24 },
  { name: "Tanzania", language: "Swahili", search: "Tanzania", quota: 24 },
  { name: "Cote d'Ivoire", language: "French", search: "Cote d'Ivoire", quota: 24 },
  { name: "Cameroon", language: "French", search: "Cameroun", quota: 24 },
  { name: "Uganda", language: "English", search: "Uganda", quota: 24 },
  { name: "Rwanda", language: "English", search: "Rwanda", quota: 24 },
  { name: "Zambia", language: "English", search: "Zambia", quota: 24 },
  { name: "Botswana", language: "English", search: "Botswana", quota: 24 },
  { name: "Morocco", language: "French", search: "Maroc", quota: 24 }
];

const THEMES = [
  { id: "sme", query: "SME entrepreneurship training resources", asset: "/tools/startup-runway/" },
  { id: "freelance", query: "freelancer guide pricing resources", asset: "/tools/freelancer-rate/" },
  { id: "career", query: "career advice jobs youth resources", asset: "/tools/cv-builder/" },
  { id: "education", query: "scholarship study abroad student resources", asset: "/education/study-abroad/" },
  { id: "agriculture", query: "farmer agriculture business training resources", asset: "/agriculture/farm-profit/" },
  { id: "finance", query: "financial literacy budgeting resources", asset: "/tools/budget-50-30-20/" },
  { id: "payroll", query: "HR payroll employer guide resources", asset: "/salary-tax/" },
  { id: "creator", query: "creator economy content creator resources", asset: "/creator/" },
  { id: "women", query: "women entrepreneurs business support resources", asset: "/tools/startup-runway/" },
  { id: "youth", query: "youth entrepreneurship incubator resources", asset: "/tools/startup-runway/" },
  { id: "digital", query: "digital skills community training resources", asset: "/tools/" },
  { id: "business", query: "small business association member resources", asset: "/business/" }
];

const BLOCKED_HOSTS = new Set([
  "facebook.com", "www.facebook.com", "linkedin.com", "www.linkedin.com", "x.com", "twitter.com",
  "instagram.com", "www.instagram.com", "youtube.com", "www.youtube.com", "tiktok.com", "wikipedia.org",
  "en.wikipedia.org", "fr.wikipedia.org", "reddit.com", "www.reddit.com", "pinterest.com", "medium.com",
  "amazon.com", "www.amazon.com", "google.com", "www.google.com", "duckduckgo.com", "www.duckduckgo.com",
  "bing.com", "www.bing.com", "afrotools.com", "www.afrotools.com", "linkedin.com", "gh.linkedin.com",
  "za.linkedin.com", "scribd.com", "www.scribd.com", "researchgate.net", "www.researchgate.net", "zenodo.org",
  "medium.com", "www.medium.com"
]);

const GENERIC_EMAIL_PREFIXES = ["info", "contact", "hello", "support", "team", "admin", "office", "enquiries", "inquiries", "communications", "partnerships", "editor"];

function blockedHost(host) {
  const normalized = String(host || "").toLowerCase().replace(/^www\./, "");
  return Array.from(BLOCKED_HOSTS).some((blocked) => normalized === blocked.replace(/^www\./, "") || normalized.endsWith(`.${blocked.replace(/^www\./, "")}`));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&ndash;|&mdash;/g, "-");
}

function stripTags(value) {
  return decodeEntities(String(value || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function csvEscape(value) {
  const text = String(value == null ? "" : value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

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
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).filter((values) => values.some(Boolean)).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function existingDomains() {
  const directory = path.join(ROOT, "reports", "backlinks");
  const domains = new Set();
  if (!fs.existsSync(directory)) return domains;
  for (const file of fs.readdirSync(directory).filter((name) => name.endsWith(".csv") && name !== path.basename(OUTPUT))) {
    for (const row of parseCsv(fs.readFileSync(path.join(directory, file), "utf8"))) {
      const values = [row.domain, row.source_domain, row.recipient, row.contact_email, row.contact_route, row.submission_url, row.source_url];
      for (const value of values.filter(Boolean)) {
        try {
          const normalized = value.includes("@") && !/^https?:/i.test(value) ? `https://${value.split("@").pop()}` : value;
          const host = new URL(/^https?:/i.test(normalized) ? normalized : `https://${normalized}`).hostname.toLowerCase().replace(/^www\./, "");
          if (host) domains.add(host);
        } catch (_) {
          // Ignore non-URL evidence fields.
        }
      }
    }
  }
  return domains;
}

async function fetchText(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { redirect: "follow", signal: controller.signal, headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" } });
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html") && !type.includes("text/plain")) return { response, html: "" };
    return { response, html: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

function ddgResults(html) {
  const urls = [];
  const pattern = /class="result__a"[^>]+href="([^"]+)"/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const href = decodeEntities(match[1]);
    try {
      const redirect = new URL(href, "https://duckduckgo.com");
      const target = redirect.searchParams.get("uddg") || redirect.toString();
      const url = new URL(target);
      if (!/^https?:$/.test(url.protocol) || /\.pdf$/i.test(url.pathname)) continue;
      urls.push(url.toString());
    } catch (_) {
      // Ignore malformed search results.
    }
  }
  return urls;
}

function startpageResults(html) {
  const urls = [];
  const anchorPattern = /<a\b([^>]*)>/gi;
  let match;
  while ((match = anchorPattern.exec(html))) {
    const attributes = match[1];
    if (!/data-testid="gl-title-link"/i.test(attributes)) continue;
    const href = attributes.match(/href="([^"]+)"/i);
    if (!href) continue;
    try {
      const url = new URL(decodeEntities(href[1]));
      if (/^https?:$/.test(url.protocol) && !/\.pdf$/i.test(url.pathname)) urls.push(url.toString());
    } catch (_) {
      // Ignore malformed search results.
    }
  }
  return urls;
}

async function discover(country, theme) {
  const query = `${country.search} ${theme.query} contact`;
  const startpageUrl = `https://www.startpage.com/sp/search?query=${encodeURIComponent(query)}`;
  try {
    const { response, html } = await fetchText(startpageUrl, 18000);
    if (response.ok) {
      const results = startpageResults(html);
      if (results.length) return results.map((sourceUrl) => ({ country, theme, query, sourceUrl }));
    }
  } catch (_) {
    // Fall through to the secondary search source.
  }
  const duckDuckGoUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const { response, html } = await fetchText(duckDuckGoUrl, 15000);
    if (response.ok) return ddgResults(html).map((sourceUrl) => ({ country, theme, query, sourceUrl }));
  } catch (_) {
    // Return an empty result for this query.
  }
  return [];
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]).slice(0, 180) : "";
}

function extractEmails(html, host) {
  const found = new Set();
  const normalized = decodeEntities(html).replace(/\s+\[at\]\s+|\s+\(at\)\s+/gi, "@").replace(/\s+\[dot\]\s+|\s+\(dot\)\s+/gi, ".");
  for (const match of normalized.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
    const email = match[0].toLowerCase().replace(/[),.;:]+$/, "");
    if (/example\.|sentry\.|wixpress|cloudflare|wordpress|noreply|no-reply|donotreply/.test(email)) continue;
    if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(email) || /%20|@2x\./i.test(email)) continue;
    found.add(email);
  }
  return Array.from(found).sort((a, b) => {
    const [ap, ah] = a.split("@");
    const [bp, bh] = b.split("@");
    const aScore = Number(ah === host || ah.endsWith(`.${host}`)) * 4 + Number(GENERIC_EMAIL_PREFIXES.includes(ap)) * 3;
    const bScore = Number(bh === host || bh.endsWith(`.${host}`)) * 4 + Number(GENERIC_EMAIL_PREFIXES.includes(bp)) * 3;
    return bScore - aScore;
  });
}

function extractActionLinks(html, baseUrl) {
  const links = [];
  const pattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const href = match[1].match(/\bhref=["']([^"']+)["']/i);
    if (!href) continue;
    const label = stripTags(match[2]);
    if (!/(contact|write to us|reach us|partnership|partner|submit|suggest|nous contacter|contactez|partenariat|wasiliana|mawasiliano)/i.test(`${label} ${href[1]}`)) continue;
    try {
      const url = new URL(decodeEntities(href[1]), baseUrl);
      if (/^https?:$/.test(url.protocol)) links.push(url.toString());
    } catch (_) {
      // Ignore malformed links.
    }
  }
  return Array.from(new Set(links)).slice(0, 5);
}

function hasContactForm(html) {
  if (!/<form\b/i.test(html)) return false;
  const hasMessage = /<textarea\b/i.test(html) || /<input[^>]+name=["'][^"']*(message|subject|comment|inquiry)/i.test(html);
  const hasIdentity = /<input[^>]+(type=["']email|name=["'][^"']*(email|mail))/i.test(html);
  const hasSubmit = /<(button|input)[^>]+(type=["']submit|send|submit|envoyer|tuma)/i.test(html);
  return hasMessage && hasIdentity && hasSubmit;
}

function registrableHost(host) {
  const parts = String(host || "").toLowerCase().replace(/^www\./, "").split(".");
  if (parts.length <= 2) return parts.join(".");
  const twoLevelSuffixes = new Set(["co.za", "org.za", "gov.za", "ac.za", "com.gh", "org.gh", "gov.gh", "edu.gh", "co.tz", "or.tz", "go.tz", "ac.tz", "co.ug", "or.ug", "go.ug", "ac.ug", "co.rw", "org.rw", "gov.rw", "co.zm", "org.zm", "gov.zm", "co.bw", "org.bw", "gov.bw"]);
  const suffix = parts.slice(-2).join(".");
  return twoLevelSuffixes.has(suffix) ? parts.slice(-3).join(".") : suffix;
}

function credibleEmails(emails, siteHost, allowExternalGeneric = false) {
  const siteRoot = registrableHost(siteHost);
  return emails.filter((email) => {
    const [prefix, emailHost] = email.split("@");
    if (!prefix || !emailHost) return false;
    const sameOrganization = registrableHost(emailHost) === siteRoot;
    const generic = GENERIC_EMAIL_PREFIXES.includes(prefix) || /^(news|media|press|outreach|partnership|partnerships|programmes|programs|membership|members|careers?|marketing|marcoms|community|secretariat|mail|webmaster|customer|customercare)/.test(prefix);
    const smallOrgMailbox = /@(gmail|outlook|hotmail|yahoo)\./.test(email) && generic;
    return (sameOrganization && generic) || (allowExternalGeneric && (generic || smallOrgMailbox));
  });
}

function cleanProspect(title, host) {
  const first = String(title || "").split(/\s+[|–—-]\s+/)[0].trim();
  return (first && first.length >= 3 ? first : host.split(".")[0]).slice(0, 100);
}

function localizedAsset(country, theme) {
  if (country.language === "French") return "https://afrotools.com/fr/";
  if (country.language === "Swahili") return "https://afrotools.com/sw/";
  if (theme.id === "freelance") {
    const slug = country.name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
    return `https://afrotools.com/tools/freelancer-rate/${slug}/`;
  }
  return `https://afrotools.com${theme.asset}`;
}

function angleFor(country, theme, prospect) {
  const languageNote = country.language === "French" ? "ressource pratique gratuite en francais" : country.language === "Swahili" ? "zana ya bure yenye msaada wa Kiswahili" : "free practical local calculator";
  return `${theme.id} audience fit: suggest a ${languageNote} as a useful companion for ${prospect}'s readers or members`;
}

function subjectFor(country, theme, prospect) {
  if (country.language === "French") return `Ressource gratuite pour les lecteurs de ${prospect}`.slice(0, 105);
  if (country.language === "Swahili") return `Zana ya bure kwa wasomaji wa ${prospect}`.slice(0, 105);
  return `Free ${theme.id} tool for ${prospect}'s readers`.slice(0, 105);
}

function bodyFor(country, theme, prospect, sourceUrl, asset) {
  if (country.language === "French") return `Bonjour,\n\nJ'ai decouvert ${prospect} en recherchant des ressources utiles pour les entrepreneurs et les jeunes en ${country.name}. AfroTools propose un outil gratuit et adapte aux usages africains qui pourrait completer vos contenus: ${asset}\n\nPourriez-vous l'evaluer comme ressource pratique pour vos lecteurs ou membres? Je peux aussi fournir une description courte en francais.\n\nMerci,\nAfroTools\nhello@afrotools.com\n\nSi ce message n'est pas pertinent, repondez simplement non et je ne relancerai pas.`;
  if (country.language === "Swahili") return `Habari,\n\nNimepata ${prospect} nilipokuwa nikitafuta rasilimali muhimu kwa wajasiriamali na vijana wa Tanzania. AfroTools ina zana ya bure inayolenga matumizi ya Afrika na inaweza kuongezea thamani kwa wasomaji wako: ${asset}\n\nJe, mnaweza kuipitia kama rasilimali ya ziada kwa wasomaji au wanachama wenu? Ninaweza pia kutuma maelezo mafupi kwa Kiswahili.\n\nAsante,\nAfroTools\nhello@afrotools.com\n\nIkiwa haifai, jibu "hapana" na sitatuma ujumbe mwingine.`;
  return `Hi ${prospect} team,\n\nI found your ${theme.id}-related work while researching useful resources for people in ${country.name}. AfroTools has a free, Africa-focused tool that could be a practical companion for your readers or members: ${asset}\n\nWould you consider reviewing it for an appropriate resources page or guide? I can provide a short description or embed option if useful.\n\nBest,\nAfroTools\nhello@afrotools.com\n\nIf this is not relevant, reply "no" and I will not follow up.`;
}

async function inspectCandidate(candidate, excluded) {
  let url;
  try { url = new URL(candidate.sourceUrl); } catch (_) { return null; }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (blockedHost(url.hostname) || blockedHost(host) || excluded.has(host)) return null;
  try {
    const { response, html } = await fetchText(candidate.sourceUrl);
    if (!response.ok || !html || response.url.includes("duckduckgo.com")) return null;
    const finalUrl = new URL(response.url);
    const finalHost = finalUrl.hostname.toLowerCase().replace(/^www\./, "");
    if (blockedHost(finalHost) || excluded.has(finalHost)) return null;
    const title = extractTitle(html);
    const text = stripTags(html).slice(0, 30000);
    if (/domain for sale|buy this domain|parked domain|access denied/i.test(`${title} ${text.slice(0, 1000)}`)) return null;
    let emails = credibleEmails(extractEmails(html, finalHost), finalHost, false);
    const actionLinks = extractActionLinks(html, response.url).filter((link) => {
      try { return new URL(link).hostname.replace(/^www\./, "") === finalHost; } catch (_) { return false; }
    });
    let contactUrl = actionLinks.sort((a, b) => Number(!/contact|nous-contacter|contactez|wasiliana|mawasiliano/i.test(a)) - Number(!/contact|nous-contacter|contactez|wasiliana|mawasiliano/i.test(b)))[0] || "";
    let contactHasForm = hasContactForm(html);
    if (contactUrl) {
      try {
        const contact = await fetchText(contactUrl, 10000);
        emails = Array.from(new Set([...emails, ...credibleEmails(extractEmails(contact.html, finalHost), finalHost, true)]));
        contactHasForm = hasContactForm(contact.html);
        contactUrl = contact.response.url;
      } catch (_) {
        // Keep homepage evidence when the contact page is unavailable.
      }
    }
    const route = emails[0] || (contactHasForm && /contact|nous-contacter|contactez|wasiliana|mawasiliano|partner|submit/i.test(contactUrl || response.url) ? contactUrl || response.url : "");
    if (!route) return null;
    const prospect = cleanProspect(title, finalHost);
    const asset = localizedAsset(candidate.country, candidate.theme);
    const topicalHits = [candidate.theme.id, ...candidate.theme.query.split(/\s+/)].filter((word) => word.length > 4 && new RegExp(word, "i").test(`${title} ${text.slice(0, 6000)}`)).length;
    return {
      country: candidate.country.name,
      language: candidate.country.language,
      prospect,
      domain: finalHost,
      source_url: response.url,
      target_asset: asset,
      angle: angleFor(candidate.country, candidate.theme, prospect),
      contact_route: route,
      channel: route.includes("@") ? "email" : "contact_form",
      subject: subjectFor(candidate.country, candidate.theme, prospect),
      body: bodyFor(candidate.country, candidate.theme, prospect, response.url, asset),
      status: "qualified_not_submitted",
      proof: `Live page HTTP ${response.status}; contact route extracted ${new Date().toISOString()}`,
      quality_score: Math.min(100, 62 + topicalHits * 4 + Number(route.includes("@")) * 6 + Number(finalHost.endsWith(".org") || finalHost.endsWith(".org.za") || finalHost.endsWith(".go.tz") || finalHost.endsWith(".gov.gh")) * 8),
      theme: candidate.theme.id,
      query: candidate.query
    };
  } catch (_) {
    return null;
  }
}

async function main() {
  const excluded = existingDomains();
  const discovered = [];
  const inspected = [];
  const selected = [];
  const selectedDomains = new Set();

  for (const country of COUNTRIES) {
    const countryDiscovered = [];
    for (const theme of THEMES) {
      const results = await discover(country, theme);
      countryDiscovered.push(...results);
      discovered.push(...results);
      await sleep(350);
    }

    const unique = [];
    const seen = new Set();
    for (const candidate of countryDiscovered) {
      try {
        const host = new URL(candidate.sourceUrl).hostname.toLowerCase().replace(/^www\./, "");
        if (!seen.has(host) && !excluded.has(host) && !selectedDomains.has(host)) {
          seen.add(host);
          unique.push(candidate);
        }
      } catch (_) {
        // Ignore malformed results.
      }
    }

    for (let offset = 0; offset < unique.length; offset += 10) {
      if (selected.filter((row) => row.country === country.name).length >= country.quota) break;
      const batch = unique.slice(offset, offset + 10);
      const results = (await Promise.all(batch.map((candidate) => inspectCandidate(candidate, excluded)))).filter(Boolean);
      inspected.push(...results);
      for (const row of results.sort((a, b) => b.quality_score - a.quality_score)) {
        if (selected.filter((item) => item.country === country.name).length >= country.quota) break;
        if (selectedDomains.has(row.domain)) continue;
        selectedDomains.add(row.domain);
        selected.push(row);
      }
      await sleep(300);
    }
  }

  const finalRows = [];
  for (let position = 0; position < 24 && finalRows.length < 200; position += 1) {
    for (const country of COUNTRIES) {
      const row = selected.filter((item) => item.country === country.name)[position];
      if (row) finalRows.push(row);
      if (finalRows.length >= 200) break;
    }
  }
  const headers = ["number", "country", "language", "prospect", "domain", "source_url", "target_asset", "angle", "contact_route", "channel", "subject", "body", "status", "proof", "quality_score", "theme"];
  const csv = [headers.join(","), ...finalRows.map((row, index) => headers.map((header) => csvEscape(header === "number" ? index + 1 : row[header])).join(","))].join("\n") + "\n";
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, csv, "utf8");
  fs.writeFileSync(DISCOVERY_OUTPUT, JSON.stringify({ generated_at: new Date().toISOString(), excluded_domains: excluded.size, search_results: discovered.length, actionable_candidates: inspected.length, selected: finalRows.length, country_counts: Object.fromEntries(COUNTRIES.map((country) => [country.name, finalRows.filter((row) => row.country === country.name).length])), candidates: inspected }, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ output: path.relative(ROOT, OUTPUT), selected: finalRows.length, actionable: inspected.length, search_results: discovered.length, country_counts: Object.fromEntries(COUNTRIES.map((country) => [country.name, finalRows.filter((row) => row.country === country.name).length])) }, null, 2));
  if (finalRows.length < 200) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
