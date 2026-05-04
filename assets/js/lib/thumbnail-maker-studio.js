(function () {
  'use strict';

  var STORAGE_KEY = 'afro_thumbnail_studio_state_v2';
  var BRAND_KEY = 'afro_thumbnail_brand_v1';
  var HISTORY_KEY = 'afro_thumbnail_history_v1';

  var SIZES = {
    youtube: { label: 'YouTube thumbnail', width: 1280, height: 720, note: 'Recommended upload size' },
    fullhd: { label: 'Full HD draft', width: 1920, height: 1080, note: 'High-resolution source export' },
    shorts: { label: 'Shorts cover draft', width: 1080, height: 1920, note: 'Vertical cover reuse' },
    square: { label: 'Square promo', width: 1080, height: 1080, note: 'Community and cross-posting' }
  };

  var PALETTES = {
    punch: { label: 'Punch red', primary: '#111827', accent: '#e11d48', textColor: '#ffffff' },
    gold: { label: 'Gold rush', primary: '#18181b', accent: '#f59e0b', textColor: '#ffffff' },
    lagoon: { label: 'Lagoon blue', primary: '#0f766e', accent: '#facc15', textColor: '#ffffff' },
    studio: { label: 'Studio purple', primary: '#312e81', accent: '#22c55e', textColor: '#ffffff' },
    paper: { label: 'Clean paper', primary: '#f8fafc', accent: '#2563eb', textColor: '#111827' },
    fire: { label: 'Fire orange', primary: '#7f1d1d', accent: '#fb923c', textColor: '#ffffff' }
  };

  var PRESETS = {
    reaction: {
      label: 'Reaction',
      detail: 'Face, shock, big claim',
      layout: 'face-right',
      palette: 'punch',
      backgroundStyle: 'burst',
      videoIdea: 'I reacted to a viral topic',
      headline: 'I DID NOT EXPECT THIS',
      subline: 'Full reaction',
      badge: 'WATCH',
      channel: '@YourChannel'
    },
    explainer: {
      label: 'Explainer',
      detail: 'Tutorial or how-to',
      layout: 'headline-bar',
      palette: 'lagoon',
      backgroundStyle: 'pattern',
      videoIdea: 'How to solve this problem',
      headline: 'HOW IT WORKS',
      subline: 'Simple breakdown',
      badge: 'GUIDE',
      channel: '@LearnWithMe'
    },
    review: {
      label: 'Review',
      detail: 'Product, app, movie',
      layout: 'split',
      palette: 'gold',
      backgroundStyle: 'gradient',
      videoIdea: 'Honest review after testing',
      headline: 'WORTH IT?',
      subline: 'Honest review',
      badge: 'TESTED',
      channel: '@ReviewDesk'
    },
    football: {
      label: 'Football',
      detail: 'Match recap or preview',
      layout: 'face-left',
      palette: 'studio',
      backgroundStyle: 'burst',
      videoIdea: 'Big match recap',
      headline: 'MATCH CHANGED EVERYTHING',
      subline: 'Key moments',
      badge: 'RECAP',
      channel: '@PitchPulse'
    },
    music: {
      label: 'Music drop',
      detail: 'Afrobeats, amapiano, gospel',
      layout: 'center-punch',
      palette: 'fire',
      backgroundStyle: 'gradient',
      videoIdea: 'New song breakdown',
      headline: 'NEW SOUND ALERT',
      subline: 'Top tracks this week',
      badge: 'NEW',
      channel: '@SoundDaily'
    },
    food: {
      label: 'Food',
      detail: 'Recipe or street food',
      layout: 'face-right',
      palette: 'gold',
      backgroundStyle: 'pattern',
      videoIdea: 'Jollof recipe tips',
      headline: 'BEST JOLLOF HACKS',
      subline: 'Smoky and rich',
      badge: 'RECIPE',
      channel: '@KitchenStudio'
    },
    education: {
      label: 'Education',
      detail: 'Exam, lesson, class',
      layout: 'list-stack',
      palette: 'paper',
      backgroundStyle: 'solid',
      videoIdea: 'Exam preparation guide',
      headline: '5 TIPS TO SCORE HIGHER',
      subline: 'Use before exam day',
      badge: 'STUDY',
      channel: '@StudyDesk'
    },
    news: {
      label: 'News',
      detail: 'Update or analysis',
      layout: 'headline-bar',
      palette: 'punch',
      backgroundStyle: 'solid',
      videoIdea: 'What changed today',
      headline: 'WHAT JUST HAPPENED?',
      subline: 'Context in minutes',
      badge: 'UPDATE',
      channel: '@BriefingRoom'
    },
    podcast: {
      label: 'Podcast',
      detail: 'Interview or clip',
      layout: 'podcast',
      palette: 'studio',
      backgroundStyle: 'gradient',
      videoIdea: 'Conversation highlight',
      headline: 'THE MOMENT EVERYONE MISSED',
      subline: 'Podcast clip',
      badge: 'CLIP',
      channel: '@PodcastDesk'
    },
    list: {
      label: 'List',
      detail: 'Ranking or countdown',
      layout: 'list-stack',
      palette: 'lagoon',
      backgroundStyle: 'burst',
      videoIdea: 'Top tools or tips',
      headline: 'TOP 7 TO TRY NOW',
      subline: 'Number 4 surprised me',
      badge: 'LIST',
      channel: '@CreatorDesk'
    }
  };

  var DEFAULT_STATE = Object.assign({
    size: 'youtube',
    preset: 'reaction',
    exportFormat: 'image/png',
    quality: 0.9,
    filenameSuffix: 'youtube-thumbnail',
    textScale: 100,
    subjectZoom: 108,
    subjectShift: 0,
    vignette: 34,
    showGuides: true,
    font: 'impact',
    primary: PALETTES.punch.primary,
    accent: PALETTES.punch.accent,
    textColor: PALETTES.punch.textColor,
    backgroundName: '',
    subjectName: '',
    logoName: '',
    backgroundSrc: '',
    subjectSrc: '',
    logoSrc: ''
  }, PRESETS.reaction);

  var state = Object.assign({}, DEFAULT_STATE);
  var els = {};
  var backgroundImage = null;
  var subjectImage = null;
  var logoImage = null;
  var history = [];
  var hookIdeas = [];
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

  function persistableState() {
    return Object.assign({}, state);
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

  function loadStoredState() {
    var hashState = readHashState();
    var saved = safeJsonParse(localStorage.getItem(STORAGE_KEY), null);
    state = Object.assign({}, DEFAULT_STATE, saved || {}, hashState || {});
    if (!SIZES[state.size]) state.size = 'youtube';
    if (!PALETTES[state.palette] && state.palette !== 'custom') state.palette = 'punch';
    if (!PRESETS[state.preset]) state.preset = 'reaction';
    history = safeJsonParse(localStorage.getItem(HISTORY_KEY), []);
  }

  function encodeStateForLink() {
    var clean = persistableState();
    clean.backgroundSrc = '';
    clean.subjectSrc = '';
    clean.logoSrc = '';
    clean.backgroundName = '';
    clean.subjectName = '';
    clean.logoName = '';
    var encoded = btoa(JSON.stringify(clean)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return window.location.origin + window.location.pathname + '#design=' + encodeURIComponent(encoded);
  }

  function hexToRgb(hex) {
    var clean = String(hex || '').replace('#', '').trim();
    if (clean.length === 3) clean = clean.split('').map(function (ch) { return ch + ch; }).join('');
    var value = parseInt(clean, 16);
    if (!Number.isFinite(value)) return { r: 17, g: 24, b: 39 };
    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
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
    var light = Math.max(luminance(a), luminance(b));
    var dark = Math.min(luminance(a), luminance(b));
    return (light + 0.05) / (dark + 0.05);
  }

  function slugify(value) {
    return String(value || 'thumbnail')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'thumbnail';
  }

  function fileExtension() {
    if (state.exportFormat === 'image/jpeg') return 'jpg';
    if (state.exportFormat === 'image/webp') return 'webp';
    return 'png';
  }

  function renderPresetButtons() {
    if (!els.presetGrid) return;
    els.presetGrid.innerHTML = Object.keys(PRESETS).map(function (key) {
      var preset = PRESETS[key];
      return '<button type="button" class="thumb-choice" data-preset="' + key + '"><strong>' + preset.label + '</strong><span>' + preset.detail + '</span></button>';
    }).join('');
  }

  function renderPaletteButtons() {
    if (!els.paletteGrid) return;
    els.paletteGrid.innerHTML = Object.keys(PALETTES).map(function (key) {
      var palette = PALETTES[key];
      return '<button type="button" class="thumb-palette" data-palette="' + key + '"><span class="thumb-swatches"><i style="background:' + palette.primary + '"></i><i style="background:' + palette.accent + '"></i><i style="background:' + palette.textColor + '"></i></span>' + palette.label + '</button>';
    }).join('');
  }

  function syncForm() {
    var fields = {
      videoIdea: els.videoIdea,
      headline: els.headline,
      subline: els.subline,
      badge: els.badge,
      channel: els.channel,
      size: els.size,
      layout: els.layout,
      font: els.font,
      backgroundStyle: els.backgroundStyle,
      primary: els.primary,
      accent: els.accent,
      textColor: els.textColor,
      textScale: els.textScale,
      subjectZoom: els.subjectZoom,
      subjectShift: els.subjectShift,
      vignette: els.vignette,
      exportFormat: els.format,
      quality: els.quality,
      filenameSuffix: els.suffix
    };
    Object.keys(fields).forEach(function (key) {
      if (fields[key]) fields[key].value = state[key];
    });
    if (els.guides) els.guides.checked = !!state.showGuides;
    if (els.textScaleValue) els.textScaleValue.textContent = state.textScale + '%';
    if (els.subjectZoomValue) els.subjectZoomValue.textContent = state.subjectZoom + '%';
    if (els.subjectShiftValue) els.subjectShiftValue.textContent = state.subjectShift + '%';
    if (els.vignetteValue) els.vignetteValue.textContent = state.vignette + '%';
    if (els.qualityValue) els.qualityValue.textContent = Math.round(state.quality * 100) + '%';
    if (els.backgroundName) els.backgroundName.textContent = state.backgroundName || 'Choose image';
    if (els.subjectName) els.subjectName.textContent = state.subjectName || 'Choose subject';
    if (els.logoName) els.logoName.textContent = state.logoName || 'Choose logo';

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
    var palette = PALETTES[preset.palette] || PALETTES.punch;
    state = Object.assign({}, state, preset, {
      preset: key,
      primary: palette.primary,
      accent: palette.accent,
      textColor: palette.textColor
    });
    hookIdeas = [];
    syncForm();
    renderHooks();
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
    if (['textScale', 'subjectZoom', 'subjectShift', 'vignette'].indexOf(key) !== -1) {
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

  function drawCoverImage(ctx, img, x, y, w, h, zoom, shiftX) {
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    var ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight) * (zoom || 1);
    var dw = img.naturalWidth * ratio;
    var dh = img.naturalHeight * ratio;
    var dx = x + (w - dw) / 2 + (shiftX || 0);
    var dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function drawPattern(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = rgba(state.accent, 0.26);
    ctx.lineWidth = Math.max(3, Math.round(Math.min(w, h) * 0.006));
    var gap = Math.max(54, Math.round(Math.min(w, h) * 0.11));
    for (var x = -gap; x < w + gap; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, h + gap);
      ctx.lineTo(x + h + gap, -gap);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBurst(ctx, w, h) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    for (var i = 0; i < 36; i += 1) {
      ctx.rotate((Math.PI * 2) / 36);
      ctx.fillStyle = i % 2 ? rgba(state.accent, 0.22) : rgba('#ffffff', 0.07);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, -h * 0.05);
      ctx.lineTo(w, h * 0.05);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBackground(ctx, w, h) {
    if (state.backgroundStyle === 'image' && backgroundImage) {
      drawCoverImage(ctx, backgroundImage, 0, 0, w, h, 1, 0);
      ctx.fillStyle = rgba(state.primary, 0.24);
      ctx.fillRect(0, 0, w, h);
    } else if (state.backgroundStyle === 'solid') {
      ctx.fillStyle = state.primary;
      ctx.fillRect(0, 0, w, h);
    } else {
      var gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, state.primary);
      gradient.addColorStop(1, state.accent);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
    if (state.backgroundStyle === 'pattern') drawPattern(ctx, w, h);
    if (state.backgroundStyle === 'burst') drawBurst(ctx, w, h);

    if (state.vignette > 0) {
      var radial = ctx.createRadialGradient(w * 0.52, h * 0.45, Math.min(w, h) * 0.08, w / 2, h / 2, Math.max(w, h) * 0.68);
      radial.addColorStop(0, 'rgba(0,0,0,0)');
      radial.addColorStop(1, 'rgba(0,0,0,' + (state.vignette / 100) + ')');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function fontFamily() {
    if (state.font === 'serif') return '"Instrument Serif", Georgia, serif';
    if (state.font === 'mono') return '"JetBrains Mono", "Courier New", monospace';
    if (state.font === 'dm') return '"DM Sans", Arial, sans-serif';
    return 'Impact, "Arial Black", "DM Sans", sans-serif';
  }

  function wrapLines(ctx, text, maxWidth, maxLines) {
    var raw = String(text || '').replace(/\s+/g, ' ').trim();
    if (!raw) return [];
    var words = raw.split(' ');
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
      while (ctx.measureText(last + '...').width > maxWidth && last.length > 5) last = last.slice(0, -1);
      lines[lines.length - 1] = last.replace(/\s+$/, '') + '...';
    }
    return lines;
  }

  function drawTextBlock(ctx, opts) {
    ctx.save();
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,.42)';
    ctx.shadowBlur = opts.shadow || Math.round(opts.titleSize * 0.14);
    ctx.shadowOffsetX = Math.round(opts.titleSize * 0.05);
    ctx.shadowOffsetY = Math.round(opts.titleSize * 0.05);

    if (state.badge) {
      drawBadge(ctx, state.badge, opts.x, opts.y - opts.titleSize * 0.95, opts.align, opts.scale);
    }

    ctx.font = '900 ' + Math.round(opts.titleSize) + 'px ' + fontFamily();
    var lines = wrapLines(ctx, state.headline, opts.maxWidth, opts.maxLines || 3);
    var lineHeight = opts.titleSize * 0.93;
    ctx.strokeStyle = 'rgba(0,0,0,.92)';
    ctx.lineWidth = Math.max(5, opts.titleSize * 0.09);
    ctx.fillStyle = state.textColor;
    lines.forEach(function (line, index) {
      var y = opts.y + index * lineHeight;
      ctx.strokeText(line, opts.x, y);
      ctx.fillText(line, opts.x, y);
    });

    if (state.subline) {
      var subY = opts.y + lines.length * lineHeight + opts.titleSize * 0.22;
      ctx.font = '850 ' + Math.round(opts.bodySize) + 'px "DM Sans", Arial, sans-serif';
      ctx.lineWidth = Math.max(3, opts.bodySize * 0.08);
      ctx.strokeStyle = 'rgba(0,0,0,.82)';
      ctx.fillStyle = state.accent;
      ctx.strokeText(state.subline, opts.x, subY);
      ctx.fillText(state.subline, opts.x, subY);
    }
    ctx.restore();
  }

  function drawBadge(ctx, text, x, y, align, scale) {
    var fontSize = Math.round(22 * scale);
    ctx.save();
    ctx.font = '900 ' + fontSize + 'px "DM Sans", Arial, sans-serif';
    var padX = Math.round(16 * scale);
    var padY = Math.round(9 * scale);
    var width = ctx.measureText(text).width + padX * 2;
    var height = fontSize + padY * 2;
    var left = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
    drawRoundedRect(ctx, left, y, width, height, height * 0.32);
    ctx.fillStyle = state.accent;
    ctx.fill();
    ctx.fillStyle = contrastRatio(state.accent, '#111827') > 4.5 ? '#111827' : '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = align || 'left';
    ctx.fillText(text, align === 'center' ? x : align === 'right' ? x - padX : left + padX, y + height / 2 + 1);
    ctx.restore();
  }

  function drawSubject(ctx, w, h, side, scale) {
    var boxW = side === 'full' ? w * 0.62 : w * 0.44;
    var boxH = h * 0.92;
    var x = side === 'left' ? -w * 0.04 : side === 'full' ? w * 0.19 : w - boxW + w * 0.02;
    var y = h * 0.04;
    ctx.save();
    if (subjectImage) {
      drawRoundedRect(ctx, x, y, boxW, boxH, Math.min(w, h) * 0.045);
      ctx.clip();
      drawCoverImage(ctx, subjectImage, x, y, boxW, boxH, state.subjectZoom / 100, (state.subjectShift / 100) * boxW);
    } else {
      var gradient = ctx.createLinearGradient(x, y, x + boxW, y + boxH);
      gradient.addColorStop(0, rgba(state.accent, 0.92));
      gradient.addColorStop(1, rgba('#ffffff', 0.16));
      ctx.fillStyle = gradient;
      drawRoundedRect(ctx, x, y, boxW, boxH, Math.min(w, h) * 0.045);
      ctx.fill();
      ctx.fillStyle = rgba('#000000', 0.16);
      ctx.beginPath();
      ctx.arc(x + boxW * 0.5, y + boxH * 0.32, boxH * 0.13, 0, Math.PI * 2);
      ctx.fill();
      drawRoundedRect(ctx, x + boxW * 0.27, y + boxH * 0.5, boxW * 0.46, boxH * 0.22, boxH * 0.08);
      ctx.fill();
      ctx.fillStyle = state.textColor;
      ctx.font = '900 ' + Math.round(30 * scale) + 'px "DM Sans", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DROP PHOTO', x + boxW / 2, y + boxH * 0.78);
    }
    ctx.restore();
  }

  function drawLogo(ctx, w, h, pad, scale) {
    var size = Math.max(46, Math.round(Math.min(w, h) * 0.07));
    var x = pad;
    var y = h - pad - size;
    ctx.save();
    if (logoImage) {
      drawRoundedRect(ctx, x, y, size, size, size * 0.2);
      ctx.clip();
      drawCoverImage(ctx, logoImage, x, y, size, size, 1, 0);
    } else {
      drawRoundedRect(ctx, x, y, size, size, size * 0.22);
      ctx.fillStyle = rgba('#000000', 0.36);
      ctx.fill();
      ctx.fillStyle = state.accent;
      ctx.font = '900 ' + Math.round(size * 0.28 * scale) + 'px "DM Sans", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials(state.channel), x + size / 2, y + size / 2 + 1);
    }
    if (state.channel) {
      ctx.font = '850 ' + Math.round(20 * scale) + 'px "DM Sans", Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.86)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(state.channel, x + size + 12, y + size / 2 + 1);
    }
    ctx.restore();
  }

  function initials(text) {
    return String(text || 'YT')
      .replace(/[^A-Za-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (word) { return word.charAt(0).toUpperCase(); })
      .join('') || 'YT';
  }

  function drawRuntimeGuide(ctx, w, h) {
    var rw = Math.round(w * 0.15);
    var rh = Math.round(h * 0.075);
    var x = w - rw - Math.round(w * 0.025);
    var y = h - rh - Math.round(h * 0.035);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.72)';
    drawRoundedRect(ctx, x, y, rw, rh, rh * 0.18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 ' + Math.round(rh * 0.45) + 'px "DM Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('12:34', x + rw / 2, y + rh / 2 + 1);
    ctx.strokeStyle = 'rgba(250,204,21,.92)';
    ctx.lineWidth = Math.max(2, Math.round(w * 0.002));
    ctx.strokeRect(x - 6, y - 6, rw + 12, rh + 12);
    ctx.restore();
  }

  function drawSafeGuides(ctx, w, h) {
    var margin = Math.round(Math.min(w, h) * 0.055);
    ctx.save();
    ctx.setLineDash([18, 12]);
    ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.003));
    ctx.strokeStyle = 'rgba(255,255,255,.74)';
    ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,.78)';
    ctx.font = '850 ' + Math.max(18, Math.round(Math.min(w, h) * 0.025)) + 'px "DM Sans", Arial, sans-serif';
    ctx.fillText('safe area', margin + 12, margin + 30);
    ctx.restore();
    drawRuntimeGuide(ctx, w, h);
  }

  function drawThumbnail(canvas, options) {
    var size = SIZES[state.size] || SIZES.youtube;
    canvas.width = size.width;
    canvas.height = size.height;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var base = Math.min(w, h);
    var scale = clamp(state.textScale / 100, 0.75, 1.4);
    var pad = Math.round(base * 0.07);
    var titleSize = clamp(w * 0.085 * scale, 54, state.size === 'shorts' ? 130 : 122);
    var bodySize = clamp(w * 0.032 * scale, 24, 44);

    drawBackground(ctx, w, h);

    if (state.layout === 'face-left') {
      drawSubject(ctx, w, h, 'left', scale);
      drawTextBlock(ctx, { x: w - pad, y: h * 0.36, maxWidth: w * 0.52, titleSize: titleSize * 0.88, bodySize: bodySize, align: 'right', maxLines: 3, scale: scale });
    } else if (state.layout === 'center-punch') {
      drawSubject(ctx, w, h, 'full', scale);
      drawTextBlock(ctx, { x: w / 2, y: h * 0.36, maxWidth: w * 0.78, titleSize: titleSize, bodySize: bodySize, align: 'center', maxLines: 3, scale: scale });
    } else if (state.layout === 'split') {
      ctx.save();
      ctx.fillStyle = rgba('#000000', 0.38);
      ctx.fillRect(w * 0.48, 0, w * 0.04, h);
      ctx.restore();
      drawSubject(ctx, w, h, 'right', scale);
      drawTextBlock(ctx, { x: pad, y: h * 0.36, maxWidth: w * 0.44, titleSize: titleSize * 0.82, bodySize: bodySize, align: 'left', maxLines: 3, scale: scale });
      drawBadge(ctx, 'A / B', w * 0.5, pad, 'center', scale);
    } else if (state.layout === 'headline-bar') {
      if (subjectImage) drawSubject(ctx, w, h, 'right', scale);
      ctx.save();
      ctx.fillStyle = rgba('#000000', 0.58);
      drawRoundedRect(ctx, pad, h * 0.22, w - pad * 2, h * 0.48, base * 0.04);
      ctx.fill();
      ctx.restore();
      drawTextBlock(ctx, { x: w / 2, y: h * 0.43, maxWidth: w - pad * 3, titleSize: titleSize * 0.9, bodySize: bodySize, align: 'center', maxLines: 2, scale: scale });
    } else if (state.layout === 'list-stack') {
      ctx.save();
      ctx.fillStyle = rgba('#ffffff', state.textColor === '#111827' ? 0.8 : 0.12);
      drawRoundedRect(ctx, pad, pad, w - pad * 2, h - pad * 2, base * 0.045);
      ctx.fill();
      ctx.restore();
      drawTextBlock(ctx, { x: pad * 1.45, y: h * 0.34, maxWidth: w - pad * 2.9, titleSize: titleSize * 0.78, bodySize: bodySize, align: 'left', maxLines: 3, scale: scale });
      for (var i = 0; i < 3; i += 1) {
        ctx.save();
        ctx.fillStyle = i === 0 ? state.accent : rgba('#ffffff', 0.75);
        ctx.beginPath();
        ctx.arc(w - pad * 1.6, h * (0.32 + i * 0.16), base * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = i === 0 && contrastRatio(state.accent, '#111827') > 4.5 ? '#111827' : '#ffffff';
        ctx.font = '900 ' + Math.round(base * 0.04) + 'px "DM Sans", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), w - pad * 1.6, h * (0.32 + i * 0.16) + 1);
        ctx.restore();
      }
    } else if (state.layout === 'podcast') {
      drawSubject(ctx, w, h, 'left', scale);
      ctx.save();
      ctx.strokeStyle = rgba(state.accent, 0.8);
      ctx.lineWidth = Math.max(10, base * 0.02);
      for (var bar = 0; bar < 9; bar += 1) {
        var bx = w * 0.55 + bar * (w * 0.035);
        var bh = h * (0.1 + (bar % 4) * 0.045);
        ctx.beginPath();
        ctx.moveTo(bx, h * 0.82 - bh);
        ctx.lineTo(bx, h * 0.82 + bh);
        ctx.stroke();
      }
      ctx.restore();
      drawTextBlock(ctx, { x: w - pad, y: h * 0.36, maxWidth: w * 0.48, titleSize: titleSize * 0.8, bodySize: bodySize, align: 'right', maxLines: 3, scale: scale });
    } else {
      drawSubject(ctx, w, h, 'right', scale);
      drawTextBlock(ctx, { x: pad, y: h * 0.36, maxWidth: w * 0.52, titleSize: titleSize * 0.9, bodySize: bodySize, align: 'left', maxLines: 3, scale: scale });
    }

    drawLogo(ctx, w, h, pad, scale);
    if (options && options.guides) drawSafeGuides(ctx, w, h);
  }

  function renderPreview() {
    if (!els.canvas) return;
    drawThumbnail(els.canvas, { guides: state.showGuides });
    updateMetrics();
  }

  function words(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean);
  }

  function readiness() {
    var headlineWords = words(state.headline).length;
    var ratio = contrastRatio(state.primary, state.textColor);
    var size = SIZES[state.size] || SIZES.youtube;
    var exactYoutube = state.size === 'youtube' && size.width === 1280 && size.height === 720;
    var hasVisual = !!subjectImage || !!backgroundImage;
    var hasBrand = !!state.channel || !!logoImage;
    var score = 0;
    if (exactYoutube) score += 25;
    if (headlineWords > 0 && headlineWords <= 6) score += 22;
    if (ratio >= 4.5 || state.backgroundStyle === 'image') score += 18;
    if (hasVisual) score += 18;
    if (hasBrand) score += 10;
    if (state.showGuides) score += 7;
    return { score: score, headlineWords: headlineWords, ratio: ratio, exactYoutube: exactYoutube, hasVisual: hasVisual, hasBrand: hasBrand };
  }

  function updateMetrics() {
    var size = SIZES[state.size] || SIZES.youtube;
    var data = readiness();
    if (els.previewTitle) els.previewTitle.textContent = size.label;
    if (els.sizeMetric) els.sizeMetric.textContent = size.width + ' x ' + size.height;
    if (els.hookMetric) els.hookMetric.textContent = data.headlineWords <= 6 ? 'Strong ' + data.headlineWords + ' words' : 'Long ' + data.headlineWords + ' words';
    if (els.readinessMetric) els.readinessMetric.textContent = data.score + '/100';
    renderChecklist(data);
    renderHistory();
  }

  function renderChecklist(data) {
    if (!els.checklist) return;
    var size = SIZES[state.size] || SIZES.youtube;
    var items = [
      { ok: data.exactYoutube, text: data.exactYoutube ? 'Default YouTube upload size is selected: 1280 x 720 px.' : 'Use 1280 x 720 for the safest YouTube thumbnail upload.' },
      { ok: data.headlineWords > 0 && data.headlineWords <= 6, text: data.headlineWords <= 6 ? 'Main text is short enough for mobile feeds.' : 'Main text is long. Aim for 3 to 6 words.' },
      { ok: data.ratio >= 4.5 || state.backgroundStyle === 'image', text: data.ratio >= 4.5 ? 'Base text contrast is strong.' : 'Contrast may be low. Adjust primary or text color.' },
      { ok: data.hasVisual, text: data.hasVisual ? 'A subject or still frame is available.' : 'Add a face, object, or still frame for stronger visual pull.' },
      { ok: data.hasBrand, text: data.hasBrand ? 'Channel mark is present.' : 'Add a channel mark or logo for recognition.' },
      { ok: state.showGuides, text: state.showGuides ? 'Runtime corner guide is visible while editing.' : 'Turn on safe zones before final export.' },
      { ok: size.width / size.height === 16 / 9 || state.size !== 'youtube', text: 'Current canvas: ' + size.width + ' x ' + size.height + ' px.' }
    ];
    els.checklist.innerHTML = items.map(function (item) {
      return '<li class="' + (item.ok ? '' : 'warn') + '"><i>' + (item.ok ? 'OK' : '!') + '</i><span>' + item.text + '</span></li>';
    }).join('');
  }

  function renderHistory() {
    if (!els.history) return;
    if (!history.length) {
      els.history.innerHTML = '<p class="thumb-empty">Downloaded thumbnails in this browser will appear here.</p>';
      return;
    }
    els.history.innerHTML = history.slice(0, 5).map(function (item) {
      return '<div class="thumb-history-item"><strong>' + item.title + '</strong><span>' + item.size + ' - ' + item.format + ' - ' + item.time + '</span></div>';
    }).join('');
  }

  function renderHooks() {
    if (!els.hookList) return;
    els.hookList.innerHTML = hookIdeas.map(function (idea) {
      return '<button type="button" class="thumb-hook-btn" data-hook="' + encodeURIComponent(idea) + '">' + idea + '</button>';
    }).join('');
  }

  function generateHooks() {
    var idea = String(state.videoIdea || state.headline || 'this video').replace(/\s+/g, ' ').trim();
    var topic = idea.replace(/^(how to|why|what|i tried|reviewing)\s+/i, '').slice(0, 48) || 'this';
    hookIdeas = [
      'I TRIED ' + topic.toUpperCase(),
      topic.toUpperCase() + ' CHANGED EVERYTHING',
      'BEFORE YOU TRY ' + topic.toUpperCase(),
      'THE TRUTH ABOUT ' + topic.toUpperCase(),
      'STOP DOING THIS'
    ].map(function (text) {
      return text.replace(/\s+/g, ' ').slice(0, 48);
    });
    renderHooks();
    setStatus('Hook ideas ready');
  }

  function renderExportCanvas(sizeKey, headline) {
    var previousSize = state.size;
    var previousHeadline = state.headline;
    if (sizeKey) state.size = sizeKey;
    if (headline) state.headline = headline;
    var canvas = document.createElement('canvas');
    drawThumbnail(canvas, { guides: false });
    state.size = previousSize;
    state.headline = previousHeadline;
    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        resolve(blob);
      }, state.exportFormat, state.quality);
    });
  }

  async function downloadThumbnail(headline, suffix) {
    var canvas = renderExportCanvas(null, headline);
    var blob = await canvasToBlob(canvas);
    if (!blob) {
      setStatus('Export failed');
      return;
    }
    var size = SIZES[state.size] || SIZES.youtube;
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    var fileSuffix = slugify(suffix || state.filenameSuffix || state.headline);
    link.href = url;
    link.download = 'thumbnail-' + state.size + '-' + fileSuffix + '.' + fileExtension();
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
    addHistory(size, blob, headline || state.headline);
    setStatus('Downloaded ' + size.label);
  }

  function addHistory(size, blob, title) {
    var now = new Date();
    history.unshift({
      title: String(title || 'Thumbnail').slice(0, 74),
      size: size.width + ' x ' + size.height,
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

  async function downloadABVariants() {
    if (!hookIdeas.length) generateHooks();
    var variants = hookIdeas.slice(0, 3);
    setStatus('Exporting variants');
    for (var i = 0; i < variants.length; i += 1) {
      await downloadThumbnail(variants[i], (state.filenameSuffix || 'variant') + '-v' + (i + 1));
      await new Promise(function (resolve) { setTimeout(resolve, 160); });
    }
    setStatus('A/B variants exported');
  }

  function checklistText() {
    var data = readiness();
    return [
      'YouTube thumbnail checklist',
      'Canvas: ' + (SIZES[state.size] || SIZES.youtube).width + ' x ' + (SIZES[state.size] || SIZES.youtube).height,
      'Readiness score: ' + data.score + '/100',
      'Main text words: ' + data.headlineWords,
      'Contrast: ' + data.ratio.toFixed(1) + ':1',
      'Visual asset: ' + (data.hasVisual ? 'yes' : 'no'),
      'Channel mark: ' + (data.hasBrand ? 'yes' : 'no'),
      'Runtime corner checked: ' + (state.showGuides ? 'yes' : 'no')
    ].join('\n');
  }

  function uploadBrief() {
    var size = SIZES[state.size] || SIZES.youtube;
    return [
      'Thumbnail upload brief',
      'Video idea: ' + state.videoIdea,
      'Thumbnail text: ' + state.headline,
      'Support line: ' + state.subline,
      'Badge: ' + state.badge,
      'Channel: ' + state.channel,
      'Canvas: ' + size.label + ' (' + size.width + ' x ' + size.height + ')',
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
      channel: state.channel,
      logoName: state.logoName,
      logoSrc: state.logoSrc && state.logoSrc.length < 700000 ? state.logoSrc : ''
    };
    try {
      localStorage.setItem(BRAND_KEY, JSON.stringify(brand));
      setStatus('Brand kit saved');
    } catch (err) {
      setStatus('Brand kit too large');
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
    subjectImage = null;
    logoImage = null;
    hookIdeas = [];
    syncForm();
    renderHooks();
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
          state.backgroundStyle = 'image';
        } else if (target === 'subject') {
          subjectImage = img;
          state.subjectSrc = src.length < 1700000 ? src : '';
          state.subjectName = name || 'Subject photo';
        } else {
          logoImage = img;
          state.logoSrc = src.length < 700000 ? src : '';
          state.logoName = name || 'Logo';
        }
        syncForm();
        renderPreview();
        scheduleSave();
        setStatus(target.charAt(0).toUpperCase() + target.slice(1) + ' loaded');
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
      var presetButton = event.target.closest('[data-preset]');
      if (presetButton) {
        applyPreset(presetButton.getAttribute('data-preset'));
        return;
      }
      var paletteButton = event.target.closest('[data-palette]');
      if (paletteButton) {
        applyPalette(paletteButton.getAttribute('data-palette'));
        return;
      }
      var hookButton = event.target.closest('[data-hook]');
      if (hookButton) {
        state.headline = decodeURIComponent(hookButton.getAttribute('data-hook') || '');
        syncForm();
        renderPreview();
        scheduleSave();
      }
    });

    document.querySelectorAll('[data-thumb-field]').forEach(function (field) {
      var eventName = field.type === 'checkbox' ? 'change' : 'input';
      field.addEventListener(eventName, function () {
        setField(field.getAttribute('data-thumb-field'), field.type === 'checkbox' ? field.checked : field.value);
      });
      if (field.tagName === 'SELECT') {
        field.addEventListener('change', function () {
          setField(field.getAttribute('data-thumb-field'), field.value);
        });
      }
    });

    if (els.backgroundInput) els.backgroundInput.addEventListener('change', function () { loadImageFromFile(els.backgroundInput.files && els.backgroundInput.files[0], 'background'); });
    if (els.subjectInput) els.subjectInput.addEventListener('change', function () { loadImageFromFile(els.subjectInput.files && els.subjectInput.files[0], 'subject'); });
    if (els.logoInput) els.logoInput.addEventListener('change', function () { loadImageFromFile(els.logoInput.files && els.logoInput.files[0], 'logo'); });
    if (els.generateHooks) els.generateHooks.addEventListener('click', generateHooks);
    if (els.download) els.download.addEventListener('click', function () { downloadThumbnail(); });
    if (els.downloadAB) els.downloadAB.addEventListener('click', downloadABVariants);
    if (els.copyBrief) els.copyBrief.addEventListener('click', function () { copyText(uploadBrief(), 'Upload brief copied'); });
    if (els.copyChecklist) els.copyChecklist.addEventListener('click', function () { copyText(checklistText(), 'Checklist copied'); });
    if (els.copyLink) els.copyLink.addEventListener('click', function () { copyText(encodeStateForLink(), 'Design link copied'); });
    if (els.saveBrand) els.saveBrand.addEventListener('click', saveBrand);
    if (els.loadBrand) els.loadBrand.addEventListener('click', loadBrand);
    if (els.reset) els.reset.addEventListener('click', resetStudio);
  }

  async function hydrateSavedImages() {
    if (state.backgroundSrc) await loadImageFromSource(state.backgroundSrc, 'background', state.backgroundName);
    if (state.subjectSrc) await loadImageFromSource(state.subjectSrc, 'subject', state.subjectName);
    if (state.logoSrc) await loadImageFromSource(state.logoSrc, 'logo', state.logoName);
  }

  async function init() {
    els = {
      status: qs('thumbStatus'),
      presetGrid: qs('thumbPresetGrid'),
      paletteGrid: qs('thumbPaletteGrid'),
      canvas: qs('thumbCanvas'),
      previewTitle: qs('thumbPreviewTitle'),
      sizeMetric: qs('thumbSizeMetric'),
      hookMetric: qs('thumbHookMetric'),
      readinessMetric: qs('thumbReadinessMetric'),
      checklist: qs('thumbChecklist'),
      history: qs('thumbHistory'),
      hookList: qs('thumbHookList'),
      videoIdea: qs('thumbVideoIdea'),
      headline: qs('thumbHeadline'),
      subline: qs('thumbSubline'),
      badge: qs('thumbBadge'),
      channel: qs('thumbChannel'),
      size: qs('thumbSize'),
      layout: qs('thumbLayout'),
      font: qs('thumbFont'),
      backgroundStyle: qs('thumbBackgroundStyle'),
      primary: qs('thumbPrimary'),
      accent: qs('thumbAccent'),
      textColor: qs('thumbTextColor'),
      textScale: qs('thumbTextScale'),
      textScaleValue: qs('thumbTextScaleValue'),
      subjectZoom: qs('thumbSubjectZoom'),
      subjectZoomValue: qs('thumbSubjectZoomValue'),
      subjectShift: qs('thumbSubjectShift'),
      subjectShiftValue: qs('thumbSubjectShiftValue'),
      vignette: qs('thumbVignette'),
      vignetteValue: qs('thumbVignetteValue'),
      guides: qs('thumbGuides'),
      backgroundInput: qs('thumbBackgroundInput'),
      backgroundName: qs('thumbBackgroundName'),
      subjectInput: qs('thumbSubjectInput'),
      subjectName: qs('thumbSubjectName'),
      logoInput: qs('thumbLogoInput'),
      logoName: qs('thumbLogoName'),
      format: qs('thumbFormat'),
      quality: qs('thumbQuality'),
      qualityValue: qs('thumbQualityValue'),
      suffix: qs('thumbSuffix'),
      generateHooks: qs('thumbGenerateHooks'),
      download: qs('thumbDownload'),
      downloadAB: qs('thumbDownloadAB'),
      copyBrief: qs('thumbCopyBrief'),
      copyChecklist: qs('thumbCopyChecklist'),
      copyLink: qs('thumbCopyLink'),
      saveBrand: qs('thumbSaveBrand'),
      loadBrand: qs('thumbLoadBrand'),
      reset: qs('thumbReset')
    };

    if (!els.canvas) return;
    loadStoredState();
    renderPresetButtons();
    renderPaletteButtons();
    syncForm();
    renderHooks();
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
  window.AfroTools.thumbnailStudio = {
    renderPreview: renderPreview,
    getState: function () { return Object.assign({}, state); },
    getSizes: function () { return Object.assign({}, SIZES); }
  };
})();
