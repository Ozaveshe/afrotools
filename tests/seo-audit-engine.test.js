const assert = require("assert");

const engine = require("../netlify/functions/_shared/seo-audit-engine.js");

const PERFECT_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Freelancer Pricing Calculator for Africa | AfroTools</title>
<meta name="description" content="Work out day rates, project pricing, and retainers in your local currency with benchmarks for Nigeria, Kenya, Ghana, and South Africa. Free and fast.">
<link rel="canonical" href="https://example.com/pricing/">
<link rel="icon" href="/favicon.svg">
<meta property="og:title" content="Freelancer Pricing Calculator">
<meta property="og:description" content="Day rates and project pricing for African freelancers.">
<meta property="og:image" content="https://example.com/og.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[]}</script>
</head>
<body>
<h1>Freelancer pricing calculator</h1>
<h2>How day rates work</h2>
<p>${"Useful sentence about pricing strategy for freelancers across African markets. ".repeat(40)}</p>
<img src="/chart.png" alt="Rate benchmark chart">
<a href="/guides/rates/">Rate guides</a>
<a href="https://other-site.example/research">External research</a>
</body>
</html>`;

const EMPTY_PAGE = `<html><body><div>hi</div></body></html>`;

const BROKEN_JSONLD_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>A perfectly reasonable page title here</title>
<meta name="description" content="${"A description long enough to pass the length checks for meta descriptions on this page. "}">
<link rel="canonical" href="https://example.com/a/">
<script type="application/ld+json">{"@type": "Product", broken}</script>
</head>
<body><h1>One heading</h1><p>${"words ".repeat(300)}</p></body>
</html>`;

const NOINDEX_MIXED_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Secret page</title>
<meta name="robots" content="noindex, nofollow">
<script src="http://insecure.example/lib.js"></script>
</head>
<body>
<h1>First</h1><h1>Second</h1>
<img src="/a.png"><img src="/b.png">
</body>
</html>`;

const FETCH_META_GOOD = {
  responseTimeMs: 420,
  contentEncoding: "br",
  xRobotsTag: "",
  redirects: [],
  robotsTxt: { found: true },
  llmsTxt: { found: true },
  sitemap: { found: true, url: "https://example.com/sitemap.xml" }
};

function findCheck(report, id) {
  for (const category of report.categories) {
    for (const item of category.checks) {
      if (item.id === id) return item;
    }
  }
  return null;
}

function testPerfectPageScoresHigh() {
  const report = engine.analyzeHtml({ html: PERFECT_PAGE, url: "https://example.com/pricing/", fetchMeta: FETCH_META_GOOD });
  assert.ok(report.score >= 90, "perfect page should score >= 90, got " + report.score);
  assert.equal(report.grade, "A");
  assert.equal(findCheck(report, "title-ok").status, "pass");
  assert.equal(findCheck(report, "desc-ok").status, "pass");
  assert.equal(findCheck(report, "canonical-ok").status, "pass");
  assert.equal(findCheck(report, "h1-ok").status, "pass");
  assert.equal(findCheck(report, "jsonld-valid").status, "pass");
  assert.equal(findCheck(report, "img-alt-ok").status, "pass");
  assert.equal(report.page.jsonLdTypes[0], "FAQPage");
  assert.equal(report.page.internalLinks, 1);
  assert.equal(report.page.externalLinks, 1);
}

function testEmptyPageFails() {
  const report = engine.analyzeHtml({ html: EMPTY_PAGE, url: "http://example.com/" });
  assert.ok(report.score < 60, "empty page should score < 60, got " + report.score);
  assert.ok(report.grade === "D" || report.grade === "F", "empty page grade should be D or F, got " + report.grade);
  assert.equal(findCheck(report, "title-missing").status, "fail");
  assert.equal(findCheck(report, "desc-missing").status, "fail");
  assert.equal(findCheck(report, "h1-missing").status, "fail");
  assert.equal(findCheck(report, "https-missing").status, "fail");
  assert.equal(findCheck(report, "viewport-missing").status, "fail");
  assert.ok(report.issues.length >= 8, "expected many issues, got " + report.issues.length);
  assert.ok(report.issues.every((issue) => typeof issue.fix === "string"));
  assert.equal(report.issues[0].status, "fail", "fails sort before warns");
}

function testBrokenJsonLdDetected() {
  const report = engine.analyzeHtml({ html: BROKEN_JSONLD_PAGE, url: "https://example.com/a/" });
  const broken = findCheck(report, "jsonld-broken");
  assert.ok(broken, "broken JSON-LD check expected");
  assert.equal(broken.status, "fail");
  assert.ok(broken.detail.indexOf("JSON parse failed") >= 0);
}

function testNoindexAndMixedContent() {
  const report = engine.analyzeHtml({
    html: NOINDEX_MIXED_PAGE,
    url: "https://example.com/hidden/",
    fetchMeta: { responseTimeMs: 200, redirects: [] }
  });
  assert.equal(findCheck(report, "noindex").status, "fail");
  assert.equal(findCheck(report, "mixed-content").status, "fail");
  assert.equal(findCheck(report, "h1-multiple").status, "warn");
  const alt = findCheck(report, "img-alt-missing");
  assert.ok(alt && (alt.status === "fail" || alt.status === "warn"));
}

function testRedirectChainAndSlowResponse() {
  const report = engine.analyzeHtml({
    html: PERFECT_PAGE,
    url: "https://example.com/pricing/",
    fetchMeta: {
      responseTimeMs: 3500,
      redirects: [{ status: 301 }, { status: 302 }],
      robotsTxt: { found: false },
      llmsTxt: { found: false },
      sitemap: { found: false }
    }
  });
  assert.equal(findCheck(report, "ttfb-slow").status, "fail");
  assert.equal(findCheck(report, "redirect-chain").status, "warn");
  assert.equal(findCheck(report, "robotstxt-missing").status, "warn");
  assert.equal(findCheck(report, "llms-missing").status, "warn");
  assert.equal(findCheck(report, "sitemap-missing").status, "warn");
}

function testHugeHtmlFlagged() {
  const filler = "<p>" + "content words here ".repeat(20) + "</p>";
  const huge = PERFECT_PAGE.replace("</body>", filler.repeat(1600) + "</body>");
  const report = engine.analyzeHtml({ html: huge, url: "https://example.com/pricing/" });
  const size = findCheck(report, "html-huge") || findCheck(report, "html-large");
  assert.ok(size, "large HTML should be flagged");
  assert.notEqual(size.status, "pass");
}

function testParserHelpers() {
  assert.deepEqual(engine.parseAttributes('<meta name="description" content="Hello &amp; welcome">'), {
    name: "description",
    content: "Hello & welcome"
  });
  assert.equal(engine.stripTags("<p>Two <b>words</b></p><script>ignore()</script>"), "Two words");
  const blocks = engine.collectJsonLd('<script type="application/ld+json">{"@type":"Article"}</script>');
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].valid, true);
  assert.equal(blocks[0].types[0], "Article");
}

const tests = [
  testPerfectPageScoresHigh,
  testEmptyPageFails,
  testBrokenJsonLdDetected,
  testNoindexAndMixedContent,
  testRedirectChainAndSlowResponse,
  testHugeHtmlFlagged,
  testParserHelpers
];

let failures = 0;
tests.forEach((test) => {
  try {
    test();
    console.log("ok - " + test.name);
  } catch (error) {
    failures += 1;
    console.error("not ok - " + test.name);
    console.error(error && error.message ? error.message : error);
  }
});

if (failures) {
  console.error(failures + " seo-audit-engine test(s) failed");
  process.exit(1);
}
console.log("seo-audit-engine tests passed");
