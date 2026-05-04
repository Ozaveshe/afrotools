(function () {
  'use strict';

  var STORAGE_KEY = 'afro_social_card_settings_v2';
  var BRAND_KEY = 'afro_social_card_brand_v1';
  var HISTORY_KEY = 'afro_social_card_history_v1';

  var PLATFORMS = {
    og: { label: 'Open Graph / X / WhatsApp', short: 'OG', width: 1200, height: 630, note: 'Website previews, X, WhatsApp links' },
    linkedin: { label: 'LinkedIn feed', short: 'LinkedIn', width: 1200, height: 627, note: 'Company updates and founder posts' },
    square: { label: 'Instagram square', short: 'Square', width: 1080, height: 1080, note: 'Instagram, Facebook, carousel cover' },
    portrait: { label: 'Portrait feed', short: 'Portrait', width: 1080, height: 1350, note: 'Tall feed posts and ads' },
    story: { label: 'Story / WhatsApp status', short: 'Story', width: 1080, height: 1920, note: 'Stories, status, vertical promos' },
    youtube: { label: 'YouTube community', short: 'YouTube', width: 1280, height: 720, note: 'Community posts and video promos' }
  };

  var PALETTES = {
    atlantic: { label: 'Atlantic blue', primary: '#0f5ea8', accent: '#f6b73c', textColor: '#ffffff' },
    market: { label: 'Market green', primary: '#15803d', accent: '#f59e0b', textColor: '#ffffff' },
    studio: { label: 'Studio ink', primary: '#111827', accent: '#38bdf8', textColor: '#ffffff' },
    coral: { label: 'Coral launch', primary: '#be3455', accent: '#ffd166', textColor: '#ffffff' },
    violet: { label: 'Violet night', primary: '#4c1d95', accent: '#22c55e', textColor: '#ffffff' },
    cream: { label: 'Clean paper', primary: '#f8fafc', accent: '#2563eb', textColor: '#0f172a' }
  };

  var PRESETS = {
    product: {
      label: 'Product drop',
      detail: 'Launch, menu, collection',
      platform: 'square',
      layout: 'split',
      palette: 'coral',
      eyebrow: 'New drop',
      title: 'Fresh collection is live',
      subtitle: 'Announce a product, food menu, beauty launch, or online shop update with a card that reads quickly.',
      cta: 'Shop now',
      footer: 'Built for local brands',
      bgStyle: 'pattern'
    },
    market: {
      label: 'Market day',
      detail: 'Community commerce',
      platform: 'story',
      layout: 'badge',
      palette: 'market',
      eyebrow: 'Saturday market',
      title: 'Fresh produce and home goods',
      subtitle: 'Share a clear WhatsApp status for stalls, pop-ups, fabrics, groceries, and local services.',
      cta: 'Share location',
      footer: 'For traders and community sellers',
      bgStyle: 'gradient'
    },
    event: {
      label: 'Event invite',
      detail: 'Church, meetup, workshop',
      platform: 'portrait',
      layout: 'centered',
      palette: 'violet',
      eyebrow: 'This Friday at 6 PM',
      title: 'Revival night and community gathering',
      subtitle: 'Use this layout for programs, trainings, fellowships, open days, and public announcements.',
      cta: 'Save the date',
      footer: 'Doors open 5:30 PM',
      bgStyle: 'gradient'
    },
    founder: {
      label: 'Founder update',
      detail: 'Milestone or traction',
      platform: 'linkedin',
      layout: 'bold-left',
      palette: 'atlantic',
      eyebrow: 'Company update',
      title: 'We crossed a new milestone this quarter',
      subtitle: 'Summarize traction, growth, hiring, funding, product progress, or a customer win in a polished social card.',
      cta: 'Read the note',
      footer: 'AfroTools Studio',
      bgStyle: 'solid'
    },
    quote: {
      label: 'Quote card',
      detail: 'Creator insight',
      platform: 'og',
      layout: 'quote',
      palette: 'studio',
      eyebrow: 'Creator note',
      title: 'Make the insight clear enough that someone can repost it without extra context.',
      subtitle: 'Use short lines, strong contrast, and a visible brand mark.',
      cta: 'Share this',
      footer: 'For creators and educators',
      bgStyle: 'pattern'
    },
    hiring: {
      label: 'Hiring post',
      detail: 'Role announcement',
      platform: 'linkedin',
      layout: 'lower-third',
      palette: 'cream',
      eyebrow: 'We are hiring',
      title: 'Operations lead for a growing team',
      subtitle: 'Add the role, location, application deadline, and a clean CTA so candidates know the next step.',
      cta: 'Apply by May 20',
      footer: 'Hybrid / Lagos',
      bgStyle: 'solid'
    },
    training: {
      label: 'Training cohort',
      detail: 'Bootcamp or class',
      platform: 'og',
      layout: 'bold-left',
      palette: 'atlantic',
      eyebrow: 'Applications open',
      title: 'Digital skills cohort for small businesses',
      subtitle: 'Use for bootcamps, webinars, school programs, fellowships, and creator courses.',
      cta: 'Reserve a seat',
      footer: 'Limited cohort size',
      bgStyle: 'gradient'
    },
    news: {
      label: 'News update',
      detail: 'Public alert',
      platform: 'youtube',
      layout: 'lower-third',
      palette: 'studio',
      eyebrow: 'Breaking update',
      title: 'What changed and why it matters',
      subtitle: 'Keep the headline factual, put the context below, and export a wide card for video or community posts.',
      cta: 'See details',
      footer: 'Verified update',
      bgStyle: 'pattern'
    }
  };

  var DEFAULT_STATE = {
    platform: 'og',
    preset: 'training',
    layout: 'bold-left',
    palette: 'atlantic',
    bgStyle: 'gradient',
    primary: PALETTES.atlantic.primary,
    accent: PALETTES.atlantic.accent,
    textColor: PALETTES.atlantic.textColor,
    eyebrow: PRESETS.training.eyebrow,
    title: PRESETS.training.title,
    subtitle: PRESETS.training.subtitle,
    cta: PRESETS.training.cta,
    footer: PRESETS.training.footer,
    textScale: 100,
    padding: 8,
    overlay: 34,
    blur: 0,
    showGuides: true,
    exportFormat: 'image/png',
    quality: 0.92,
    filenameSuffix: 'campaign-card',
    backgroundName: '',
    logoName: '',
    backgroundSrc: '',
    logoSrc: ''
  };

  var state = Object.assign({}, DEFAULT_STATE);
  var els = {};
  var backgroundImage = null;
  var logoImage = null;
  var history = [];
  var saveTimer = 0;

  function qs(id) {
    return document.getElementById(id);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function safeJsonParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function persistableState() {
    return Object.assign({}, state);
  }

  function setStatus(message) {
    if (els.status) els.status.textContent = message;
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persistableState()));
        setStatus('Saved locally');
      } catch (err) {
        setStatus('Preview updated');
      }
    }, 180);
  }

  function loadStoredState() {
    var hashState = readHashState();
    var saved = safeJsonParse(localStorage.getItem(STORAGE_KEY), null);
    var next = hashState || saved || {};
    state = Object.assign({}, DEFAULT_STATE, next);
    if (!PLATFORMS[state.platform]) state.platform = DEFAULT_STATE.platform;
    if (!PALETTES[state.palette]) state.palette = DEFAULT_STATE.palette;
    history = safeJsonParse(localStorage.getItem(HISTORY_KEY), []);
  }

  function readHashState() {
    var match = String(window.location.hash || '').match(/design=([^&]+)/);
    if (!match) return null;
    try {
      var decoded = decodeURIComponent(match[1]).replace(/-/g, '+').replace(/_/g, '/');
      while (decoded.length % 4) decoded += '=';
      return JSON.parse(atob(decoded));
    } catch (err) {
      return null;
    }
  }

  function encodeStateForLink() {
    var clean = persistableState();
    clean.backgroundSrc = '';
    clean.logoSrc = '';
    clean.backgroundName = '';
    clean.logoName = '';
    var encoded = btoa(JSON.stringify(clean)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return window.location.origin + window.location.pathname + '#design=' + encodeURIComponent(encoded);
  }

  function hexToRgb(hex) {
    var clean = String(hex || '').replace('#', '').trim();
    if (clean.length === 3) clean = clean.split('').map(function (ch) { return ch + ch; }).join('');
    var num = parseInt(clean, 16);
    if (!Number.isFinite(num)) return { r: 15, g: 23, b: 42 };
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgba(hex, alpha) {
    var rgb = hexToRgb(hex);
    return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')';
  }

  function luminance(hex) {
    var rgb = hexToRgb(hex);
    var values = [rgb.r, rgb.g, rgb.b].map(function (value) {
      var channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  }

  function contrastRatio(a, b) {
    var l1 = luminance(a);
    var l2 = luminance(b);
    var light = Math.max(l1, l2);
    var dark = Math.min(l1, l2);
    return (light + 0.05) / (dark + 0.05);
  }

  function slugify(value) {
    return String(value || 'social-card')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'social-card';
  }

  function fileExtension() {
    if (state.exportFormat === 'image/jpeg') return 'jpg';
    if (state.exportFormat === 'image/webp') return 'webp';
    return 'png';
  }

  function renderPlatformButtons() {
    if (!els.platformGrid) return;
    els.platformGrid.innerHTML = Object.keys(PLATFORMS).map(function (key) {
      var item = PLATFORMS[key];
      return '<button type="button" class="social-choice" data-platform="' + key + '"><strong>' + item.label + '</strong><span>' + item.width + ' x ' + item.height + ' - ' + item.note + '</span></button>';
    }).join('');
  }

  function renderPresetButtons() {
    if (!els.presetGrid) return;
    els.presetGrid.innerHTML = Object.keys(PRESETS).map(function (key) {
      var item = PRESETS[key];
      return '<button type="button" class="social-choice" data-preset="' + key + '"><strong>' + item.label + '</strong><span>' + item.detail + '</span></button>';
    }).join('');
  }

  function renderPaletteButtons() {
    if (!els.paletteGrid) return;
    els.paletteGrid.innerHTML = Object.keys(PALETTES).map(function (key) {
      var item = PALETTES[key];
      return '<button type="button" class="social-palette" data-palette="' + key + '"><span class="social-swatches"><i style="background:' + item.primary + '"></i><i style="background:' + item.accent + '"></i><i style="background:' + item.textColor + '"></i></span>' + item.label + '</button>';
    }).join('');
  }

  function syncForm() {
    var fieldMap = {
      layout: els.layout,
      bgStyle: els.bgStyle,
      eyebrow: els.eyebrow,
      title: els.title,
      subtitle: els.subtitle,
      cta: els.cta,
      footer: els.footer,
      primary: els.primary,
      accent: els.accent,
      textColor: els.textColor,
      textScale: els.textScale,
      padding: els.padding,
      overlay: els.overlay,
      blur: els.blur,
      exportFormat: els.format,
      quality: els.quality,
      filenameSuffix: els.suffix
    };

    Object.keys(fieldMap).forEach(function (key) {
      if (fieldMap[key]) fieldMap[key].value = state[key];
    });

    if (els.guides) els.guides.checked = !!state.showGuides;
    if (els.textScaleValue) els.textScaleValue.textContent = state.textScale + '%';
    if (els.paddingValue) els.paddingValue.textContent = state.padding + '%';
    if (els.overlayValue) els.overlayValue.textContent = state.overlay + '%';
    if (els.blurValue) els.blurValue.textContent = state.blur + ' px';
    if (els.qualityValue) els.qualityValue.textContent = Math.round(state.quality * 100) + '%';
    if (els.backgroundName) els.backgroundName.textContent = state.backgroundName || 'Choose image';
    if (els.logoName) els.logoName.textContent = state.logoName || 'Choose logo';

    document.querySelectorAll('[data-platform]').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-platform') === state.platform);
    });
    document.querySelectorAll('[data-preset]').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-preset') === state.preset);
    });
    document.querySelectorAll('[data-palette]').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-palette') === state.palette);
    });
  }

  function applyPreset(key) {
    var preset = PRESETS[key];
    if (!preset) return;
    var palette = PALETTES[preset.palette] || PALETTES.atlantic;
    state = Object.assign({}, state, preset, {
      preset: key,
      primary: palette.primary,
      accent: palette.accent,
      textColor: palette.textColor
    });
    syncForm();
    renderPreview();
    scheduleSave();
  }

  function applyPalette(key) {
    var palette = PALETTES[key];
    if (!palette) return;
    state.palette = key;
    state.primary = palette.primary;
    state.accent = palette.accent;
    state.textColor = palette.textColor;
    syncForm();
    renderPreview();
    scheduleSave();
  }

  function setField(key, value) {
    if (['textScale', 'padding', 'overlay', 'blur'].indexOf(key) !== -1) {
      state[key] = Number(value);
    } else if (key === 'quality') {
      state[key] = Number(value);
    } else if (key === 'showGuides') {
      state[key] = !!value;
    } else {
      state[key] = value;
    }
    if (key === 'primary' || key === 'accent' || key === 'textColor') state.palette = 'custom';
    syncForm();
    renderPreview();
    scheduleSave();
  }

  function drawRoundedRect(ctx, x, y, w, h, radius) {
    var r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCoverImage(ctx, img, x, y, w, h) {
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    var ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    var dw = img.naturalWidth * ratio;
    var dh = img.naturalHeight * ratio;
    var dx = x + (w - dw) / 2;
    var dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function drawPattern(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = rgba(state.accent, 0.22);
    ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.003));
    var gap = Math.max(56, Math.round(Math.min(w, h) * 0.09));
    for (var x = -gap; x < w + gap; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, h + gap);
      ctx.lineTo(x + h + gap, -gap);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = state.accent;
    for (var i = 0; i < 18; i += 1) {
      var px = (i * 173) % w;
      var py = (i * 97) % h;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(8, Math.min(w, h) * 0.012), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBackground(ctx, w, h, includeGuides) {
    if (state.bgStyle === 'image' && backgroundImage) {
      ctx.save();
      if (state.blur > 0 && 'filter' in ctx) ctx.filter = 'blur(' + state.blur + 'px)';
      var bleed = state.blur > 0 ? state.blur * 3 : 0;
      drawCoverImage(ctx, backgroundImage, -bleed, -bleed, w + bleed * 2, h + bleed * 2);
      ctx.restore();
      ctx.fillStyle = rgba(state.primary, state.overlay / 100);
      ctx.fillRect(0, 0, w, h);
    } else if (state.bgStyle === 'solid') {
      ctx.fillStyle = state.primary;
      ctx.fillRect(0, 0, w, h);
    } else {
      var gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, state.primary);
      gradient.addColorStop(1, state.accent);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      if (state.bgStyle === 'pattern') drawPattern(ctx, w, h);
    }

    ctx.save();
    ctx.fillStyle = rgba('#000000', state.textColor === '#0f172a' ? 0 : 0.08);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    void includeGuides;
  }

  function drawDecor(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = rgba(state.accent, 0.7);
    drawRoundedRect(ctx, w * 0.72, -h * 0.08, w * 0.36, h * 0.34, Math.min(w, h) * 0.08);
    ctx.fill();
    ctx.globalAlpha = 0.16;
    drawRoundedRect(ctx, -w * 0.08, h * 0.74, w * 0.34, h * 0.24, Math.min(w, h) * 0.07);
    ctx.fill();
    ctx.restore();
  }

  function drawSafeGuides(ctx, w, h) {
    var margin = Math.round(Math.min(w, h) * 0.08);
    ctx.save();
    ctx.setLineDash([18, 12]);
    ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.003));
    ctx.strokeStyle = 'rgba(255,255,255,.72)';
    ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,.78)';
    ctx.font = '800 ' + Math.max(18, Math.round(Math.min(w, h) * 0.025)) + 'px "DM Sans", Arial, sans-serif';
    ctx.fillText('safe zone', margin + 12, margin + Math.max(26, Math.round(Math.min(w, h) * 0.04)));
    ctx.restore();
  }

  function wrapLines(ctx, text, maxWidth, maxLines) {
    var words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    var lines = [];
    var line = '';
    words.forEach(function (word) {
      var test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width <= maxWidth || !line) {
        line = test;
      } else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      var last = lines[lines.length - 1];
      while (ctx.measureText(last + '...').width > maxWidth && last.length > 8) {
        last = last.slice(0, -1);
      }
      lines[lines.length - 1] = last.replace(/\s+$/, '') + '...';
    }
    return lines;
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines, align) {
    var lines = wrapLines(ctx, text, maxWidth, maxLines);
    ctx.textAlign = align || 'left';
    lines.forEach(function (line, index) {
      ctx.fillText(line, x, y + index * lineHeight);
    });
    return lines.length * lineHeight;
  }

  function drawPill(ctx, text, x, y, align, scale) {
    if (!text) return 0;
    var fontSize = Math.round(18 * scale);
    ctx.font = '900 ' + fontSize + 'px "DM Sans", Arial, sans-serif';
    var padX = Math.round(16 * scale);
    var padY = Math.round(10 * scale);
    var width = ctx.measureText(text).width + padX * 2;
    var height = fontSize + padY * 2;
    var left = align === 'center' ? x - width / 2 : x;
    ctx.save();
    ctx.fillStyle = rgba(state.accent, 0.92);
    drawRoundedRect(ctx, left, y, width, height, height / 2);
    ctx.fill();
    ctx.fillStyle = contrastRatio(state.accent, '#0f172a') > 4.5 ? '#0f172a' : '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = align || 'left';
    ctx.fillText(text, align === 'center' ? x : left + padX, y + height / 2 + 1);
    ctx.restore();
    return height;
  }

  function drawLogo(ctx, w, h, pad, scale) {
    var size = Math.max(58, Math.round(Math.min(w, h) * 0.075));
    var x = w - pad - size;
    var y = pad;
    ctx.save();
    if (logoImage) {
      drawRoundedRect(ctx, x, y, size, size, size * 0.22);
      ctx.clip();
      drawCoverImage(ctx, logoImage, x, y, size, size);
    } else {
      drawRoundedRect(ctx, x, y, size, size, size * 0.24);
      ctx.fillStyle = rgba(state.accent, 0.95);
      ctx.fill();
      ctx.fillStyle = contrastRatio(state.accent, '#0f172a') > 4.5 ? '#0f172a' : '#ffffff';
      ctx.font = '900 ' + Math.round(size * 0.34 * scale) + 'px "DM Sans", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials(state.footer || 'AT'), x + size / 2, y + size / 2 + 1);
    }
    ctx.restore();
  }

  function initials(text) {
    return String(text || 'AT')
      .replace(/[^A-Za-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (word) { return word.charAt(0).toUpperCase(); })
      .join('') || 'AT';
  }

  function drawFooter(ctx, w, h, x, scale, align, y) {
    var text = state.footer || 'AfroTools';
    var footerY = y || h - Math.round(Math.min(w, h) * (state.padding / 100));
    ctx.save();
    ctx.fillStyle = state.textColor;
    ctx.globalAlpha = 0.86;
    ctx.font = '850 ' + Math.round(20 * scale) + 'px "DM Sans", Arial, sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, align === 'center' ? w / 2 : x, footerY);
    ctx.restore();
  }

  function drawTextBlock(ctx, opts) {
    var scale = opts.scale;
    ctx.save();
    ctx.fillStyle = state.textColor;
    ctx.textBaseline = 'alphabetic';

    if (state.eyebrow) {
      ctx.font = '900 ' + Math.round(opts.eyebrowSize) + 'px "DM Sans", Arial, sans-serif';
      ctx.globalAlpha = 0.92;
      ctx.fillText(state.eyebrow.toUpperCase(), opts.x, opts.y);
      opts.y += opts.eyebrowSize * 1.55;
      ctx.globalAlpha = 1;
    }

    ctx.font = '900 ' + Math.round(opts.titleSize) + 'px "DM Sans", Arial, sans-serif';
    var titleHeight = drawWrappedText(ctx, state.title, opts.x, opts.y, opts.maxWidth, opts.titleSize * 1.04, opts.titleLines || 4, opts.align);
    opts.y += titleHeight + opts.titleSize * 0.26;

    if (state.subtitle) {
      ctx.font = '700 ' + Math.round(opts.bodySize) + 'px "DM Sans", Arial, sans-serif';
      ctx.globalAlpha = 0.9;
      opts.y += drawWrappedText(ctx, state.subtitle, opts.x, opts.y, opts.maxWidth, opts.bodySize * 1.38, opts.bodyLines || 4, opts.align);
      ctx.globalAlpha = 1;
    }

    if (state.cta) {
      opts.y += opts.bodySize * 0.75;
      drawPill(ctx, state.cta, opts.x, opts.y, opts.align, scale);
    }
    ctx.restore();
  }

  function drawCard(canvas, options) {
    var platform = PLATFORMS[state.platform] || PLATFORMS.og;
    canvas.width = platform.width;
    canvas.height = platform.height;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var base = Math.min(w, h);
    var scale = clamp(state.textScale / 100, 0.75, 1.35);
    var pad = Math.round(base * (state.padding / 100));
    var titleSize = clamp(w * 0.066 * scale, 44, state.platform === 'story' ? 112 : 96);
    var bodySize = clamp(w * 0.024 * scale, 22, state.platform === 'story' ? 42 : 34);
    var eyebrowSize = clamp(w * 0.019 * scale, 18, 28);
    var layout = state.layout;

    drawBackground(ctx, w, h, !!(options && options.guides));
    drawDecor(ctx, w, h);

    ctx.fillStyle = state.textColor;
    if (layout === 'centered') {
      var maxWidth = w - pad * 2.4;
      drawTextBlock(ctx, {
        x: w / 2,
        y: h * 0.29,
        maxWidth: maxWidth,
        titleSize: titleSize * 1.04,
        bodySize: bodySize,
        eyebrowSize: eyebrowSize,
        scale: scale,
        align: 'center',
        titleLines: state.platform === 'story' ? 6 : 4,
        bodyLines: 4
      });
      drawFooter(ctx, w, h, pad, scale, 'center');
      drawLogo(ctx, w, h, pad, scale);
    } else if (layout === 'split') {
      var leftW = w * 0.42;
      ctx.save();
      drawRoundedRect(ctx, pad, pad, leftW - pad * 1.2, h - pad * 2, base * 0.04);
      ctx.clip();
      if (backgroundImage) {
        drawCoverImage(ctx, backgroundImage, pad, pad, leftW - pad * 1.2, h - pad * 2);
      } else {
        var splitGradient = ctx.createLinearGradient(pad, pad, leftW, h - pad);
        splitGradient.addColorStop(0, rgba(state.accent, 0.95));
        splitGradient.addColorStop(1, rgba(state.primary, 0.42));
        ctx.fillStyle = splitGradient;
        ctx.fillRect(pad, pad, leftW - pad * 1.2, h - pad * 2);
        drawPattern(ctx, leftW, h);
      }
      ctx.restore();
      drawTextBlock(ctx, {
        x: leftW + pad * 0.55,
        y: pad + eyebrowSize * 1.2,
        maxWidth: w - leftW - pad * 1.6,
        titleSize: titleSize * 0.9,
        bodySize: bodySize * 0.95,
        eyebrowSize: eyebrowSize,
        scale: scale,
        align: 'left',
        titleLines: 4,
        bodyLines: 4
      });
      drawFooter(ctx, w, h, leftW + pad * 0.55, scale, 'left');
      drawLogo(ctx, w, h, pad, scale);
    } else if (layout === 'quote') {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = state.accent;
      ctx.font = '600 ' + Math.round(base * 0.32) + 'px "Instrument Serif", Georgia, serif';
      ctx.fillText('"', pad, pad + base * 0.2);
      ctx.restore();
      ctx.font = '600 ' + Math.round(titleSize * 0.9) + 'px "Instrument Serif", Georgia, serif';
      ctx.fillStyle = state.textColor;
      drawWrappedText(ctx, state.title, pad, h * 0.33, w - pad * 2, titleSize * 0.98, state.platform === 'story' ? 7 : 5, 'left');
      ctx.font = '800 ' + Math.round(bodySize) + 'px "DM Sans", Arial, sans-serif';
      ctx.globalAlpha = 0.85;
      drawWrappedText(ctx, state.subtitle, pad, h * 0.72, w - pad * 2.2, bodySize * 1.35, 3, 'left');
      ctx.globalAlpha = 1;
      drawPill(ctx, state.cta, pad, h - pad - bodySize * 3, 'left', scale);
      drawFooter(ctx, w, h, pad, scale, 'left');
      drawLogo(ctx, w, h, pad, scale);
    } else if (layout === 'lower-third') {
      if (backgroundImage) {
        ctx.save();
        ctx.globalAlpha = 0.96;
        drawCoverImage(ctx, backgroundImage, 0, 0, w, h);
        ctx.restore();
        ctx.fillStyle = rgba(state.primary, 0.45);
        ctx.fillRect(0, 0, w, h);
      }
      var bandH = Math.max(h * 0.38, base * 0.38);
      ctx.save();
      ctx.fillStyle = rgba(state.primary, state.textColor === '#0f172a' ? 0.08 : 0.82);
      drawRoundedRect(ctx, pad, h - pad - bandH, w - pad * 2, bandH, base * 0.04);
      ctx.fill();
      ctx.restore();
      drawTextBlock(ctx, {
        x: pad * 1.45,
        y: h - pad - bandH + eyebrowSize * 1.8,
        maxWidth: w - pad * 3,
        titleSize: titleSize * 0.82,
        bodySize: bodySize * 0.9,
        eyebrowSize: eyebrowSize,
        scale: scale,
        align: 'left',
        titleLines: 3,
        bodyLines: 2
      });
      drawFooter(ctx, w, h, pad * 1.45, scale, 'left');
      drawLogo(ctx, w, h, pad, scale);
    } else if (layout === 'badge') {
      var ring = Math.min(w, h) * 0.44;
      ctx.save();
      ctx.strokeStyle = rgba(state.accent, 0.7);
      ctx.lineWidth = Math.max(14, base * 0.028);
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.35, ring / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      drawTextBlock(ctx, {
        x: w / 2,
        y: h * 0.21,
        maxWidth: w - pad * 2.3,
        titleSize: titleSize * 0.95,
        bodySize: bodySize,
        eyebrowSize: eyebrowSize,
        scale: scale,
        align: 'center',
        titleLines: state.platform === 'story' ? 6 : 4,
        bodyLines: 4
      });
      drawFooter(ctx, w, h, pad, scale, 'center');
      drawLogo(ctx, w, h, pad, scale);
    } else {
      drawTextBlock(ctx, {
        x: pad,
        y: pad + eyebrowSize * 1.15,
        maxWidth: w * 0.68,
        titleSize: titleSize,
        bodySize: bodySize,
        eyebrowSize: eyebrowSize,
        scale: scale,
        align: 'left',
        titleLines: state.platform === 'story' ? 7 : 4,
        bodyLines: 4
      });
      drawFooter(ctx, w, h, pad, scale, 'left');
      drawLogo(ctx, w, h, pad, scale);
    }

    if (options && options.guides) drawSafeGuides(ctx, w, h);
  }

  function renderPreview() {
    if (!els.canvas) return;
    drawCard(els.canvas, { guides: state.showGuides });
    updateMetrics();
  }

  function updateMetrics() {
    var platform = PLATFORMS[state.platform] || PLATFORMS.og;
    if (els.previewTitle) els.previewTitle.textContent = platform.label;
    if (els.sizeMetric) els.sizeMetric.textContent = platform.width + ' x ' + platform.height;

    var ratio = contrastRatio(state.primary, state.textColor);
    var contrastLabel = ratio >= 4.5 ? 'Good ' + ratio.toFixed(1) + ':1' : 'Low ' + ratio.toFixed(1) + ':1';
    if (els.contrastMetric) els.contrastMetric.textContent = contrastLabel;

    var titleLength = String(state.title || '').length;
    var fitLabel = titleLength <= 78 ? 'Strong' : titleLength <= 118 ? 'Watch length' : 'Too long';
    if (els.fitMetric) els.fitMetric.textContent = fitLabel;
    renderChecklist(ratio, titleLength);
    renderHistory();
  }

  function renderChecklist(ratio, titleLength) {
    if (!els.checklist) return;
    var platform = PLATFORMS[state.platform] || PLATFORMS.og;
    var items = [
      { ok: true, text: 'Canvas is exact size: ' + platform.width + ' x ' + platform.height + ' px.' },
      { ok: ratio >= 4.5 || state.bgStyle === 'image', text: ratio >= 4.5 ? 'Text contrast is strong for fast scanning.' : 'Contrast may be low. Adjust primary or text color.' },
      { ok: titleLength <= 118, text: titleLength <= 78 ? 'Headline length is clean.' : titleLength <= 118 ? 'Headline is workable, but keep an eye on small screens.' : 'Headline is long. Shorten before posting.' },
      { ok: !!state.footer, text: state.footer ? 'Brand footer is present.' : 'Add a brand or footer note.' },
      { ok: !!state.cta, text: state.cta ? 'CTA is included for handoff.' : 'Add a CTA if this is a campaign card.' }
    ];
    els.checklist.innerHTML = items.map(function (item) {
      return '<li class="' + (item.ok ? '' : 'warn') + '"><i>' + (item.ok ? 'OK' : '!') + '</i><span>' + item.text + '</span></li>';
    }).join('');
  }

  function renderHistory() {
    if (!els.history) return;
    if (!history.length) {
      els.history.innerHTML = '<p class="social-empty">Exports you download in this browser will appear here.</p>';
      return;
    }
    els.history.innerHTML = history.slice(0, 5).map(function (item) {
      return '<div class="social-history-item"><strong>' + item.title + '</strong><span>' + item.platform + ' - ' + item.size + ' - ' + item.format + ' - ' + item.time + '</span></div>';
    }).join('');
  }

  function renderExportCanvas(platformKey) {
    var previous = state.platform;
    if (platformKey) state.platform = platformKey;
    var platform = PLATFORMS[state.platform] || PLATFORMS.og;
    var canvas = document.createElement('canvas');
    canvas.width = platform.width;
    canvas.height = platform.height;
    drawCard(canvas, { guides: false });
    state.platform = previous;
    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        resolve(blob);
      }, state.exportFormat, state.quality);
    });
  }

  async function downloadCurrent(platformKey) {
    var activePlatform = platformKey || state.platform;
    var canvas = renderExportCanvas(activePlatform);
    var blob = await canvasToBlob(canvas);
    if (!blob) {
      setStatus('Export failed');
      return;
    }
    var platform = PLATFORMS[activePlatform] || PLATFORMS.og;
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    var suffix = slugify(state.filenameSuffix || state.title || 'social-card');
    link.href = url;
    link.download = 'social-card-' + activePlatform + '-' + suffix + '.' + fileExtension();
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
    addHistory(platform, blob);
    setStatus('Downloaded ' + platform.short);
  }

  function addHistory(platform, blob) {
    var now = new Date();
    history.unshift({
      title: String(state.title || 'Social card').slice(0, 74),
      platform: platform.label,
      size: platform.width + ' x ' + platform.height,
      format: fileExtension().toUpperCase(),
      bytes: blob ? blob.size : 0,
      time: now.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    });
    history = history.slice(0, 8);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (err) {}
    renderHistory();
  }

  async function downloadPlatformSet() {
    var keys = ['og', 'linkedin', 'square', 'portrait', 'story', 'youtube'];
    setStatus('Preparing platform set');
    for (var i = 0; i < keys.length; i += 1) {
      await downloadCurrent(keys[i]);
      await new Promise(function (resolve) { setTimeout(resolve, 180); });
    }
    setStatus('Platform set exported');
  }

  function metadataSnippet() {
    var platform = PLATFORMS[state.platform] || PLATFORMS.og;
    var filename = 'social-card-' + state.platform + '-' + slugify(state.filenameSuffix || state.title) + '.' + fileExtension();
    return [
      '<meta property="og:image" content="https://your-site.com/assets/' + filename + '">',
      '<meta property="og:image:width" content="' + platform.width + '">',
      '<meta property="og:image:height" content="' + platform.height + '">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:image" content="https://your-site.com/assets/' + filename + '">'
    ].join('\n');
  }

  function handoffBrief() {
    var platform = PLATFORMS[state.platform] || PLATFORMS.og;
    return [
      'Social card handoff',
      'Platform: ' + platform.label + ' (' + platform.width + ' x ' + platform.height + ' px)',
      'Headline: ' + state.title,
      'Supporting copy: ' + state.subtitle,
      'CTA: ' + state.cta,
      'Brand/footer: ' + state.footer,
      'Layout: ' + state.layout,
      'Colors: primary ' + state.primary + ', accent ' + state.accent + ', text ' + state.textColor,
      'Export: ' + fileExtension().toUpperCase() + ' at ' + Math.round(state.quality * 100) + '% quality'
    ].join('\n');
  }

  function copyText(text, success) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus(success);
      }).catch(function () {
        legacyCopy(text, success);
      });
    } else {
      legacyCopy(text, success);
    }
  }

  function legacyCopy(text, success) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setStatus(success);
    } catch (err) {
      setStatus('Copy failed');
    }
    textarea.remove();
  }

  function saveBrand() {
    var brand = {
      palette: state.palette,
      primary: state.primary,
      accent: state.accent,
      textColor: state.textColor,
      footer: state.footer,
      logoName: state.logoName,
      logoSrc: state.logoSrc && state.logoSrc.length < 700000 ? state.logoSrc : ''
    };
    try {
      localStorage.setItem(BRAND_KEY, JSON.stringify(brand));
      setStatus('Brand kit saved');
    } catch (err) {
      setStatus('Brand kit too large to save');
    }
  }

  async function loadBrand() {
    var brand = safeJsonParse(localStorage.getItem(BRAND_KEY), null);
    if (!brand) {
      setStatus('No saved brand kit yet');
      return;
    }
    state = Object.assign({}, state, brand);
    if (brand.logoSrc) await loadImageFromSource(brand.logoSrc, 'logo', brand.logoName || 'Saved logo');
    syncForm();
    renderPreview();
    scheduleSave();
    setStatus('Brand kit loaded');
  }

  function resetStudio() {
    state = Object.assign({}, DEFAULT_STATE);
    backgroundImage = null;
    logoImage = null;
    syncForm();
    renderPreview();
    scheduleSave();
    setStatus('Reset complete');
  }

  function loadImageFromFile(file, target) {
    if (!file || !/^image\//.test(file.type)) {
      setStatus('Choose an image file');
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      loadImageFromSource(String(reader.result || ''), target, file.name);
    };
    reader.onerror = function () {
      setStatus('Image could not load');
    };
    reader.readAsDataURL(file);
  }

  function loadImageFromSource(src, target, name) {
    return new Promise(function (resolve) {
      if (!src) {
        resolve();
        return;
      }
      var img = new Image();
      img.onload = function () {
        if (target === 'background') {
          backgroundImage = img;
          state.backgroundSrc = src.length < 1700000 ? src : '';
          state.backgroundName = name || 'Background image';
          state.bgStyle = 'image';
        } else {
          logoImage = img;
          state.logoSrc = src.length < 700000 ? src : '';
          state.logoName = name || 'Logo';
        }
        syncForm();
        renderPreview();
        scheduleSave();
        setStatus(target === 'background' ? 'Background loaded' : 'Logo loaded');
        resolve();
      };
      img.onerror = function () {
        setStatus('Image could not load');
        resolve();
      };
      img.src = src;
    });
  }

  function bindEvents() {
    document.addEventListener('click', function (event) {
      var platformButton = event.target.closest('[data-platform]');
      if (platformButton) {
        state.platform = platformButton.getAttribute('data-platform');
        syncForm();
        renderPreview();
        scheduleSave();
        return;
      }
      var presetButton = event.target.closest('[data-preset]');
      if (presetButton) {
        applyPreset(presetButton.getAttribute('data-preset'));
        return;
      }
      var paletteButton = event.target.closest('[data-palette]');
      if (paletteButton) {
        applyPalette(paletteButton.getAttribute('data-palette'));
      }
    });

    document.querySelectorAll('[data-sc-field]').forEach(function (field) {
      var eventName = field.type === 'checkbox' ? 'change' : 'input';
      field.addEventListener(eventName, function () {
        setField(field.getAttribute('data-sc-field'), field.type === 'checkbox' ? field.checked : field.value);
      });
      if (field.tagName === 'SELECT') {
        field.addEventListener('change', function () {
          setField(field.getAttribute('data-sc-field'), field.value);
        });
      }
    });

    if (els.backgroundInput) {
      els.backgroundInput.addEventListener('change', function () {
        loadImageFromFile(els.backgroundInput.files && els.backgroundInput.files[0], 'background');
      });
    }
    if (els.logoInput) {
      els.logoInput.addEventListener('change', function () {
        loadImageFromFile(els.logoInput.files && els.logoInput.files[0], 'logo');
      });
    }
    if (els.download) els.download.addEventListener('click', function () { downloadCurrent(); });
    if (els.downloadSet) els.downloadSet.addEventListener('click', downloadPlatformSet);
    if (els.copyMeta) els.copyMeta.addEventListener('click', function () { copyText(metadataSnippet(), 'OG snippet copied'); });
    if (els.copyBrief) els.copyBrief.addEventListener('click', function () { copyText(handoffBrief(), 'Handoff brief copied'); });
    if (els.copyLink) els.copyLink.addEventListener('click', function () { copyText(encodeStateForLink(), 'Design link copied'); });
    if (els.saveBrand) els.saveBrand.addEventListener('click', saveBrand);
    if (els.loadBrand) els.loadBrand.addEventListener('click', loadBrand);
    if (els.reset) els.reset.addEventListener('click', resetStudio);
  }

  async function hydrateSavedImages() {
    if (state.backgroundSrc) await loadImageFromSource(state.backgroundSrc, 'background', state.backgroundName);
    if (state.logoSrc) await loadImageFromSource(state.logoSrc, 'logo', state.logoName);
  }

  async function init() {
    els = {
      status: qs('socialStatus'),
      presetGrid: qs('socialPresetGrid'),
      platformGrid: qs('socialPlatformGrid'),
      paletteGrid: qs('socialPaletteGrid'),
      canvas: qs('socialCanvas'),
      previewTitle: qs('socialPreviewTitle'),
      sizeMetric: qs('socialSizeMetric'),
      contrastMetric: qs('socialContrastMetric'),
      fitMetric: qs('socialFitMetric'),
      checklist: qs('socialChecklist'),
      history: qs('socialHistory'),
      layout: qs('socialLayout'),
      bgStyle: qs('socialBackgroundStyle'),
      eyebrow: qs('socialEyebrow'),
      title: qs('socialTitle'),
      subtitle: qs('socialSubtitle'),
      cta: qs('socialCta'),
      footer: qs('socialFooter'),
      primary: qs('socialPrimary'),
      accent: qs('socialAccent'),
      textColor: qs('socialTextColor'),
      textScale: qs('socialTextScale'),
      textScaleValue: qs('socialTextScaleValue'),
      padding: qs('socialPadding'),
      paddingValue: qs('socialPaddingValue'),
      overlay: qs('socialOverlay'),
      overlayValue: qs('socialOverlayValue'),
      blur: qs('socialBlur'),
      blurValue: qs('socialBlurValue'),
      guides: qs('socialGuides'),
      format: qs('socialFormat'),
      quality: qs('socialQuality'),
      qualityValue: qs('socialQualityValue'),
      suffix: qs('socialSuffix'),
      backgroundInput: qs('socialBackgroundInput'),
      backgroundName: qs('socialBackgroundName'),
      logoInput: qs('socialLogoInput'),
      logoName: qs('socialLogoName'),
      download: qs('socialDownload'),
      downloadSet: qs('socialDownloadSet'),
      copyMeta: qs('socialCopyMeta'),
      copyBrief: qs('socialCopyBrief'),
      copyLink: qs('socialCopyLink'),
      saveBrand: qs('socialSaveBrand'),
      loadBrand: qs('socialLoadBrand'),
      reset: qs('socialReset')
    };

    if (!els.canvas) return;
    loadStoredState();
    renderPresetButtons();
    renderPlatformButtons();
    renderPaletteButtons();
    syncForm();
    bindEvents();
    await hydrateSavedImages();
    renderPreview();
    setStatus('Ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.socialCardStudio = {
    renderPreview: renderPreview,
    getState: function () { return Object.assign({}, state); },
    getPlatforms: function () { return Object.assign({}, PLATFORMS); }
  };
})();
