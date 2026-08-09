(function () {
  'use strict';
  const exact = new Map([
    ['Ready', 'Tayari'], ['Saved locally', 'Imehifadhiwa kwenye kifaa'], ['Preview updated', 'Muonekano umesasishwa'],
    ['Export failed', 'Utoaji umeshindwa'], ['Preparing platform set', 'Inaandaa seti ya majukwaa'], ['Platform set exported', 'Seti ya majukwaa imetolewa'],
    ['Copy failed', 'Kunakili kumeshindwa'], ['Brand kit saved', 'Brand kit imehifadhiwa'], ['Brand kit too large to save', 'Brand kit ni kubwa mno kuhifadhi'],
    ['Brand kit loaded', 'Brand kit imepakiwa'], ['No saved brand kit yet', 'Hakuna brand kit iliyohifadhiwa'], ['Reset complete', 'Imerejeshwa'],
    ['Image could not load', 'Picha haikuweza kufunguka'], ['Choose an image file', 'Chagua faili ya picha'], ['Background loaded', 'Mandharinyuma yamepakiwa'], ['Logo loaded', 'Logo imepakiwa'],
    ['OG snippet copied', 'Snippet ya OG imenakiliwa'], ['Handoff brief copied', 'Maelezo ya kukabidhi yamenakiliwa'], ['Design link copied', 'Link ya design imenakiliwa'],
    ['Choose image', 'Chagua picha'], ['Choose logo', 'Chagua logo'], ['Good', 'Nzuri'], ['Low', 'Chini'], ['Strong', 'Imara'], ['Watch length', 'Kagua urefu'], ['Too long', 'Ndefu mno'],
    ['Product drop', 'Uzinduzi wa bidhaa'], ['Launch, menu, collection', 'Uzinduzi, menyu, mkusanyo'], ['Market day', 'Siku ya soko'], ['Community commerce', 'Biashara ya jamii'],
    ['Event invite', 'Mwaliko wa hafla'], ['Church, meetup, workshop', 'Kanisa, mkutano, warsha'], ['Founder update', 'Taarifa ya mwanzilishi'], ['Milestone or traction', 'Hatua muhimu au maendeleo'],
    ['Quote card', 'Kadi ya nukuu'], ['Creator insight', 'Wazo la mtayarishi'], ['Hiring post', 'Tangazo la ajira'], ['Role announcement', 'Tangazo la nafasi'], ['Training cohort', 'Kundi la mafunzo'], ['Bootcamp or class', 'Bootcamp au darasa'], ['News update', 'Taarifa ya habari'], ['Public alert', 'Tangazo la umma'],
    ['LinkedIn feed', 'Feed ya LinkedIn'], ['Company updates and founder posts', 'Taarifa za kampuni na mwanzilishi'], ['Instagram square', 'Mraba wa Instagram'], ['Instagram, Facebook, carousel cover', 'Instagram, Facebook na jalada la carousel'],
    ['Portrait feed', 'Feed ya wima'], ['Tall feed posts and ads', 'Machapisho marefu na matangazo'], ['Story / WhatsApp status', 'Story / status ya WhatsApp'], ['Stories, status, vertical promos', 'Story, status na promo za wima'], ['YouTube community', 'Jamii ya YouTube'], ['Community posts and video promos', 'Machapisho ya jamii na promo za video'], ['Website previews, X, WhatsApp links', 'Muonekano wa tovuti, X na link za WhatsApp'],
    ['Atlantic blue', 'Bluu ya Atlantiki'], ['Market green', 'Kijani cha soko'], ['Studio ink', 'Wino wa studio'], ['Coral launch', 'Coral ya uzinduzi'], ['Violet night', 'Zambarau ya usiku'], ['Clean paper', 'Karatasi safi'],
    ['Exports you download in this browser will appear here.', 'Matokeo utakayopakua kwenye kivinjari hiki yataonekana hapa.'],
    ['Text contrast is strong for fast scanning.', 'Utofauti wa maandishi ni mzuri kwa usomaji wa haraka.'], ['Contrast may be low. Adjust primary or text color.', 'Utofauti unaweza kuwa mdogo. Rekebisha rangi kuu au maandishi.'],
    ['Headline length is clean.', 'Urefu wa kichwa ni mzuri.'], ['Headline is workable, but keep an eye on small screens.', 'Kichwa kinafaa, lakini kikague kwenye skrini ndogo.'], ['Headline is long. Shorten before posting.', 'Kichwa ni kirefu. Kifupishe kabla ya kuchapisha.'],
    ['Brand footer is present.', 'Sehemu ya brand ipo.'], ['Add a brand or footer note.', 'Ongeza brand au maelezo ya chini.'], ['CTA is included for handoff.', 'CTA imejumuishwa kwa kukabidhi.'], ['Add a CTA if this is a campaign card.', 'Ongeza CTA ikiwa hii ni kadi ya kampeni.']
  ]);
  const presets = {
    product: ['Bidhaa mpya', 'Mkusanyo mpya unapatikana', 'Tangaza bidhaa, menyu, uzinduzi wa urembo au taarifa ya duka kwa kadi inayosomeka haraka.', 'Nunua sasa', 'Kwa brand za hapa'],
    market: ['Soko la Jumamosi', 'Mazao mapya na bidhaa za nyumbani', 'Shiriki status wazi ya WhatsApp kwa vibanda, pop-up, vitambaa, vyakula na huduma za hapa.', 'Shiriki eneo', 'Kwa wafanyabiashara wa jamii'],
    event: ['Ijumaa hii saa 12 jioni', 'Usiku wa uamsho na mkutano wa jamii', 'Tumia mpangilio huu kwa programu, mafunzo, ushirika na matangazo ya umma.', 'Hifadhi tarehe', 'Milango inafunguliwa saa 11:30'],
    founder: ['Taarifa ya kampuni', 'Tumefikia hatua mpya robo hii', 'Fupisha maendeleo, ukuaji, ajira, ufadhili, bidhaa au ushindi wa mteja kwa kadi nadhifu.', 'Soma taarifa', 'AfroTools Studio'],
    quote: ['Ujumbe wa mtayarishi', 'Fanya wazo liwe wazi kiasi kwamba mtu anaweza kulishiriki bila maelezo ya ziada.', 'Tumia mistari mifupi, utofauti mzuri na alama ya brand inayoonekana.', 'Shiriki hii', 'Kwa watayarishi na waelimishaji'],
    hiring: ['Tunaajiri', 'Kiongozi wa uendeshaji kwa timu inayokua', 'Ongeza nafasi, eneo, tarehe ya mwisho na CTA wazi ili waombaji wajue hatua inayofuata.', 'Tuma ombi', 'Mseto / Afrika'],
    training: ['Maombi yamefunguliwa', 'Mafunzo ya ujuzi wa kidijitali kwa biashara ndogo', 'Tumia kwa bootcamp, webinar, programu za shule, fellowship na kozi za watayarishi.', 'Hifadhi nafasi', 'Nafasi ni chache'],
    news: ['Taarifa mpya', 'Kilichobadilika na kwa nini ni muhimu', 'Weka kichwa cha ukweli, maelezo chini na utoe kadi pana kwa video au machapisho ya jamii.', 'Angalia maelezo', 'Taarifa iliyohakikiwa']
  };
  const fields = ['socialEyebrow', 'socialTitle', 'socialSubtitle', 'socialCta', 'socialFooter'];
  const roots = ['socialStatus', 'socialPresetGrid', 'socialPlatformGrid', 'socialPaletteGrid', 'socialPreviewTitle', 'socialContrastMetric', 'socialFitMetric', 'socialChecklist', 'socialHistory', 'socialBackgroundName', 'socialLogoName'].map(id => document.getElementById(id)).filter(Boolean);
  function translate(raw) {
    const value = String(raw || '').trim();
    if (exact.has(value)) return exact.get(value);
    if (/^Downloaded (.+)$/.test(value)) return value.replace(/^Downloaded /, 'Imepakuliwa ');
    if (/^Canvas is exact size:/.test(value)) return value.replace('Canvas is exact size:', 'Canvas ina saizi kamili:');
    if (/^Good (.+)$/.test(value)) return value.replace('Good ', 'Nzuri ');
    if (/^Low (.+)$/.test(value)) return value.replace('Low ', 'Chini ');
    return value;
  }
  function localize(root) { const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode); nodes.forEach(node => { const raw = node.nodeValue.trim(); const next = translate(raw); if (raw && raw !== next) node.nodeValue = node.nodeValue.replace(raw, next); }); }
  function applyPreset(key) { const values = presets[key]; if (!values) return; fields.forEach((id, index) => { const input = document.getElementById(id); if (input && input.value !== values[index]) { input.value = values[index]; input.dispatchEvent(new Event('input', { bubbles: true })); } }); }
  const observer = new MutationObserver(() => roots.forEach(localize));
  roots.forEach(root => observer.observe(root, { childList: true, subtree: true, characterData: true }));
  document.addEventListener('click', event => { const button = event.target.closest('[data-preset]'); if (button) window.setTimeout(() => applyPreset(button.dataset.preset)); });
  window.setTimeout(() => { roots.forEach(localize); applyPreset('training'); });
}());
