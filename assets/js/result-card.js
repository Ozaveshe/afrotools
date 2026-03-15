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

  // Ensure html2canvas is loaded
  function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      if (window.html2canvas) return resolve(window.html2canvas);
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload = () => resolve(window.html2canvas);
      s.onerror = reject;
      document.head.appendChild(s);
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
      background-image:linear-gradient(rgba(93,219,158,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(93,219,158,.06) 1px,transparent 1px);
      background-size:44px 44px;
    `;
    card.appendChild(grid);

    // Radial glow
    const glow = document.createElement('div');
    glow.style.cssText = `position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 50% at 50% 30%,rgba(93,219,158,.15) 0%,transparent 70%);`;
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
          <div style="width:12px;height:12px;background:var(--color-primary);transform:rotate(45deg);"></div>
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
    value.style.cssText = 'font-size:72px;font-weight:800;color:var(--color-primary);letter-spacing:-0.03em;line-height:1;margin-bottom:16px;';
    value.textContent = opts.value || '—';
    content.appendChild(value);

    // Subtitle / Country
    const subtitle = document.createElement('div');
    subtitle.style.cssText = 'font-size:20px;font-weight:600;color:rgba(255,255,255,.5);margin-bottom:24px;';
    subtitle.textContent = opts.subtitle || '';
    content.appendChild(subtitle);

    // Details line
    if (opts.details) {
      const details = document.createElement('div');
      details.style.cssText = 'font-size:16px;color:rgba(255,255,255,.4);margin-bottom:32px;letter-spacing:0.01em;';
      details.textContent = opts.details;
      content.appendChild(details);
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
        const canvas = await h2c(card, {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          scale: 2,
          useCORS: true,
          backgroundColor: '#0a1a10',
          logging: false
        });

        return new Promise(resolve => {
          canvas.toBlob(blob => resolve(blob), 'image/png');
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
      if (!blob) return;

      const shareText = opts.text || `${opts.title}: ${opts.value} — ${opts.subtitle}`;
      await window.AfroTools.share.shareResult({
        title: opts.title || 'My AfroTools Result',
        text: shareText,
        url: 'https://afrotools.com' + (opts.toolUrl || ''),
        imageBlob: blob,
        toolId: opts.toolId || 'unknown'
      });
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
