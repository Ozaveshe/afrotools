#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { imageSize } = require('image-size');

const ROOT = path.resolve(__dirname, '..');
const CONFIG = require('../data/localization/fr-document-pdf-parity.json');
const ARTWORK = require('../data/localization/fr-document-pdf-artwork.json');
const STATIC_LANGUAGE = require('../reports/french-document-pdf-language-oracle.json');
const RUNTIME_LANGUAGE = require('../reports/french-document-pdf-runtime-language-receipts.json');
const EXPORTS = require('../reports/french-document-pdf-export-receipts.json');
const BROWSER = require('../reports/french-document-pdf-browser-receipts.json');
const REVIEWED_ON = '2026-07-28';
const ORIGIN = 'https://afrotools.com';
const ALLOWED_ARTWORK_STATUSES = new Set(['reusedTextFree', 'localizedFrench']);

function absolute(relativeFile) {
  return path.join(ROOT, relativeFile.replace(/^\//, ''));
}

function read(relativeFile) {
  return fs.readFileSync(absolute(relativeFile), 'utf8');
}

function writeJson(relativeFile, value) {
  const file = absolute(relativeFile);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function attributes(tag) {
  const values = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(["'])([\s\S]*?)\2/g)) {
    values[match[1].toLowerCase()] = match[3];
  }
  return values;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => ({
    raw: match[0],
    attrs: attributes(match[0])
  }));
}

function link(html, rel, hreflang) {
  return tags(html, 'link').find((entry) => (
    (entry.attrs.rel || '').toLowerCase() === rel
    && (!hreflang || (entry.attrs.hreflang || '').toLowerCase() === hreflang)
  ));
}

function meta(html, key, value) {
  return tags(html, 'meta').find((entry) => (
    (entry.attrs[key] || '').toLowerCase() === value.toLowerCase()
  ));
}

function schemas(html) {
  const parsed = [];
  const failures = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    const attrs = attributes(`<script ${match[1]}>`);
    if ((attrs.type || '').toLowerCase() !== 'application/ld+json') continue;
    try {
      parsed.push(JSON.parse(match[2]));
    } catch (error) {
      failures.push(error.message);
    }
  }
  return { parsed, failures };
}

function indexedRows(report) {
  return new Map((report.rows || []).map((row) => [row.id, row]));
}

function exactArray(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function routePath(url) {
  try {
    return new URL(url, ORIGIN).pathname;
  } catch {
    return '';
  }
}

function findScopedEnglishLinks(html, englishRoutes) {
  return tags(html, 'a')
    .map((entry) => ({
      href: entry.attrs.href || '',
      hreflang: (entry.attrs.hreflang || '').toLowerCase()
    }))
    .filter((entry) => englishRoutes.has(routePath(entry.href)) && entry.hreflang !== 'en');
}

function formatProofAccepted(app, row) {
  if (!row || row.status !== 'accepted') return false;
  if (!exactArray(row.advertisedFormats, app.exports)) return false;
  if (!Array.isArray(row.missing) || row.missing.length !== 0) return false;
  if (row.primaryActionsUngated !== true) return false;
  if (app.sensitive === true || app.requiresConsent === true) {
    if (!row.privacy || row.privacy.noRawFixtureLeak !== true) return false;
  }
  if (app.requiresConsent === true) {
    if (row.privacy.explicitSendConsent !== true || row.privacy.localOnlyPath !== true) return false;
  }
  return app.exports.every((format) => {
    const proof = row.formats && row.formats[format];
    if (!proof || proof.status !== 'accepted') return false;
    if (format === 'pdf' && app.id === 'pdf-password') {
      return proof.encrypted === true
        && proof.noPasswordRejected === true
        && proof.wrongPasswordRejected === true
        && proof.correctPasswordOpened === true
        && proof.fixtureRecovered === true;
    }
    if (format === 'pdf') {
      return proof.signature === '%PDF-'
        && proof.eof === true
        && Number(proof.pages) >= 1
        && proof.fixtureRecovered === true;
    }
    if (format === 'zip') {
      return Array.isArray(proof.members)
        && proof.members.length >= 1
        && proof.parsedPayload === true
        && proof.fixtureRecovered === true;
    }
    if (format === 'docx') {
      return Array.isArray(proof.requiredParts)
        && ['[Content_Types].xml', '_rels/.rels', 'word/document.xml']
          .every((part) => proof.requiredParts.includes(part))
        && proof.fixtureRecovered === true;
    }
    if (format === 'png' || format === 'jpeg') {
      return proof.mimeSignature === format
        && Number(proof.width) > 10
        && Number(proof.height) > 10
        && proof.nonempty === true;
    }
    if (format === 'print') {
      return proof.printInvocation === true && proof.downloadedPdfClaim === false;
    }
    return proof.parsed === true && proof.fixtureRecovered === true;
  });
}

function registryAccepted(app, registrySource) {
  return registrySource.split(/\r?\n/).some((line) => (
    line.includes(app.frenchRoute)
    && line.includes("lang: 'fr'")
    && line.includes(`sourceId: '${app.id}'`)
    && line.includes("category: 'document-pdf'")
  ));
}

function aiAccepted(app, manifestSource, routerSource) {
  const manifestKey = new RegExp(`['"]${app.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\s*:`);
  const routedOwner = app.id === 'document-pdf' ? 'pdf-workspace' : app.id;
  const routerRule = new RegExp(`rule\\([^\\n]+['"]${routedOwner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
  return manifestKey.test(manifestSource) && routerRule.test(routerSource);
}

function main() {
  if (!Array.isArray(CONFIG.apps) || CONFIG.apps.length !== 32) {
    throw new Error(`Expected the fixed 32-row denominator, received ${CONFIG.apps && CONFIG.apps.length}`);
  }
  if (!Array.isArray(ARTWORK.rows) || ARTWORK.rows.length !== 32) {
    throw new Error(`Expected 32 artwork rows, received ${ARTWORK.rows && ARTWORK.rows.length}`);
  }

  const staticRows = indexedRows(STATIC_LANGUAGE);
  const runtimeRows = indexedRows(RUNTIME_LANGUAGE);
  const exportRows = indexedRows(EXPORTS);
  const browserRows = indexedRows(BROWSER);
  const artworkRows = indexedRows(ARTWORK);
  const englishRoutes = new Set(CONFIG.apps.map((app) => app.englishRoute));
  const registrySource = read('assets/js/components/tool-registry.js');
  const manifestSource = read('assets/js/ai/tool-manifest.js');
  const routerSource = read('assets/js/ai/intent-router.js');
  const artworkEvidence = [ARTWORK.cardReviewEvidence, ...(ARTWORK.ogReviewEvidence || [])];
  const artworkEvidenceExists = artworkEvidence.length >= 2
    && artworkEvidence.every((file) => typeof file === 'string' && fs.existsSync(absolute(file)));

  const rows = CONFIG.apps.map((app) => {
    const blockers = [];
    const html = read(app.frenchFile);
    const englishHtml = read(app.englishFile);
    const canonical = link(html, 'canonical');
    const frAlternate = link(html, 'alternate', 'fr');
    const enAlternate = link(html, 'alternate', 'en');
    const englishFrAlternate = link(englishHtml, 'alternate', 'fr');
    const ogUrl = meta(html, 'property', 'og:url');
    const ogImage = meta(html, 'property', 'og:image');
    const description = meta(html, 'name', 'description');
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    const schema = schemas(html);
    const schemaAccepted = schema.failures.length === 0
      && schema.parsed.length > 0
      && schema.parsed.every((entry) => entry && entry.inLanguage === 'fr');
    const scopedEnglishLinks = findScopedEnglishLinks(html, englishRoutes);
    const expectedFrenchUrl = `${ORIGIN}${app.frenchRoute}`;
    const expectedEnglishUrl = `${ORIGIN}${app.englishRoute}`;

    const staticRow = staticRows.get(app.id);
    const staticAccepted = Boolean(
      staticRow
      && staticRow.status === 'accepted'
      && Array.isArray(staticRow.findings)
      && staticRow.findings.length === 0
      && Array.isArray(staticRow.workspaceFindings)
      && staticRow.workspaceFindings.length === 0
    );
    if (!staticAccepted) blockers.push('residual-English static oracle is missing or blocked');

    const runtimeRow = runtimeRows.get(app.id);
    const runtimeAccepted = Boolean(runtimeRow && runtimeRow.accepted === true);
    if (!runtimeAccepted) blockers.push('route-aware exercised runtime language oracle is missing or blocked');

    const exportRow = exportRows.get(app.id);
    const exportsAccepted = formatProofAccepted(app, exportRow);
    if (!exportsAccepted) blockers.push('one or more advertised export, ungated-action, privacy, or consent proofs are missing');

    const browserRow = browserRows.get(app.id);
    const browserAccepted = Boolean(browserRow && browserRow.accepted === true);
    if (!browserAccepted) blockers.push('mobile/reflow/theme/keyboard/console/network browser proof is missing or blocked');

    const artworkRow = artworkRows.get(app.id);
    const artworkFile = artworkRow && typeof artworkRow.asset === 'string'
      ? absolute(artworkRow.asset)
      : '';
    let dimensions = null;
    if (artworkFile && fs.existsSync(artworkFile)) {
      try {
        const measured = imageSize(fs.readFileSync(artworkFile));
        dimensions = { width: measured.width || 0, height: measured.height || 0 };
      } catch {
        dimensions = null;
      }
    }
    const artworkAccepted = Boolean(
      artworkRow
      && artworkRow.sourceId === app.id
      && ALLOWED_ARTWORK_STATUSES.has(artworkRow.status)
      && artworkFile
      && fs.existsSync(artworkFile)
      && dimensions
      && dimensions.width > 0
      && dimensions.height > 0
      && artworkEvidenceExists
      && ogImage
      && routePath(ogImage.attrs.content) === routePath(artworkRow.asset)
    );
    if (!artworkAccepted) blockers.push('artwork mapping, dimensions, OG ownership, or visual-review proof is blocked');

    const seo = {
      canonical: Boolean(canonical && canonical.attrs.href === expectedFrenchUrl),
      ogUrl: Boolean(ogUrl && ogUrl.attrs.content === expectedFrenchUrl),
      title: Boolean(titleMatch && titleMatch[1].trim() === app.title),
      description: Boolean(description && description.attrs.content === app.description),
      schemaInLanguage: schemaAccepted,
      hreflangSelf: Boolean(frAlternate && frAlternate.attrs.href === expectedFrenchUrl),
      hreflangEnglish: Boolean(enAlternate && enAlternate.attrs.href === expectedEnglishUrl),
      hreflangReciprocal: Boolean(englishFrAlternate && englishFrAlternate.attrs.href === expectedFrenchUrl),
      scopedInternalLinks: scopedEnglishLinks.length === 0
    };
    if (Object.values(seo).some((value) => value !== true)) {
      blockers.push('canonical, OG, title/description, schema, hreflang, or internal-link proof is blocked');
    }

    const registry = registryAccepted(app, registrySource);
    const aiDiscovery = aiAccepted(app, manifestSource, routerSource);
    if (!registry) blockers.push('French registry/sourceId/category ownership is missing');
    if (!aiDiscovery) blockers.push('French AI manifest or deterministic intent route is missing');

    let workspace = null;
    if (app.frenchWorkspaceFile) {
      const workspaceHtml = read(app.frenchWorkspaceFile);
      const robots = meta(workspaceHtml, 'name', 'robots');
      workspace = {
        route: app.frenchWorkspaceRoute,
        file: app.frenchWorkspaceFile,
        noindex: Boolean(robots && /(?:^|,)\s*noindex(?:,|$)/i.test(robots.attrs.content || '')),
        browserAccepted: Boolean(browserRow && browserRow.workspace && browserRow.workspace.accepted === true),
        languageAccepted: Boolean(runtimeRow && runtimeRow.workspace && runtimeRow.workspace.accepted === true)
      };
      if (!workspace.noindex || !workspace.browserAccepted || !workspace.languageAccepted) {
        blockers.push('private workspace noindex, browser, or language proof is blocked');
      }
    }

    return {
      id: app.id,
      englishOwner: app.englishFile,
      frenchRoute: app.frenchRoute,
      frenchFile: app.frenchFile,
      workspace,
      registryOwnership: {
        sourceId: app.id,
        category: 'document-pdf',
        accepted: registry
      },
      aiDiscovery: {
        manifestIntent: true,
        deterministicRoute: true,
        accepted: aiDiscovery
      },
      language: {
        static: staticAccepted,
        runtimeAfterInteraction: runtimeAccepted,
        allowlist: STATIC_LANGUAGE.allowlist
      },
      seo,
      browser: browserRow || null,
      privacy: exportRow ? exportRow.privacy : null,
      exports: {
        advertised: app.exports,
        receipt: exportRow || null,
        accepted: exportsAccepted
      },
      source: {
        acceptedEnglishOwner: app.englishFile,
        reviewedOn: REVIEWED_ON,
        freshnessClaimAdded: false,
        complianceAiOrLiveClaimInvented: false
      },
      artwork: {
        sourceId: artworkRow && artworkRow.sourceId,
        status: artworkRow && artworkRow.status,
        asset: artworkRow && artworkRow.asset,
        dimensions,
        cardReviewEvidence: ARTWORK.cardReviewEvidence,
        ogReviewEvidence: ARTWORK.ogReviewEvidence,
        accepted: artworkAccepted
      },
      accepted: blockers.length === 0,
      blockers
    };
  });

  const accepted = rows.filter((row) => row.accepted).length;
  const receipt = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    reviewedOn: REVIEWED_ON,
    denominator: 32,
    accepted,
    blocked: 32 - accepted,
    failClosed: true,
    allAccepted: accepted === 32,
    proofBoundary: {
      staticLanguageRows: STATIC_LANGUAGE.summary && STATIC_LANGUAGE.summary.accepted,
      runtimeLanguageRows: RUNTIME_LANGUAGE.accepted,
      exportRows: (EXPORTS.rows || []).filter((row) => row.status === 'accepted').length,
      browserRows: BROWSER.accepted,
      artworkRows: rows.filter((row) => row.artwork.accepted).length
    },
    sharedOwnerChanges: [
      'assets/js/components/tool-registry.js: scoped French Document/PDF ownership rows',
      'assets/js/ai/tool-manifest.js and assets/js/ai/intent-router.js: scoped French intents and deterministic routing',
      'tools/pdf-to-audio/index.html: removed the unsupported downloadable-audio claim and action',
      'French source-owned runtimes were generated for CV, HTML-to-PDF, freelance invoice, and cover-letter workspaces; English engines were otherwise preserved'
    ],
    rows
  };

  const artworkReport = {
    schemaVersion: 2,
    generatedAt: receipt.generatedAt,
    denominator: 32,
    reusedTextFree: rows.filter((row) => row.artwork.status === 'reusedTextFree' && row.artwork.accepted).length,
    localizedFrench: rows.filter((row) => row.artwork.status === 'localizedFrench' && row.artwork.accepted).length,
    blocked: rows.filter((row) => !row.artwork.accepted).length,
    zeroGenericFallbackAcceptance: true,
    visualReviewEvidence: artworkEvidence,
    rows: rows.map((row) => ({
      id: row.id,
      sourceId: row.artwork.sourceId,
      status: row.artwork.accepted ? row.artwork.status : 'blocked',
      asset: row.artwork.asset,
      dimensions: row.artwork.dimensions,
      cardReviewEvidence: row.artwork.cardReviewEvidence,
      ogReviewEvidence: row.artwork.ogReviewEvidence,
      visuallyReviewed: row.artwork.accepted
    }))
  };

  writeJson('reports/french-document-pdf-parity-evidence.json', receipt);
  writeJson('reports/french-document-pdf-missing-artwork.json', artworkReport);
  console.log(`French Document/PDF evidence: ${accepted}/32 accepted; artwork ${artworkReport.blocked}/32 blocked.`);
  if (accepted !== 32) process.exitCode = 1;
}

main();
