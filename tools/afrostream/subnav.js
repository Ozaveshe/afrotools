(function () {
  'use strict';

  function normalizedPath() {
    return window.location.pathname.replace(/\/+$/, '/');
  }

  function activeKey() {
    var path = normalizedPath();
    var params = new URLSearchParams(window.location.search);

    if (path.indexOf('/tools/afrostream/university') !== -1) return 'university';
    if (path.indexOf('/tools/afrostream/submit') !== -1) return 'submit';
    if (path.indexOf('/tools/afrostream/calendar') !== -1) return 'calendar';
    if (path.indexOf('/tools/afrostream/news') !== -1 || path.indexOf('/tools/afrostream/article') !== -1) return 'news';
    if (path.indexOf('/tools/afrostream/creator') !== -1) return 'rankings';
    if (path.indexOf('/tools/afrostream/rankings') !== -1) {
      return params.get('mode') === 'streamers' ? 'streamers' : 'rankings';
    }
    return 'live';
  }

  function refresh() {
    var key = activeKey();
    document.querySelectorAll('.as-subnav-links a[data-as-nav], .su-subnav-links a[data-as-nav]').forEach(function (link) {
      var isActive = link.getAttribute('data-as-nav') === key;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh);
  } else {
    refresh();
  }

  window.AfroStreamSubnav = {
    refresh: refresh
  };
})();
