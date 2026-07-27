(function () {
  'use strict';
  var allowed = [
    'creator-captions', 'creator-invoice', 'creator-kit',
    'creator-money', 'creator-page', 'wedding-photo-package'
  ];
  var match = window.location.pathname.match(/^\/tools\/([^/]+)\/?$/);
  if (!match || allowed.indexOf(match[1]) === -1) return;
  var style = document.createElement('style');
  style.textContent =
    'html,body{max-width:100%;overflow-x:clip}' +
    '@media(max-width:640px){' +
    '.landing-container,.landing-section-inner,.landing-hero-text,.landing-breadcrumb,.landing-badges,' +
    '.df-upgrade__card,.ccr-compare,.ccr-compare-card{box-sizing:border-box;min-width:0;max-width:100%;width:auto}' +
    '.ccr-compare,[style*="grid-template-columns:1fr 1fr"]{grid-template-columns:minmax(0,1fr)!important}' +
    '.ccr-compare-card,[style*="grid-template-columns:1fr 1fr"]>*{min-width:0;overflow-wrap:anywhere}' +
    '.ci-preview-table{display:block;max-width:100%;overflow-x:auto}' +
    '.addon-item{flex-wrap:wrap;gap:6px}.addon-label{min-width:0;overflow-wrap:anywhere}' +
    '.addon-price{margin-left:auto;overflow-wrap:anywhere}' +
    '}';
  document.head.appendChild(style);
}());
