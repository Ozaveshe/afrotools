(function () {
  'use strict';

  var article = document.querySelector('.article-body, main article, article');
  if (!article) return;

  function slugify(value) {
    return String(value || '').toLowerCase().normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'section';
  }

  function ensureTableOfContents() {
    var headings = Array.prototype.slice.call(article.querySelectorAll('h2'));
    if (headings.length < 3) return;
    var used = {};
    headings.forEach(function (heading) {
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
      var start = article.getBoundingClientRect().top + window.scrollY;
      var end = start + article.offsetHeight - window.innerHeight;
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
    var note = document.createElement('span');
    note.textContent = 'Useful guide? Keep the link for later.';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'article-copy-link';
    button.textContent = 'Copy article link';
    var status = document.createElement('span');
    status.className = 'article-copy-status';
    status.setAttribute('aria-live', 'polite');
    button.addEventListener('click', function () {
      copyText(window.location.href.split('#')[0]).then(function () {
        status.textContent = 'Link copied.';
        button.textContent = 'Copied';
        window.setTimeout(function () {
          status.textContent = '';
          button.textContent = 'Copy article link';
        }, 1800);
      }).catch(function () {
        status.textContent = 'Copy failed. Select the address from your browser.';
      });
    });
    bar.appendChild(note);
    bar.appendChild(button);
    bar.appendChild(status);
    layout.insertBefore(bar, article);
  }

  ensureTableOfContents();
  ensureArticleActions();
  ensureProgress();
})();
