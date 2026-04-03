/**
 * AFROTOOLS — Salary & Tax Hub (main index)
 * Handles search + hub filtering for salary-tax/index.html
 */
(function () {
  'use strict';

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _initSalaryTax() {
    var key = 'financial';
    var allTools = AFRO_TOOLS.filter(function (t) { return t.category === key; });
    var live = allTools.filter(function (t) { return t.status === 'live' || t.status === 'new'; });
    var e;
    e = document.getElementById('s-total'); if (e) e.textContent = allTools.length;

    /* ── Hub ID sets ── */
    var HUB_IDS = {
      paye: ['ng-paye','ke-paye','gh-paye','za-paye','eg-paye','tz-paye','ug-paye','rw-paye','et-paye','sn-paye','ci-paye','cm-paye','ma-paye','dz-paye','tn-paye','ly-paye','sd-paye','ao-paye','mz-paye','zm-paye','zw-paye','bw-paye','na-paye','sz-paye','ls-paye','mw-paye','mg-paye','mu-paye','sc-paye','bi-paye','cd-paye','cg-paye','ga-paye','gq-paye','cf-paye','td-paye','ne-paye','ml-paye','bf-paye','gn-paye','gw-paye','sl-paye','lr-paye','mr-paye','gm-paye','cv-paye','st-paye','tg-paye','bj-paye','so-paye','dj-paye','er-paye','ss-paye','km-paye','paye-calculator','ke-paye-sw','tz-paye-sw','ke-vs-tz-sw'],
      payroll: ['minimum-wage','overtime-calc','leave-calculator','social-security','pension-proj','payslip-generator','staff-cost','salary-compare','ng-pension','ke-nssf','za-gepf','gh-ssnit','za-uif','job-offer-evaluator'],
      biztax: ['gh-paye-2','ng-cit','ng-cgt','ke-cgt','za-cgt','za-dividend-tax','ng-wht','ke-wht','transfer-pricing','import-duty','side-hustle-tax'],
      property: ['mortgage-calculator','loan-compare','za-transfer-duty','compound-interest','first-home-buyer','home-loan-eligibility','mortgage-affordability','property-roi','property-transfer-cost','rent-vs-buy','ng-land-use','ke-stamp-duty','car-loan','student-loan','microfinance-calc'],
      savings: ['investment-return','inflation-calc','savings-goal','retirement-planner','startup-valuation','business-planner','crypto-cgt'],
      crypto: ['crypto-p2p','crypto-prices','crypto-stablecoins','crypto-remittance','crypto-arbitrage','crypto-portfolio','crypto-dca','crypto-tax','crypto-cgt','crypto-profit','crypto-mining','crypto-scam','crypto-address','crypto-exchange','crypto-contract','crypto-quiz'],
      fx: ['currency-converter','afrorates','interest-rate-ref','forex-profit','bank-charges','fuel-tracker'],
      francophone: ['ci-paye-fr','sn-paye-fr','cm-paye-fr','cd-paye-fr','ma-paye-fr','dz-paye-fr','tn-paye-fr','ml-paye-fr','bf-paye-fr','ne-paye-fr','gn-paye-fr','cg-paye-fr','ga-paye-fr','tg-paye-fr','mg-paye-fr','bj-paye-fr','td-paye-fr','bi-paye-fr','mr-paye-fr','cf-paye-fr','dj-paye-fr','km-paye-fr','cv-paye-fr','gq-paye-fr','sn-vs-ci-fr','ci-tva-fr','sn-tva-fr','cm-tva-fr','cd-tva-fr','ma-tva-fr','dz-tva-fr','tn-tva-fr','ml-tva-fr','bf-tva-fr','ne-tva-fr','gn-tva-fr','cg-tva-fr','ga-tva-fr','tg-tva-fr','calculateur-tva-fr','convertisseur-devises-fr','generateur-factures-fr','droits-douane-fr','frais-mobile-money-fr','transfert-argent-fr','ci-salaire','sn-salaire','cm-salaire','cd-salaire','ma-salaire','dz-salaire','tn-salaire','ml-salaire','bf-salaire','ne-salaire','gn-salaire','cg-salaire','ga-salaire','tg-salaire']
    };
    var HUB_SETS = {};
    Object.keys(HUB_IDS).forEach(function (h) { HUB_SETS[h] = new Set(HUB_IDS[h]); });

    var HUB_LABELS = {
      paye: '💰 PAYE Calculators', payroll: '👔 Payroll & HR', biztax: '🏢 Business & Capital Tax',
      property: '🏠 Property & Loans', savings: '📈 Savings & Investment', crypto: '₿ Crypto Suite',
      fx: '💱 Currency & FX', francophone: '🇫🇷 Outils Francophones'
    };

    var results = document.getElementById('find-results');
    var MAX = 30;

    function showResults(tools, label) {
      if (!results) return;
      var html = '';
      if (label) html += '<div class="fr-hub-label">' + esc(label) + '<span class="fr-count">' + tools.length + ' tools</span></div>';
      if (!tools.length) {
        results.innerHTML = html + '<div class="fr-empty">No tools found — try a different search.</div>';
        results.style.display = 'block'; return;
      }
      tools.slice(0, MAX).forEach(function (t) {
        html += '<a href="' + esc(t.href || '#') + '" class="fr-item">'
          + '<span class="fr-icon">' + esc(t.icon || '') + '</span>'
          + '<div class="fr-info"><div class="fr-name">' + esc(t.name || '') + '</div><div class="fr-desc">' + esc(t.desc || '') + '</div></div>'
          + '<span class="fr-cta">Open &rarr;</span>'
          + '</a>';
      });
      if (tools.length > MAX) html += '<div class="fr-empty fr-more">' + tools.length + ' tools — refine your search to narrow down</div>';
      results.innerHTML = html;
      results.style.display = 'block';
    }

    window.filterHub = function (hub) {
      var input = document.getElementById('tool-search');
      if (input) input.value = '';
      var s = HUB_SETS[hub];
      var filtered = live.filter(function (t) { return s && s.has(t.id); });
      showResults(filtered, HUB_LABELS[hub] || hub);
    };

    var searchInput = document.getElementById('tool-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var q = this.value.trim().toLowerCase();
        if (!q) { if (results) results.style.display = 'none'; return; }
        var matched = live.filter(function (t) {
          return (t.name || '').toLowerCase().includes(q)
            || (t.desc || '').toLowerCase().includes(q)
            || (t.id || '').toLowerCase().includes(q)
            || (Array.isArray(t.countries) ? t.countries.join(' ').toLowerCase().includes(q) : false);
        });
        showResults(matched, '');
      });
    }
  }

  if (typeof onRegistryReady === 'function') { onRegistryReady(_initSalaryTax); }
  else {
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof AFRO_TOOLS !== 'undefined') _initSalaryTax();
      else document.addEventListener('afrotools:registry-ready', _initSalaryTax);
    });
  }
})();
