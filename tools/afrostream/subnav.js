(function () {
  'use strict';
  var primary = [
    ['news', 'The Scene', '/tools/afrostream/news'],
    ['live', 'Live', '/tools/afrostream/#live'],
    ['directory', 'Creators', '/tools/afrostream/directory/'],
    ['university', 'Playbook', '/tools/afrostream/university/']
  ];
  var secondary = [
    ['rankings', 'Creator rankings', '/tools/afrostream/rankings'],
    ['streamers', 'Streamer rankings', '/tools/afrostream/rankings?mode=streamers&amp;period=month'],
    ['calendar', "What's on", '/tools/afrostream/calendar'],
    ['methodology', 'Ranking methodology', '/tools/afrostream/methodology/'],
    ['editorial', 'Editorial policy', '/tools/afrostream/editorial/'],
    ['submit', 'Submit a tip', '/tools/afrostream/community']
  ];
  function links(items) {
    return items.map(function(item) { return '<a href="' + item[2] + '" data-as-nav="' + item[0] + '">' + item[1] + '</a>'; }).join('');
  }
  function renderSubnav() {
    return '<nav class="as-subnav as-unified-nav" aria-label="AfroStream navigation"><div class="as-subnav-inner"><a class="as-subnav-logo" href="/tools/afrostream/">AfroStream</a><div class="as-subnav-links">' + links(primary) + '</div><details class="scene-nav-more"><summary>More</summary><div class="scene-nav-menu">' + links(secondary) + '</div></details></div></nav>';
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { renderSubnav: renderSubnav }; return; }
  function unifyNavigation() {
    document.querySelectorAll('.as-subnav,.su-subnav').forEach(function(nav) {
      if (nav.dataset.asUnified) return;
      var inner = nav.querySelector('.as-subnav-inner,.su-subnav-inner');
      var primaryLinks = nav.querySelector('.as-subnav-links,.su-subnav-links');
      if (!inner || !primaryLinks) return;
      primaryLinks.innerHTML = links(primary);
      var more = nav.querySelector('.scene-nav-more');
      if (!more) { more = document.createElement('details'); more.className = 'scene-nav-more'; inner.appendChild(more); }
      more.innerHTML = '<summary>More</summary><div class="scene-nav-menu">' + links(secondary) + '</div>';
      nav.querySelectorAll('.as-subnav-actions,.su-subnav-actions').forEach(function(actions) { actions.hidden = true; });
      nav.classList.add('as-unified-nav');
      nav.setAttribute('aria-label', 'AfroStream navigation');
      nav.dataset.asUnified = 'true';
    });
  }
  var local = /^(localhost|127\.0\.0\.1|\[?::1\]?)$/i.test(location.hostname) || location.protocol === 'file:';
  var aliases = {rankings:'rankings.html',news:'news.html',calendar:'calendar.html',submit:'submit.html',creator:'creator.html',article:'article.html',community:'community.html'};
  function refresh() {
    unifyNavigation();
    if (local) document.querySelectorAll('.as-subnav a[href^="/tools/afrostream/"],.su-subnav a[href^="/tools/afrostream/"]').forEach(function (link) {
      var url = new URL(link.getAttribute('href'),location.href), base = url.pathname.replace('/tools/afrostream/','');
      if (aliases[base]) link.setAttribute('href','/tools/afrostream/' + aliases[base] + url.search + url.hash);
    });
    var pathname = location.pathname, active = 'live';
    if (pathname.includes('/university')) active = 'university';
    else if (pathname.includes('/directory')) active = 'directory';
    else if (/\/(methodology|afroscore)/.test(pathname)) active = 'methodology';
    else if (/\/(submit|community)/.test(pathname)) active = 'submit';
    else if (pathname.includes('/calendar')) active = 'calendar';
    else if (pathname.includes('/editorial')) active = 'editorial';
    else if (/\/(news|article)/.test(pathname)) active = 'news';
    else if (pathname.includes('/rankings')) active = new URLSearchParams(location.search).get('mode') === 'streamers' ? 'streamers' : 'rankings';
    else if (pathname.includes('/creator')) active = 'directory';
    else if (document.body.classList.contains('as-editorial') && location.hash !== '#live') active = 'news';
    document.querySelectorAll('.as-subnav a[data-as-nav],.su-subnav a[data-as-nav]').forEach(function (link) {
      var current = link.dataset.asNav === active;
      link.classList.toggle('active',current);
      if (current) {
        var target = new URL(link.href);
        link.setAttribute('aria-current', target.pathname === location.pathname && target.search === location.search && target.hash === location.hash ? 'page' : 'location');
      } else link.removeAttribute('aria-current');
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
