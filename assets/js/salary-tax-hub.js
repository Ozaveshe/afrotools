/**
 * AFROTOOLS — Salary & Tax Hub Sub-Page Engine
 * Reads window.HUB_CONFIG defined per page, filters AFRO_TOOLS, renders cards + search.
 * Supports: paginated "load more", country chip quick-filters.
 */
(function () {
  'use strict';

  var PAGE_SIZE = 12;

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initHub() {
    var cfg = window.HUB_CONFIG;
    if (!cfg) return;

    var idSet = new Set(cfg.toolIds || []);
    var STATUS_ORDER = { live: 0, new: 1 };
    var all = (window.AFRO_TOOLS || []).filter(function (t) {
      return t.category === 'financial' && idSet.has(t.id);
    }).sort(function (a, b) {
      return (STATUS_ORDER[a.status] != null ? STATUS_ORDER[a.status] : 2)
           - (STATUS_ORDER[b.status] != null ? STATUS_ORDER[b.status] : 2);
    });

    var grid    = document.getElementById('tool-grid');
    var countEl = document.getElementById('tool-count');

    function badge(status) {
      if (status === 'new')  return '<span class="htc-badge badge-new">New</span>';
      if (status === 'live') return '<span class="htc-badge badge-live">Live</span>';
      return '<span class="htc-badge badge-soon">Soon</span>';
    }

    function card(t, idx, animate) {
      var live = t.status === 'live' || t.status === 'new';
      var webp = '/assets/img/tools/' + t.id + '.webp';
      var svg  = '/assets/img/tools/' + t.id + '.svg';
      var cls  = 'htc' + (live ? '' : ' htc--coming') + (animate ? ' htc-animate' : '');
      var styleAttr = animate ? ' style="animation-delay:' + (Math.min(idx, 11) * 0.035).toFixed(3) + 's"' : '';
      var imgHtml = '<div class="htc-img" aria-hidden="true">'
        + '<img src="' + esc(webp) + '" alt="" loading="lazy" decoding="async"'
        + ' onerror="this.src=\'' + esc(svg) + '\';this.onerror=function(){this.style.display=\'none\';};">'
        + '<span class="htc-img-ph">' + esc(t.icon || '🔧') + '</span>'
        + '<div class="htc-img-chips">'
        + '<span class="htc-flag" aria-hidden="true">' + esc(t.icon || '') + '</span>'
        + badge(t.status)
        + '</div>'
        + '</div>';
      var body = '<div class="htc-body">'
        + '<div class="htc-name">' + esc(t.name) + '</div>'
        + '<div class="htc-desc">' + esc(t.desc || '') + '</div>'
        + '</div>'
        + '<div class="htc-foot">'
        + '<span class="htc-cta">' + (live ? 'Calculate' : 'Coming soon')
        + (live ? '<svg class="htc-arrow" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>' : '')
        + '</span>'
        + '</div>';
      if (live) {
        return '<a href="' + esc(t.href || '#') + '" class="' + cls + '"' + styleAttr + '>'
          + imgHtml + body + '</a>';
      }
      return '<div class="' + cls + '"' + styleAttr + ' role="article" aria-label="' + esc(t.name) + ' — coming soon">'
        + imgHtml + body + '</div>';
    }

    function removeLoadMore() {
      var el = grid && grid.querySelector('.shub-load-more-wrap');
      if (el) el.remove();
    }

    function addLoadMore(tools, offset) {
      var remaining = tools.length - offset;
      if (remaining <= 0) return;
      var next = Math.min(remaining, PAGE_SIZE);
      var wrap = document.createElement('div');
      wrap.className = 'shub-load-more-wrap';
      wrap.innerHTML = '<button class="shub-load-more" type="button">'
        + 'Show ' + next + ' more'
        + '<span class="shub-lm-rest"> \u2014 ' + remaining + ' remaining</span>'
        + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>'
        + '</button>';
      grid.appendChild(wrap);
      wrap.querySelector('.shub-load-more').addEventListener('click', function () {
        wrap.remove();
        var newCards = tools.slice(offset, offset + PAGE_SIZE).map(card).join('');
        grid.insertAdjacentHTML('beforeend', newCards);
        addLoadMore(tools, offset + PAGE_SIZE);
      });
    }

    function render(tools, paginate) {
      if (!grid) return;
      removeLoadMore();
      if (countEl) countEl.textContent = tools.length + (tools.length === 1 ? ' tool' : ' tools');
      if (!tools.length) {
        grid.innerHTML = '<div class="shub-empty">'
          + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
          + '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
          + '<p>No tools found \u2014 try a different search term.</p>'
          + '</div>';
        return;
      }
      var show = paginate ? tools.slice(0, PAGE_SIZE) : tools;
      grid.innerHTML = show.map(function (t, i) { return card(t, i, paginate); }).join('');
      if (paginate && tools.length > PAGE_SIZE) {
        addLoadMore(tools, PAGE_SIZE);
      }
    }

    /* Initial render — paginated */
    render(all, true);

    /* Search */
    var inp = document.getElementById('hub-search');
    var clearBtn = null;
    if (inp) {
      /* Inject clear (×) button */
      var searchWrap = inp.closest('.shub-hero-search');
      if (searchWrap) {
        clearBtn = document.createElement('button');
        clearBtn.className = 'shub-search-clear';
        clearBtn.type = 'button';
        clearBtn.setAttribute('aria-label', 'Clear search');
        clearBtn.innerHTML = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        searchWrap.appendChild(clearBtn);
        clearBtn.addEventListener('click', function () {
          inp.value = '';
          inp.dispatchEvent(new Event('input'));
          inp.focus();
        });
      }

      inp.addEventListener('input', function () {
        var q = this.value.trim().toLowerCase();
        if (clearBtn) clearBtn.classList.toggle('visible', !!this.value.trim());
        /* Deactivate chips if user is typing freely */
        var matched = false;
        document.querySelectorAll('.shub-country-chip').forEach(function (c) {
          if ((c.getAttribute('data-search') || '').toLowerCase() === q) matched = true;
        });
        if (!matched) {
          document.querySelectorAll('.shub-country-chip').forEach(function (c) { c.classList.remove('active'); });
        }
        if (!q) { render(all, true); return; }
        render(all.filter(function (t) {
          return (t.name || '').toLowerCase().includes(q)
            || (t.desc || '').toLowerCase().includes(q)
            || (Array.isArray(t.countries) ? t.countries.join(' ').toLowerCase().includes(q) : false);
        }), false); /* show all search results — no pagination */
      });
    }

    /* Country quick-filter chips */
    document.querySelectorAll('.shub-country-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var wasActive = this.classList.contains('active');
        document.querySelectorAll('.shub-country-chip').forEach(function (c) { c.classList.remove('active'); });
        if (wasActive) {
          /* Toggle off — clear search */
          if (inp) { inp.value = ''; inp.dispatchEvent(new Event('input')); }
        } else {
          this.classList.add('active');
          var q = this.getAttribute('data-search') || '';
          if (inp) { inp.value = q; inp.dispatchEvent(new Event('input')); }
        }
      });
    });
  }

  if (typeof onRegistryReady === 'function') {
    onRegistryReady(initHub);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof AFRO_TOOLS !== 'undefined') {
        initHub();
      } else {
        document.addEventListener('afrotools:registry-ready', initHub);
      }
    });
  }
})();
