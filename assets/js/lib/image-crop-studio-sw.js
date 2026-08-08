(function () {
  'use strict';

  const exact = new Map([
    ['Choose an image to begin.', 'Chagua picha ili uanze.'],
    ['Recent exports will appear here after your first crop.', 'Picha ulizotayarisha zitaonekana hapa baada ya upakuaji wa kwanza.'],
    ['Try an image under 25 MB for this browser editor.', 'Jaribu picha iliyo chini ya MB 25.'],
    ['Loading image...', 'Picha inafunguliwa...'],
    ['This image could not be loaded.', 'Picha hii haikuweza kufunguliwa.'],
    ['Choose a valid image file.', 'Chagua faili halali ya picha.'],
    ['Transform reset.', 'Mabadiliko yamewekwa upya.'],
    ['Enter valid crop coordinates.', 'Andika nafasi halali za kukata.'],
    ['Exact crop selection applied.', 'Eneo kamili la kukata limetumika.'],
    ['Load an image before applying a selection.', 'Chagua picha kabla ya kutumia eneo.'],
    ['Crop exported.', 'Picha iliyokatwa imeandaliwa.'],
    ['Export failed in this browser.', 'Upakuaji haukuandaliwa kwenye kivinjari hiki.'],
    ['Load an image before exporting.', 'Chagua picha kabla ya kuandaa matokeo.'],
    ['Crop recipe copied.', 'Maelekezo ya kukata yamenakiliwa.'],
    ['Copy is unavailable in this browser.', 'Kunakili hakupatikani kwenye kivinjari hiki.'],
    ['No image', 'Hakuna picha']
  ]);

  function translateText(value) {
    const text = String(value || '').trim();
    if (exact.has(text)) return exact.get(text);
    const loaded = text.match(/^([\d,.]+ x [\d,.]+ px) loaded\.$/);
    if (loaded) return `${loaded[1]} imefunguliwa.`;
    return value;
  }

  function translateNode(node) {
    if (!node) return;
    const translated = translateText(node.textContent);
    if (translated !== node.textContent) node.textContent = translated;
  }

  function translateTransform(node) {
    if (!node || !node.textContent || node.textContent === '-') return;
    const translated = node.textContent.replace(/deg/g, '°').replace(/ H/g, ' mlalo').replace(/ V/g, ' wima');
    if (translated !== node.textContent) node.textContent = translated;
  }

  function copyFallback(value) {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }

  function init() {
    const status = document.getElementById('cropStudioStatus');
    const history = document.getElementById('cropHistoryList');
    const selection = document.getElementById('cropDetailSelection');
    const transform = document.getElementById('cropDetailTransform');
    [status, history, selection].forEach(translateNode);
    translateTransform(transform);

    const observer = new MutationObserver(() => {
      [status, history, selection].forEach(translateNode);
      translateTransform(transform);
    });
    [status, history, selection, transform].filter(Boolean).forEach(node => observer.observe(node, { childList: true, characterData: true, subtree: true }));

    const copyButton = document.getElementById('cropCopyRecipeBtn');
    if (copyButton) {
      copyButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const active = document.querySelector('[data-crop-target].active strong');
        const recipe = [
          'AfroTools — Kukata Picha',
          `Uwiano: ${active ? active.textContent.trim() : 'Huru'}`,
          `Eneo: ${selection ? selection.textContent.trim() : '-'}`,
          `Matokeo: ${document.getElementById('cropDetailOutput').textContent.trim()}`,
          `Mabadiliko: ${transform ? transform.textContent.trim() : '-'}`
        ].join('\n');
        const done = () => { if (status) status.textContent = 'Maelekezo ya kukata yamenakiliwa.'; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(recipe).then(done).catch(() => { copyFallback(recipe); done(); });
        else { copyFallback(recipe); done(); }
      }, true);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
