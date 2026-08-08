(function () {
  'use strict';

  const exact = new Map([
    ['Checking browser image encoders...', 'Inakagua encoder za picha za kivinjari...'],
    ['Ready. Drop, paste, or choose photos to filter locally.', 'Tayari. Dondosha, bandika au chagua picha za kuchuja kwenye kifaa hiki.'],
    ['Supported', 'Inatumika'], ['Not available', 'Haipatikani'],
    ['Canvas filter stack', 'Mfumo wa vichujio vya Canvas'],
    ['Export one image first to confirm color and sharpness.', 'Toa picha moja kwanza kuthibitisha rangi na ukali.'],
    ['Use batch zip after the first preview looks right.', 'Tumia ZIP ya kundi baada ya muonekano wa kwanza kuwa sahihi.'],
    ['Choose JPG, PNG, WebP, AVIF, SVG, GIF, or other browser-supported image files.', 'Chagua JPG, PNG, WebP, AVIF, SVG, GIF au picha nyingine inayoungwa mkono.'],
    ['Preview failed. Try a different image format.', 'Muonekano umeshindwa. Jaribu format nyingine.'],
    ['Upload an image to compare the original and edited result.', 'Pakia picha ili kulinganisha chanzo na matokeo.'],
    ['Rendering current image...', 'Inatengeneza picha ya sasa...'],
    ['Current filtered image is ready to download.', 'Picha ya sasa iliyochujwa iko tayari kupakuliwa.'],
    ['Export failed. Try another format.', 'Utoaji umeshindwa. Jaribu format nyingine.'],
    ['Upload an image first.', 'Pakia picha kwanza.'],
    ['Batch filter zip is ready.', 'ZIP ya kundi la vichujio iko tayari.'],
    ['Batch export failed.', 'Utoaji wa kundi umeshindwa.'],
    ['Zip packaging is not available on this page.', 'Ufungashaji wa ZIP haupatikani kwenye ukurasa huu.'],
    ['Upload images before building a batch.', 'Pakia picha kabla ya kutengeneza kundi.'],
    ['Filter recipe copied.', 'Mapishi ya kichujio yamenakiliwa.'],
    ['Clipboard copy failed.', 'Kunakili kwenye clipboard kumeshindwa.'],
    ['Clipboard is not available in this browser.', 'Clipboard haipatikani kwenye kivinjari hiki.'],
    ['Clean photo', 'Picha safi'], ['Warm market', 'Soko lenye joto'], ['Cool dusk', 'Jioni tulivu'],
    ['Vintage print', 'Chapisho la zamani'], ['Mono newsprint', 'Gazeti nyeusi na nyeupe'],
    ['Soft portrait', 'Picha laini ya mtu'], ['Product clarity', 'Uwazi wa bidhaa'],
    ['Food pop', 'Chakula angavu'], ['Document scan', 'Scan ya hati'],
    ['Current image export', 'Tokeo la picha ya sasa']
  ]);
  const patterns = [
    [/^(\d+) image(?:s)? ready for filters\.$/, '$1 picha ziko tayari kuchujwa.'],
    [/^Converting (\d+) of (\d+)\.\.\.$/, 'Inachakata $1 kati ya $2...'],
    [/^(.+) look applied\.$/, 'Mwonekano wa $1 umetumika.'],
    [/^(\d+) file(?:s)? \| (.+)$/, '$1 faili | $2']
  ];
  const ids = ['filtersStatus', 'filtersQueue', 'filtersSupportList', 'filtersGuideTitle', 'filtersGuideIntro', 'filtersGuideList', 'filtersHistoryList', 'filtersRecipeName', 'filtersLastExport'];
  const roots = ids.map(id => document.getElementById(id)).filter(Boolean);

  function translate(value) {
    const raw = String(value || '').trim();
    if (exact.has(raw)) return exact.get(raw);
    for (const [pattern, replacement] of patterns) if (pattern.test(raw)) return raw.replace(pattern, replacement);
    return raw;
  }
  function localize(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const raw = node.nodeValue.trim();
      const next = translate(raw);
      if (raw && next !== raw) node.nodeValue = node.nodeValue.replace(raw, next);
    });
  }
  const observer = new MutationObserver(() => roots.forEach(localize));
  roots.forEach(root => observer.observe(root, { childList: true, subtree: true, characterData: true }));
  window.setTimeout(() => roots.forEach(localize));
}());
