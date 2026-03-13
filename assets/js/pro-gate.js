(function(window) {
  'use strict';

  const PRO_TOOLS = ['japa-calculator', 'medical-report', 'japa-visa-predict'];

  const AfroProGate = {
    isPro() {
      return window.AfroAuth && AfroAuth.isPro();
    },

    isProFeature(toolId) {
      return PRO_TOOLS.includes(toolId);
    },

    injectUpsell() {
      const meta = document.querySelector('meta[name="tool-id"]');
      if (!meta) return;
      const toolId = meta.content;
      if (!this.isProFeature(toolId)) return;
      if (this.isPro()) return;

      // Insert upsell banner before footer
      const footer = document.querySelector('afro-footer');
      if (!footer) return;

      const banner = document.createElement('div');
      banner.className = 'pro-upsell-banner';
      banner.innerHTML = `
        <div style="max-width:800px;margin:0 auto;padding:32px 24px;text-align:center;">
          <span style="display:inline-block;background:linear-gradient(135deg,#F5A623,#e8960e);color:#fff;font-size:.6rem;font-weight:800;padding:3px 10px;border-radius:100px;letter-spacing:.08em;margin-bottom:12px;">PRO</span>
          <h3 style="font-size:1.2rem;font-weight:800;color:#111827;margin-bottom:8px;">Get more with AfroTools Pro</h3>
          <p style="font-size:.85rem;color:#6B7280;line-height:1.6;margin-bottom:16px;">Unlimited AI advisor, visa predictions, medical report analysis, and more.</p>
          <a href="/pricing/" style="display:inline-block;background:#008751;color:#fff;padding:10px 24px;border-radius:8px;font-weight:700;font-size:.85rem;text-decoration:none;">See Plans & Pricing</a>
        </div>
      `;
      banner.style.cssText = 'background:#F9FAFB;border-top:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB;margin:24px 0;';
      footer.parentNode.insertBefore(banner, footer);
    },

    // Toggle .pro-only elements visibility
    applyGating() {
      const isPro = this.isPro();
      document.querySelectorAll('.pro-only').forEach(el => {
        el.style.display = isPro ? '' : 'none';
      });
      document.querySelectorAll('.free-only').forEach(el => {
        el.style.display = isPro ? 'none' : '';
      });
    }
  };

  // Auto-run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      AfroProGate.injectUpsell();
      AfroProGate.applyGating();
    });
  } else {
    AfroProGate.injectUpsell();
    AfroProGate.applyGating();
  }

  window.AfroProGate = AfroProGate;
})(window);
