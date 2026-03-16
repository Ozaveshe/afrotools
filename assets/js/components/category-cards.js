/**
 * AfroTools Category Card Component
 * Shared card rendering for all category pages (salary-tax, education, health, etc.)
 * Renders homepage-style cards with image thumbnails.
 */
(function() {
  'use strict';

  // Country code → gradient background for card thumbnails
  var COUNTRY_BG = {
    NG:'linear-gradient(135deg,#0047AB 0%,#007AFF 50%,#4DA3FF 100%)',
    KE:'linear-gradient(135deg,#B30000 0%,#0047AB 60%,#B30000 100%)',
    GH:'linear-gradient(135deg,#C8102E 0%,#FCD116 50%,#004EA8 100%)',
    ZA:'linear-gradient(135deg,#0063D1 0%,#001489 40%,#E03C31 100%)',
    EG:'linear-gradient(135deg,#CE1126 0%,#C09300 50%,#000000 100%)',
    TZ:'linear-gradient(135deg,#2563EB 0%,#FCD116 40%,#00A3DD 100%)',
    RW:'linear-gradient(135deg,#0063D1 0%,#FAD201 40%,#00A1DE 100%)',
    MA:'linear-gradient(135deg,#C1272D 0%,#0063D1 100%)',
    ALL:'linear-gradient(135deg,var(--color-primary) 0%,#005BBF 100%)'
  };
  var DEFAULT_BG = 'linear-gradient(145deg,#0a1929 0%,#0d2b5e 60%,#0a1929 100%)';

  // Inject card CSS if not already present
  if (!document.getElementById('afro-tc-css')) {
    var style = document.createElement('style');
    style.id = 'afro-tc-css';
    style.textContent = [
      '.tc{background:#fff;border:1.5px solid #E5E7EB;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;transition:border-color .2s,box-shadow .2s,transform .2s;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,.06);position:relative;text-decoration:none;color:inherit}',
      '.tc:hover{border-color:var(--color-primary);box-shadow:0 16px 48px rgba(0,122,255,.18),0 2px 8px rgba(0,0,0,.06);transform:translateY(-6px) scale(1.01)}',
      '.tc-thumb{aspect-ratio:3/2;overflow:hidden;flex-shrink:0;position:relative;display:flex;align-items:center;justify-content:center}',
      '.tc-thumb-ph{font-size:4.5rem;opacity:.14;position:absolute;inset:0;display:flex;align-items:center;justify-content:center;user-select:none;pointer-events:none}',
      '.tc-thumb img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0;z-index:1}',
      '.tc-body{padding:13px 15px 15px;display:flex;flex-direction:column;flex:1}',
      '.tc-row1{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:5px}',
      '.tc-flag{font-size:1.35rem;line-height:1;flex-shrink:0}',
      '.tc-badge{font-size:.58rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:3px 7px;border-radius:4px;white-space:nowrap;margin-top:2px}',
      '.badge-live{background:#DBEAFE;color:#1a4fa0;border:1px solid #93C5FD}',
      '.badge-soon{background:#F3F4F6;color:#9CA3AF;border:1px solid #E5E7EB}',
      '.badge-new{background:#FEF2F2;color:#991B1B;border:1px solid #FECACA}',
      '.tc-name{font-size:.95rem;font-weight:800;color:var(--color-text);letter-spacing:-.02em;line-height:1.2;margin-bottom:6px}',
      '.tc-desc{font-size:.78rem;color:#4b5563;line-height:1.6;flex:1;margin-bottom:11px}',
      '.tc-foot{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #F3F4F6;padding-top:9px}',
      '.tc-tags{font-size:.62rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#9CA3AF}',
      '.tc-cta{font-size:.73rem;font-weight:700;color:var(--color-primary)}',
      '.tc:hover .tc-cta{text-decoration:underline}',
      '.tc.coming{opacity:.6;pointer-events:none}'
    ].join('\n');
    document.head.appendChild(style);
  }

  /**
   * Render a single tool card in homepage style
   * @param {Object} t - Tool object from AFRO_TOOLS
   * @param {boolean} ok - Whether the tool is live
   * @returns {string} HTML string
   */
  function afroCard(t, ok) {
    var cc = (t.countries && t.countries[0]) || 'ALL';
    var bg = COUNTRY_BG[cc] || DEFAULT_BG;
    var imgSrc = '/assets/img/tools/' + t.id + '.webp';
    var imgFb = '/assets/img/tool-icons/' + t.id + '.png';
    var badgeClass = t.status === 'new' ? 'badge-new' : (ok ? 'badge-live' : 'badge-soon');
    var badgeText = t.status === 'new' ? 'New' : (ok ? 'Live' : 'Coming Soon');
    var tag = ok ? 'a' : 'div';
    var href = ok ? ' href="' + t.href + '"' : '';
    return '<' + tag + href + ' class="tc' + (ok ? '' : ' coming') + '">'
      + '<div class="tc-thumb" style="background:' + bg + '">'
      + '<div class="tc-thumb-ph">' + t.icon + '</div>'
      + '<img src="' + imgSrc + '" alt="' + t.name + '" loading="lazy" onerror="this.onerror=function(){this.style.display=\'none\'};this.src=\'' + imgFb + '\';">'
      + '</div>'
      + '<div class="tc-body">'
      + '<div class="tc-row1"><span class="tc-flag">' + t.icon + '</span><span class="tc-badge ' + badgeClass + '">' + badgeText + '</span></div>'
      + '<div class="tc-name">' + t.name + '</div>'
      + '<div class="tc-desc">' + t.desc + '</div>'
      + '<div class="tc-foot"><span class="tc-tags">' + (cc !== 'ALL' ? cc : 'TOOL') + '</span><span class="tc-cta">Open →</span></div>'
      + '</div></' + tag + '>';
  }

  window.afroCard = afroCard;
})();
