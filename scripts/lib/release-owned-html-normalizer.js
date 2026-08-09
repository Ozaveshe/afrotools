'use strict';

function sortLocaleLinks(html) {
  const links = [];
  const withoutLinks = html.replace(
    /<link\b(?=[^>]*\brel=["'](?:canonical|alternate)["'])[^>]*>\s*/gi,
    (tag) => {
      links.push(tag.replace(/\s+/g, ' ').trim());
      return '';
    }
  );
  if (!links.length) return withoutLinks;
  links.sort((left, right) => left.localeCompare(right));
  return withoutLinks.replace('</head>', `${links.join('')}</head>`);
}

/**
 * Compare a source-owned page after the release pipeline has added cache
 * hashes and sitewide runtime hooks. This deliberately does not remove body
 * copy, controls, source-owner scripts, forms, or app configuration.
 */
function normalizeReleaseOwnedHtml(input, options = {}) {
  let html = String(input || '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+data-chat-bundle=["'][^"']+["']/gi, '')
    .replace(/(["']\/(?:assets|data|engines)\/[^"'?]+)\?v=[0-9a-f]+(["'])/gi, '$1$2')
    .replace(/(["']\/assets\/[^"']+)\.min\.(css|js)(["'])/gi, '$1.$2$3')
    .replace(/\s*<script\b[^>]*\bsrc=["']\/assets\/js\/analytics-bootstrap\.js(?:\?v=[0-9a-f]+)?["'][^>]*><\/script>\s*/gi, '')
    .replace(/\s*<script\b[^>]*\bsrc=["']\/assets\/js\/lazy-analytics\.js(?:\?v=[0-9a-f]+)?["'][^>]*><\/script>\s*/gi, '')
    .replace(/\s*<script\b[^>]*\bsrc=["']\/assets\/js\/lib\/sw-accessibility\.js(?:\?v=[0-9a-f]+)?["'][^>]*><\/script>\s*/gi, '');

  if (options.stripReleaseMetadata) {
    html = html
      .replace(/\s*<meta\b[^>]*name=["'](?:afrotools-content-id|afrotools-sw-source-hash)["'][^>]*>\s*/gi, '')
      .replace(/\s*<meta\b[^>]*(?:name|property)=["']twitter:[^"']+["'][^>]*>\s*/gi, '')
      .replace(/\s*<meta\b[^>]*property=["']og:image:(?:width|height)["'][^>]*>\s*/gi, '')
      .replace(/\s*<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');
  }

  if (options.stripRouteContractLinks) {
    html = html.replace(
      /\s*<link\b(?=[^>]*\brel=["'](?:canonical|alternate)["'])[^>]*>\s*/gi,
      ''
    );
  }

  if (!options.stripRouteContractLinks) html = sortLocaleLinks(html);
  return html.replace(/>\s+</g, '><').trim();
}

module.exports = { normalizeReleaseOwnedHtml };
