(function () {
  'use strict';

  // Prefer the reading column; querySelector on a selector list otherwise
  // returns the outer article first and puts generated controls beside it.
  var article = document.querySelector('.article-body') || document.querySelector('main article, article');
  if (!article) return;
  var readingRegion = article.closest('.article-layout') || article;

  function slugify(value) {
    return String(value || '').toLowerCase().normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'section';
  }

  function ensureTableOfContents() {
    var headings = Array.prototype.slice.call(article.querySelectorAll('h2'));
    if (headings.length < 3) return;
    var used = {};
    // Preserve existing fragment targets for FAQs and recommendations too,
    // while keeping the contents list focused on the guide itself.
    Array.prototype.slice.call(readingRegion.querySelectorAll('h2')).forEach(function (heading) {
      var base = heading.id || slugify(heading.textContent);
      var id = base;
      var suffix = 2;
      while (used[id] || (document.getElementById(id) && document.getElementById(id) !== heading)) {
        id = base + '-' + suffix++;
      }
      used[id] = true;
      heading.id = id;
    });
    if (document.querySelector('.article-toc')) return;

    var nav = document.createElement('nav');
    nav.className = 'article-toc article-toc--generated';
    nav.setAttribute('aria-label', 'Table of contents');
    var title = document.createElement('div');
    title.className = 'article-toc-title';
    title.textContent = 'In this article';
    nav.appendChild(title);
    var list = document.createElement('ol');
    headings.forEach(function (heading) {
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = '#' + heading.id;
      link.textContent = heading.textContent.trim();
      item.appendChild(link);
      list.appendChild(item);
    });
    nav.appendChild(list);
    article.parentNode.insertBefore(nav, article);
  }

  function ensureProgress() {
    var progress = document.getElementById('readingProgress');
    if (!progress) {
      progress = document.createElement('div');
      progress.id = 'readingProgress';
      progress.className = 'reading-progress';
      document.body.insertBefore(progress, document.body.firstChild);
    }
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-label', 'Article reading progress');
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '100');
    var queued = false;
    function update() {
      queued = false;
      var start = readingRegion.getBoundingClientRect().top + window.scrollY;
      var end = start + readingRegion.offsetHeight - window.innerHeight;
      var percent = end <= start ? 100 : ((window.scrollY - start) / (end - start)) * 100;
      var bounded = Math.max(0, Math.min(100, percent));
      progress.style.width = bounded + '%';
      progress.setAttribute('aria-valuenow', String(Math.round(bounded)));
    }
    function queueUpdate() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate);
    queueUpdate();
  }

  function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(value);
    var input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
    return Promise.resolve();
  }

  function ensureArticleActions() {
    var layout = article.parentNode;
    if (!layout || layout.querySelector('.article-utility-bar')) return;
    var bar = document.createElement('div');
    bar.className = 'article-utility-bar';
    bar.setAttribute('aria-label', 'Article actions');
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'article-copy-link';
    button.setAttribute('aria-label', 'Copy article link');
    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    var label = document.createElement('span');
    label.textContent = 'Copy link';
    button.appendChild(label);
    var status = document.createElement('span');
    status.className = 'article-copy-status';
    status.setAttribute('aria-live', 'polite');
    button.addEventListener('click', function () {
      copyText(window.location.href.split('#')[0]).then(function () {
        status.textContent = 'Link copied.';
        label.textContent = 'Copied';
        window.setTimeout(function () {
          status.textContent = '';
          label.textContent = 'Copy link';
        }, 1800);
      }).catch(function () {
        status.textContent = 'Copy failed. Select the address from your browser.';
      });
    });
    bar.appendChild(status);
    bar.appendChild(button);
    layout.insertBefore(bar, article);
  }

  ensureTableOfContents();
  ensureArticleActions();
  ensureProgress();
})();
