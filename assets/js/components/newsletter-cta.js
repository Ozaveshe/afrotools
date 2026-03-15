/**
 * AFROTOOLS NEWSLETTER CTA — Sticky bottom bar Web Component
 * Shows after user scrolls 40% of page. Dismissible. Remembers dismissal for 7 days.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'afro_nl_dismissed';
  const DISMISS_DAYS = 7;

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;font-family:'DM Sans',system-ui,sans-serif}
    :host{display:block}
    .bar{
      position:fixed;bottom:0;left:0;right:0;z-index:400;
      background:#111827;border-top:2px solid #1f2937;
      padding:14px 20px;
      transform:translateY(100%);opacity:0;
      transition:transform .35s ease,opacity .35s ease;
      display:none;
    }
    .bar.show{display:block}
    .bar.visible{transform:translateY(0);opacity:1}
    .inner{
      max-width:1000px;margin:0 auto;
      display:flex;align-items:center;gap:14px;flex-wrap:wrap;
    }
    .text{flex:1;min-width:200px;color:#fff;font-size:.85rem;font-weight:600;line-height:1.4}
    .text span{color:#34d399}
    .form{display:flex;gap:8px;flex:1;min-width:260px;max-width:400px}
    .inp{
      flex:1;min-width:0;padding:10px 12px;
      background:rgba(255,255,255,.08);border:1px solid #374151;border-radius:6px;
      font-size:.82rem;color:#f3f4f6;outline:none;
      transition:border-color .15s;
    }
    .inp::placeholder{color:#6b7280}
    .inp:focus{border-color:#5ddb9e}
    .btn{
      padding:10px 16px;background:#5ddb9e;color:#fff;border:none;border-radius:6px;
      font-size:.78rem;font-weight:700;cursor:pointer;white-space:nowrap;
      transition:background .15s;
    }
    .btn:hover{background:#00a863}
    .close{
      background:none;border:none;color:#6b7280;cursor:pointer;padding:6px;
      font-size:1.1rem;line-height:1;transition:color .15s;flex-shrink:0;
    }
    .close:hover{color:#fff}
    @media(max-width:640px){
      .inner{flex-direction:column;gap:10px;align-items:stretch}
      .form{max-width:none}
      .text{font-size:.8rem}
    }
  `;

  class AfroNewsletterCta extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      // Check if dismissed recently
      try {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (dismissed && Date.now() - parseInt(dismissed) < DISMISS_DAYS * 86400000) return;
      } catch(e) {}

      this._render();
      this._bind();
    }

    _render() {
      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <div class="bar" id="bar" role="complementary" aria-label="Newsletter signup">
          <div class="inner">
            <div class="text"><span>New tools every week.</span> Get notified — no spam, cancel anytime.</div>
            <form class="form" name="newsletter-cta" data-netlify="true" id="form">
              <input class="inp" type="email" name="email" placeholder="your@email.com" required aria-label="Email address">
              <button class="btn" type="submit">Notify Me →</button>
            </form>
            <button class="close" type="button" aria-label="Dismiss" id="close">✕</button>
          </div>
        </div>`;
    }

    _bind() {
      const bar = this.shadowRoot.getElementById('bar');
      const form = this.shadowRoot.getElementById('form');
      const closeBtn = this.shadowRoot.getElementById('close');
      let shown = false;

      // Show after 40% scroll
      const checkScroll = () => {
        if (shown) return;
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        if (scrollPercent > 0.4) {
          bar.classList.add('show');
          requestAnimationFrame(() => {
            requestAnimationFrame(() => bar.classList.add('visible'));
          });
          shown = true;
          window.removeEventListener('scroll', checkScroll);
        }
      };
      window.addEventListener('scroll', checkScroll, { passive: true });

      // Close
      const dismiss = () => {
        bar.classList.remove('visible');
        setTimeout(() => bar.classList.remove('show'), 350);
        try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch(e) {}
      };
      closeBtn.addEventListener('click', dismiss);

      // Submit
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('.btn');
        const inp = form.querySelector('.inp');
        if (!inp.value || !inp.checkValidity()) return;
        btn.disabled = true;
        btn.textContent = '…';
        try {
          const formData = new URLSearchParams();
          formData.append('form-name', 'newsletter');
          formData.append('email', inp.value);
          await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData.toString() });
        } catch(err) {}
        btn.textContent = '✓ Done!';
        inp.value = '';
        setTimeout(dismiss, 2000);
      });
    }
  }

  if (!customElements.get('afro-newsletter-cta')) {
    customElements.define('afro-newsletter-cta', AfroNewsletterCta);
  }
})();
