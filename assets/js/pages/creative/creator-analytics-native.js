(function () {
  'use strict';

  var root = document.querySelector('[data-creator-analytics-app]');
  if (!root) return;
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.creatorAnalytics;
  if (!engine) return;
  var language = document.documentElement.lang.toLowerCase();
  var fr = language.indexOf('fr') === 0;
  var sw = language.indexOf('sw') === 0;
  var locale = fr ? 'fr-FR' : (sw ? 'sw' : 'en');
  var storageKey = 'afrotools.creatorAnalytics.local.v2';
  var posts = [];
  var copyOperation = 0;
  window.addEventListener("pagehide", function () { copyOperation += 1; });
  var summary = engine.summarize(posts);
  var text = fr ? {
    invalid: 'Ajoutez une date et une portée supérieure à zéro. Vérifiez aussi les métriques.',
    added: 'Publication ajoutée localement.',
    deleted: 'Publication supprimée.',
    cleared: 'Données locales effacées.',
    copied: 'Synthèse copiée.',
    downloaded: 'Export téléchargé.',
    empty: 'Ajoutez une publication pour commencer.',
    remove: 'Supprimer'
  } : sw ? {
    invalid: 'Weka tarehe na reach iliyo zaidi ya sifuri. Hakiki pia vipimo vingine.',
    added: 'Chapisho limeongezwa kwenye kifaa hiki.',
    deleted: 'Chapisho limeondolewa.',
    cleared: 'Data ya kifaa hiki imefutwa.',
    copied: 'Muhtasari umenakiliwa.',
    downloaded: 'Faili imepakuliwa.',
    empty: 'Ongeza chapisho ili kuanza.',
    remove: 'Ondoa'
  } : {
    invalid: 'Add a date and reach above zero. Also check the metrics.',
    added: 'Post added locally.',
    deleted: 'Post removed.',
    cleared: 'Local data cleared.',
    copied: 'Summary copied.',
    downloaded: 'Export downloaded.',
    empty: 'Add a post to get started.',
    remove: 'Remove'
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function num(id) {
    return Number(byId(id).value || 0);
  }

  function collect() {
    return {
      date: byId('caDate').value,
      platform: byId('caPlatform').value,
      format: byId('caFormat').value,
      label: byId('caLabel').value,
      impressions: num('caImpressions'),
      reach: num('caReach'),
      likes: num('caLikes'),
      comments: num('caComments'),
      shares: num('caShares'),
      saves: num('caSaves'),
      followers: num('caFollowers')
    };
  }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(posts)); return true; }
    catch (_) { return false; }
  }

  function storageWarning(clearing) {
    if (clearing) return fr ? 'Session effacée, mais les données enregistrées n’ont pas pu être supprimées. Elles peuvent réapparaître au rechargement.' : sw ? 'Kipindi kimefutwa, lakini data iliyohifadhiwa haikuweza kuondolewa. Inaweza kurudi ukurasa ukipakiwa upya.' : 'Session cleared, but saved data could not be removed. It may return when you reload.';
    return fr ? 'Modifications conservées pour cette session uniquement. Téléchargez JSON avant de quitter ; l’enregistrement local a échoué.' : sw ? 'Mabadiliko yapo katika kipindi hiki pekee. Pakua JSON kabla ya kuondoka; kuhifadhi kwenye kifaa kumeshindikana.' : 'Changes are kept for this session only. Download JSON before leaving; local saving failed.';
  }

  function load() {
    try {
      var stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      posts = Array.isArray(stored) ? stored.map(engine.normalizePost) : [];
    } catch (_) {
      posts = [];
    }
  }

  function setStatus(message, error) {
    byId('caError').textContent = error ? message : '';
    byId('caStatus').textContent = error ? '' : message;
  }

  function render() {
    copyOperation += 1;
    summary = engine.summarize(posts);
    window.__creatorAnalyticsSummary = summary;
    byId('caPosts').textContent = String(summary.totalPosts);
    byId('caReachTotal').textContent = summary.totalReach.toLocaleString(locale);
    byId('caEngagement').textContent = summary.engagementRate.toFixed(2) + '%';
    byId('caFollowersTotal').textContent = summary.followersGained.toLocaleString(locale);
    byId('caBestPlatform').textContent = summary.bestPlatform ? summary.bestPlatform.name : '—';
    byId('caBestFormat').textContent = summary.bestFormat ? summary.bestFormat.name : '—';
    byId('caBrief').textContent = engine.brief(summary, locale);
    byId('caTableBody').innerHTML = posts.length ? posts.slice().reverse().map(function (post) {
      return '<tr><td>' + escapeHtml(post.date) + '</td><td>' + escapeHtml(post.platform) + '</td><td>' + escapeHtml(post.format) + '</td><td>' + post.reach.toLocaleString(locale) + '</td><td>' + post.engagementRate.toFixed(2) + '%</td><td><button class="cb-btn cb-btn-danger" type="button" data-remove-post="' + escapeHtml(post.id) + '">' + text.remove + '</button></td></tr>';
    }).join('') : '<tr><td colspan="6" class="cb-empty">' + text.empty + '</td></tr>';
    root.querySelectorAll('[data-needs-posts]').forEach(function (button) {
      button.disabled = !posts.length;
    });
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  root.querySelector('form').addEventListener('submit', function (event) {
    event.preventDefault();
    var checked = engine.validatePost(collect());
    if (!checked.valid) return setStatus(text.invalid, true);
    posts.push(checked.post);
    var saved = save();
    render();
    setStatus(saved ? text.added : storageWarning(false), !saved);
  });

  byId('caTableBody').addEventListener('click', function (event) {
    var button = event.target.closest('[data-remove-post]');
    if (!button) return;
    var removedIndex = Array.prototype.indexOf.call(byId('caTableBody').querySelectorAll('[data-remove-post]'), button);
    posts = posts.filter(function (post) { return post.id !== button.dataset.removePost; });
    var saved = save();
    render();
    setStatus(saved ? text.deleted : storageWarning(!posts.length), !saved);
    var remaining = byId('caTableBody').querySelectorAll('[data-remove-post]');
    var nextControl = remaining[Math.min(removedIndex, remaining.length - 1)] || byId('caLabel');
    nextControl.focus();
  });

  byId('caClear').addEventListener('click', function () {
    posts = [];
    var cleared = true;
    try { localStorage.removeItem(storageKey); } catch (_) { cleared = false; }
    render();
    setStatus(cleared ? text.cleared : storageWarning(true), !cleared);
  });

  byId('caCopy').addEventListener('click', async function () {
    if (!posts.length) return;
    var operation = ++copyOperation;
    var capturedSummary = summary;
    var brief = engine.brief(capturedSummary, locale);
    function current() { return operation === copyOperation && summary === capturedSummary; }
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(brief);
      if (current()) setStatus(text.copied, false);
    } catch (_) {
      if (!current()) return;
      try {
        download(new Blob([brief], { type: 'text/plain;charset=utf-8' }), 'creator-analytics-summary.txt');
        setStatus(fr ? 'Copie indisponible. Synthèse téléchargée en TXT.' : sw ? 'Kunakili hakupatikani. Muhtasari umepakuliwa kama TXT.' : 'Copy unavailable. Summary downloaded as TXT.', false);
      } catch (_) {
        setStatus(fr ? 'Impossible de copier ou de télécharger la synthèse. Réessayez.' : sw ? 'Imeshindikana kunakili au kupakua muhtasari. Jaribu tena.' : 'Unable to copy or download the summary. Try again.', true);
      }
    }
  });

  byId('caCsv').addEventListener('click', function () {
    copyOperation += 1;
    download(new Blob([engine.toCsv(posts)], { type: 'text/csv;charset=utf-8' }), 'creator-analytics.csv');
    setStatus(text.downloaded, false);
  });

  byId('caJson').addEventListener('click', function () {
    copyOperation += 1;
    download(new Blob([JSON.stringify({ posts: posts, summary: summary }, null, 2)], { type: 'application/json;charset=utf-8' }), 'creator-analytics.json');
    setStatus(text.downloaded, false);
  });

  function escapeHtml(valueToEscape) {
    var node = document.createElement('div');
    node.textContent = valueToEscape == null ? '' : String(valueToEscape);
    return node.innerHTML;
  }

  if (!byId('caDate').value) byId('caDate').value = new Date().toISOString().slice(0, 10);
  load();
  render();
})();
