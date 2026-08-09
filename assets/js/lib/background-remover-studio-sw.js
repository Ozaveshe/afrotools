(function () {
  'use strict';

  if (document.documentElement.lang !== 'sw') return;

  var exact = new Map([
    ['Ready. Add an image, choose a recipe, then remove the background.', 'Tayari. Ongeza picha, chagua mpangilio, kisha ondoa mandharinyuma.'],
    ['AI person cutout selected. The model downloads only when you run it.', 'Hali ya kukata picha ya mtu kwa AI imechaguliwa. Modeli hupakuliwa tu unapoianzisha.'],
    ['Color key selected. Pick a background sample or use the corner sample.', 'Rangi maalum imechaguliwa. Chagua sampuli ya mandharinyuma au tumia sampuli ya pembe.'],
    ['Smart edge cleanup selected. Best for a clear subject against a plain background.', 'Usafishaji mahiri wa kingo umechaguliwa. Unafaa kwa mhusika aliye wazi mbele ya mandharinyuma rahisi.'],
    ['Click preview', 'Bofya muonekano'],
    ['Click a background area in either preview to sample that color.', 'Bofya sehemu ya mandharinyuma kwenye muonekano wowote ili kuchukua rangi hiyo.'],
    ['Load an image before picking a background sample.', 'Pakia picha kabla ya kuchagua sampuli ya mandharinyuma.'],
    ['Mask reset. Run a cutout recipe or refine manually.', 'Maski imerudishwa. Endesha mpangilio wa kukata au safisha kwa mkono.'],
    ['Pick from image', 'Chagua kwenye picha'],
    ['Background sample updated. Run the cutout recipe again for the new color.', 'Sampuli ya mandharinyuma imesasishwa. Endesha mpangilio tena kwa rangi mpya.'],
    ['Loading queued image...', 'Picha ya foleni inapakiwa...'],
    ['This image could not be decoded by the browser. Try JPG, PNG, or WebP.', 'Kivinjari hakikuweza kusoma picha hii. Jaribu JPG, PNG au WebP.'],
    ['Loading the in-browser person model...', 'Modeli ya mtu ya ndani ya kivinjari inapakiwa...'],
    ['Running person cutout on this device...', 'Picha ya mtu inakatwa kwenye kifaa hiki...'],
    ['Background removed. Refine the edge or render an export.', 'Mandharinyuma yameondolewa. Safisha kingo au andaa faili.'],
    ['AI model was not available, so smart edge cleanup was applied instead.', 'Modeli ya AI haikupatikana, kwa hiyo usafishaji mahiri wa kingo umetumika.'],
    ['Could not process this image. Try a lower-resolution image or another method.', 'Picha haikuweza kuchakatwa. Jaribu picha ndogo zaidi au njia nyingine.'],
    ['Load an image before removing a background.', 'Pakia picha kabla ya kuondoa mandharinyuma.'],
    ['Brush ready', 'Brashi iko tayari'],
    ['Mask not cut', 'Maski haijakatwa'],
    ['Export rendered. Download or copy the handoff brief.', 'Faili imeandaliwa. Pakua au nakili muhtasari wa kazi.'],
    ['Export failed. Try a smaller max width or PNG format.', 'Faili haikuandaliwa. Jaribu upana mdogo zaidi au format ya PNG.'],
    ['Remove the background before rendering an export.', 'Ondoa mandharinyuma kabla ya kuandaa faili.'],
    ['Handoff brief copied.', 'Muhtasari wa kazi umenakiliwa.'],
    ['Could not copy automatically. Select the brief from the browser permission prompt if shown.', 'Haikuwezekana kunakili moja kwa moja. Ruhusu clipboard kwenye kivinjari kisha ujaribu tena.'],
    ['Refine step undone.', 'Hatua ya usafishaji imetenguliwa.'],
    ['Not processed', 'Haijachakatwa'],
    ['Working...', 'Inachakata...'],
    ['Rendering...', 'Inaandaa faili...'],
    ['Remove background', 'Ondoa mandharinyuma'],
    ['Process queue', 'Chakata foleni'],
    ['Render export', 'Andaa faili'],
    ['Rendered exports will appear here without storing the image itself.', 'Faili zilizoandaliwa zitaonekana hapa bila kuhifadhi picha yenyewe.'],
    ['Processed', 'Imechakatwa'],
    ['Load', 'Pakia'],
    ['Product', 'Bidhaa'],
    ['Portrait', 'Picha ya mtu'],
    ['Signature', 'Saini'],
    ['Creator asset', 'Nyenzo ya mtayarishi'],
    ['AI person cutout', 'Kukata picha ya mtu kwa AI'],
    ['color key cleanup', 'usafishaji kwa rangi maalum'],
    ['smart edge cleanup', 'usafishaji mahiri wa kingo'],
    ['transparent', 'wazi'],
    ['white for JPG export', 'nyeupe kwa faili ya JPG'],
    ['custom', 'maalum']
  ]);

  function translate(value) {
    var text = String(value || '');
    if (exact.has(text)) return exact.get(text);
    var match;
    if ((match = text.match(/^(.+) recipe loaded\. Run background removal to apply it\.$/))) {
      return translate(match[1]) + ' umewekwa. Endesha uondoaji wa mandharinyuma ili kuutumia.';
    }
    if ((match = text.match(/^(\d+) images? added to the queue\.$/))) return match[1] + ' picha zimeongezwa kwenye foleni.';
    if ((match = text.match(/^Loading (.+)\.\.\.$/))) return 'Inapakia ' + match[1] + '...';
    if ((match = text.match(/^Loaded (.+)\. Choose a recipe and remove the background\.$/))) return match[1] + ' imepakiwa. Chagua mpangilio kisha ondoa mandharinyuma.';
    if ((match = text.match(/^Processed (\d+) queued images?\. The last result is ready to download\.$/))) return 'Picha ' + match[1] + ' za foleni zimechakatwa. Matokeo ya mwisho yako tayari kupakuliwa.';
    if (/^Choose a JPG, PNG, WebP, SVG/.test(text)) return 'Chagua faili ya JPG, PNG, WebP, SVG au picha nyingine inayokubaliwa na kivinjari.';
    return text;
  }

  function localizeNode(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.children.length === 0 && node.textContent) {
      var localized = translate(node.textContent.trim());
      if (localized !== node.textContent.trim()) node.textContent = localized;
    }
    node.querySelectorAll('*').forEach(function (child) {
      if (child.children.length !== 0 || !child.textContent) return;
      var localized = translate(child.textContent.trim());
      if (localized !== child.textContent.trim()) child.textContent = localized;
    });
  }

  function copySwahiliBrief(event) {
    var button = event.target.closest && event.target.closest('#brCopyBriefBtn');
    if (!button || button.disabled) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var source = document.getElementById('brSourceStat');
    var removed = document.getElementById('brRemovedStat');
    var output = document.getElementById('brExportStat');
    var recipe = document.getElementById('brRecipeStat');
    var brief = [
      'Muhtasari wa Studio ya Kuondoa Mandharinyuma',
      'Picha chanzo: ' + (source ? source.textContent : '-'),
      'Mpangilio: ' + translate(recipe ? recipe.textContent : '-'),
      'Sehemu iliyoondolewa: ' + (removed ? translate(removed.textContent) : '-'),
      'Faili: ' + (output ? output.textContent : '-'),
      'Picha imebaki ndani ya kipindi hiki cha kivinjari. Hali ya mtu kwa AI, ikitumika, hupakua modeli ya kivinjari bila kupakia picha.'
    ].join('\n');
    var write = navigator.clipboard && navigator.clipboard.writeText
      ? navigator.clipboard.writeText(brief)
      : Promise.reject(new Error('clipboard unavailable'));
    write.then(function () {
      var status = document.getElementById('brStatus');
      if (status) status.textContent = 'Muhtasari wa kazi umenakiliwa.';
    }).catch(function () {
      var area = document.createElement('textarea');
      area.value = brief;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); } finally { area.remove(); }
    });
  }

  document.addEventListener('click', copySwahiliBrief, true);
  var observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      if (record.type === 'characterData') localizeNode(record.target.parentElement);
      record.addedNodes.forEach(function (node) { localizeNode(node); });
      if (record.target && record.target.nodeType === Node.ELEMENT_NODE) localizeNode(record.target);
    });
  });

  function start() {
    var studio = document.querySelector('.br-studio');
    if (!studio) return;
    localizeNode(studio);
    observer.observe(studio, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());
