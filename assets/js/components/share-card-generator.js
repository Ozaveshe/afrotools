/* ──────────────────────────────────────────────
   AfroShare — Shareable Result Card Generator
   Canvas-based OG image cards + Web Share API
   ────────────────────────────────────────────── */
window.AfroShare = (function () {
  'use strict';

  var W = 1200, H = 630;
  var BG = '#0c1a10';
  var GREEN = '#008751';
  var ACCENT = '#5ddb9e';
  var WHITE = '#FAFAF8';
  var MUTED = 'rgba(250,250,248,0.55)';

  /* ── Font helpers ── */
  function loadFonts() {
    var promises = [];
    if (document.fonts && document.fonts.load) {
      promises.push(document.fonts.load('bold 72px "Instrument Serif"').catch(function () {}));
      promises.push(document.fonts.load('600 28px "DM Sans"').catch(function () {}));
    }
    return Promise.all(promises);
  }

  function fontAvailable(family) {
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      ctx.font = '72px monospace';
      var w1 = ctx.measureText('W').width;
      ctx.font = '72px "' + family + '", monospace';
      var w2 = ctx.measureText('W').width;
      return w1 !== w2;
    } catch (e) { return false; }
  }

  /* ── Truncate text to fit width ── */
  function truncate(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    while (text.length > 0 && ctx.measureText(text + '…').width > maxW) {
      text = text.slice(0, -1);
    }
    return text + '…';
  }

  /* ── Draw rounded rect ── */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ── Format number for display (compact) ── */
  function compactNum(val) {
    if (typeof val === 'string') return val;
    if (typeof val !== 'number') return String(val);
    if (val >= 1e9) return (val / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (val >= 1e6) return (val / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (val >= 1e3) return val.toLocaleString('en');
    return String(val);
  }

  /* ═══════════════════════════════════════════
     generateCard()
     ═══════════════════════════════════════════ */
  function generateCard(opts) {
    var toolName = opts.toolName || 'AfroTools Calculator';
    var headline = opts.headline || 'My Result';
    var mainValue = opts.mainValue || '';
    var subValues = opts.subValues || [];
    var flag = opts.countryFlag || '';
    var brand = opts.brandColor || GREEN;

    return loadFonts().then(function () {
      var canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      var ctx = canvas.getContext('2d');

      var serifFont = fontAvailable('Instrument Serif') ? '"Instrument Serif"' : 'Georgia, serif';
      var sansFont = fontAvailable('DM Sans') ? '"DM Sans"' : 'system-ui, sans-serif';

      /* Background gradient */
      var grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, BG);
      grad.addColorStop(1, '#0f2516');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      /* Subtle decorative circle */
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = brand;
      ctx.beginPath();
      ctx.arc(W - 120, 140, 260, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* ── Top bar: Logo + tool name ── */
      var px = 60, py = 52;

      /* Logo badge */
      roundRect(ctx, px, py, 110, 38, 6);
      ctx.fillStyle = brand;
      ctx.fill();
      ctx.font = 'bold 16px ' + sansFont;
      ctx.fillStyle = WHITE;
      ctx.textBaseline = 'middle';
      ctx.fillText('AFROTOOLS', px + 10, py + 19);

      /* Tool name + flag */
      ctx.font = '600 22px ' + sansFont;
      ctx.fillStyle = MUTED;
      var toolLabel = flag ? toolName + '  ' + flag : toolName;
      ctx.fillText(truncate(ctx, toolLabel, W - 260), px + 124, py + 19);

      /* ── Headline ── */
      ctx.font = '500 28px ' + sansFont;
      ctx.fillStyle = ACCENT;
      ctx.textBaseline = 'top';
      ctx.fillText(truncate(ctx, headline, W - 140), px, 140);

      /* ── Main value ── */
      ctx.font = 'bold 80px ' + serifFont;
      ctx.fillStyle = WHITE;
      var mainText = truncate(ctx, mainValue, W - 140);
      ctx.fillText(mainText, px, 190);

      /* ── Sub-values row ── */
      if (subValues.length > 0) {
        var sy = 320;
        var colW = Math.min(280, (W - 140) / subValues.length);

        subValues.forEach(function (sv, i) {
          var sx = px + i * colW;

          /* Divider line (not on first) */
          if (i > 0) {
            ctx.strokeStyle = 'rgba(250,250,248,0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sx - 16, sy);
            ctx.lineTo(sx - 16, sy + 60);
            ctx.stroke();
          }

          /* Label */
          ctx.font = '500 18px ' + sansFont;
          ctx.fillStyle = MUTED;
          ctx.textBaseline = 'top';
          ctx.fillText(truncate(ctx, sv.label || '', colW - 24), sx, sy);

          /* Value */
          ctx.font = '700 26px ' + sansFont;
          ctx.fillStyle = WHITE;
          ctx.fillText(truncate(ctx, sv.value || '', colW - 24), sx, sy + 30);
        });
      }

      /* ── Bottom brand bar ── */
      var barH = 64;
      var barY = H - barH;

      ctx.fillStyle = brand;
      ctx.fillRect(0, barY, W, barH);

      /* Separator line */
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(0, barY, W, 1);

      /* CTA text */
      ctx.font = '600 22px ' + sansFont;
      ctx.fillStyle = WHITE;
      ctx.textBaseline = 'middle';
      ctx.fillText('Calculate yours →  afrotools.com', px, barY + barH / 2);

      /* Convert to blob */
      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) {
          resolve({
            blob: blob,
            dataUrl: canvas.toDataURL('image/png')
          });
        }, 'image/png');
      });
    });
  }

  /* ═══════════════════════════════════════════
     share()
     ═══════════════════════════════════════════ */
  function share(opts) {
    var blob = opts.blob;
    var title = opts.title || 'My AfroTools Result';
    var text = opts.text || '';
    var url = opts.url || window.location.href;

    /* Try Web Share API with file */
    if (navigator.share && blob) {
      var file = new File([blob], 'afrotools-result.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ title: title, text: text, url: url, files: [file] }).catch(function () {});
      }
      /* Fallback: text only share */
      return navigator.share({ title: title, text: text + '\n' + url }).catch(function () {});
    }

    /* Final fallback: copy to clipboard */
    return copyToClipboard(url).then(function () {
      if (window.AfroTools && window.AfroTools.toast) {
        AfroTools.toast('Link copied to clipboard!', 'success');
      }
    });
  }

  /* ═══════════════════════════════════════════
     Platform-specific share URLs
     ═══════════════════════════════════════════ */
  function whatsappUrl(text) {
    return 'https://wa.me/?text=' + encodeURIComponent(text);
  }

  function twitterUrl(text) {
    return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
  }

  function linkedinUrl(url) {
    return 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
  }

  /* ═══════════════════════════════════════════
     generateCompareLink()
     ═══════════════════════════════════════════ */
  function generateCompareLink(toolSlug, inputs) {
    var base = window.location.origin + window.location.pathname;
    var params = new URLSearchParams();
    params.set('compare', 'true');
    if (inputs) {
      Object.keys(inputs).forEach(function (k) {
        var v = inputs[k];
        if (v !== undefined && v !== null && v !== '' && v !== false) {
          params.set(k, String(v));
        }
      });
    }
    return base + '?' + params.toString();
  }

  /* ── Download blob as file ── */
  function downloadBlob(blob, filename) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || 'afrotools-result.png';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 100);
  }

  /* ── Copy to clipboard ── */
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      resolve();
    });
  }

  /* ── Public API ── */
  return {
    generateCard: generateCard,
    share: share,
    whatsappUrl: whatsappUrl,
    twitterUrl: twitterUrl,
    linkedinUrl: linkedinUrl,
    generateCompareLink: generateCompareLink,
    downloadBlob: downloadBlob,
    copyToClipboard: copyToClipboard
  };
})();
