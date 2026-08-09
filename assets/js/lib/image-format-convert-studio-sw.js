(function () {
  'use strict';

  const statusMap = new Map([
    ['Checking browser encoders...', 'Inakagua umbizo linaloweza kutengenezwa...'],
    ['Ready. Choose images to convert locally.', 'Tayari. Chagua picha za kubadilisha ndani ya kifaa.'],
    ['Convert this file to preview the result.', 'Badilisha picha hii ili uhakiki matokeo.'],
    ['Choose image files that your browser can decode.', 'Chagua picha zinazoweza kufunguliwa na kivinjari hiki.'],
    ['Converting current image...', 'Inabadilisha picha ya sasa...'],
    ['Current image converted.', 'Picha ya sasa imebadilishwa.'],
    ['Conversion failed. Try JPG, PNG, or WebP.', 'Ubadilishaji umeshindikana. Jaribu JPG, PNG au WebP.'],
    ['Conversion failed.', 'Ubadilishaji umeshindikana.'],
    ['Upload an image first.', 'Chagua picha kwanza.'],
    ['Batch zip is ready.', 'Kifurushi cha ZIP kiko tayari.'],
    ['At least one image could not be converted. Check source format support.', 'Angalau picha moja haikuweza kubadilishwa. Hakiki umbizo la chanzo.'],
    ['Zip packaging is not available on this page.', 'Kutengeneza ZIP hakupatikani kwenye ukurasa huu.'],
    ['Zip packaging is not available.', 'Kutengeneza ZIP hakupatikani.'],
    ['Upload images before building a batch.', 'Chagua picha kabla ya kutengeneza kifurushi.'],
    ['Picture markup copied.', 'Markup ya picture imenakiliwa.'],
    ['Clipboard copy failed.', 'Kunakili kwenye ubao kumeshindikana.'],
    ['Clipboard is not available in this browser.', 'Ubao wa kunakili haupatikani kwenye kivinjari hiki.'],
    ['Convert the current image first.', 'Badilisha picha ya sasa kwanza.'],
    ['Recent conversion packs will appear here.', 'Vifurushi vya karibuni vitaonekana hapa.'],
    ['Upload an image to see the original.', 'Chagua picha ili kuona asili.'],
    ['This source could not be decoded in this browser.', 'Chanzo hiki hakikuweza kufunguliwa na kivinjari hiki.']
  ]);

  const guides = {
    portal: ['JPG ya portal', 'JPG salama kwa kazi, visa, shule na fomu.', ['JPG hukubaliwa zaidi na mifumo ya zamani.', 'Hakikisha nyuso, maandishi na bidhaa zinaonekana.', 'Tumia portal inapokataa WebP, AVIF au faili kubwa.']],
    web: ['Kifurushi cha wavuti', 'WebP na JPG mbadala kwa tovuti na CMS.', ['WebP ni chaguo zuri kwa tovuti za kisasa.', 'JPG husaidia mifumo ya zamani.', 'Nakili markup ya picture kwa makabidhiano ya haraka.']],
    modern: ['Umbizo za kisasa', 'AVIF, WebP na JPG pale kivinjari kinapoweza kuzitengeneza.', ['Tumia kupima utendaji wa wavuti.', 'Umbizo lisilokubaliwa litarukwa.', 'Hifadhi JPG kwa mifumo isiyotabirika.']],
    transparent: ['PNG yenye uwazi', 'Nembo, picha za skrini, sticker na UI.', ['PNG huhifadhi uwazi na kingo safi.', 'Inafaa kwa nembo, sahihi na mali za chapa.', 'Kwa picha, faili inaweza kuwa kubwa kuliko JPG au WebP.']],
    data: ['Okoa data', 'Faili ndogo kwa miunganisho ya polepole.', ['Inafaa kwa rasimu na kushiriki kwenye chat.', 'Ubora umepunguzwa makusudi kuokoa data.', 'Hakiki kabla ya kutumia kwa bidhaa au kitambulisho.']],
    archive: ['Kumbukumbu safi', 'PNG na nakala ya WebP bila kupunguza sana.', ['Inafaa kwa nakala ya uhariri na nakala ndogo ya wavuti.', 'Canvas huondoa metadata nyingi za chanzo.', 'Hifadhi asili ikiwa metadata ya kamera ni muhimu.']]
  };

  function translatedStatus(value) {
    const text = String(value || '').trim();
    if (statusMap.has(text)) return statusMap.get(text);
    let match = text.match(/^(\d+) images? ready\.$/);
    if (match) return `Picha ${match[1]} ${match[1] === '1' ? 'iko' : 'ziko'} tayari.`;
    match = text.match(/^Converting (\d+) of (\d+)\.\.\.$/);
    if (match) return `Inabadilisha picha ${match[1]} kati ya ${match[2]}...`;
    match = text.match(/^(.+) recipe applied\.$/);
    if (match) return 'Mpangilio umetumika.';
    return value;
  }

  function setText(node, value) { if (node && node.textContent !== value) node.textContent = value; }

  function localizeGuide() {
    const active = document.querySelector('[data-ifc-preset].active');
    const guide = active && guides[active.dataset.ifcPreset];
    if (guide) {
      setText(document.getElementById('ifcGuideTitle'), guide[0]);
      setText(document.getElementById('ifcGuideIntro'), guide[1]);
      const list = document.getElementById('ifcGuideList');
      const html = guide[2].map(item => `<li>${item}</li>`).join('');
      if (list && list.innerHTML !== html) list.innerHTML = html;
    } else {
      setText(document.getElementById('ifcGuideTitle'), 'Mpangilio maalum');
      setText(document.getElementById('ifcGuideIntro'), 'Umbizo ulizochagua pamoja na vipimo na ubora wa sasa.');
    }
  }

  function localizeMeta() {
    document.querySelectorAll('.ifc-preview-empty').forEach(node => setText(node, translatedStatus(node.textContent)));
    document.querySelectorAll('.ifc-preview-meta').forEach(node => {
      let text = node.textContent.replace(/^Original:/, 'Asili:').replace(/^Preview:/, 'Hakiki:').replace(/first output is /, 'faili ya kwanza ni ').replace(/% smaller/g, '% ndogo').replace(/% larger/g, '% kubwa').replace(/same size/g, 'ukubwa sawa');
      setText(node, text);
    });
    document.querySelectorAll('.ifc-support-row span').forEach(node => setText(node, node.textContent === 'Supported' ? 'Inapatikana' : node.textContent === 'Not available' ? 'Haipatikani' : node.textContent));
    document.querySelectorAll('.ifc-history-item').forEach(node => {
      let text = node.textContent.replace('Recent conversion packs will appear here.', 'Vifurushi vya karibuni vitaonekana hapa.').replace('Current image export', 'Picha ya sasa').replace('Batch zip export', 'Kifurushi cha ZIP').replace(/ output(s?)/g, ' faili').replace(/ source file(s?)/g, ' picha');
      setText(node, text);
    });
    const outputCount = document.getElementById('ifcOutputCount');
    if (outputCount && outputCount.textContent === 'Zip ready') outputCount.textContent = 'ZIP tayari';
    const savings = document.getElementById('ifcSavings');
    if (savings) setText(savings, savings.textContent.replace(/% smaller/g, '% ndogo').replace(/% larger/g, '% kubwa').replace(/same size/g, 'ukubwa sawa'));
  }

  function translateAll() {
    const status = document.getElementById('ifcStatus');
    if (status) setText(status, translatedStatus(status.textContent));
    localizeGuide();
    localizeMeta();
  }

  function init() {
    translateAll();
    const observer = new MutationObserver(translateAll);
    ['ifcStatus', 'ifcSupportList', 'ifcHistoryList', 'ifcOriginalBox', 'ifcOutputBox', 'ifcSavings', 'ifcOutputCount', 'ifcGuideTitle', 'ifcGuideIntro', 'ifcGuideList'].map(id => document.getElementById(id)).filter(Boolean).forEach(node => observer.observe(node, { childList: true, characterData: true, subtree: true }));
    document.querySelectorAll('[data-ifc-preset]').forEach(button => button.addEventListener('click', () => window.setTimeout(translateAll, 0)));
    document.querySelectorAll('[data-ifc-format], #ifcQuality, #ifcScale, #ifcMaxWidth, #ifcMaxHeight, #ifcSuffix').forEach(input => {
      input.addEventListener('input', () => window.setTimeout(translateAll, 0));
      input.addEventListener('change', () => window.setTimeout(translateAll, 0));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
