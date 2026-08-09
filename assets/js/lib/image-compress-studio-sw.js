(function () {
  'use strict';

  const exact = new Map([
    ['Ready', 'Tayari'],
    ['Queued', 'Kwenye foleni'],
    ['Processing', 'Inachakatwa'],
    ['Done', 'Imekamilika'],
    ['Needs attention', 'Inahitaji kukaguliwa'],
    ['Waiting', 'Inasubiri'],
    ['View', 'Angalia'],
    ['Save', 'Pakua'],
    ['Remove', 'Ondoa'],
    ['Queue complete.', 'Foleni imekamilika.'],
    ['Queue cleared.', 'Foleni imefutwa.'],
    ['No supported image files found.', 'Hakuna faili ya picha inayotumika iliyopatikana.'],
    ['No images yet. Add files above to start.', 'Bado hakuna picha. Ongeza faili hapo juu kuanza.'],
    ['No local run history yet.', 'Bado hakuna historia ya kazi ndani ya kifaa.'],
    ['This browser could not encode the requested format.', 'Kivinjari hiki hakikuweza kuunda format iliyoombwa.'],
    ['The browser could not decode this image.', 'Kivinjari hakikuweza kufungua picha hii.'],
    ['Canvas is not available in this browser.', 'Canvas haipatikani kwenye kivinjari hiki.'],
    ['Compression failed.', 'Kubana kumeshindwa.'],
    ['WhatsApp Share keeps images light for chats, statuses, and community updates on limited data.', 'Kushiriki WhatsApp huweka picha nyepesi kwa gumzo, status na taarifa za jamii kwenye data ndogo.'],
    ['Portal Upload aims for a practical size limit while keeping faces, text, and document details readable.', 'Kupakia kwenye portal hulenga ukubwa unaofaa huku nyuso, maandishi na maelezo ya hati yakibaki wazi.'],
    ['Marketplace preserves product clarity for shops, menus, seller catalogs, and listing photos.', 'Soko la mtandaoni huhifadhi uwazi wa bidhaa kwa maduka, menyu, katalogi na picha za matangazo.'],
    ['Fast Website creates lighter WebP exports for pages, blogs, and low-bandwidth browsing.', 'Tovuti nyepesi huunda faili za WebP kwa kurasa, blogu na matumizi ya intaneti yenye kasi ndogo.']
  ]);

  function translate(raw) {
    const value = String(raw || '').trim();
    if (!value) return value;
    if (exact.has(value)) return exact.get(value);
    let match = value.match(/^(\d+) images? added\.$/);
    if (match) return `Picha ${match[1]} zimeongezwa.`;
    match = value.match(/^Compressing (\d+) images?\.\.\.$/);
    if (match) return `Inabana picha ${match[1]}...`;
    match = value.match(/^(.+) is over 50MB\.$/);
    if (match) return `${match[1]} inazidi MB 50.`;
    match = value.match(/^(\d+(?:\.\d+)?)% saved$/);
    if (match) return `${match[1]}% imeokolewa`;
    match = value.match(/^(\d+) files?, (.+) to (.+), (\d+)% saved\.$/);
    if (match) return `Faili ${match[1]}, ${match[2]} hadi ${match[3]}, ${match[4]}% imeokolewa.`;
    return value;
  }

  function localize(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const raw = node.nodeValue.trim();
      const translated = translate(raw);
      if (raw && translated !== raw) node.nodeValue = node.nodeValue.replace(raw, translated);
    });
  }

  const roots = ['studioStatus', 'presetNote', 'queueList', 'historyList']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const observer = new MutationObserver(() => roots.forEach(localize));
  roots.forEach((root) => {
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    localize(root);
  });
}());
