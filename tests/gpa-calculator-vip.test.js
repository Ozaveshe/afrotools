const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const engine = require("../tools/gpa-calculator/gpa-engine.js");

function close(actual, expected, label) {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${label}: expected ${expected}, received ${actual}`
  );
}

const fivePoint = engine.getTemplate("example-5");
const weighted = engine.calculateAll(
  [
    {
      courses: [
        { name: "A course", credits: 3, value: "A" },
        { name: "B course", credits: 3, value: "B" },
        { name: "C course", credits: 2, value: "C" }
      ]
    }
  ],
  fivePoint
);
close(weighted.average, 4.125, "credit-weighted letter result");
assert.equal(weighted.totalCredits, 8);
assert.equal(weighted.totalPoints, 33);
assert.equal(weighted.invalidCourses, 0);

const direct = engine.getTemplate("direct-points", 4.5);
const directResult = engine.calculateAll(
  [
    {
      courses: [
        { credits: 2, value: 4.5 },
        { credits: 1, value: 3 },
        { credits: 2, value: 6 }
      ]
    }
  ],
  direct
);
close(directResult.average, 4, "direct transcript points");
assert.equal(directResult.validCourses, 2);
assert.equal(directResult.invalidCourses, 1);

close(
  engine.requiredAverage(3.2, 45, 3.5, 18),
  4.25,
  "target-average algebra"
);
close(
  engine.replacementAverage(33, 8, 3, 5, 2),
  4.625,
  "complete replacement scenario"
);
const normalized = engine.normalizeScale(4, 5, 4);
close(normalized.position, 0.8, "relative scale position");
close(normalized.normalizedValue, 3.2, "planning normalization");
assert.equal(engine.normalizeScale(6, 5, 4), null);
assert.equal(engine.bucketCourseCount(0), "0");
assert.equal(engine.bucketCourseCount(5), "4-6");
assert.equal(engine.bucketCourseCount(18), "13+");

const html = fs.readFileSync(
  path.join(__dirname, "..", "tools", "gpa-calculator", "index.html"),
  "utf8"
);
[
  "/assets/js/edu-profile-sync.js",
  "/assets/js/edu-cloud-sync.js",
  "/tools/gpa-calculator/gpa-calculator.js",
  "/tools/gpa-calculator/data/grading-systems.js",
  "/tools/gpa-calculator/data/scholarships.js",
  "cdn.jsdelivr.net/npm/chart.js",
  "/.netlify/functions/ai-advisor",
  "How is GPA calculated in Nigerian universities?",
  "Chevening requires a minimum"
].forEach((unsafeReference) => {
  assert.ok(
    !html.includes(unsafeReference),
    `retired runtime reference remains: ${unsafeReference}`
  );
});
assert.match(html, /Scale Normalizer/);
assert.match(html, /not a credential conversion/i);
assert.match(html, /No account, cloud sync, or background academic-profile update/i);
assert.doesNotMatch(html, /Scholarship Eligibility/);

const runtime = fs.readFileSync(
  path.join(__dirname, "..", "tools", "gpa-calculator", "gpa-vip.js"),
  "utf8"
);
assert.doesNotMatch(runtime, /gpa_value|EduCloudSync|EduProfileSync/);
assert.doesNotMatch(runtime, /gpa:\s*result|gpa:\s*u\.toFixed/);
assert.match(runtime, /payload:\s*"route_only"/);
assert.match(runtime, /course_count_bucket/);

console.log("GPA Calculator VIP unit and static checks passed.");
