(function () {
  'use strict';

  const exact = new Map(Object.entries({
    'New drawing': 'Mchoro mpya', 'Start fresh': 'Anza upya', 'Open drawing': 'Fungua mchoro',
    'Save': 'Hifadhi', 'Keep this revision': 'Hifadhi toleo hili', 'Save as': 'Hifadhi kama',
    'Export DXF': 'Hamisha DXF', 'Share with CAD': 'Shiriki na CAD', 'Recent': 'Ya hivi karibuni',
    'Jump back in': 'Endelea ulipoishia', 'Line': 'Mstari', 'Polyline': 'Mstari mfululizo',
    'Circle': 'Duara', 'Rectangle': 'Mstatili', 'Text': 'Maandishi', 'Dimension': 'Kipimo',
    'Hatch': 'Ujazaji', 'Offset': 'Sogezo sambamba', 'Trim': 'Punguza', 'Layers': 'Tabaka',
    'Blocks': 'Vitalu', 'Properties': 'Sifa', 'Command:': 'Amri:', 'No selection': 'Hakuna kilichochaguliwa',
    'Quick': 'Haraka', 'Quick Actions': 'Vitendo vya haraka', 'Draw': 'Chora', 'Edit': 'Hariri', 'Annotate': 'Weka maelezo',
    'Setup': 'Mipangilio', 'All': 'Zote', 'Project': 'Mradi', 'Canvas': 'Eneo la kuchora',
    'Inspector': 'Mkaguzi', 'Selection': 'Uteuzi', 'View': 'Mwonekano', 'Layout': 'Mpangilio',
    'Session': 'Kikao', 'History': 'Historia', 'Tools': 'Zana', 'Command': 'Amri', 'COMMAND': 'AMRI', 'Close': 'Funga',
    'Cancel': 'Ghairi', 'Apply': 'Tumia', 'Delete': 'Futa', 'Create': 'Unda', 'Restore': 'Rejesha',
    'Loading...': 'Inapakia...', 'No matching commands': 'Hakuna amri inayolingana',
    'Type a command...': 'Andika amri...', 'Type a command name...': 'Andika jina la amri...',
    'New Drawing': 'Mchoro Mpya', 'Open Drawing': 'Fungua Mchoro', 'Save Drawing': 'Hifadhi Mchoro',
    'Save As': 'Hifadhi kama', 'SAVE AS': 'HIFADHI KAMA', 'Save As JSON': 'Hifadhi kama JSON', 'Export SVG': 'Hamisha SVG', 'Export PNG': 'Hamisha PNG',
    'File': 'Faili', 'Modify': 'Hariri', 'Drawing setup': 'Mipangilio ya mchoro', 'Drawing Info': 'Taarifa za mchoro',
    'Recent Drawings': 'Michoro ya hivi karibuni', 'Layer Manager': 'Kidhibiti cha tabaka',
    'Drawing Limits': 'Mipaka ya mchoro', 'Drawing Units': 'Vipimo vya mchoro',
    'Entity List': 'Orodha ya vipengele', 'Go To Coordinate': 'Nenda kwenye uratibu',
    'Print / Plot': 'Chapisha / Panga', 'Print to PDF': 'Chapisha PDF',
    'Paper Size': 'Ukubwa wa karatasi', 'Orientation': 'Mwelekeo', 'Landscape': 'Mlalo',
    'Portrait': 'Wima', 'Scale': 'Skeli', 'Fit to Page': 'Toshea ukurasa',
    'Color Mode': 'Hali ya rangi', 'Full Color': 'Rangi kamili', 'Monochrome': 'Nyeusi na nyeupe',
    'Plot Area': 'Eneo la kuchapisha', 'Drawing Extents': 'Mipaka ya mchoro',
    'Current Display': 'Mwonekano wa sasa', 'Margin (mm)': 'Pambizo (mm)',
    'Select Color': 'Chagua rangi', 'Standard Colors': 'Rangi za kawaida',
    'Custom Color': 'Rangi maalum', 'Special': 'Maalum', 'Choose Theme': 'Chagua mandhari',
    'Dark': 'Giza', 'Light': 'Mwanga', 'Blueprint': 'Ramani ya samawati',
    'High Contrast': 'Utofautishaji mkubwa', 'Canvas Background Color': 'Rangi ya usuli wa eneo la kuchora',
    'Preset Colors': 'Rangi zilizowekwa', 'Reset to Theme Default': 'Rudisha rangi ya mandhari',
    'AfroDraft project': 'Mradi wa AfroDraft', 'DXF exchange': 'Ubadilishanaji wa DXF',
    'DWG bridge': 'Daraja la DWG', 'Save drawing': 'Hifadhi mchoro',
    'Save AfroDraft project': 'Hifadhi mradi wa AfroDraft', 'Export DXF copy': 'Hamisha nakala ya DXF',
    'Editable source of truth.': 'Chanzo kinachoweza kuhaririwa.',
    'Shareable 2D CAD handoff.': 'Faili ya CAD ya 2D inayoweza kushirikiwa.',
    'DWG bridge not connected': 'Daraja la DWG halijaunganishwa',
    'DWG save needs a bridge': 'Kuhifadhi DWG kunahitaji daraja',
    'Select geometry first.': 'Chagua umbo kwanza.', 'Nothing to frame yet.': 'Bado hakuna mchoro wa kuonyesha.',
    'Duplicate tool is not available.': 'Zana ya kunakili haipatikani.',
    'Autosave snapshot stored': 'Nakala ya urejeshaji imehifadhiwa',
    'Autosave snapshot cleared': 'Nakala ya urejeshaji imefutwa',
    'No previous view is stored yet.': 'Bado hakuna mwonekano wa awali uliohifadhiwa.',
    'All layers restored': 'Tabaka zote zimerejeshwa', 'No unused layers found': 'Hakuna tabaka zisizotumika',
    'Saved': 'Imehifadhiwa', 'Opened': 'Imefunguliwa', 'Exported': 'Imehamishwa',
    'Success': 'Imefanikiwa', 'Warning': 'Tahadhari', 'Error': 'Hitilafu',
    'Untitled-1': 'Mchoro-1', 'No saved drawings yet. Use Save (Ctrl+S) to store drawings.': 'Bado hakuna mchoro uliohifadhiwa. Tumia Hifadhi (Ctrl+S).',
    'Could not load drawings': 'Michoro haikuweza kupakiwa', 'Unknown': 'Haijulikani',
    'Drawing loaded': 'Mchoro umepakiwa', 'Drawing deleted': 'Mchoro umefutwa',
    'Saved views': 'Mionekano iliyohifadhiwa', 'Layer States': 'Hali za tabaka'
  }));

  const contains = [
    [/\bSave As\b/gi, 'Hifadhi kama'],
    [/\bCommand\b/gi, 'Amri'],
    [/\bexport DXF\b/gi, 'hamisha DXF'],
    [/\bsaved views\b/gi, 'mionekano iliyohifadhiwa'],
    [/\blayer states\b/gi, 'hali za tabaka']
  ];

  const patterns = [
    [/^([0-9]+) objects?$/, '$1 vipengele'], [/^\(([0-9]+) selected\)$/, '($1 vimechaguliwa)'],
    [/^Saved (.+)$/, 'Imehifadhiwa $1'], [/^Opened (.+)$/, 'Imefunguliwa $1'],
    [/^Imported (.+)$/, 'Imeingizwa $1'], [/^Exported (.+)$/, 'Imehamishwa $1'],
    [/^Started (.+)$/, 'Imeanzishwa $1'], [/^Recovered (.+)$/, 'Imerejeshwa $1'],
    [/^Deleted ([0-9]+) items?$/, 'Vipengele $1 vimefutwa'],
    [/^([0-9]+) entities$/, 'vipengele $1'], [/^Theme: (.+)$/, 'Mandhari: $1'],
    [/^Grid: (.+)$/, 'Gridi: $1'], [/^Coords: (.+)$/, 'Uratibu: $1']
  ];

  function translate(value) {
    const input = String(value || '');
    const trimmed = input.trim();
    if (!trimmed) return input;
    let translated = exact.get(trimmed);
    if (!translated) {
      const prefix = [...exact.keys()]
        .sort((a, b) => b.length - a.length)
        .find((key) => trimmed.startsWith(`${key} (`) || trimmed.startsWith(`${key}: `));
      if (prefix) translated = `${exact.get(prefix)}${trimmed.slice(prefix.length)}`;
    }
    if (!translated) {
      for (const [pattern, replacement] of patterns) {
        if (pattern.test(trimmed)) { translated = trimmed.replace(pattern, replacement); break; }
      }
    }
    if (!translated) {
      const replaced = contains.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), trimmed);
      if (replaced !== trimmed) translated = replaced;
    }
    if (!translated) return input;
    return input.replace(trimmed, translated);
  }

  function localizeElement(element) {
    if (!(element instanceof Element)) return;
    const idLabels = {
      'prop-lineweight': 'Unene wa mstari',
      'prop-color': 'Rangi ya kipengele',
      'prop-layer': 'Tabaka la kipengele',
      'prop-linetype': 'Aina ya mstari'
    };
    if (idLabels[element.id] && !element.getAttribute('aria-label')) {
      element.setAttribute('aria-label', idLabels[element.id]);
    }
    for (const attribute of ['title', 'aria-label', 'placeholder']) {
      if (element.hasAttribute(attribute)) {
        const current = element.getAttribute(attribute);
        const next = translate(current);
        if (next !== current) element.setAttribute(attribute, next);
      }
    }
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const next = translate(node.nodeValue);
        if (next !== node.nodeValue) node.nodeValue = next;
      }
    }
  }

  function localizeTree(root) {
    if (root instanceof Element) localizeElement(root);
    root.querySelectorAll?.('*').forEach(localizeElement);
  }

  const originalPrompt = window.prompt?.bind(window);
  const originalConfirm = window.confirm?.bind(window);
  if (originalPrompt) window.prompt = (message, value) => originalPrompt(translate(message), value);
  if (originalConfirm) window.confirm = (message) => originalConfirm(translate(message));

  document.addEventListener('click', async (event) => {
    const button = event.target.closest?.('#plt-print');
    if (!button || !window.app) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    button.disabled = true;
    try {
      const { PdfExporter } = await import('/engineering/afrodraft/src/io/PdfExporter.js');
      const blob = await PdfExporter.export(window.app.engine, window.app.viewport, {
        paperSize: document.querySelector('#plt-paper')?.value || 'A3',
        orientation: document.querySelector('#plt-orient')?.value || 'landscape',
        colorMode: document.querySelector('#plt-color')?.value || 'color',
        margin: Number(document.querySelector('#plt-margin')?.value || 10)
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${window.app._tabs?.[window.app._activeTab]?.name || 'mchoro'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 100);
      document.querySelector('#modal-overlay')?.classList.add('hidden');
      window.app._showToast?.('PDF imehamishwa', 'success');
    } catch (error) {
      window.app._showToast?.(`PDF haikuweza kuhamishwa: ${error.message}`, 'error');
    } finally {
      button.disabled = false;
    }
  }, true);

  function start() {
    document.documentElement.lang = 'sw';
    localizeTree(document.documentElement);
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes' && record.target.id === 'theme-css') {
          const href = record.target.getAttribute('href') || '';
          if (/^(?:\.\/)?assets\/css\/themes\//.test(href)) {
            record.target.setAttribute('href', `/engineering/afrodraft/${href.replace(/^\.\//, '')}`);
          }
          continue;
        }
        if (record.type === 'characterData') {
          const next = translate(record.target.nodeValue);
          if (next !== record.target.nodeValue) record.target.nodeValue = next;
        }
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            const next = translate(node.nodeValue);
            if (next !== node.nodeValue) node.nodeValue = next;
          }
          else if (node.nodeType === Node.ELEMENT_NODE) localizeTree(node);
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['href'] });
    window.AfroToolsSwAfroDraft = Object.freeze({ locale: 'sw', translate, owner: '/engineering/afrodraft/app' });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}());
