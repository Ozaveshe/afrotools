(function () {
  'use strict';

  const replacements = [
    [/^Ready$/, 'Tayari'],
    [/^(\d+) image(?:s)? added\.$/, '$1 picha zimeongezwa.'],
    [/^No supported image files found\.$/, 'Hakuna faili za picha zinazoungwa mkono.'],
    [/^Resizing (\d+) image(?:s)?\.\.\.$/, 'Inabadilisha picha $1...'],
    [/^Resize queue complete\.$/, 'Foleni imekamilika.'],
    [/^Choose at least one target size\.$/, 'Chagua angalau saizi moja ya matokeo.'],
    [/^Keep at least one target active\.$/, 'Acha angalau saizi moja ikiwa imechaguliwa.'],
    [/^Queue cleared\.$/, 'Foleni imefutwa.'],
    [/^(.+) is over 50MB\.$/, '$1 ni kubwa kuliko MB 50.'],
    [/^Queued$/, 'Kwenye foleni'],
    [/^Processing$/, 'Inachakata'],
    [/^Done$/, 'Imekamilika'],
    [/^Needs attention$/, 'Inahitaji ukaguzi'],
    [/^Remove$/, 'Ondoa'],
    [/^View$/, 'Angalia'],
    [/^Save$/, 'Pakua'],
    [/^No images yet\. Add files above to start\.$/, 'Hakuna picha bado. Ongeza faili hapo juu.'],
    [/^Processed exports appear here\.$/, 'Matokeo yaliyotengenezwa yataonekana hapa.'],
    [/^Resized previews appear here\.$/, 'Muonekano wa matokeo utaonekana hapa.'],
    [/^No local run history yet\.$/, 'Hakuna historia ya ndani bado.'],
    [/^(\d+) file(?:s)?, (\d+) export(?:s)?, (.+) total\.$/, '$1 faili, $2 matokeo, jumla $3.'],
    [/^Decoding after resize$/, 'Vipimo vitaonekana baada ya kuchakata'],
    [/^(\d+)% smaller$/, 'ndogo kwa $1%']
  ];

  const status = document.getElementById('resizeStudioStatus');
  const roots = ['resizeStudioStatus', 'resizeFileList', 'resizeOutputList', 'resizeHistoryList', 'resizeDetailDimensions', 'resizeDetailMode']
    .map(id => document.getElementById(id)).filter(Boolean);

  function translateText(value) {
    let result = String(value || '');
    replacements.some(([pattern, replacement]) => {
      if (!pattern.test(result)) return false;
      result = result.replace(pattern, replacement);
      return true;
    });
    return result;
  }

  function localize(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const next = translateText(node.nodeValue.trim());
      if (next && next !== node.nodeValue.trim()) node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), next);
    });
    root.querySelectorAll('[data-action="remove-file"]').forEach(button => { if (button.textContent !== 'Ondoa') button.textContent = 'Ondoa'; });
    root.querySelectorAll('[data-action="select-output"]').forEach(button => { if (button.textContent !== 'Angalia') button.textContent = 'Angalia'; });
    root.querySelectorAll('[data-action="download-output"]').forEach(button => { if (button.textContent !== 'Pakua') button.textContent = 'Pakua'; });
  }

  function localizeAll() { roots.forEach(localize); }

  if (status) {
    const observer = new MutationObserver(localizeAll);
    roots.forEach(root => observer.observe(root, { childList: true, subtree: true, characterData: true }));
    document.addEventListener('input', () => window.setTimeout(localizeAll));
    document.addEventListener('click', () => window.setTimeout(localizeAll));
    window.setTimeout(localizeAll);
  }
}());
