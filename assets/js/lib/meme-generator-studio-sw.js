(function localizeMemeStudio() {
  'use strict';
  if (document.documentElement.lang !== 'sw') return;
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof STARTER_SCENES === 'undefined' || typeof CAPTION_PACKS === 'undefined') return;
    Object.assign(STARTER_SCENES.nepa, { label: 'Hali ya stima', copy: 'Stima ikirudi na kila chaja ikaonekana mara moja.', tips: ['Inafaa kwa utani wa furaha au afueni.', 'Tumia kwa utani wa kusubiri, msongo au matumaini ya ghafla.'] });
    Object.assign(STARTER_SCENES.market, { label: 'Siku ya soko', copy: 'Kwa utani wa bei ya mwisho na nguvu za muuzaji.', tips: ['Tumia sentensi fupi ili utani ufike haraka.', 'Inafaa kwa biashara, chakula na mitumba.'] });
    Object.assign(STARTER_SCENES.groupchat, { label: 'Group chat ya familia', copy: 'Kwa ujumbe uliotumwa mbele, salamu za asubuhi na usumbufu wa admin.', tips: ['Utani usikike kama jambo ambalo shangazi au admin angesema.', 'Tumia maandishi mazito ili yasomeke.'] });
    Object.assign(STARTER_SCENES.football, { label: 'Mpira wa wikendi', copy: 'Kwa kushangilia mapema, ulinzi mbaya na kujiamini kupita kiasi.', tips: ['Weka maneno mafupi kama utani wa mashabiki.', 'Pia inafaa kwa screenshot za mechi.'] });
    Object.assign(STARTER_SCENES.campus, { label: 'Wiki ya mtihani', copy: 'Kwa shinikizo la shule, notes ambazo hujasoma na hofu ya mwisho.', tips: ['Tumia utani mfupi wa kusoma na hofu.', 'Ni mbadala mzuri usipokuwa na picha ya darasani.'] });
    Object.assign(CAPTION_PACKS.nepa, { label: 'Stima imerudi', copy: 'Afueni, vurugu za chaja na furaha ya ghafla.', top: 'STIMA IKIRUDI HATIMAYE', bottom: 'KILA MTU ANAANZA KUCHAJI MARA MOJA' });
    Object.assign(CAPTION_PACKS.market, { label: 'Bei ya mwisho', copy: 'Nguvu ya kubishana bei na majibu ya muuzaji.', top: 'ULISEMA BEI YA MWISHO', bottom: 'MUUZAJI AKASEMA RUDI BAADAYE' });
    Object.assign(CAPTION_PACKS.groupchat, { label: 'Salamu za asubuhi', copy: 'Group chat ya familia alfajiri.', top: 'GROUP CHAT YA FAMILIA SAA KUMI NA MOJA', bottom: 'HABARI ZA ASUBUHI NA FORWARD 19' });
    Object.assign(CAPTION_PACKS.football, { label: 'Kujisifu mapema', copy: 'Utani wa mpira kwa mashabiki wasio na subira.', top: 'TIMU YAKO IKIFUNGA KWANZA', bottom: 'UNAANZA KUJISIFU MAPEMA' });
    Object.assign(CAPTION_PACKS.campus, { label: 'Mshtuko wa past paper', copy: 'Hofu ya wiki ya mtihani kwenye picha moja.', top: 'UKIFUNGUA PAST PAPER', bottom: 'HAKUNA KITU UNACHOKUMBUKA' });
    Object.assign(CAPTION_PACKS.hustle, { label: 'Malipo ya mteja', copy: 'Kwa freelancer, biashara ndogo na malipo yaliyochelewa.', top: 'MTEJA ALISEMA MALIPO YANAKUJA', bottom: 'TANGU WIKI ILIYOPITA' });
    var exact = {
      'No custom image selected yet.': 'Bado hujachagua picha yako.',
      'Please choose an image file.': 'Tafadhali chagua faili ya picha.',
      'Your custom image is loaded. Edit the text and download when ready.': 'Picha yako imefunguliwa. Hariri maandishi kisha upakue ukiwa tayari.',
      'That image could not be opened. Try a different file.': 'Picha hiyo haikuweza kufunguliwa. Jaribu faili nyingine.',
      'You are using your own image now, which is usually the strongest way to make the meme feel personal and locally specific.': 'Sasa unatumia picha yako, ambayo kwa kawaida hufanya meme iwe ya binafsi na ya mazingira yako.',
      'Starter scenes are simple AfroTools backdrops, not a full reaction-image library. They are here so you can move fast when you do not have a photo ready.': 'Mandhari za kuanzia ni picha rahisi za AfroTools, si maktaba kamili ya picha za mwitikio. Zinakusaidia kuanza haraka usipokuwa na picha.'
    };
    function translate(root) {
      if (!root) return;
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); var node;
      while ((node = walker.nextNode())) {
        var value = node.nodeValue.trim(); var replacement = exact[value] || value.replace(/^Using (.+)\.$/, 'Unatumia $1.').replace(/^Current caption pack: (.+)\.$/, 'Kifurushi cha sasa: $1.');
        if (replacement !== value) node.nodeValue = node.nodeValue.replace(value, replacement);
      }
    }
    renderScenes(); renderPacks(); applyPack(activePack, true); translate(document.getElementById('uploadMeta')); translate(document.getElementById('statusText')); translate(document.getElementById('guideIntro')); translate(document.getElementById('guideList'));
    var observer = new MutationObserver(function () { ['uploadMeta', 'statusText', 'guideIntro', 'guideList'].forEach(function (id) { translate(document.getElementById(id)); }); });
    ['uploadMeta', 'statusText', 'guideIntro', 'guideList'].forEach(function (id) { var node = document.getElementById(id); if (node) observer.observe(node, { childList: true, subtree: true, characterData: true }); });
  });
}());
