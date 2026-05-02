(function () {
  'use strict';

  var root = window.AfroTools = window.AfroTools || {};
  if (root.aiConsentFetchWrapped || typeof window.fetch !== 'function') return;

  var STORAGE_KEY = 'afrotools_ai_advisor_consent';
  var CONSENT_VALUE = 'accepted';
  var NOTICE = [
    'AI Advisor sends your question and a calculation summary to Anthropic through AfroTools.',
    'Do not include names, ID numbers, secrets, or full documents.',
    'Continue?'
  ].join('\n\n');
  var CANCELLED_REPLY = 'AI Advisor was not contacted. Review the AI data notice and continue only if you agree.';
  var originalFetch = window.fetch.bind(window);

  function isAiAdvisorRequest(input) {
    var url = '';
    if (typeof input === 'string') url = input;
    else if (input && typeof input.url === 'string') url = input.url;
    return url.indexOf('/.netlify/functions/ai-advisor') !== -1 || url.indexOf('/api/ai-advisor') !== -1;
  }

  function getStoredConsent() {
    try { return window.localStorage && window.localStorage.getItem(STORAGE_KEY); }
    catch (err) { return null; }
  }

  function storeConsent() {
    try {
      if (window.localStorage) window.localStorage.setItem(STORAGE_KEY, CONSENT_VALUE);
    } catch (err) {}
  }

  function hasConsent() {
    return getStoredConsent() === CONSENT_VALUE;
  }

  function askConsent() {
    if (hasConsent()) return true;
    var accepted = window.confirm(NOTICE);
    if (accepted) storeConsent();
    return accepted;
  }

  function cancelledResponse() {
    return Promise.resolve(new Response(JSON.stringify({
      error: 'ai_consent_required',
      reply: CANCELLED_REPLY,
      text: CANCELLED_REPLY
    }), {
      status: 428,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    }));
  }

  function withConsentHeader(input, init) {
    var nextInit = Object.assign({}, init || {});
    var baseHeaders = nextInit.headers || (input && typeof input !== 'string' ? input.headers : undefined);
    var headers = new Headers(baseHeaders || {});
    headers.set('x-afrotools-ai-consent', CONSENT_VALUE);
    nextInit.headers = headers;

    if (input && typeof input !== 'string' && typeof Request !== 'undefined' && input instanceof Request) {
      return [new Request(input, nextInit)];
    }
    return [input, nextInit];
  }

  window.fetch = function afroToolsConsentFetch(input, init) {
    if (!isAiAdvisorRequest(input)) {
      return originalFetch(input, init);
    }

    if (!askConsent()) {
      return cancelledResponse();
    }

    var args = withConsentHeader(input, init);
    return originalFetch.apply(window, args);
  };

  root.aiConsentFetchWrapped = true;
  root.AIConsent = {
    hasConsent: hasConsent,
    reset: function () {
      try {
        if (window.localStorage) window.localStorage.removeItem(STORAGE_KEY);
      } catch (err) {}
    }
  };
})();
