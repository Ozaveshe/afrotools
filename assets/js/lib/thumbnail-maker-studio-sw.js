(function () {
  'use strict';

  const exact = new Map([
    ['Ready', 'Tayari'], ['Saved locally', 'Imehifadhiwa kwenye kifaa'], ['Preview updated', 'Muonekano umesasishwa'],
    ['Hook ideas ready', 'Mawazo ya hook yako tayari'], ['Exporting variants', 'Inatoa matoleo'], ['A/B variants exported', 'Matoleo ya A/B yametolewa'], ['Export failed', 'Utoaji umeshindwa'],
    ['Copy failed', 'Kunakili kumeshindwa'], ['Brand kit saved', 'Seti ya brand imehifadhiwa'], ['Brand kit too large', 'Seti ya brand ni kubwa mno'],
    ['Brand kit loaded', 'Seti ya brand imepakiwa'], ['No saved brand kit yet', 'Hakuna seti ya brand iliyohifadhiwa'], ['Reset complete', 'Imerejeshwa'],
    ['Image could not load', 'Picha haikuweza kufunguka'], ['Choose an image file', 'Chagua faili ya picha'], ['Choose image', 'Chagua picha'], ['Choose subject', 'Chagua mhusika'], ['Choose logo', 'Chagua logo'],
    ['Background image', 'Picha ya mandharinyuma'], ['Subject photo', 'Picha ya mhusika'], ['Logo', 'Logo'],
    ['YouTube recommended', 'YouTube inayopendekezwa'], ['Current large 16:9 upload size', 'Saizi kubwa ya sasa ya upakiaji wa 16:9'], ['YouTube compact', 'YouTube ndogo'], ['Lightweight 16:9 export', 'Faili jepesi la 16:9'],
    ['Full HD draft', 'Rasimu ya Full HD'], ['High-resolution source export', 'Faili chanzo lenye ubora wa juu'], ['Shorts cover draft', 'Rasimu ya jalada la Shorts'], ['Vertical cover reuse', 'Jalada la wima la kutumia tena'], ['Square promo', 'Promo ya mraba'], ['Community and cross-posting', 'Jamii na kuchapisha sehemu nyingi'],
    ['Punch red', 'Nyekundu nzito'], ['Gold rush', 'Dhahabu'], ['Lagoon blue', 'Bluu ya lagoon'], ['Studio purple', 'Zambarau ya studio'], ['Clean paper', 'Karatasi safi'], ['Fire orange', 'Machungwa ya moto'],
    ['Reaction', 'Mwitikio'], ['Face, shock, big claim', 'Uso, mshangao na dai kubwa'], ['Explainer', 'Maelezo'], ['Tutorial or how-to', 'Mafunzo au hatua za kufanya'], ['Review', 'Tathmini'], ['Product, app, movie', 'Bidhaa, app au filamu'],
    ['Football', 'Soka'], ['Match recap or preview', 'Muhtasari au utangulizi wa mechi'], ['Music drop', 'Muziki mpya'], ['Afrobeats, amapiano, gospel', 'Afrobeats, amapiano au gospel'], ['Food', 'Chakula'], ['Recipe or street food', 'Mapishi au chakula cha mtaani'],
    ['Education', 'Elimu'], ['Exam, lesson, class', 'Mtihani, somo au darasa'], ['News', 'Habari'], ['Update or analysis', 'Taarifa au uchambuzi'], ['Podcast', 'Podcast'], ['Interview or clip', 'Mahojiano au kipande'], ['List', 'Orodha'], ['Ranking or countdown', 'Mpangilio au kuhesabu kurudi'],
    ['Current large YouTube 16:9 canvas is selected: 3840 x 2160 px.', 'Canvas kubwa ya YouTube ya 16:9 imechaguliwa: 3840 x 2160 px.'], ['Compact 16:9 creator export is selected: 1280 x 720 px.', 'Faili ndogo la mtayarishi la 16:9 limechaguliwa: 1280 x 720 px.'], ['Use a 16:9 canvas for YouTube thumbnail uploads.', 'Tumia canvas ya 16:9 kwa upakiaji wa thumbnail za YouTube.'],
    ['Main text is short enough for mobile feeds.', 'Maandishi makuu ni mafupi vya kutosha kwa feed za simu.'], ['Main text is long. Aim for 3 to 6 words.', 'Maandishi makuu ni marefu. Lenga maneno 3 hadi 6.'], ['Base text contrast is strong.', 'Utofauti wa maandishi ya msingi ni mzuri.'], ['Contrast may be low. Adjust primary or text color.', 'Utofauti unaweza kuwa mdogo. Rekebisha rangi kuu au ya maandishi.'],
    ['A subject or still frame is available.', 'Picha ya mhusika au fremu ya video ipo.'], ['Add a face, object, or still frame for stronger visual pull.', 'Ongeza uso, kitu au fremu ya video ili kuvutia zaidi.'], ['Channel mark is present.', 'Alama ya channel ipo.'], ['Add a channel mark or logo for recognition.', 'Ongeza alama ya channel au logo ili itambulike.'],
    ['Runtime corner guide is visible while editing.', 'Mwongozo wa kona ya muda wa video unaonekana wakati wa kuhariri.'], ['Turn on safe zones before final export.', 'Washa maeneo salama kabla ya kutoa faili la mwisho.'], ['Downloaded thumbnails in this browser will appear here.', 'Thumbnail utakazopakua kwenye kivinjari hiki zitaonekana hapa.'],
    ['Upload brief copied', 'Muhtasari wa upakiaji umenakiliwa'], ['Checklist copied', 'Orodha ya ukaguzi imenakiliwa'], ['Design link copied', 'Link ya design imenakiliwa']
  ]);

  const presetCopy = {
    reaction: { english: 'I DID NOT EXPECT THIS', values: ['Nilijibu mada iliyosambaa', 'SIKUTARAJIA HILI', 'Mwitikio kamili', 'TAZAMA', '@ChannelYako'] },
    explainer: { english: 'HOW IT WORKS', values: ['Jinsi ya kutatua tatizo hili', 'JINSI INAVYOFANYA KAZI', 'Maelezo rahisi', 'MWONGOZO', '@JifunzeNami'] },
    review: { english: 'WORTH IT?', values: ['Tathmini ya kweli baada ya kujaribu', 'INAFAA?', 'Tathmini ya kweli', 'IMEJARIBIWA', '@DawatiLaTathmini'] },
    football: { english: 'MATCH CHANGED EVERYTHING', values: ['Muhtasari wa mechi kubwa', 'MECHI ILIBADILI KILA KITU', 'Matukio muhimu', 'MUHTASARI', '@SautiYaUwanja'] },
    music: { english: 'NEW SOUND ALERT', values: ['Uchambuzi wa wimbo mpya', 'MUZIKI MPYA', 'Nyimbo bora za wiki hii', 'MPYA', '@SautiKilaSiku'] },
    food: { english: 'BEST JOLLOF HACKS', values: ['Mbinu za mapishi ya jollof', 'SIRI BORA ZA JOLLOF', 'Moshi na ladha tele', 'MAPISHI', '@StudioYaJikoni'] },
    education: { english: '5 TIPS TO SCORE HIGHER', values: ['Mwongozo wa maandalizi ya mtihani', 'MBINU 5 ZA KUPATA ALAMA ZAIDI', 'Tumia kabla ya siku ya mtihani', 'SOMA', '@DawatiLaMasomo'] },
    news: { english: 'WHAT JUST HAPPENED?', values: ['Kilichobadilika leo', 'NINI KIMETOKEA?', 'Muktadha kwa dakika chache', 'TAARIFA', '@ChumbaChaHabari'] },
    podcast: { english: 'THE MOMENT EVERYONE MISSED', values: ['Kipande muhimu cha mazungumzo', 'WAKATI AMBAO WENGI WALIKOSA', 'Kipande cha podcast', 'KIPANDE', '@DawatiLaPodcast'] },
    list: { english: 'TOP 7 TO TRY NOW', values: ['Zana au mbinu bora', 'BORA 7 ZA KUJARIBU SASA', 'Namba 4 imenishangaza', 'ORODHA', '@DawatiLaWatayarishi'] }
  };
  const fields = ['thumbVideoIdea', 'thumbHeadline', 'thumbSubline', 'thumbBadge', 'thumbChannel'];
  const rootIds = ['thumbStatus', 'thumbPresetGrid', 'thumbPaletteGrid', 'thumbPreviewTitle', 'thumbHookMetric', 'thumbChecklist', 'thumbHistory', 'thumbHookList', 'thumbBackgroundName', 'thumbSubjectName', 'thumbLogoName'];

  const nativeFillText = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (value, ...args) {
    const localized = value === 'DROP PHOTO' ? 'WEKA PICHA' : value === 'safe area' ? 'eneo salama' : value;
    return nativeFillText.call(this, localized, ...args);
  };

  function translate(raw) {
    const value = String(raw || '').trim();
    if (exact.has(value)) return exact.get(value);
    if (/^Strong (\d+) words$/.test(value)) return value.replace(/^Strong (\d+) words$/, 'Nzuri: maneno $1');
    if (/^Long (\d+) words$/.test(value)) return value.replace(/^Long (\d+) words$/, 'Marefu: maneno $1');
    if (/^Current canvas:/.test(value)) return value.replace('Current canvas:', 'Canvas ya sasa:');
    if (/^Downloaded (.+)$/.test(value)) return `Imepakuliwa: ${translate(value.replace(/^Downloaded /, ''))}`;
    if (/^(Background|Subject|Logo) loaded$/.test(value)) return `${translate(value.replace(/ loaded$/, ''))} imepakiwa`;
    if (/^I TRIED (.+)$/.test(value)) return value.replace(/^I TRIED /, 'NILIJARIBU ');
    if (/^(.+) CHANGED EVERYTHING$/.test(value)) return value.replace(/ CHANGED EVERYTHING$/, ' ILIBADILI KILA KITU');
    if (/^BEFORE YOU TRY (.+)$/.test(value)) return value.replace(/^BEFORE YOU TRY /, 'KABLA HUJARIBU ');
    if (/^THE TRUTH ABOUT (.+)$/.test(value)) return value.replace(/^THE TRUTH ABOUT /, 'UKWELI KUHUSU ');
    if (value === 'STOP DOING THIS') return 'ACHA KUFANYA HIVI';
    return value;
  }

  function localize(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const raw = node.nodeValue.trim();
      const localized = translate(raw);
      if (raw && raw !== localized) node.nodeValue = node.nodeValue.replace(raw, localized);
    });
  }

  function applyPreset(key, onlyIfEnglish) {
    const preset = presetCopy[key];
    const headline = document.getElementById('thumbHeadline');
    if (!preset || !headline || (onlyIfEnglish && headline.value !== preset.english)) return;
    fields.forEach((id, index) => {
      const input = document.getElementById(id);
      if (!input || input.value === preset.values[index]) return;
      input.value = preset.values[index];
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  function localizeClipboard(value) {
    return String(value || '').split('\n').map(line => {
      let localized = line;
      const prefixes = [
        ['Video idea:', 'Wazo la video:'], ['Thumbnail text:', 'Maandishi ya thumbnail:'], ['Support line:', 'Mstari wa kusaidia:'], ['Badge:', 'Beji:'], ['Layout:', 'Mpangilio:'],
        ['Readiness score:', 'Alama ya utayari:'], ['Main text words:', 'Maneno makuu:'], ['Contrast:', 'Utofauti:'], ['Visual asset:', 'Picha ipo:'], ['Channel mark:', 'Alama ya channel ipo:'], ['Runtime corner checked:', 'Kona ya muda imekaguliwa:']
      ];
      if (localized === 'Thumbnail upload brief') localized = 'Muhtasari wa upakiaji wa thumbnail';
      else if (localized === 'YouTube thumbnail checklist') localized = 'Orodha ya ukaguzi wa thumbnail ya YouTube';
      else if (localized === 'Upload note: 16:9 canvas; use JPEG/WebP or 1280 x 720 when a mobile 2 MB limit matters.') localized = 'Kumbuka: canvas ya 16:9; tumia JPEG/WebP au 1280 x 720 ikiwa kikomo cha simu ni MB 2.';
      else if (localized.startsWith('Colors: primary ')) localized = localized.replace(/^Colors: primary /, 'Rangi: kuu ').replace(', accent ', ', msisitizo ').replace(', text ', ', maandishi ');
      else if (localized.startsWith('Export: ')) localized = localized.replace(/^Export: /, 'Faili: ').replace(' at ', ' kwa ubora wa ').replace(/ quality$/, '');
      else for (const [from, to] of prefixes) if (localized.startsWith(from)) { localized = localized.replace(from, to); break; }
      for (const label of ['YouTube recommended', 'YouTube compact', 'Full HD draft', 'Shorts cover draft', 'Square promo']) localized = localized.replace(label, translate(label));
      localized = localized.replace(/:\s*yes$/, ': ndiyo').replace(/:\s*no$/, ': hapana');
      return localized.trimEnd();
    }).join('\n');
  }

  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    const nativeWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = value => nativeWriteText(localizeClipboard(value));
  }
  const nativeExecCommand = Document.prototype.execCommand;
  if (nativeExecCommand) {
    Document.prototype.execCommand = function (command, ...args) {
      if (String(command).toLowerCase() === 'copy' && document.activeElement instanceof HTMLTextAreaElement) document.activeElement.value = localizeClipboard(document.activeElement.value);
      return nativeExecCommand.call(this, command, ...args);
    };
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.id === 'thumbReset') {
      window.setTimeout(() => applyPreset('reaction', false));
      return;
    }
    const presetButton = button.closest('[data-preset]');
    if (presetButton) window.setTimeout(() => applyPreset(presetButton.dataset.preset, false));
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    const roots = rootIds.map(id => document.getElementById(id)).filter(Boolean);
    const observer = new MutationObserver(() => roots.forEach(localize));
    roots.forEach(root => observer.observe(root, { childList: true, subtree: true, characterData: true }));
    window.setTimeout(() => {
      const studio = window.AfroTools && window.AfroTools.thumbnailStudio;
      const state = studio && studio.getState();
      if (state) applyPreset(state.preset, true);
      roots.forEach(localize);
    });
  });
}());
