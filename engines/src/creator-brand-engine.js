(function (window) {
  'use strict';

  var DEFAULT_COLORS = ['#0F766E', '#F59E0B', '#0F172A'];
  var ALLOWED_FONTS = [
    'Sora',
    'DM Sans',
    'Inter',
    'Poppins',
    'Nunito',
    'Raleway',
    'Playfair Display',
    'Space Grotesk',
  ];

  function text(value, fallback, max) {
    var output = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    if (!output) output = fallback || '';
    return output.slice(0, max || 500);
  }

  function normalizeHex(value, fallback) {
    var candidate = String(value || '').trim().toUpperCase();
    if (/^#[0-9A-F]{6}$/.test(candidate)) return candidate;
    if (/^#[0-9A-F]{3}$/.test(candidate)) {
      return '#' + candidate.slice(1).split('').map(function (char) {
        return char + char;
      }).join('');
    }
    return fallback || '#000000';
  }

  function hexToRgb(hex) {
    var clean = normalizeHex(hex, '#000000').slice(1);
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }

  function luminance(hex) {
    var rgb = hexToRgb(hex);
    var channels = [rgb.r, rgb.g, rgb.b].map(function (value) {
      var channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function contrastRatio(first, second) {
    var a = luminance(first);
    var b = luminance(second);
    return Number(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2));
  }

  function uniqueWords(value) {
    var seen = {};
    return String(value || '').split(/[,;\n]/).map(function (item) {
      return text(item, '', 40);
    }).filter(function (item) {
      var key = item.toLowerCase();
      if (!item || seen[key]) return false;
      seen[key] = true;
      return true;
    }).slice(0, 8);
  }

  function buildKit(input, locale) {
    input = input || {};
    var sw = locale === 'sw';
    var headingFont = ALLOWED_FONTS.indexOf(input.headingFont) >= 0 ? input.headingFont : 'Sora';
    var bodyFont = ALLOWED_FONTS.indexOf(input.bodyFont) >= 0 ? input.bodyFont : 'DM Sans';
    var colors = [
      normalizeHex(input.primaryColor, DEFAULT_COLORS[0]),
      normalizeHex(input.secondaryColor, DEFAULT_COLORS[1]),
      normalizeHex(input.textColor, DEFAULT_COLORS[2]),
    ];
    var name = text(input.name, 'My creator brand', 80);
    var tagline = text(input.tagline, 'Create with purpose.', 120);
    var audience = text(input.audience, 'People who value useful, original work', 220);
    var mission = text(input.mission, 'Help the audience make confident progress.', 500);
    var tone = text(input.tone, 'friendly', 30).toLowerCase();
    var words = uniqueWords(input.keywords);
    if (!words.length) words = ['clear', 'useful', 'human'];

    var ratio = contrastRatio(colors[2], colors[0]);
    var sampleLead = sw ? 'Dokezo muhimu kwako:' : tone === 'bold' ? 'Here is the move:' :
      tone === 'formal' ? 'An important update:' :
      tone === 'playful' ? 'A small idea with big energy:' :
      'A useful note for you:';

    return {
      schemaVersion: 1,
      tool: 'creator-brand',
      profile: {
        name: name,
        tagline: tagline,
        industry: text(input.industry, 'creative', 60),
        audience: audience,
        mission: mission,
      },
      colors: {
        primary: colors[0],
        secondary: colors[1],
        text: colors[2],
        primaryTextContrast: ratio,
        primaryTextWcagAA: ratio >= 4.5,
      },
      typography: {
        heading: headingFont,
        body: bodyFont,
      },
      voice: {
        tone: tone,
        keywords: words,
        samplePosts: [
          sampleLead + ' ' + tagline,
          mission + (sw ? ' Imeundwa kwa ' : ' Built for ') + audience + '.',
          name + (sw ? ' inasimamia ' : ' stands for ') + words.join(', ') + '.',
        ],
      },
      assumptions: sw ? [
        'Rangi zinakaguliwa kwa WCAG AA ya maandishi ya kawaida kwa uwiano wa 4.5:1.',
        'Majina ya fonti ni chaguo za mwonekano; mwongozo haupakii faili za fonti.',
        'Mifano ya machapisho inatengenezwa kwenye kifaa kutoka maneno uliyoingiza.',
      ] : [
        'Colors are checked against WCAG AA for normal text at a 4.5:1 ratio.',
        'Font names are presentation choices; the exported guide does not bundle font files.',
        'Sample posts are generated locally from the words entered in this form.',
      ],
    };
  }

  function paletteExports(kit) {
    var colors = kit.colors;
    return {
      css: ':root {\n  --brand-primary: ' + colors.primary + ';\n  --brand-secondary: ' + colors.secondary + ';\n  --brand-text: ' + colors.text + ';\n}',
      tailwind: 'colors: {\n  brand: {\n    primary: "' + colors.primary + '",\n    secondary: "' + colors.secondary + '",\n    text: "' + colors.text + '"\n  }\n}',
      figma: JSON.stringify({
        brandPrimary: colors.primary,
        brandSecondary: colors.secondary,
        brandText: colors.text,
      }, null, 2),
    };
  }

  function toText(kit, locale) {
    var fr = locale === 'fr';
    var sw = locale === 'sw';
    return [
      fr ? 'KIT DE MARQUE' : (sw ? 'MWONGOZO WA BRAND' : 'BRAND KIT'),
      kit.profile.name + ' — ' + kit.profile.tagline,
      '',
      (fr ? 'Mission : ' : 'Mission: ') + kit.profile.mission,
      (fr ? 'Public : ' : (sw ? 'Hadhira: ' : 'Audience: ')) + kit.profile.audience,
      (fr ? 'Secteur : ' : 'Industry: ') + kit.profile.industry,
      '',
      (fr ? 'Couleurs : ' : (sw ? 'Rangi: ' : 'Colors: ')) + [kit.colors.primary, kit.colors.secondary, kit.colors.text].join(', '),
      (fr ? 'Contraste texte/primaire : ' : 'Text/primary contrast: ') + kit.colors.primaryTextContrast + ':1',
      (fr ? 'Typographie : ' : 'Typography: ') + kit.typography.heading + ' / ' + kit.typography.body,
      (fr ? 'Ton : ' : 'Tone: ') + kit.voice.tone,
      (fr ? 'Mots-clés : ' : (sw ? 'Maneno muhimu: ' : 'Keywords: ')) + kit.voice.keywords.join(', '),
      '',
      fr ? 'EXEMPLES DE PUBLICATIONS' : (sw ? 'MIFANO YA MACHAPISHO' : 'SAMPLE POSTS'),
    ].concat(kit.voice.samplePosts.map(function (post, index) {
      return (index + 1) + '. ' + post;
    })).join('\n');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function toGuideHtml(kit, locale) {
    var fr = locale === 'fr';
    var sw = locale === 'sw';
    var title = fr ? 'Guide de marque' : (sw ? 'Mwongozo wa brand' : 'Brand guide');
    return '<!doctype html><html lang="' + (fr ? 'fr' : (sw ? 'sw' : 'en')) + '"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
      escapeHtml(kit.profile.name + ' — ' + title) + '</title><style>' +
      'body{font-family:Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:' + kit.colors.text + '}' +
      'h1,h2{font-family:Arial,sans-serif}.swatches{display:flex;gap:12px;flex-wrap:wrap}.swatch{width:150px;padding:52px 12px 12px;border-radius:12px;color:#fff;font-weight:700}' +
      '</style></head><body><h1>' + escapeHtml(kit.profile.name) + '</h1><p>' + escapeHtml(kit.profile.tagline) +
      '</p><h2>' + (fr ? 'Mission' : 'Mission') + '</h2><p>' + escapeHtml(kit.profile.mission) +
      '</p><h2>' + (fr ? 'Couleurs' : (sw ? 'Rangi' : 'Colors')) + '</h2><div class="swatches">' +
      [kit.colors.primary, kit.colors.secondary, kit.colors.text].map(function (color) {
        return '<div class="swatch" style="background:' + color + '">' + color + '</div>';
      }).join('') + '</div><h2>' + (fr ? 'Typographie' : 'Typography') + '</h2><p>' +
      escapeHtml(kit.typography.heading + ' / ' + kit.typography.body) + '</p><h2>' +
      (fr ? 'Voix' : (sw ? 'Sauti' : 'Voice')) + '</h2><p>' + escapeHtml(kit.voice.tone + ' — ' + kit.voice.keywords.join(', ')) +
      '</p><ol>' + kit.voice.samplePosts.map(function (post) {
        return '<li>' + escapeHtml(post) + '</li>';
      }).join('') + '</ol></body></html>';
  }

  var engine = {
    id: 'creator-brand',
    version: '2.0.0',
    DEFAULT_COLORS: DEFAULT_COLORS.slice(),
    ALLOWED_FONTS: ALLOWED_FONTS.slice(),
    normalizeHex: normalizeHex,
    contrastRatio: contrastRatio,
    buildKit: buildKit,
    paletteExports: paletteExports,
    toText: toText,
    toGuideHtml: toGuideHtml,
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.creatorBrand = engine;

  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
})(typeof window !== 'undefined' ? window : globalThis);
