/* AfroTools API Docs — Sidebar Component */
class ApiSidebar extends HTMLElement {
  connectedCallback() {
    const current = this.getAttribute('active') || '';
    const link = (href, label, method) => {
      const isActive = current === href;
      const badge = method ? `<span class="method-badge method-badge--${method.toLowerCase()}">${method}</span>` : '';
      return `<a href="${href}" class="api-nav__link${isActive ? ' api-nav__link--active' : ''}">${badge}${label}</a>`;
    };
    this.innerHTML = `
    <aside class="api-sidebar" id="apiSidebar">
      <a href="/docs/api/" class="api-sidebar__logo">
        <img src="/assets/img/logo-mark.svg" alt="AfroTools">
        <span>API Docs <span class="badge">v1</span></span>
      </a>
      <div class="api-sidebar__search">
        <input type="text" placeholder="Search docs..." id="apiSearchInput">
      </div>
      <nav class="api-nav">
        <div class="api-nav__section">
          <div class="api-nav__heading">Getting Started</div>
          ${link('/docs/api/','Overview')}
          ${link('/docs/api/authentication.html','Authentication')}
          ${link('/docs/api/errors.html','Error Handling')}
          ${link('/docs/api/rate-limits.html','Rate Limits')}
          ${link('/docs/api/sdks.html','SDKs &amp; Libraries')}
        </div>
        <div class="api-nav__section">
          <div class="api-nav__heading">AfroTax</div>
          ${link('/docs/api/tax/','Overview')}
          ${link('/docs/api/tax/calculate.html','Calculate Tax','POST')}
          ${link('/docs/api/tax/countries.html','List Countries','GET')}
          ${link('/docs/api/tax/country.html','Country Info','GET')}
        </div>
        <div class="api-nav__section">
          <div class="api-nav__heading">AfroFX (Forex)</div>
          ${link('/docs/api/forex/','Overview')}
          ${link('/docs/api/forex/latest.html','Latest Rates','GET')}
        </div>
        <div class="api-nav__section">
          <div class="api-nav__heading">AfroFuel</div>
          ${link('/docs/api/fuel/','Overview')}
          ${link('/docs/api/fuel/prices.html','Fuel Prices','GET')}
        </div>
        <div class="api-nav__section">
          <div class="api-nav__heading">AfroRates</div>
          ${link('/docs/api/rates/','Overview')}
          ${link('/docs/api/rates/central-bank.html','Central Bank Rates','GET')}
        </div>
        <div class="api-nav__section">
          <div class="api-nav__heading">AfroVAT</div>
          ${link('/docs/api/vat/','Overview')}
          ${link('/docs/api/vat/calculate.html','Calculate VAT','POST')}
        </div>
        <div class="api-nav__section">
          <div class="api-nav__heading">Resources</div>
          ${link('/docs/api/pricing.html','Pricing')}
          ${link('/docs/api/changelog.html','Changelog')}
        </div>
      </nav>
    </aside>
    <button class="api-sidebar-toggle" id="apiSidebarToggle" aria-label="Toggle sidebar">&#9776;</button>`;
    // Toggle sidebar on mobile
    const toggle = this.querySelector('#apiSidebarToggle');
    const sidebar = this.querySelector('#apiSidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('api-sidebar--open'));
      // Close on link click (mobile)
      sidebar.querySelectorAll('.api-nav__link').forEach(a => {
        a.addEventListener('click', () => sidebar.classList.remove('api-sidebar--open'));
      });
    }
    // Simple search filter
    const input = this.querySelector('#apiSearchInput');
    if (input) {
      input.addEventListener('input', () => {
        const q = input.value.toLowerCase();
        this.querySelectorAll('.api-nav__link').forEach(a => {
          a.style.display = a.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
        this.querySelectorAll('.api-nav__heading').forEach(h => {
          const section = h.parentElement;
          const hasVisible = [...section.querySelectorAll('.api-nav__link')].some(a => a.style.display !== 'none');
          h.style.display = hasVisible ? '' : 'none';
        });
      });
    }
  }
}
customElements.define('api-sidebar', ApiSidebar);
