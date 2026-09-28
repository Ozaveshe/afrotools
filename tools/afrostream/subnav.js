(function () {
  'use strict';
  var local = /^(localhost|127\.0\.0\.1|\[?::1\]?)$/i.test(location.hostname) || location.protocol === 'file:';
  var aliases = {rankings:'rankings.html',news:'news.html',calendar:'calendar.html',submit:'submit.html',creator:'creator.html',article:'article.html',community:'community.html'};
  function refresh() {
    if (local) document.querySelectorAll('a[href^="/tools/afrostream/"]').forEach(function (link) {
      var url = new URL(link.getAttribute('href'),location.href), base = url.pathname.replace('/tools/afrostream/','');
      if (aliases[base]) link.setAttribute('href','/tools/afrostream/' + aliases[base] + url.search + url.hash);
    });
    var pathname = location.pathname, active = 'live';
    if (pathname.includes('/university')) active = 'university';
    else if (pathname.includes('/directory')) active = 'directory';
    else if (/\/(methodology|afroscore)/.test(pathname)) active = 'methodology';
    else if (/\/(submit|community)/.test(pathname)) active = 'submit';
    else if (pathname.includes('/calendar')) active = 'calendar';
    else if (/\/(news|article|editorial)/.test(pathname)) active = 'news';
    else if (pathname.includes('/rankings')) active = new URLSearchParams(location.search).get('mode') === 'streamers' ? 'streamers' : 'rankings';
    else if (pathname.includes('/creator')) active = 'rankings';
    else if (document.body.classList.contains('as-editorial') && location.hash !== '#live') active = 'news';
    document.querySelectorAll('.as-subnav-links a[data-as-nav],.su-subnav-links a[data-as-nav]').forEach(function (link) {
      var current = link.dataset.asNav === active;
      link.classList.toggle('active',current);
      if (current) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
    });
  }
  document.addEventListener('click',function (event) {
    var menu = document.querySelector('.scene-nav-more');
    if (menu && !menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener('keydown',function (event) {
    var menu = document.querySelector('.scene-nav-more');
    if (event.key === 'Escape' && menu && menu.open) { menu.open = false; menu.querySelector('summary').focus(); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',refresh); else refresh();
  window.addEventListener('hashchange',refresh);
  window.AfroStreamSubnav = {refresh:refresh};
})();
