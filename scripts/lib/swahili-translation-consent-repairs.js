"use strict";

const EXTERNAL_CONSENT_SCRIPT = '<script src="/assets/js/lib/external-translation-consent.js" defer></script>';

function insertBeforeHeadEnd(html, markup) {
  if (html.includes(markup)) return html;
  return html.replace(/<\/head>/i, `${markup}\n</head>`);
}

function replaceFunctionBeforeMarker(html, functionName, marker, replacement) {
  const escapedName = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`function\\s+${escapedName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}\\s*\\n\\s*(?=${marker})`);
  if (!pattern.test(html)) {
    throw new Error(`Unable to locate ${functionName} before ${marker}`);
  }
  return html.replace(pattern, `${replacement}\n\n`);
}

function repairPidginTranslatorConsent(source) {
  // Cache-busting versions this tag after generation. Normalize both raw and
  // versioned copies first so repeated cross-platform builds stay idempotent.
  let html = source.replace(
    /[ \t]*<script\b[^>]*\bsrc=["']\/assets\/js\/lib\/external-translation-consent\.js(?:\?v=[a-f0-9]{8})?["'][^>]*><\/script>[ \t]*\r?\n?/gi,
    ''
  );
  html = insertBeforeHeadEnd(html, EXTERNAL_CONSENT_SCRIPT);

  if (!html.includes('id="pidginTranslationConsent"')) {
    html = html.replace(
      /(<div class="translate-actions">)/,
      '<div id="pidginTranslationConsent" data-tool-id="pidgin-translator"></div>\n$1'
    );
  }

  html = html.replace(
    /(<button\b[^>]*\bid="translateBtn"[^>]*)(?<!\sdisabled)>/i,
    '$1 disabled>'
  );
  html = html.replace(
    /<span class="translate-status" id="translateStatus"(?:\s+role="status")?(?:\s+aria-live="polite")?><\/span>/i,
    '<span class="translate-status" id="translateStatus" role="status" aria-live="polite"></span>'
  );

  if (!html.includes('onclick="clearCloudTranslation()"')) {
    html = html.replace(
      /(<span class="translate-status" id="translateStatus"[^>]*><\/span>)/i,
      '<button type="button" class="p-btn" onclick="clearCloudTranslation()">Futa maandishi</button>\n$1'
    );
  }

  html = replaceFunctionBeforeMarker(
    html,
    "doTranslate",
    "\\/\\*",
    `function doTranslate() {
  var consent = window.AfroTools && window.AfroTools.ExternalTranslationConsent;
  if (!consent || !consent.requireConsent('pidgin-translator', 'Tafsiri ya cloud imezimwa. Soma taarifa na ukubali kwanza.')) {
    document.getElementById('translateStatus').textContent = 'Hakuna maandishi yaliyotumwa. Tafsiri ya cloud inahitaji idhini yako ya wazi.';
    return;
  }
  var text = document.getElementById('srcText').value.trim();
  if (!text) return;
  var btn = document.getElementById('translateBtn');
  var status = document.getElementById('translateStatus');
  btn.disabled = true;
  btn.textContent = 'Inatafsiri...';
  status.textContent = '';
  var src = swapped ? 'pcm' : 'en';
  var tgt = swapped ? 'en' : 'pcm';
  var requestHeaders = Object.assign({'Content-Type': 'application/json'}, consent.headers('pidgin-translator'));
  fetch('/api/translate', {
    method: 'POST',
    headers: requestHeaders,
    credentials: 'same-origin',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify({text: text, source: src, target: tgt, allowFallback: false})
  }).then(function(r){ return r.json().catch(function(){ return {}; }).then(function(data){ return {response:r,data:data}; }); })
  .then(function(result) {
    var r = result.response;
    var d = result.data;
    if (!r.ok) {
      if (r.status === 428) consent.reset('pidgin-translator');
      document.getElementById('tgtOutput').textContent = 'Tafsiri ya cloud haipatikani. Tumia phrasebook ya ndani.';
      status.textContent = d.message || d.error || 'Hakuna tafsiri ya nje iliyorudishwa.';
      return;
    }
    document.getElementById('tgtOutput').textContent = d.translatedText || 'Tafsiri haipatikani';
    status.textContent = d.provider ? 'kupitia ' + d.provider + (d.unchanged ? ' | haijabadilika; hakiki matokeo' : '') : '';
  }).catch(function() {
    document.getElementById('tgtOutput').textContent = 'Tafsiri ya cloud haipatikani. Tumia phrasebook ya ndani.';
    status.textContent = 'Hitilafu ya muunganisho. Hakuna matokeo yaliyohifadhiwa.';
  }).finally(function() {
    btn.disabled = !(consent && consent.hasConsent('pidgin-translator'));
    btn.textContent = 'Tafsiri \\u2192';
  });
}

function clearCloudTranslation() {
  document.getElementById('srcText').value = '';
  document.getElementById('tgtOutput').textContent = 'Tafsiri itaonekana hapa baada ya kukubali.';
  document.getElementById('translateStatus').textContent = 'Maandishi na hali ya muda ya tafsiri imefutwa.';
  document.getElementById('srcText').focus();
}

function initExternalTranslationConsent() {
  var consent = window.AfroTools && window.AfroTools.ExternalTranslationConsent;
  var host = document.getElementById('pidginTranslationConsent');
  var button = document.getElementById('translateBtn');
  if (!consent || !host || !button) return;
  consent.render(host, {toolId: 'pidgin-translator', primaryProvider: 'MyMemory'});
  host.addEventListener('afrotools:external-translation-consent-change', function() {
    button.disabled = !consent.hasConsent('pidgin-translator');
  });
}`
  );

  if (!html.includes("DOMContentLoaded', initExternalTranslationConsent")) {
    html = html.replace(
      /(\binitPB\(\);\s*)(?=<\/script>)/,
      `$1if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExternalTranslationConsent, {once:true});
} else {
  initExternalTranslationConsent();
}
`
    );
  }

  return html;
}

function repairPdfTranslatorConsent(source) {
  let html = source;

  if (!html.includes('id="cloudConsent"')) {
    html = html.replace(
      /(<label class="check-row">\s*<input\b[^>]*\bid="preserveNumbers"[^>]*>[\s\S]*?<\/label>)(\s*<div class="option-note" id="engineNote">)/i,
      `$1
            <label class="check-row">
              <input type="checkbox" id="cloudConsent">
              <span>Tuma maandishi yaliyotolewa kutoka PDF kwa API/AI ya cloud kwa ombi hili pekee. Acha bila kuchagua na utumie rasimu ya ndani kwa vitambulisho, mikataba, afya, shule, sheria au hati za mteja.</span>
            </label>$2`
    );
  }

  if (!html.includes("const cloudConsent = $('cloudConsent');")) {
    html = html.replace(
      /(const preserveNumbers = \$\('preserveNumbers'\);\s*)/,
      "$1const cloudConsent = $('cloudConsent');\n  "
    );
  }

  if (!html.includes("function hasCloudContentConsent()")) {
    html = html.replace(
      /(\s+function resetState\(\) \{)/,
      `
  function hasCloudContentConsent() {
    var consentApi = window.AfroTools && window.AfroTools.AIConsent;
    return !!(consentApi && typeof consentApi.hasConsent === 'function' &&
      consentApi.hasConsent('ai_optional_content_included', 'pdf-translate'));
  }

  function ensureCloudContentConsent(requireFresh) {
    var consentApi = window.AfroTools && window.AfroTools.AIConsent;
    return !!(consentApi && typeof consentApi.ensureConsent === 'function' && consentApi.ensureConsent({
      mode: 'ai_optional_content_included',
      toolId: 'pdf-translate',
      action: 'Tuma maandishi ya PDF yaliyotolewa kwa tafsiri',
      contentIncluded: true,
      requireFresh: !!requireFresh
    }));
  }
$1`
    );
  }

  html = html.replace(
    /headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\},\s*body:\s*JSON\.stringify\(\{/,
    `headers: {
          'Content-Type': 'application/json',
          'X-AfroTools-External-Translation-Consent': 'accepted',
          'X-AfroTools-AI-Consent': 'accepted',
          'X-AfroTools-AI-Content-Consent': 'accepted'
        },
        credentials: 'same-origin',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({`
  );

  html = html.replace(
    /(target:\s*tgt\s*)(\n\s*\}\))/,
    "$1,\n          allowFallback: false$2"
  );

  if (!html.includes("external-translation-consent-required")) {
    html = html.replace(
      /(if \(response\.status === 404 \|\| response\.status === 405 \|\| response\.status === 501 \|\| response\.status >= 500\) \{)/,
      `if (response.status === 428) {
        if (cloudConsent) cloudConsent.checked = false;
        throw new Error('external-translation-consent-required');
      }
      $1`
    );
  }

  html = html.replace(
    /var headers = \{ 'Content-Type': 'application\/json' \};/,
    `var headers = {
        'Content-Type': 'application/json',
        'X-AfroTools-AI-Consent': 'accepted',
        'X-AfroTools-AI-Content-Consent': 'accepted'
      };`
  );

  if (!html.includes("cloudConsent.addEventListener('change'")) {
    html = html.replace(
      /(engineMode\.addEventListener\('change', updateEngineNote\);\s*updateEngineNote\(\);)/,
      `$1
  cloudConsent.addEventListener('change', function() {
    if (!this.checked) return;
    if (!ensureCloudContentConsent(true)) {
      this.checked = false;
      showWarning('Tafsiri ya cloud imebaki imezimwa. Rasimu ya glossary ya ndani bado inapatikana.');
      return;
    }
    showNotice('Tafsiri ya cloud imewashwa kwa idhini ya maudhui ya hati katika kipindi hiki cha ukurasa.');
  });`
    );
  }

  if (!html.includes("Tafsiri ya cloud inahitaji idhini ya maudhui ya hati")) {
    html = html.replace(
      /(var settings = \{\s*mode: engineMode\.value,\s*domain: domainPreset\.value,\s*preserveNumbers: preserveNumbers\.checked\s*\};)/,
      `$1

    if (cloudModeSelected(settings.mode) && cloudConsent && !cloudConsent.checked) {
      showError('API/AI ya cloud hutuma maandishi yaliyotolewa kutoka PDF. Chagua idhini au badili hali iwe rasimu ya glossary ya ndani pekee.');
      return;
    }
    if (cloudModeSelected(settings.mode) && !hasCloudContentConsent()) {
      cloudConsent.checked = false;
      showError('Tafsiri ya cloud inahitaji idhini ya maudhui ya hati. Soma taarifa ya idhini au tumia rasimu ya glossary ya ndani pekee.');
      return;
    }`
    );
  }

  return html;
}

module.exports = {
  EXTERNAL_CONSENT_SCRIPT,
  repairPdfTranslatorConsent,
  repairPidginTranslatorConsent
};
