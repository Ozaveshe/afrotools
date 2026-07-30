!function() {
  "use strict";

  var E = window.AfroTools && window.AfroTools.CaptionCraftEngine;
  if (!E) { console.error('CaptionCraft engine not loaded'); return; }

  var API = '/.netlify/functions/creator-captions';
  var AUTH_KEY = 'sb-zpclagtgczsygrgztlts-auth-token';
  var HISTORY_KEY = 'ccr-history';
  var FAV_KEY = 'ccr-favorites';
  var TODAY_KEY = 'ccr-today-count';
  var TODAY_DATE_KEY = 'ccr-today-date';
  var GUEST_GEN_KEY = 'ccr-guest-generations';
  var GUEST_GEN_DATE_KEY = 'ccr-guest-generations-date';
  var GUEST_DAILY_LIMIT = 10;

  // ===== AUTH =====
  var currentUser = null;

  function getAuthData() {
    try {
      var raw = localStorage.getItem(AUTH_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return null;
  }

  function getToken() {
    var d = getAuthData();
    return d && d.access_token ? d.access_token : '';
  }

  function getUserInfo() {
    var d = getAuthData();
    if (!d || !d.user) return null;
    return d.user;
  }

  function authHeaders() {
    var t = getToken();
    return { 'Content-Type': 'application/json', 'Authorization': t ? 'Bearer ' + t : '' };
  }

  function isSignedIn() {
    var d = getAuthData();
    if (!d || !d.access_token) return false;
    // Check expiry
    if (d.expires_at) {
      var now = Math.floor(Date.now() / 1000);
      if (now > d.expires_at) return false;
    }
    return true;
  }

  function initAuth() {
    document.getElementById('authGate').style.display = 'none';
    document.getElementById('appTopbar').style.display = '';
    document.getElementById('statsBar').style.display = '';
    document.getElementById('appMain').style.display = '';

    if (isSignedIn()) {
      currentUser = getUserInfo();

      // Populate user info
      var email = currentUser ? (currentUser.email || '') : '';
      var avatar = currentUser && currentUser.user_metadata ? currentUser.user_metadata.avatar_url : '';
      var initials = email ? email.charAt(0).toUpperCase() : '?';

      var avatarEl = document.getElementById('userAvatar');
      if (avatar) {
        avatarEl.innerHTML = '<img src="' + avatar + '" alt="">';
      } else {
        avatarEl.textContent = initials;
      }
      document.getElementById('userEmail').textContent = email;
    } else {
      currentUser = null;
      document.getElementById('userAvatar').textContent = 'G';
      document.getElementById('userEmail').textContent = 'Guest mode';
      document.getElementById('signOutBtn').style.display = 'none';
      updateStats();
      renderHistory();
      renderFavorites();
      return;
    }

    document.getElementById('signOutBtn').style.display = '';
    updateStats();
    renderHistory();
    renderFavorites();
  }

  // Sign out
  document.getElementById('signOutBtn').onclick = function() {
    localStorage.removeItem(AUTH_KEY);
    window.location.reload();
  };

  // ===== TOAST =====
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function() { el.classList.remove('show'); }, 2800);
  }

  // ===== HELPERS =====
  function getActivePill(containerId) {
    var el = document.getElementById(containerId);
    var active = el && el.querySelector('.ccr-pill-v2.active');
    return active ? active.getAttribute('data-val') : '';
  }

  function getToggles() {
    var result = {};
    document.querySelectorAll('#tabWrite .ccr-toggle-v2').forEach(function(tog) {
      result[tog.getAttribute('data-field')] = tog.classList.contains('on');
    });
    return result;
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  }

  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var LENGTH_MAP = ['short', 'medium', 'long'];
  var LENGTH_LABELS = ['Short', 'Medium', 'Long'];

  // ===== PILL CLICK WIRING =====
  function wirePills(container) {
    var el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;
    el.querySelectorAll('.ccr-pill-v2').forEach(function(pill) {
      pill.onclick = function() {
        el.querySelectorAll('.ccr-pill-v2').forEach(function(p) { p.classList.remove('active'); });
        pill.classList.add('active');
      };
    });
  }

  wirePills('platformPills');
  wirePills('tonePills');
  wirePills('rewritePlatformPills');

  // ===== TOGGLE WIRING =====
  document.querySelectorAll('.ccr-toggle-v2').forEach(function(tog) {
    tog.onclick = function() { tog.classList.toggle('on'); };
  });

  // ===== LENGTH SLIDER =====
  var lengthSlider = document.getElementById('lengthSlider');
  var lengthLabel = document.getElementById('lengthLabel');
  lengthSlider.oninput = function() {
    lengthLabel.textContent = LENGTH_LABELS[parseInt(lengthSlider.value)];
  };

  // ===== TAB SWITCHING =====
  function switchTab(tabId) {
    // Desktop nav
    document.querySelectorAll('.ccr-topbar-v2-tab').forEach(function(t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
    });
    // Mobile nav
    document.querySelectorAll('.ccr-bnav2-item').forEach(function(t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
    });
    // Content
    document.querySelectorAll('.ccr-tab-content').forEach(function(c) { c.classList.remove('active'); });
    var target = document.getElementById('tab' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
    if (target) target.classList.add('active');

    // Hide compare if switching away
    if (tabId !== 'write' && tabId !== 'rewrite') {
      document.getElementById('compareBar').style.display = 'none';
      document.getElementById('compareView').style.display = 'none';
    }
  }

  document.querySelectorAll('.ccr-topbar-v2-tab').forEach(function(tab) {
    tab.onclick = function() { switchTab(tab.getAttribute('data-tab')); };
  });
  document.querySelectorAll('.ccr-bnav2-item').forEach(function(tab) {
    tab.onclick = function() { switchTab(tab.getAttribute('data-tab')); };
  });

  // ===== PLATFORM MOCKUP RENDERERS =====
  function renderMockup(platform, caption) {
    var text = escapeHtml(caption.text || '');
    var hashtags = (caption.hashtags || []).map(function(h) { return h; }).join(' ');

    switch (platform) {
      case 'instagram':
        return '<div class="ccr-mockup-body">' +
          '<div class="ccr-ig-header"><div class="ccr-ig-avatar"></div><span class="ccr-ig-handle">@yourhandle</span><span class="ccr-ig-time">2m</span></div>' +
          '<div class="ccr-ig-actions"><span>&#9825;</span><span>&#128172;</span><span>&#8599;&#65039;</span><span>&#128278;</span></div>' +
          '<div class="ccr-ig-caption"><strong>yourhandle</strong> ' + text + '</div>' +
          (hashtags ? '<div class="ccr-ig-hashtags">' + escapeHtml(hashtags) + '</div>' : '') +
          '</div>';
      case 'x':
        return '<div class="ccr-mockup-body">' +
          '<div class="ccr-x-header"><div class="ccr-x-avatar"></div><div><div class="ccr-x-name">Your Name</div><div class="ccr-x-handle">@yourhandle</div></div></div>' +
          '<div class="ccr-x-text">' + text + '</div>' +
          '<div class="ccr-x-footer"><span>&#128172; 0</span><span>&#128257; 0</span><span>&#10084;&#65039; 0</span><span>&#128200; 0</span></div>' +
          '</div>';
      case 'linkedin':
        return '<div class="ccr-mockup-body">' +
          '<div class="ccr-li-header"><div class="ccr-li-avatar"></div><div><div class="ccr-li-name">Your Name</div><div class="ccr-li-headline">Creator &bull; Content Strategist</div></div></div>' +
          '<div class="ccr-li-text">' + text + '</div>' +
          (hashtags ? '<div class="ccr-ig-hashtags" style="margin-top:12px">' + escapeHtml(hashtags) + '</div>' : '') +
          '</div>';
      case 'tiktok':
        return '<div class="ccr-mockup-body">' +
          '<div class="ccr-tt-body"><div class="ccr-tt-text-area"><div class="ccr-tt-handle">@yourhandle</div><div class="ccr-tt-text">' + text + '</div>' +
          (hashtags ? '<div class="ccr-tt-hashtags">' + escapeHtml(hashtags) + '</div>' : '') +
          '</div><div class="ccr-tt-actions"><span>&#10084;&#65039;</span><span>&#128172;</span><span>&#128278;</span></div></div>' +
          '</div>';
      case 'facebook':
        return '<div class="ccr-mockup-body">' +
          '<div class="ccr-fb-header"><div class="ccr-fb-avatar"></div><div><div class="ccr-fb-name">Your Name</div><div class="ccr-fb-time">Just now &bull; &#127760;</div></div></div>' +
          '<div class="ccr-fb-text">' + text + '</div>' +
          '</div>';
      default:
        return '<div class="ccr-mockup-body"><div style="font-size:14px;line-height:1.7;color:rgba(255,255,255,.9);white-space:pre-wrap;">' + text + '</div></div>';
    }
  }

  function getPlatformIconClass(platform) {
    var map = { instagram: 'ig', x: 'x', linkedin: 'li', tiktok: 'tt', facebook: 'fb' };
    return map[platform] || 'ig';
  }

  function getPlatformIcon(platform) {
    var p = E.PLATFORMS[platform];
    return p ? p.icon : '&#128247;';
  }

  // ===== CHARACTER BAR COLOR =====
  function charBarColor(ratio) {
    if (ratio <= 0.6) return '#22c55e';
    if (ratio <= 0.85) return '#facc15';
    return '#ef4444';
  }

  // ===== COMPARE STATE =====
  var compareSlots = [];
  var lastCaptions = [];
  var lastPlatform = '';

  function updateCompareBar() {
    var bar = document.getElementById('compareBar');
    document.getElementById('compareCount').textContent = compareSlots.length;
    document.getElementById('compareRunBtn').style.display = compareSlots.length === 2 ? '' : 'none';
    bar.style.display = compareSlots.length > 0 ? '' : 'none';
  }

  document.getElementById('compareClearBtn').onclick = function() {
    compareSlots = [];
    updateCompareBar();
    document.getElementById('compareView').style.display = 'none';
    // Deactivate all compare toggles
    document.querySelectorAll('.ccr-act-btn[data-action="compare"]').forEach(function(b) {
      b.classList.remove('fav-active');
    });
  };

  document.getElementById('compareRunBtn').onclick = function() {
    if (compareSlots.length !== 2) return;
    var grid = document.getElementById('compareGrid');
    var html = '';
    compareSlots.forEach(function(cap, i) {
      html += '<div class="ccr-compare-col">';
      html += '<div class="ccr-compare-label">Option ' + (i + 1) + ': ' + escapeHtml(cap.label || '') + '</div>';
      html += '<div class="ccr-compare-text">' + escapeHtml(cap.text || '') + '</div>';
      if (cap.hashtags && cap.hashtags.length) {
        html += '<div style="margin-top:12px;font-size:13px;color:var(--ccr-primary)">' + escapeHtml(cap.hashtags.join(' ')) + '</div>';
      }
      html += '<div style="margin-top:8px;font-size:12px;color:rgba(255,255,255,.3)">' + (cap.charCount || (cap.text||'').length) + ' characters</div>';
      html += '</div>';
    });
    grid.innerHTML = html;
    document.getElementById('compareView').style.display = '';
    document.getElementById('compareView').scrollIntoView({ behavior: 'smooth' });
  };

  // ===== RENDER CAPTIONS =====
  function renderCaptions(data, platform, targetId) {
    var area = document.getElementById(targetId);
    var captions = data.captions || [];
    lastCaptions = captions;
    lastPlatform = platform;
    var html = '';

    // Export button
    if (captions.length) {
      html += '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">';
      html += '<button type="button" class="ccr-export-btn" id="exportAllBtn">&#128229; Export All as .txt</button>';
      html += '</div>';
    }

    captions.forEach(function(cap, i) {
      var charCount = cap.charCount || (cap.text || '').length;
      var maxChars = E.PLATFORMS[platform] ? E.PLATFORMS[platform].maxChars : 2200;
      var ratio = charCount / maxChars;
      var barColor = charBarColor(ratio);
      var barWidth = Math.min(ratio * 100, 100);

      var isFav = isFavorited(cap.text || '');

      html += '<div class="ccr-output-card">';

      // Header
      html += '<div class="ccr-output-card-header">';
      html += '<div class="ccr-output-platform-badge ' + getPlatformIconClass(platform) + '">' + getPlatformIcon(platform) + '</div>';
      html += '<div class="ccr-output-card-label">' + escapeHtml(cap.label || 'Variation ' + (i + 1)) + '</div>';
      html += '<div class="ccr-output-card-charbar">';
      html += '<div class="ccr-charbar"><div class="ccr-charbar-fill" style="width:' + barWidth + '%;background:' + barColor + '"></div></div>';
      html += '<div class="ccr-output-card-chartext" style="color:' + barColor + '">' + charCount + '/' + maxChars + '</div>';
      html += '</div></div>';

      // Body (mockup)
      html += '<div class="ccr-output-card-body">';
      html += renderMockup(platform, cap);
      html += '</div>';

      // Actions
      html += '<div class="ccr-output-card-actions">';
      html += '<button type="button" class="ccr-act-btn" data-action="copy" data-idx="' + i + '">&#128203; Copy</button>';
      html += '<button type="button" class="ccr-act-btn" data-action="copy-no-tags" data-idx="' + i + '">&#128203; No Tags</button>';
      if (cap.hashtags && cap.hashtags.length) {
        html += '<button type="button" class="ccr-act-btn" data-action="copy-tags" data-idx="' + i + '"># Tags Only</button>';
      }
      html += '<button type="button" class="ccr-act-btn" data-action="share" data-idx="' + i + '">&#128172; Share</button>';
      html += '<button type="button" class="ccr-act-btn' + (isFav ? ' fav-active' : '') + '" data-action="favorite" data-idx="' + i + '">&#11088; ' + (isFav ? 'Saved' : 'Save') + '</button>';
      html += '<button type="button" class="ccr-act-btn" data-action="compare" data-idx="' + i + '">&#9878;&#65039; Compare</button>';
      html += '</div>';

      html += '</div>';
    });

    if (data.platformTip) {
      html += '<div class="ccr-platform-tip"><strong>&#128161; Tip:</strong> ' + escapeHtml(data.platformTip) + '</div>';
    }

    area.innerHTML = html;

    // Wire action buttons
    wireActionButtons(area, captions, platform);

    // Wire export
    var exportBtn = document.getElementById('exportAllBtn');
    if (exportBtn) {
      exportBtn.onclick = function() { exportCaptions(captions, platform); };
    }

    return captions;
  }

  function wireActionButtons(area, captions, platform) {
    area.querySelectorAll('.ccr-act-btn').forEach(function(btn) {
      btn.onclick = function() {
        var idx = parseInt(btn.getAttribute('data-idx'));
        var action = btn.getAttribute('data-action');
        var cap = captions[idx];
        if (!cap) return;

        var text = cap.text || '';
        var hashtags = (cap.hashtags || []).join(' ');

        switch (action) {
          case 'copy':
            navigator.clipboard.writeText(text + (hashtags ? '\n\n' + hashtags : '')).then(function() { toast('Copied with hashtags!'); });
            break;
          case 'copy-no-tags':
            navigator.clipboard.writeText(text).then(function() { toast('Copied without hashtags!'); });
            break;
          case 'copy-tags':
            navigator.clipboard.writeText(hashtags).then(function() { toast('Hashtags copied!'); });
            break;
          case 'share':
            if (navigator.share) {
              navigator.share({ text: text }).catch(function(){});
            } else {
              window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
            }
            break;
          case 'favorite':
            toggleFavorite(cap, platform);
            btn.classList.toggle('fav-active');
            btn.innerHTML = btn.classList.contains('fav-active') ? '&#11088; Saved' : '&#11088; Save';
            break;
          case 'compare':
            var alreadyIdx = -1;
            for (var c = 0; c < compareSlots.length; c++) {
              if (compareSlots[c].text === cap.text) { alreadyIdx = c; break; }
            }
            if (alreadyIdx >= 0) {
              compareSlots.splice(alreadyIdx, 1);
              btn.classList.remove('fav-active');
            } else if (compareSlots.length < 2) {
              compareSlots.push(cap);
              btn.classList.add('fav-active');
            } else {
              toast('Remove one first (max 2)');
            }
            updateCompareBar();
            break;
        }
      };
    });
  }

  // ===== LOADING WITH CYCLING VERBS =====
  var LOADING_VERBS = [
    'Crafting your captions...',
    'Polishing the hook...',
    'Optimizing for engagement...',
    'Finding the perfect tone...',
    'Weaving in your personality...',
    'Testing different angles...',
    'Adding that creative spark...',
    'Making it scroll-stopping...',
    'Refining the CTA...',
    'Selecting the best hashtags...',
    'Checking character limits...',
    'Tuning for the algorithm...',
    'Writing something fire...',
    'Sprinkling in some magic...',
    'Ensuring the vibe is right...',
    'Maximizing click-through...',
    'Balancing wit and substance...'
  ];

  var loadingInterval = null;

  function showLoading(targetId, platform) {
    var area = document.getElementById(targetId);
    var platformLabel = E.PLATFORMS[platform] ? E.PLATFORMS[platform].label : platform;
    var html = '<div class="ccr-loading-overlay" id="loadingOverlay">';
    html += '<div class="ccr-loading-spinner-big"></div>';
    html += '<div class="ccr-loading-verb" id="loadingVerb">' + LOADING_VERBS[0] + '</div>';
    html += '<div style="font-size:12px;color:rgba(255,255,255,.3);margin-top:12px">Generating for ' + escapeHtml(platformLabel) + '</div>';
    html += '</div>';
    area.innerHTML = html;

    var verbIdx = 0;
    loadingInterval = setInterval(function() {
      verbIdx = (verbIdx + 1) % LOADING_VERBS.length;
      var el = document.getElementById('loadingVerb');
      if (el) {
        el.style.opacity = '0';
        setTimeout(function() {
          if (el) { el.textContent = LOADING_VERBS[verbIdx]; el.style.opacity = '1'; }
        }, 200);
      }
    }, 2000);
  }

  function stopLoading() {
    if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null; }
  }

  function showError(targetId, msg) {
    stopLoading();
    document.getElementById(targetId).innerHTML = '<div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:16px;padding:24px;color:#ef4444;font-size:14px;text-align:center;line-height:1.6">' + escapeHtml(msg) + '</div>';
  }

  // ===== GENERATE =====
  document.getElementById('generateBtn').onclick = function() {
    var topic = document.getElementById('topicInput').value.trim();
    if (!topic) { toast('Describe your post first'); return; }

    var platform = getActivePill('platformPills');
    var tone = getActivePill('tonePills');
    var includes = getToggles();
    var length = LENGTH_MAP[parseInt(lengthSlider.value)];
    var lang = document.getElementById('langSelect').value;
    var useAI = document.getElementById('aiGenerateConsent').checked;

    if (!useAI) {
      var localResult = E.generateLocal(platform, topic, tone, includes, length, lang);
      if (!localResult.ok) {
        showError('writeOutput', localResult.error);
        return;
      }
      var localCaptions = renderCaptions(localResult, platform, 'writeOutput');
      saveToHistory(platform, topic, tone, localCaptions);
      incrementTodayCount(localCaptions.length);
      updateStats();
      toast(lang === 'french' ? '3 légendes créées localement' : '3 captions created locally');
      return;
    }

    if (!isSignedIn() && getGuestGenerationCount() >= GUEST_DAILY_LIMIT) {
      showError('writeOutput', 'Guest AI limit reached for today. Local generation remains available.');
      return;
    }

    var prompt = E.buildPrompt(platform, topic, tone, includes, false, '');

    // Append extra instructions for length, language, hook
    var extras = [];
    if (length === 'short') extras.push('Keep captions SHORT (1-2 sentences max).');
    if (length === 'long') extras.push('Write LONGER captions (3-5 paragraphs, storytelling style).');
    if (lang !== 'english') extras.push('Write the captions in ' + lang.charAt(0).toUpperCase() + lang.slice(1) + '.');
    if (includes.hook) extras.push('The FIRST LINE must be a powerful hook that stops the scroll.');
    if (extras.length) prompt += '\n\nADDITIONAL INSTRUCTIONS:\n' + extras.join('\n');

    var btn = document.getElementById('generateBtn');
    btn.classList.add('loading');
    btn.disabled = true;
    showLoading('writeOutput', platform);

    fetch(API + '/generate', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ prompt: prompt, brief: topic, platform: platform, tone: tone })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(res) {
      btn.classList.remove('loading');
      btn.disabled = false;
      stopLoading();

      if (!res.ok) {
        if (res.data && (res.data.error || '').indexOf('401') >= 0) {
          localStorage.removeItem(AUTH_KEY);
          showError('writeOutput', 'Session expired. Refresh the page to continue in guest mode.');
          return;
        }
        showError('writeOutput', res.data.error || 'Generation failed. Please try again.');
        return;
      }

      var parsed = E.parseOutput(res.data.output);
      var captions = renderCaptions(parsed, platform, 'writeOutput');

      // Save
      saveToHistory(platform, topic, tone, captions);
      incrementTodayCount(captions.length);
      if (!isSignedIn()) incrementGuestGenerationCount();
      updateStats();

      if (res.data.remaining !== undefined) {
        toast(res.data.remaining + ' generations remaining today');
      } else if (!isSignedIn()) {
        toast(Math.max(0, GUEST_DAILY_LIMIT - getGuestGenerationCount()) + ' guest generations remaining today');
      }
    })
    .catch(function(err) {
      btn.classList.remove('loading');
      btn.disabled = false;
      stopLoading();
      showError('writeOutput', 'Connection error. Please check your internet and try again.');
    });
  };

  // ===== REWRITE =====
  document.getElementById('rewriteBtn').onclick = function() {
    var caption = document.getElementById('rewriteInput').value.trim();
    if (!caption) { toast('Paste a caption to rewrite'); return; }

    var platform = getActivePill('rewritePlatformPills');
    var useAI = document.getElementById('aiRewriteConsent').checked;
    var rewriteLanguage = document.documentElement.lang === 'fr' ? 'french' : 'english';

    if (!useAI) {
      var localResult = E.rewriteLocal(platform, caption, rewriteLanguage);
      if (!localResult.ok) {
        showError('rewriteOutput', localResult.error);
        return;
      }
      renderCaptions(localResult, platform, 'rewriteOutput');
      toast(rewriteLanguage === 'french' ? '3 versions créées localement' : '3 rewrites created locally');
      return;
    }

    if (!isSignedIn() && getGuestGenerationCount() >= GUEST_DAILY_LIMIT) {
      showError('rewriteOutput', 'Guest AI limit reached for today. Local rewriting remains available.');
      return;
    }

    var btn = document.getElementById('rewriteBtn');
    btn.classList.add('loading');
    btn.disabled = true;
    showLoading('rewriteOutput', platform);

    fetch(API + '/rewrite', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ caption: caption, platform: platform })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(res) {
      btn.classList.remove('loading');
      btn.disabled = false;
      stopLoading();

      if (!res.ok) {
        showError('rewriteOutput', res.data.error || 'Rewrite failed. Please try again.');
        return;
      }

      var parsed = E.parseOutput(res.data.output);
      renderCaptions(parsed, platform, 'rewriteOutput');
      if (!isSignedIn()) incrementGuestGenerationCount();

      if (res.data.remaining !== undefined) {
        toast(res.data.remaining + ' generations remaining today');
      } else if (!isSignedIn()) {
        toast(Math.max(0, GUEST_DAILY_LIMIT - getGuestGenerationCount()) + ' guest generations remaining today');
      }
    })
    .catch(function() {
      btn.classList.remove('loading');
      btn.disabled = false;
      stopLoading();
      showError('rewriteOutput', 'Connection error. Please try again.');
    });
  };

  // ===== HISTORY =====
  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e) { return []; }
  }

  function saveToHistory(platform, topic, tone, captions) {
    var history = getHistory();
    history.unshift(E.createHistoryEntry(platform, topic, tone, captions));
    if (history.length > 100) history = history.slice(0, 100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function renderHistory() {
    var history = getHistory();
    var container = document.getElementById('historyList');

    if (!history.length) {
      container.innerHTML = '<div class="ccr-empty"><div class="ccr-empty-icon">&#128336;</div><div class="ccr-empty-title">No history yet</div><div class="ccr-empty-desc">Your generated captions will appear here for quick access.</div></div>';
      return;
    }

    var html = '';
    history.forEach(function(entry, i) {
      var platformLabel = E.PLATFORMS[entry.platform] ? E.PLATFORMS[entry.platform].label : entry.platform;
      var captionCount = entry.captions ? entry.captions.length : 0;

      html += '<div class="ccr-history-item" data-idx="' + i + '">';
      html += '<div class="ccr-history-meta">';
      html += '<span class="ccr-history-platform">' + escapeHtml(platformLabel) + '</span>';
      if (entry.tone) html += '<span class="ccr-history-tone">' + escapeHtml(entry.tone) + '</span>';
      html += '<span class="ccr-history-time">' + E.formatTimestamp(entry.createdAt) + '</span>';
      html += '</div>';
      html += '<div class="ccr-history-topic">' + escapeHtml(entry.topic || 'Untitled') + '</div>';
      html += '<div class="ccr-history-count">' + captionCount + ' caption' + (captionCount !== 1 ? 's' : '') + ' generated</div>';
      html += '</div>';
    });

    container.innerHTML = html;

    // Wire clicks
    container.querySelectorAll('.ccr-history-item').forEach(function(item) {
      item.onclick = function() {
        var idx = parseInt(item.getAttribute('data-idx'));
        var entry = history[idx];
        if (!entry || !entry.captions) return;

        // Restore to write tab
        switchTab('write');
        document.getElementById('topicInput').value = entry.topic || '';

        // Set platform pill
        var pPills = document.getElementById('platformPills');
        pPills.querySelectorAll('.ccr-pill-v2').forEach(function(p) {
          p.classList.toggle('active', p.getAttribute('data-val') === entry.platform);
        });

        // Set tone pill
        if (entry.tone) {
          var tPills = document.getElementById('tonePills');
          tPills.querySelectorAll('.ccr-pill-v2').forEach(function(p) {
            p.classList.toggle('active', p.getAttribute('data-val') === entry.tone);
          });
        }

        // Render captions
        renderCaptions({ captions: entry.captions }, entry.platform, 'writeOutput');
        toast('Restored from history');
      };
    });
  }

  // ===== FAVORITES =====
  function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch(e) { return []; }
  }

  function saveFavorites(favs) {
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  }

  function isFavorited(text) {
    var favs = getFavorites();
    for (var i = 0; i < favs.length; i++) {
      if (favs[i].text === text) return true;
    }
    return false;
  }

  function toggleFavorite(cap, platform) {
    var favs = getFavorites();
    var idx = -1;
    for (var i = 0; i < favs.length; i++) {
      if (favs[i].text === (cap.text || '')) { idx = i; break; }
    }

    if (idx >= 0) {
      favs.splice(idx, 1);
      toast('Removed from favorites');
    } else {
      favs.unshift({
        text: cap.text || '',
        label: cap.label || '',
        hashtags: cap.hashtags || [],
        platform: platform,
        savedAt: Date.now()
      });
      toast('Saved to favorites!');
    }

    saveFavorites(favs);
    updateStats();
    renderFavorites();
  }

  function renderFavorites() {
    var favs = getFavorites();
    var container = document.getElementById('favList');

    if (!favs.length) {
      container.innerHTML = '<div class="ccr-empty"><div class="ccr-empty-icon">&#11088;</div><div class="ccr-empty-title">No favorites yet</div><div class="ccr-empty-desc">Save your best captions here for quick reuse.</div></div>';
      return;
    }

    var html = '<input aria-label="Search favorites" type="text" class="ccr-fav-search" id="favSearchInput" placeholder="Search favorites...">';

    favs.forEach(function(fav, i) {
      var platformLabel = E.PLATFORMS[fav.platform] ? E.PLATFORMS[fav.platform].label : (fav.platform || '');
      html += '<div class="ccr-fav-card" data-idx="' + i + '">';
      html += '<button type="button" class="ccr-fav-remove" data-remove="' + i + '">&times;</button>';
      html += '<div class="ccr-fav-card-platform">' + escapeHtml(platformLabel) + '</div>';
      html += '<div class="ccr-fav-card-text">' + escapeHtml(fav.text || '') + '</div>';
      if (fav.hashtags && fav.hashtags.length) {
        html += '<div style="font-size:12px;color:var(--ccr-primary);margin-bottom:10px">' + escapeHtml(fav.hashtags.join(' ')) + '</div>';
      }
      html += '<div class="ccr-fav-card-actions">';
      html += '<button type="button" class="ccr-act-btn" data-action="fav-copy" data-idx="' + i + '">&#128203; Copy</button>';
      html += '<button type="button" class="ccr-act-btn" data-action="fav-share" data-idx="' + i + '">&#128172; Share</button>';
      html += '</div>';
      html += '</div>';
    });

    container.innerHTML = html;

    // Wire search
    var searchInput = document.getElementById('favSearchInput');
    if (searchInput) {
      searchInput.oninput = function() {
        var q = searchInput.value.toLowerCase();
        container.querySelectorAll('.ccr-fav-card').forEach(function(card) {
          var text = (favs[parseInt(card.getAttribute('data-idx'))].text || '').toLowerCase();
          card.style.display = text.indexOf(q) >= 0 ? '' : 'none';
        });
      };
    }

    // Wire remove
    container.querySelectorAll('.ccr-fav-remove').forEach(function(btn) {
      btn.onclick = function(e) {
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-remove'));
        favs.splice(idx, 1);
        saveFavorites(favs);
        updateStats();
        renderFavorites();
        toast('Removed from favorites');
      };
    });

    // Wire copy/share
    container.querySelectorAll('.ccr-act-btn').forEach(function(btn) {
      btn.onclick = function() {
        var idx = parseInt(btn.getAttribute('data-idx'));
        var fav = favs[idx];
        if (!fav) return;
        var action = btn.getAttribute('data-action');
        if (action === 'fav-copy') {
          var text = fav.text + (fav.hashtags && fav.hashtags.length ? '\n\n' + fav.hashtags.join(' ') : '');
          navigator.clipboard.writeText(text).then(function() { toast('Copied!'); });
        } else if (action === 'fav-share') {
          if (navigator.share) {
            navigator.share({ text: fav.text }).catch(function(){});
          } else {
            window.open('https://wa.me/?text=' + encodeURIComponent(fav.text), '_blank');
          }
        }
      };
    });
  }

  // ===== EXPORT =====
  function exportCaptions(captions, platform) {
    var platformLabel = E.PLATFORMS[platform] ? E.PLATFORMS[platform].label : platform;
    var lines = ['CaptionCraft Export - ' + platformLabel, 'Generated: ' + new Date().toLocaleString(), ''];

    captions.forEach(function(cap, i) {
      lines.push('--- ' + (cap.label || 'Variation ' + (i + 1)) + ' ---');
      lines.push('');
      lines.push(cap.text || '');
      if (cap.hashtags && cap.hashtags.length) {
        lines.push('');
        lines.push(cap.hashtags.join(' '));
      }
      lines.push('');
      lines.push('Characters: ' + (cap.charCount || (cap.text || '').length));
      lines.push('');
    });

    var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'captions-' + platform + '-' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported!');
  }

  // ===== STATS =====
  function getTodayCount() {
    var today = new Date().toISOString().slice(0, 10);
    var stored = localStorage.getItem(TODAY_DATE_KEY);
    if (stored !== today) {
      localStorage.setItem(TODAY_DATE_KEY, today);
      localStorage.setItem(TODAY_KEY, '0');
      return 0;
    }
    return parseInt(localStorage.getItem(TODAY_KEY) || '0');
  }

  function incrementTodayCount(n) {
    var today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(TODAY_DATE_KEY, today);
    var current = parseInt(localStorage.getItem(TODAY_KEY) || '0');
    localStorage.setItem(TODAY_KEY, String(current + (n || 0)));
  }

  function getGuestGenerationCount() {
    var today = new Date().toISOString().slice(0, 10);
    var stored = localStorage.getItem(GUEST_GEN_DATE_KEY);
    if (stored !== today) {
      localStorage.setItem(GUEST_GEN_DATE_KEY, today);
      localStorage.setItem(GUEST_GEN_KEY, '0');
      return 0;
    }
    return parseInt(localStorage.getItem(GUEST_GEN_KEY) || '0', 10);
  }

  function incrementGuestGenerationCount() {
    var today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(GUEST_GEN_DATE_KEY, today);
    var next = getGuestGenerationCount() + 1;
    localStorage.setItem(GUEST_GEN_KEY, String(next));
    return next;
  }

  function updateStats() {
    document.getElementById('statToday').textContent = getTodayCount();
    document.getElementById('statSaved').textContent = getFavorites().length;
    document.getElementById('statHistory').textContent = getHistory().length;
  }

  // ===== ENTER KEY =====
  document.getElementById('topicInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('generateBtn').click();
    }
  });

  document.getElementById('rewriteInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      document.getElementById('rewriteBtn').click();
    }
  });

  // ===== INIT =====
  initAuth();

}();
