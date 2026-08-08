(function localizeImageToTextStudio() {
  'use strict';
  if (document.documentElement.lang !== 'sw') return;

  var exact = {
    'Ready. Add an image, choose a language, then extract text.': 'Tayari. Ongeza picha, chagua lugha, kisha toa maandishi.',
    'Choose a JPG, PNG, WebP, SVG, or browser-supported image file.': 'Chagua faili ya picha ya JPG, PNG, WebP, SVG au aina inayokubaliwa na kivinjari.',
    'Cleanup controls reset for the current recipe.': 'Mipangilio ya usafishaji imerudishwa.',
    'Load': 'Fungua', 'Not run': 'Haijaendeshwa', 'None found yet': 'Bado hakuna kilichopatikana',
    'Totals and tax lines': 'Jumla na mistari ya kodi', 'Amounts': 'Kiasi', 'Dates': 'Tarehe', 'Contacts': 'Mawasiliano', 'Links': 'Viungo', 'Check manually': 'Kagua kwa mkono',
    'Waiting...': 'Inasubiri...', 'Reading...': 'Inasoma...', 'Working...': 'Inachakata...', 'Extract text': 'Toa maandishi', 'Process queue': 'Chakata foleni',
    'OCR complete.': 'OCR imekamilika.', 'OCR complete. Edit, copy, or export the result.': 'OCR imekamilika. Hariri, nakili au hamisha matokeo.',
    'OCR failed.': 'OCR imeshindwa.', 'OCR engine could not run from bundled assets. Reload and try again.': 'Injini ya OCR haikuweza kuanza kutoka faili za ndani. Pakia ukurasa upya ujaribu tena.',
    'Load an image before running OCR.': 'Fungua picha kabla ya kuendesha OCR.', 'Current OCR view copied.': 'Mwonekano wa sasa wa OCR umenakiliwa.',
    'Could not copy automatically. Select the text and copy it manually.': 'Haikuweza kunakili kiotomatiki. Chagua maandishi na uyakili kwa mkono.',
    'OCR handoff brief copied.': 'Muhtasari wa OCR umenakiliwa.', 'Could not copy the brief automatically.': 'Haikuweza kunakili muhtasari kiotomatiki.',
    'OCR runs will appear here without storing source images.': 'Historia ya OCR itaonekana hapa bila kuhifadhi picha chanzo.',
    'Preparing image...': 'Inaandaa picha...', 'Loading OCR engine and language data...': 'Inapakia injini ya OCR na data ya lugha...', 'Recognizing text...': 'Inatambua maandishi...',
    'loading tesseract core': 'inapakia msingi wa Tesseract', 'initializing tesseract': 'inaanzisha Tesseract', 'loading language traineddata': 'inapakia data ya lugha', 'initializing api': 'inaanzisha OCR', 'recognizing text': 'inatambua maandishi',
    'Receipt OCR recipe loaded.': 'Mpangilio wa OCR wa risiti umepakiwa.', 'School notice OCR recipe loaded.': 'Mpangilio wa OCR wa tangazo la shule umepakiwa.', 'Invoice OCR recipe loaded.': 'Mpangilio wa OCR wa ankara umepakiwa.', 'Multilingual OCR recipe loaded.': 'Mpangilio wa OCR wa lugha nyingi umepakiwa.', 'Sign or menu OCR recipe loaded.': 'Mpangilio wa OCR wa bango au menyu umepakiwa.'
  };
  var languages = { English: 'Kiingereza', French: 'Kifaransa', Arabic: 'Kiarabu', Swahili: 'Kiswahili', Portuguese: 'Kireno', Amharic: 'Kiamhari', 'English + French': 'Kiingereza + Kifaransa', 'English + Swahili': 'Kiingereza + Kiswahili', 'English + Arabic': 'Kiingereza + Kiarabu', 'French + Arabic': 'Kifaransa + Kiarabu' };
  function translate(value) {
    var text = String(value || '');
    if (exact[text]) return exact[text];
    if (languages[text]) return languages[text];
    return text
      .replace(/^Loading (.+)\.\.\.$/, 'Inafungua $1...')
      .replace(/^Loaded (.+)\. Adjust cleanup or run OCR\.$/, '$1 imefunguliwa. Rekebisha usafishaji au endesha OCR.')
      .replace(/^(\d+) images? added to the queue\.$/, '$1 picha zimeongezwa kwenye foleni.')
      .replace(/^Processing queue image (\d+) of (\d+)\.\.\.$/, 'Inachakata picha $1 kati ya $2...')
      .replace(/^Processed (\d+) queued images?\.$/, 'Picha $1 za foleni zimechakatwa.')
      .replace(/^(.+) OCR recipe loaded\.$/, 'Mpangilio wa OCR wa $1 umepakiwa.')
      .replace(/^(\d+) matches? found in current result\.$/, 'Mechi $1 zimepatikana kwenye matokeo.')
      .replace(/^No matches in current result\.$/, 'Hakuna mechi kwenye matokeo.')
      .replace(/^(\d+) words, (\d+) chars$/, 'maneno $1, herufi $2')
      .replace(/^(\d+)% OCR$/, 'OCR $1%')
      .replace(/^English - /, 'Kiingereza - ').replace(/^French - /, 'Kifaransa - ').replace(/^Arabic - /, 'Kiarabu - ').replace(/^Swahili - /, 'Kiswahili - ').replace(/^Portuguese - /, 'Kireno - ').replace(/^Amharic - /, 'Kiamhari - ')
      .replace(/ - (\d+) words - /, ' - maneno $1 - ');
  }
  var targets = ['ocrStatus', 'ocrProgressText', 'ocrLanguageStat', 'ocrConfidenceStat', 'ocrTextStat', 'ocrFieldsList', 'ocrQueue', 'ocrHistoryList', 'ocrRunBtn', 'ocrBatchBtn'];
  function localize(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) { var next = translate(root.nodeValue); if (next !== root.nodeValue) root.nodeValue = next; return; }
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node; while ((node = walker.nextNode())) { var value = translate(node.nodeValue); if (value !== node.nodeValue) node.nodeValue = value; }
  }
  function localizeView() {
    var area = document.getElementById('ocrTextArea');
    if (!area || !area.value) return;
    area.value = area.value
      .replace(/^# OCR Notes/m, '# Maelezo ya OCR').replace(/^- Source:/m, '- Chanzo:').replace(/^- Language:/m, '- Lugha:')
      .replace(/^- Confidence:/m, '- Uhakika:').replace(/^- Recipe:/m, '- Mpangilio:').replace(/^## Clean Text/m, '## Maandishi Safi')
      .replace(/^## Structured Fields/m, '## Sehemu Zilizopangwa').replace(/^## Possible totals \/ tax lines/m, '## Jumla au mistari ya kodi')
      .replace(/^## Amounts/m, '## Kiasi').replace(/^## Dates/m, '## Tarehe').replace(/^## Phones/m, '## Simu').replace(/^## Emails/m, '## Barua pepe')
      .replace(/^## Links/m, '## Viungo').replace(/^## Low-confidence words to check/m, '## Maneno ya kukagua').replace(/^- None found$/gm, '- Hakuna kilichopatikana');
  }
  function run() { targets.forEach(function (id) { localize(document.getElementById(id)); }); localizeView(); }
  document.addEventListener('DOMContentLoaded', function () {
    run();
    var observer = new MutationObserver(run);
    targets.forEach(function (id) { var node = document.getElementById(id); if (node) observer.observe(node, { childList: true, subtree: true, characterData: true }); });
    document.querySelectorAll('[data-ocr-view], #ocrView').forEach(function (node) { node.addEventListener('click', function () { setTimeout(localizeView, 0); }); node.addEventListener('change', function () { setTimeout(localizeView, 0); }); });
    if (navigator.clipboard && navigator.clipboard.writeText) {
      var write = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = function (value) {
        var localized = String(value).replace('Image to Text OCR Studio handoff', 'Muhtasari wa Studio ya OCR ya Picha').replace(/^Source:/m, 'Chanzo:').replace(/^Language:/m, 'Lugha:').replace(/^Recipe:/m, 'Mpangilio:').replace(/^Confidence:/m, 'Uhakika:').replace(/^Words:/m, 'Maneno:').replace(/^Fields found:/m, 'Sehemu zilizopatikana:').replace('Images stayed in this browser session. The image and OCR runtime stayed on AfroTools pages; source pixels were not uploaded.', 'Picha zilibaki katika kipindi hiki cha kivinjari. Injini ya OCR ilifanya kazi kwenye AfroTools bila kupakia pikseli za picha chanzo.');
        return write(localized);
      };
    }
  });
}());
