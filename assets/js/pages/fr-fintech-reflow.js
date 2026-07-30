(function () {
  'use strict';

  function repairFooterReflow(footer) {
    if (!footer || !footer.shadowRoot || footer.shadowRoot.querySelector('[data-fr-fintech-reflow]')) return;
    var style = document.createElement('style');
    style.setAttribute('data-fr-fintech-reflow', '');
    style.textContent = [
      '@media(max-width:560px){',
      '.wrap{padding-inline:12px}',
      '.top,.links,.stats{grid-template-columns:minmax(0,1fr);gap:20px}',
      '.nl-form{flex-direction:column}',
      '.nl-btn{white-space:normal}',
      '.bottom{align-items:stretch}',
      '.legal{gap:12px}',
      '.wrap *{min-width:0;overflow-wrap:anywhere}',
      '}'
    ].join('');
    footer.shadowRoot.appendChild(style);
  }

  function repairNavbarReflow(navbar) {
    if (!navbar || !navbar.shadowRoot || navbar.shadowRoot.querySelector('[data-fr-fintech-reflow]')) return;
    var style = document.createElement('style');
    style.setAttribute('data-fr-fintech-reflow', '');
    style.textContent = [
      '@media(max-width:560px){',
      'nav{height:auto;min-height:var(--nav-shell-height);overflow-x:visible!important}',
      '.inner{flex-wrap:wrap;padding-block:6px}',
      '.right{margin-left:auto}',
      '}'
    ].join('');
    navbar.shadowRoot.appendChild(style);
  }

  function repairPageReflow() {
    if (document.querySelector('style[data-fr-fintech-page-reflow]')) return;
    var style = document.createElement('style');
    style.setAttribute('data-fr-fintech-page-reflow', '');
    style.textContent = [
      '.fr-fintech-artwork{max-width:720px;margin:24px auto 0}',
      '.fr-fintech-artwork img{display:block;width:100%;height:auto;border:1px solid rgba(219,234,254,.42);border-radius:14px;background:#f8fafc;box-shadow:0 14px 34px rgba(2,6,23,.22)}',
      '.fr-fintech-artwork figcaption{margin:8px 0 0;color:#dbeafe;font-size:.78rem;line-height:1.5;text-align:center}',
      'html[data-theme="dark"] :is(.info-box,.privacy-box,.source-box,.res-hero){color:#e5edf8!important}',
      'html[data-theme="dark"] .info-box{background:#172554!important;border-color:#3b82f6!important}',
      'html[data-theme="dark"] .privacy-box{background:#052e2b!important;border-color:#14b8a6!important}',
      'html[data-theme="dark"] .source-box{background:#431407!important;border-color:#f97316!important}',
      'html[data-theme="dark"] .res-hero{background:#052e2b!important;border-color:#14b8a6!important}',
      'html[data-theme="dark"] :is(.info-box,.privacy-box,.source-box) strong{color:inherit!important}',
      'html[data-theme="dark"] .res-hero :is(.res-label,.res-val,.res-sub){color:#ccfbf1!important}',
      'html[data-theme="dark"] body main .fintech-pay-actions.fintech-pay-actions{background:#101c2c!important;border-color:#3a4e68!important;color:#e5edf8!important}',
      'html[data-theme="dark"] body main .fintech-pay-actions.fintech-pay-actions strong{color:#f8fafc!important}',
      'html[data-theme="dark"] body main .fintech-pay-actions.fintech-pay-actions :is(p,.fintech-pay-actions__status){color:#cbd5e1!important}',
      'html[data-theme="dark"] body main .cc-label{color:#cbd5e1!important}',
      'html[data-theme="dark"] body main :is(.compare-card.winner,.methods-table tr.best td){background:#052e2b!important;border-color:#14b8a6!important;color:#e5edf8!important}',
      'html[data-theme="dark"] body main .compare-card :is(.cc-label,.cc-name,.cc-fee,.cc-detail){color:#ccfbf1!important}',
      'html[data-theme="dark"] body main .related-links a{color:#bfdbfe!important}',
      'html[data-theme="dark"] body main .person-amt{color:#99f6e4!important}',
      'html[data-theme="dark"] body main .person-pct{color:#cbd5e1!important}',
      'html[data-theme="dark"] body main #ds-recommendation>div{background:#2e1065!important;border-color:#a78bfa!important;color:#ede9fe!important}',
      'html[data-theme="dark"] body main .form-error{color:#fca5a5!important}',
      'html[data-theme="dark"] body main button[type][class]:is(.btn-add,.btn-secondary,.etab){background:#dbeafe!important;border-color:#93c5fd!important;color:#0f172a!important}',
      'html[data-theme="dark"] body main .fintech-pay-actions.fintech-pay-actions button[type]{background:#dbeafe!important;border-color:#93c5fd!important;color:#0f172a!important}',
      'html[data-theme="dark"] body main .fintech-pay-actions.fintech-pay-actions button[type].primary{background:#2563eb!important;border-color:#60a5fa!important;color:#fff!important}',
      'html[data-theme="dark"] body main button[type][class]:is(.btn-del,.btn-del-row){background:#fee2e2!important;border-color:#fca5a5!important;color:#7f1d1d!important}',
      '@media(prefers-color-scheme:dark){',
      'html:not([data-theme="light"]) :is(.info-box,.privacy-box,.source-box,.res-hero){color:#e5edf8!important}',
      'html:not([data-theme="light"]) .info-box{background:#172554!important;border-color:#3b82f6!important}',
      'html:not([data-theme="light"]) .privacy-box{background:#052e2b!important;border-color:#14b8a6!important}',
      'html:not([data-theme="light"]) .source-box{background:#431407!important;border-color:#f97316!important}',
      'html:not([data-theme="light"]) .res-hero{background:#052e2b!important;border-color:#14b8a6!important}',
      'html:not([data-theme="light"]) :is(.info-box,.privacy-box,.source-box) strong{color:inherit!important}',
      'html:not([data-theme="light"]) .res-hero :is(.res-label,.res-val,.res-sub){color:#ccfbf1!important}',
      'html:not([data-theme="light"]) body main .fintech-pay-actions.fintech-pay-actions{background:#101c2c!important;border-color:#3a4e68!important;color:#e5edf8!important}',
      'html:not([data-theme="light"]) body main .fintech-pay-actions.fintech-pay-actions strong{color:#f8fafc!important}',
      'html:not([data-theme="light"]) body main .fintech-pay-actions.fintech-pay-actions :is(p,.fintech-pay-actions__status){color:#cbd5e1!important}',
      'html:not([data-theme="light"]) body main .cc-label{color:#cbd5e1!important}',
      'html:not([data-theme="light"]) body main :is(.compare-card.winner,.methods-table tr.best td){background:#052e2b!important;border-color:#14b8a6!important;color:#e5edf8!important}',
      'html:not([data-theme="light"]) body main .compare-card :is(.cc-label,.cc-name,.cc-fee,.cc-detail){color:#ccfbf1!important}',
      'html:not([data-theme="light"]) body main .related-links a{color:#bfdbfe!important}',
      'html:not([data-theme="light"]) body main .person-amt{color:#99f6e4!important}',
      'html:not([data-theme="light"]) body main .person-pct{color:#cbd5e1!important}',
      'html:not([data-theme="light"]) body main #ds-recommendation>div{background:#2e1065!important;border-color:#a78bfa!important;color:#ede9fe!important}',
      'html:not([data-theme="light"]) body main .form-error{color:#fca5a5!important}',
      'html:not([data-theme="light"]) body main button[type][class]:is(.btn-add,.btn-secondary,.etab){background:#dbeafe!important;border-color:#93c5fd!important;color:#0f172a!important}',
      'html:not([data-theme="light"]) body main .fintech-pay-actions.fintech-pay-actions button[type]{background:#dbeafe!important;border-color:#93c5fd!important;color:#0f172a!important}',
      'html:not([data-theme="light"]) body main .fintech-pay-actions.fintech-pay-actions button[type].primary{background:#2563eb!important;border-color:#60a5fa!important;color:#fff!important}',
      'html:not([data-theme="light"]) body main button[type][class]:is(.btn-del,.btn-del-row){background:#fee2e2!important;border-color:#fca5a5!important;color:#7f1d1d!important}',
      '}',
      '@media(max-width:560px){',
      '.container,.tool-hero{padding-inline:16px!important}',
      '.tool-hero .container{padding-inline:0!important}',
      '.breadcrumb{display:flex;flex-wrap:wrap;overflow:visible!important;overflow-wrap:anywhere}',
      '.card{padding-inline:16px!important}',
      '.form-grid,.compare-grid,.related-links{grid-template-columns:minmax(0,1fr)!important}',
      '.compare-card{min-width:0;padding-inline:16px!important;overflow-wrap:anywhere}',
      '.fintech-pay-actions,.fintech-pay-actions__buttons{grid-template-columns:minmax(0,1fr)!important;min-width:0;width:100%}',
      '.fintech-pay-actions *{min-width:0;overflow-wrap:anywhere}',
      'table{width:100%!important;min-width:0!important;table-layout:fixed}',
      'th,td{min-width:0!important;padding-inline:4px!important;white-space:normal!important;overflow-wrap:anywhere}',
      'table :is(input,select,button){width:100%!important;min-width:0!important;max-width:100%!important;padding-inline:2px!important}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  function mountArtwork() {
    if (document.querySelector('.fr-fintech-artwork')) return;
    var hero = document.querySelector('.tool-hero .container');
    var heading = hero && hero.querySelector('h1');
    var imageMeta = document.querySelector('meta[property="og:image"]');
    if (!hero || !heading || !imageMeta || !imageMeta.content) return;
    var source;
    try {
      source = new URL(imageMeta.content, window.location.href);
    } catch (error) {
      return;
    }
    if (!/^\/assets\/img\/tools\//.test(source.pathname) || !/\.webp$/i.test(source.pathname)) return;
    var title = heading.textContent.replace(/\s+/g, ' ').trim();
    if (!title) return;
    var figure = document.createElement('figure');
    var image = document.createElement('img');
    var caption = document.createElement('figcaption');
    figure.className = 'fr-fintech-artwork';
    figure.setAttribute('data-artwork-provenance', 'AfroTools');
    image.src = source.pathname;
    image.alt = 'Illustration AfroTools pour ' + title + '.';
    image.decoding = 'async';
    caption.textContent = 'Illustration AfroTools associée à cet outil. Les calculs reposent sur vos données et les sources indiquées sur la page.';
    figure.appendChild(image);
    figure.appendChild(caption);
    hero.appendChild(figure);
  }

  function watchComponent(tagName, repair) {
    var component = document.querySelector(tagName);
    if (!component || !window.customElements) return;
    window.customElements.whenDefined(tagName).then(function () {
      repair(component);
      if (!component.shadowRoot || component._frFintechReflowObserver) return;
      component._frFintechReflowObserver = new MutationObserver(function () {
        repair(component);
      });
      component._frFintechReflowObserver.observe(component.shadowRoot, { childList: true });
    });
  }

  function init() {
    repairPageReflow();
    mountArtwork();
    watchComponent('afro-navbar', repairNavbarReflow);
    watchComponent('afro-footer', repairFooterReflow);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
