/**
 * AFROTOOLS SHARE IMAGE INJECTOR
 * Automatically adds "Share as Image" button to all PAYE/VAT tool pages.
 * Include this script on any tool page to get the share image feature.
 *
 * Looks for:
 *  - .action-row container (where existing PDF/Share buttons live)
 *  - window.RESULT object (populated after calculation)
 *  - meta[name="tool-id"] or window.TOOL_ID for tool identification
 */
(function () {
  'use strict';

  function getToolId() {
    const meta = document.querySelector('meta[name="tool-id"]');
    if (meta) return meta.content;
    if (window.TOOL_ID) return window.TOOL_ID;
    // Infer from URL: /nigeria/ng-salary-tax → ng-paye, /tools/japa-calculator → japa-calculator
    const path = location.pathname.replace(/\/$/, '');
    const slug = path.split('/').pop();
    return slug || 'unknown';
  }

  function getCountryName() {
    // Try to get from page title or heading
    const h1 = document.querySelector('h1');
    if (h1) {
      const text = h1.textContent;
      const match = text.match(/^([\w\s'ôéèêë]+)\s+(?:PAYE|VAT|Income Tax|Tax)/i);
      if (match) return match[1].trim();
    }
    return '';
  }

  function getCurrency() {
    // Try currency prefix in inputs
    const prefix = document.querySelector('.f-prefix');
    if (prefix) return prefix.textContent.trim();
    // Try from page content
    const text = document.body.textContent;
    const match = text.match(/(?:Currency|currency)[:\s]+([A-Z]{3})/);
    if (match) return match[1];
    return '';
  }

  function injectButton() {
    const actionRow = document.querySelector('.action-row');
    if (!actionRow) return;
    if (actionRow.querySelector('.act-share-image')) return; // already injected

    const btn = document.createElement('button');
    btn.className = 'act-btn act-share-image';
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      Share as Image
    `;
    btn.style.cssText = 'background:#FFF8E8;border:1.5px solid #F0D990;color:#8a5c00;display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;';
    btn.onmouseover = () => { btn.style.background = '#FEF3CD'; };
    btn.onmouseout = () => { btn.style.background = '#FFF8E8'; };

    btn.addEventListener('click', async () => {
      const R = window.RESULT;
      if (!R) {
        if (window.AfroTools && window.AfroTools.toast) {
          window.AfroTools.toast.show('Calculate first to generate a shareable image.', 'info');
        }
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Generating...';

      try {
        // Load result-card.js if not already loaded
        if (!window.AfroTools || !window.AfroTools.resultCard) {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = '/assets/js/result-card.js';
            s.onload = resolve;
            s.onerror = () => reject(new Error('Failed to load result-card.js'));
            document.head.appendChild(s);
            setTimeout(() => reject(new Error('result-card.js load timeout')), 10000);
          });
        }

        const toolId = getToolId();
        const country = getCountryName();
        const currency = getCurrency();
        const toolUrl = location.pathname;

        // Build card data from RESULT — adapt to different result shapes
        const effectiveRate = R.effectiveRate || R.effective_rate || R.rate || 0;
        const gross = R.gross || R.grossAnnual || R.grossIncome || 0;
        const net = R.netMonthly || R.net_monthly || R.netIncome || 0;
        const netAnnual = R.netAnnual || R.annualNet || (net * 12) || 0;
        const tax = R.tax || R.monthlyPAYE || R.annualTax || 0;
        const marginal = R.marginalRate || R.marginal_rate || 0;

        // Try to use page's own format function
        const fmtFn = window.fmt || (n => Math.round(n).toLocaleString());
        const pctFn = window.pct || (n => n.toFixed(1) + '%');

        const cur = currency ? currency + ' ' : '';
        const detailParts = [
          'Gross: ' + cur + fmtFn(gross) + '/mo',
          'Take-home: ' + cur + fmtFn(net) + '/mo',
          'Tax: ' + cur + fmtFn(tax) + '/mo'
        ];

        // Wrap in a timeout so it never hangs forever on mobile
        const sharePromise = window.AfroTools.resultCard.generateAndShare({
          title: 'My Effective Tax Rate',
          value: pctFn(effectiveRate),
          subtitle: country + ' PAYE ' + new Date().getFullYear() + (currency ? ' · ' + currency : ''),
          details: detailParts.join(' | '),
          toolUrl,
          toolId,
          text: `My effective tax rate is ${pctFn(effectiveRate)} in ${country}. Gross ${cur}${fmtFn(gross)}/mo → Take-home ${cur}${fmtFn(net)}/mo. What's yours?`
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Share image timed out')), 30000)
        );

        await Promise.race([sharePromise, timeoutPromise]);
      } catch (err) {
        console.error('Share image error:', err);
        if (window.AfroTools && window.AfroTools.toast) {
          window.AfroTools.toast.show('Could not generate image. Try the text share instead.', 'error');
        }
      }

      btn.disabled = false;
      btn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        Share as Image
      `;
    });

    actionRow.appendChild(btn);
  }

  // Inject after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }

  // Also re-check after a short delay (for dynamically rendered pages)
  setTimeout(injectButton, 1000);
})();
