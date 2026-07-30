const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { normalizeBuildManagedHtml } = require("../scripts/lib/shared-asset-references");

const ROOT = path.resolve(__dirname, "..");
const BASELINE = require("../data/localization/fr-creative-english-baseline.json");
const MIGRATED = new Set([
  "african-palette",
  "art-commission",
  "book-publishing-cost",
  "engagement-rate",
  "linkedin-optimizer",
  "music-royalty-splitter",
  "personal-brand-audit",
  "photography-pricing",
  "podcast-monetization",
  "self-publishing-royalty",
  "social-media-calendar",
  "wedding-photo-package",
]);
const APP_WORKSPACE_RECEIPTS = Object.freeze({
  "creator-clip": Object.freeze({
    rawStructuralSha256:
      "24e729d05ae3187f426a995e5c6c1716d882e754bce7867e0eeca044c85574bf",
    normalizedStructuralSha256:
      "df83dda2dcbe98b31a3ba6ad29c4d730f949fd7a4a9b733f14445475c0ed7915",
  }),
  "creator-record": Object.freeze({
    rawStructuralSha256:
      "8a9261ddbc119ce64a06b863f35a443d3eee608eebf05bad2e6c103e5b52e1b2",
    normalizedStructuralSha256:
      "d0402261fcd2f8efa0d174b64a9d6f6d94ca94a71e68f32dc99c9abf3186f162",
  }),
  "creator-voice": Object.freeze({
    rawStructuralSha256:
      "0e0dbb5b6d06759b47f81cb1d32cbd848135e3a13af5fdc6c82be7bc1b11a02b",
    normalizedStructuralSha256:
      "0b194afed8cea465d86caf8b0c49a94c7d806f695b22a914908b93050adacd83",
  }),
});

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeCurrent(html, id) {
  const engineAndController = new RegExp(
    `<script src="/engines/${id}-engine\\.js"></script>\\s*` +
      `<script src="/assets/js/pages/creative/${id}-controller\\.js"></script>`,
    "g"
  );
  const controller = new RegExp(
    `<script src="/assets/js/pages/creative/${id}-controller\\.js"></script>`,
    "g"
  );
  return html
    .replace(engineAndController, "<!-- CREATIVE_EXECUTABLE_OWNER -->")
    .replace(controller, "<!-- CREATIVE_EXECUTABLE_OWNER -->")
    .replace(
      new RegExp(
        `<link rel="alternate" hreflang="fr" href="https://afrotools\\.com/fr/tools/(?:calendrier-medias-sociaux|forfait-photo-mariage)/">\\s*`,
        "g"
      ),
      ""
    )
    .replace(/\r\n/g, "\n");
}

function normalizeExtractedWorkspace(html, id) {
  return normalizeBuildManagedHtml(html)
    .replace(
      '<link rel="stylesheet" href="/assets/css/creator-media-reflow.css">\n',
      ""
    )
    .replace(
      new RegExp(
        `<script src="/assets/js/pages/creative/${id}-app-controller\\.js"></script>`
      ),
      "<!-- CREATIVE_EXECUTABLE_OWNER -->"
    )
    .replace(
      /<script(?![^>]*\bsrc\s*=)(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi,
      "<!-- CREATIVE_EXECUTABLE_OWNER -->"
    )
    .replace(/\r\n/g, "\n");
}

for (const owner of BASELINE.owners.filter((item) => MIGRATED.has(item.id))) {
  test(`${owner.id} preserves the frozen English route, schema, discovery, and executable-owner boundary`, () => {
    const current = fs.readFileSync(
      path.join(ROOT, "tools", owner.id, "index.html"),
      "utf8"
    );
    assert.match(
      current,
      new RegExp(
        `<link rel="canonical" href="https://afrotools\\.com/tools/${owner.id}/">`
      )
    );
    assert.match(current, /"@type"\s*:\s*"WebApplication"/);
    assert.match(current, /related-tools/i);
    assert.match(current, /data-day9-creative-boundary/);
    assert.doesNotMatch(current, /<iframe\b/i);
    assert.match(
      current,
      new RegExp(
        `/engines/${owner.id}-engine\\.js|/assets/js/pages/creative/${owner.id}-controller\\.js`
      )
    );
  });

  test(`${owner.id} extracted controller is byte-equivalent to its frozen inline owner when no engine split occurred`, () => {
    if (
      fs.existsSync(
        path.join(ROOT, "engines", "src", `${owner.id}-engine.js`)
      )
    ) {
      return;
    }
    const indexFixture = owner.files.find((file) =>
      file.file.endsWith("/index.html")
    );
    const controller = fs
      .readFileSync(
        path.join(
          ROOT,
          "assets",
          "js",
          "pages",
          "creative",
          `${owner.id}-controller.js`
        ),
        "utf8"
      )
      .replace(/\r\n/g, "\n");
    assert.equal(
      sha256(controller),
      indexFixture.inlineScriptSha256[0],
      "controller behavior changed during extraction"
    );
  });
}

for (const id of ["creator-clip", "creator-record", "creator-voice"]) {
  test(`${id} app controller extraction preserves the frozen workspace`, () => {
    const owner = BASELINE.owners.find((item) => item.id === id);
    const fixture = owner.files.find((file) => file.file.endsWith("/app.html"));
    const receipt = APP_WORKSPACE_RECEIPTS[id];
    const current = normalizeExtractedWorkspace(
      fs.readFileSync(path.join(ROOT, "tools", id, "app.html"), "utf8"),
      id
    );
    assert.equal(
      fixture.structuralSha256,
      receipt.rawStructuralSha256,
      "immutable foundation receipt changed"
    );
    assert.equal(
      sha256(current),
      receipt.normalizedStructuralSha256,
      "workspace structure changed outside build-managed markup and controller extraction"
    );

    const controller = fs
      .readFileSync(
        path.join(
          ROOT,
          "assets/js/pages/creative",
          `${id}-app-controller.js`
        ),
        "utf8"
      )
      .replace(/\r\n/g, "\n");
    assert.ok(
      fixture.inlineScriptSha256.includes(sha256(controller)),
      "extracted controller does not match any frozen inline runtime"
    );
  });
}
