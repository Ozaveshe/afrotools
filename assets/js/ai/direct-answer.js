/* AfroTools AI — Direct Answer panel for /ai/
 * Listens for `afrotools:ai-query` (dispatched by the command page router),
 * and — with stored consent — asks the AI advisor the user's actual question,
 * rendering a written answer above the routed tool cards, with follow-ups.
 * Consent model: reuses the shared advisor consent key. No question is sent
 * to the model until the user turns the panel on once on this device.
 */
(function () {
  "use strict";

  var ENDPOINT = "/.netlify/functions/ai-advisor";
  var CONSENT_KEY = "afrotools_ai_advisor_consent";
  var SESSION_KEY = "afrotools_ai_session_id";
  var MAX_THREAD_MESSAGES = 10;

  var panel = document.getElementById("aiDirectAnswer");
  if (!panel) return;

  var consentBlock = document.getElementById("aiAnswerConsent");
  var enableButton = document.getElementById("aiAnswerEnable");
  var thread = document.getElementById("aiAnswerThread");
  var followupForm = document.getElementById("aiAnswerFollowup");
  var followupInput = document.getElementById("aiAnswerFollowupInput");
  var quotaLabel = document.getElementById("aiAnswerQuota");
  var tierBadge = document.getElementById("aiAnswerTier");

  var messages = [];
  var busy = false;
  var pendingQuery = "";
  var rateLimited = false;

  function storage() {
    try { return window.localStorage || null; } catch (err) { return null; }
  }

  function hasConsent() {
    var store = storage();
    return Boolean(store && store.getItem(CONSENT_KEY) === "accepted");
  }

  function grantConsent() {
    var store = storage();
    if (store) {
      try { store.setItem(CONSENT_KEY, "accepted"); } catch (err) {}
    }
  }

  function sessionId() {
    var store = storage();
    var existing = store && store.getItem(SESSION_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing;
    var fresh = "";
    try { fresh = window.crypto.randomUUID().replace(/-/g, ""); } catch (err) {}
    if (!fresh) fresh = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
    if (store) {
      try { store.setItem(SESSION_KEY, fresh); } catch (err) {}
    }
    return fresh;
  }

  function track(name, props) {
    try {
      if (window.AfroTools && window.AfroTools.analytics && typeof window.AfroTools.analytics.track === "function") {
        window.AfroTools.analytics.track(name, props || {});
      } else if (typeof window.gtag === "function") {
        window.gtag("event", name, props || {});
      }
    } catch (err) {}
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  // Minimal renderer: the advisor is instructed to answer in plain sentences
  // with occasional **bold**; never inject raw model HTML.
  function renderAnswerHtml(text) {
    var safe = escapeHtml(text);
    safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    safe = safe.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>");
    return "<p>" + safe + "</p>";
  }

  function buildContext() {
    var parts = [];
    var country = document.getElementById("aiContextCountry");
    var workflow = document.getElementById("aiContextWorkflow");
    if (country && country.value) parts.push("User's country focus: " + country.value + ".");
    if (workflow && workflow.value) parts.push("Help category: " + workflow.value + ".");
    var primaryCard = document.querySelector('#aiResultCards [data-workflow-card][data-primary="true"] .ai-card-title');
    if (primaryCard && primaryCard.textContent) {
      parts.push('AfroTools has matched the tool "' + primaryCard.textContent.trim() + '" for this question; mention it as the next step if relevant.');
    }
    return parts.join(" ");
  }

  function setBusy(nextBusy) {
    busy = nextBusy;
    if (followupInput) followupInput.disabled = nextBusy;
    var submit = followupForm ? followupForm.querySelector("button") : null;
    if (submit) submit.disabled = nextBusy;
  }

  function appendBubble(kind, html) {
    var div = document.createElement("div");
    div.className = "ai-answer-bubble is-" + kind;
    div.innerHTML = html;
    thread.appendChild(div);
    return div;
  }

  function appendAnswer(text) {
    var bubble = appendBubble("assistant", renderAnswerHtml(text));
    var actions = document.createElement("div");
    actions.className = "ai-answer-actions";
    var copy = document.createElement("button");
    copy.type = "button";
    copy.className = "ai-answer-copy";
    copy.textContent = "Copy answer";
    copy.addEventListener("click", function () {
      try {
        navigator.clipboard.writeText(text).then(function () {
          copy.textContent = "Copied";
          setTimeout(function () { copy.textContent = "Copy answer"; }, 1800);
        });
      } catch (err) {}
      track("ai_direct_answer_copied", {});
    });
    actions.appendChild(copy);
    bubble.appendChild(actions);
  }

  function showTyping() {
    var bubble = appendBubble("typing",
      '<span class="ai-answer-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<span class="sr-only">AfroTools AI is writing an answer</span>');
    return bubble;
  }

  function updateQuota(remaining, limit) {
    if (!quotaLabel) return;
    if (!isFinite(Number(limit)) || Number(limit) > 100) {
      quotaLabel.textContent = "Pro — unlimited answers";
      return;
    }
    var left = Math.max(0, Number(remaining) || 0);
    quotaLabel.textContent = left + " free answer" + (left === 1 ? "" : "s") + " left today";
  }

  function showRateLimit() {
    rateLimited = true;
    appendBubble("notice",
      "<strong>Daily free answers used up.</strong> " +
      'Sign in for more, or <a href="/pricing/?source=ai_direct_answer">upgrade to AfroTools Pro</a> for unlimited AI answers. ' +
      "The matched tools below still work without AI.");
    if (followupForm) followupForm.hidden = true;
    if (quotaLabel) quotaLabel.textContent = "0 free answers left today";
  }

  function showPanel() {
    panel.hidden = false;
  }

  function resetThread() {
    messages = [];
    rateLimited = false;
    if (thread) {
      thread.innerHTML = "";
      thread.hidden = false;
    }
    if (tierBadge) tierBadge.hidden = true;
    if (followupForm) followupForm.hidden = true;
  }

  function ask(text, isFollowup) {
    if (busy || rateLimited) return;
    var clean = String(text || "").trim();
    if (!clean) return;
    setBusy(true);
    if (isFollowup) appendBubble("user", "<p>" + escapeHtml(clean) + "</p>");
    messages.push({ role: "user", content: clean });
    if (messages.length > MAX_THREAD_MESSAGES) messages = messages.slice(-MAX_THREAD_MESSAGES);
    var typing = showTyping();

    var headers = {
      "Content-Type": "application/json",
      "X-AfroTools-AI-Consent": "accepted",
      "X-Afro-Session": sessionId()
    };
    try {
      if (window.AfroAuth && typeof window.AfroAuth.getSessionToken === "function") {
        var token = window.AfroAuth.getSessionToken();
        if (token) headers.Authorization = "Bearer " + token;
      }
    } catch (err) {}

    var body = {
      messages: messages.slice(),
      sessionId: sessionId(),
      aiConsent: "accepted"
    };
    var context = buildContext();
    if (context) body.context = context;

    fetch(ENDPOINT, { method: "POST", headers: headers, body: JSON.stringify(body) })
      .then(function (res) {
        return res.json().then(function (data) { return { status: res.status, data: data }; });
      })
      .then(function (result) {
        typing.remove();
        var data = result.data || {};
        if (result.status === 429) {
          messages.pop();
          showRateLimit();
          track("ai_direct_answer_rate_limited", {});
          return;
        }
        var reply = data.reply || data.text || "";
        if (!reply || data.error) {
          messages.pop();
          appendBubble("notice", "<strong>No answer this time.</strong> " +
            escapeHtml(reply || "The AI service is briefly unavailable. The matched tools below still work.") );
          return;
        }
        messages.push({ role: "assistant", content: reply });
        appendAnswer(reply);
        if (tierBadge) tierBadge.hidden = data.tier !== "smart";
        if (data.remaining !== undefined) updateQuota(data.remaining, data.limit || 3);
        if (followupForm) {
          followupForm.hidden = false;
          if (!isFollowup && followupInput) followupInput.value = "";
        }
        track("ai_direct_answer_rendered", {
          tier: data.tier || "fast",
          followup: Boolean(isFollowup),
          reply_length: reply.length
        });
      })
      .catch(function () {
        typing.remove();
        messages.pop();
        appendBubble("notice", "<strong>Connection problem.</strong> Check your network and try again — the matched tools below still work without AI.");
      })
      .then(function () { setBusy(false); });
  }

  function startForQuery(query) {
    var clean = String(query || "").trim();
    if (!clean) return;
    showPanel();
    if (!hasConsent()) {
      pendingQuery = clean;
      if (consentBlock) consentBlock.hidden = false;
      if (thread) thread.hidden = true;
      if (followupForm) followupForm.hidden = true;
      return;
    }
    if (consentBlock) consentBlock.hidden = true;
    resetThread();
    // Let the router paint its primary tool card first so the answer can
    // reference the matched tool in its context.
    setTimeout(function () { ask(clean, false); }, 450);
  }

  document.addEventListener("afrotools:ai-query", function (event) {
    startForQuery(event && event.detail && event.detail.query);
  });

  if (enableButton) {
    enableButton.addEventListener("click", function () {
      grantConsent();
      track("ai_consent_accepted", { context: "direct_answer_panel" });
      if (consentBlock) consentBlock.hidden = true;
      var query = pendingQuery;
      pendingQuery = "";
      if (!query) {
        var input = document.getElementById("aiCommandInput");
        query = input ? input.value : "";
      }
      if (query && String(query).trim()) {
        resetThread();
        ask(String(query).trim(), false);
      }
    });
  }

  if (followupForm) {
    followupForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = followupInput ? followupInput.value : "";
      if (!String(value).trim()) return;
      if (followupInput) followupInput.value = "";
      track("ai_direct_answer_followup", { query_length: String(value).trim().length });
      ask(value, true);
    });
  }
})();
