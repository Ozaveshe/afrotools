/**
 * AfroTools — Embeddable Commodity Price Widget
 *
 * Usage:
 *   <script src="https://afrotools.com/assets/js/embed/commodity-widget.js"
 *           data-commodities="gold,crude_oil,cocoa,coffee_arabica"
 *           data-theme="light"></script>
 */

(function() {
  'use strict';

  var API_URL = 'https://afrotools.com/api/v1/commodities';
  var SITE_URL = 'https://afrotools.com';

  var script = document.currentScript;
  if (!script) return;

  var ids = (script.getAttribute('data-commodities') || 'gold,crude_oil,cocoa,coffee_arabica').split(',');
  var theme = script.getAttribute('data-theme') || 'light';

  var isDark = theme === 'dark';
  var bg = isDark ? '#0a1628' : '#ffffff';
  var text = isDark ? '#e2e8f0' : '#0f172a';
  var muted = isDark ? '#94a3b8' : '#64748b';
  var border = isDark ? '#1e293b' : '#e2e8f0';
  var green = '#34C759';
  var red = '#FF3B30';

  var container = document.createElement('div');
  container.className = 'afro-commodity-widget';
  container.style.cssText = [
    'font-family:-apple-system,system-ui,sans-serif',
    'background:' + bg, 'color:' + text,
    'border:1px solid ' + border, 'border-radius:12px',
    'padding:16px', 'max-width:400px', 'font-size:14px',
    'box-shadow:0 1px 3px rgba(0,0,0,.08)',
  ].join(';');

  container.innerHTML =
    '<div style="font-weight:700;font-size:13px;margin-bottom:12px;display:flex;justify-content:space-between">' +
      '<span>African Commodity Prices</span>' +
      '<span style="font-size:10px;color:' + muted + '" id="afro-com-ts">Loading...</span>' +
    '</div>' +
    '<div id="afro-com-body" style="display:flex;flex-direction:column;gap:6px">' +
      '<div style="text-align:center;padding:12px;color:' + muted + '">Loading...</div>' +
    '</div>' +
    '<div style="margin-top:10px;text-align:center;font-size:10px">' +
      '<a href="' + SITE_URL + '/tools/commodity-tracker/" target="_blank" rel="noopener" ' +
        'style="color:#007AFF;text-decoration:none;font-weight:600">' +
        'Powered by AfroTools' +
      '</a>' +
    '</div>';

  script.parentNode.insertBefore(container, script.nextSibling);

  fetch(API_URL)
    .then(function(res) { return res.ok ? res.json() : null; })
    .then(function(data) {
      if (!data || !data.commodities) {
        document.getElementById('afro-com-body').innerHTML =
          '<div style="text-align:center;padding:12px;color:' + muted + '">Data unavailable</div>';
        return;
      }

      var idSet = {};
      ids.forEach(function(id) { idSet[id.trim()] = true; });

      var items = data.commodities.filter(function(c) { return idSet[c.id]; });
      if (!items.length) items = data.commodities.slice(0, 6);

      document.getElementById('afro-com-body').innerHTML = items.map(function(c) {
        var priceStr = c.price >= 1000 ? '$' + c.price.toLocaleString() : '$' + c.price.toFixed(2);
        return '<div style="display:flex;justify-content:space-between;align-items:center;' +
          'padding:8px 10px;background:' + (isDark ? '#1e293b' : '#f8fafc') + ';border-radius:8px">' +
          '<div style="font-size:12px;font-weight:600;color:' + text + '">' + c.name + '</div>' +
          '<div style="font-weight:700;font-size:14px;color:' + text + '">' + priceStr +
            '<span style="font-size:10px;color:' + muted + ';margin-left:4px">/' + c.unit + '</span>' +
          '</div></div>';
      }).join('');

      if (data.timestamp) {
        document.getElementById('afro-com-ts').textContent = new Date(data.timestamp).toLocaleDateString();
      }
    })
    .catch(function() {
      document.getElementById('afro-com-body').innerHTML =
        '<div style="text-align:center;padding:12px;color:' + muted + '">Could not load prices</div>';
    });
})();
