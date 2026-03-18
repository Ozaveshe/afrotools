/**
 * AFROTOOLS RESULT CARD GENERATOR
 * Creates shareable 1200x630 image cards from calculation results.
 * Uses html2canvas (already available on CDN in the codebase).
 *
 * Usage:
 *   const blob = await AfroTools.resultCard.generate({
 *     title: 'My Effective Tax Rate',
 *     value: '18.7%',
 *     subtitle: 'Nigeria PAYE 2026',
 *     details: 'Gross: NGN 5,000,000 | Net: NGN 342,500/mo',
 *     country: 'NG',
 *     toolUrl: '/nigeria/ng-salary-tax',
 *     toolId: 'ng-paye'
 *   });
 */
(function (window) {
  'use strict';

  const CARD_WIDTH = 1200;
  const CARD_HEIGHT = 630;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Ensure html2canvas is loaded (with timeout for slow networks)
  function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      if (window.html2canvas) return resolve(window.html2canvas);
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload = () => resolve(window.html2canvas);
      s.onerror = () => reject(new Error('Failed to load html2canvas'));
      document.head.appendChild(s);
      setTimeout(() => reject(new Error('html2canvas load timeout')), 15000);
    });
  }

  function createCardDOM(opts) {
    const card = document.createElement('div');
    card.id = 'afro-result-card-gen';
    card.style.cssText = `
      position:fixed;left:-9999px;top:-9999px;
      width:${CARD_WIDTH}px;height:${CARD_HEIGHT}px;
      font-family:'DM Sans',system-ui,-apple-system,sans-serif;
      background:linear-gradient(145deg,#0a1a10 0%,#0c2015 40%,#0a1a10 100%);
      color:#fff;display:flex;flex-direction:column;justify-content:center;
      padding:60px 80px;overflow:hidden;
    `;

    // Grid pattern overlay
    const grid = document.createElement('div');
    grid.style.cssText = `
      position:absolute;inset:0;pointer-events:none;
      background-image:linear-gradient(rgba(0,122,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,122,255,.06) 1px,transparent 1px);
      background-size:44px 44px;
    `;
    card.appendChild(grid);

    // Radial glow
    const glow = document.createElement('div');
    glow.style.cssText = `position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 50% at 50% 30%,rgba(0,122,255,.15) 0%,transparent 70%);`;
    card.appendChild(glow);

    // Content wrapper
    const content = document.createElement('div');
    content.style.cssText = 'position:relative;z-index:1;';

    // Logo row
    const logoRow = document.createElement('div');
    logoRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:40px;';
    logoRow.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;background:#0a1a10;border:2px solid rgba(0,200,115,.3);border-radius:8px;display:flex;align-items:center;justify-content:center;">
          <div style="width:12px;height:12px;background:#007AFF;transform:rotate(45deg);"></div>
        </div>
        <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#fff;">AfroTools</span>
      </div>
      <span style="font-size:14px;color:rgba(255,255,255,.35);">afrotools.com</span>
    `;
    content.appendChild(logoRow);

    // Title
    const title = document.createElement('div');
    title.style.cssText = 'font-size:22px;font-weight:600;color:rgba(255,255,255,.6);margin-bottom:12px;letter-spacing:0.01em;';
    title.textContent = opts.title || 'My Tax Result';
    content.appendChild(title);

    // Value
    const value = document.createElement('div');
    value.style.cssText = 'font-size:72px;font-weight:800;color:#007AFF;letter-spacing:-0.03em;line-height:1;margin-bottom:16px;';
    value.textContent = opts.value || '—';
    content.appendChild(value);

    // Subtitle / Country
    const subtitle = document.createElement('div');
    subtitle.style.cssText = 'font-size:20px;font-weight:600;color:rgba(255,255,255,.5);margin-bottom:24px;';
    subtitle.textContent = opts.subtitle || '';
    content.appendChild(subtitle);

    // Details — show as structured pills if pipe-separated
    if (opts.details) {
      const parts = opts.details.split(' | ');
      const detailsWrap = document.createElement('div');
      detailsWrap.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;margin-bottom:32px;';
      parts.forEach(part => {
        const pill = document.createElement('div');
        pill.style.cssText = 'padding:10px 18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:8px;font-size:15px;color:rgba(255,255,255,.55);font-weight:500;';
        pill.textContent = part;
        detailsWrap.appendChild(pill);
      });
      content.appendChild(detailsWrap);
    }

    // CTA bar
    const cta = document.createElement('div');
    cta.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding-top:24px;border-top:1px solid rgba(255,255,255,.08);';
    cta.innerHTML = `
      <span style="font-size:18px;font-weight:700;color:#F5A623;">What's yours? Calculate free at AfroTools</span>
      <span style="font-size:14px;color:rgba(255,255,255,.3);">afrotools.com${opts.toolUrl || ''}</span>
    `;
    content.appendChild(cta);

    card.appendChild(content);
    return card;
  }

  const resultCard = {
    /**
     * Generate a shareable result card as a Blob
     * @param {Object} opts - { title, value, subtitle, details, country, toolUrl, toolId }
     * @returns {Promise<Blob>} PNG image blob
     */
    async generate(opts = {}) {
      const h2c = await loadHtml2Canvas();
      const card = createCardDOM(opts);
      document.body.appendChild(card);

      try {
        const h2cPromise = h2c(card, {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          scale: isMobile ? 1 : 2,
          useCORS: true,
          backgroundColor: '#0a1a10',
          logging: false
        });
        const h2cTimeout = new Promise(r => setTimeout(() => r(null), 12000));
        const canvas = await Promise.race([h2cPromise, h2cTimeout]);
        if (!canvas) return null;

        return new Promise(resolve => {
          const timer = setTimeout(() => resolve(null), 5000);
          canvas.toBlob(blob => { clearTimeout(timer); resolve(blob); }, 'image/png');
        });
      } finally {
        card.remove();
      }
    },

    /**
     * Generate and immediately share
     * @param {Object} opts - same as generate() plus { text }
     */
    async generateAndShare(opts = {}) {
      const blob = await this.generate(opts);
      if (!blob) {
        if (window.AfroTools && window.AfroTools.toast) {
          window.AfroTools.toast.show('Could not generate image. Try the text share instead.', 'error');
        }
        return;
      }

      // Always download the image first
      this._downloadBlob(blob, opts.toolId);

      if (window.AfroTools && window.AfroTools.toast) {
        window.AfroTools.toast.show('Image saved! Share it on social media.', 'success');
      }
    },

    _downloadBlob(blob, toolId) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `afrotools-${toolId || 'result'}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    },

    /**
     * Generate and download as PNG
     * @param {Object} opts - same as generate()
     */
    async generateAndDownload(opts = {}) {
      const blob = await this.generate(opts);
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `afrotools-${opts.toolId || 'result'}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Merge into AfroTools namespace
  if (window.AfroTools) {
    window.AfroTools.resultCard = resultCard;
  } else {
    window.AfroTools = { resultCard };
  }

})(window);
