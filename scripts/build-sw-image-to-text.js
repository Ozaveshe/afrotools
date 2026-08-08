#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const sourcePath = path.join(ROOT, 'tools/image-to-text/index.html');
const outputPath = path.join(ROOT, 'sw/zana/kutoa-maandishi-kwenye-picha/index.html');

const copy = new Map([
  ['Image to Text OCR: Extract &amp; Export | AfroTools', 'OCR ya Picha: Toa na Hamisha Maandishi | AfroTools'],
  ['Image &amp; Design / Image to Text OCR Studio', 'Picha na Design / Studio ya OCR ya Picha'],
  ['Turn screenshots, receipts, forms, and signs into editable text.', 'Geuza screenshot, risiti, fomu na mabango kuwa maandishi yanayoharirika.'],
  ['Drop images, paste screenshots, choose the language, improve the scan, run OCR, edit the result, then export clean text, structured fields, JSON, CSV, or a handoff brief. Your images stay on this device.', 'Dondosha picha au bandika screenshot, chagua lugha, safisha picha, endesha OCR, hariri matokeo, kisha hamisha maandishi, sehemu zilizotambuliwa, JSON, CSV au muhtasari. Picha zako hubaki kwenye kifaa hiki.'],
  ['Tier Gold', 'Kiwango cha Gold'], ['No upload', 'Hakuna kupakia mtandaoni'], ['Batch queue', 'Foleni ya picha'], ['1. Source', '1. Chanzo'],
  ['Upload, drop, or paste image files', 'Pakia, dondosha au bandika faili za picha'],
  ['Use crisp screenshots or well-lit document photos. For scanned PDFs, use the PDF OCR tool or export the page as an image first.', 'Tumia screenshot zilizo wazi au picha za nyaraka zenye mwanga mzuri. Kwa PDF iliyoskanwa, tumia zana ya PDF OCR au geuza ukurasa kuwa picha kwanza.'],
  ['Loading editor...', 'Kihariri kinapakiwa...'], ['Choose images', 'Chagua picha'], ['Drag files here, paste from clipboard, or click to browse.', 'Buruta faili hapa, bandika kutoka clipboard au bofya ili kuchagua.'],
  ['Local only', 'Ndani ya kivinjari pekee'], ['2. Workflow', '2. Mtiririko'], ['Pick the OCR recipe and language', 'Chagua mpangilio na lugha ya OCR'],
  ['Recipes tune cleanup and the default result view. Mixed-language OCR downloads more model data and can take longer on the first run.', 'Mipangilio huboresha usafishaji na mwonekano wa matokeo. OCR ya lugha nyingi hupakua data zaidi ya modeli na inaweza kuchelewa mara ya kwanza.'],
  ['Receipt', 'Risiti'], ['School notice', 'Tangazo la shule'], ['Invoice', 'Ankara'], ['Multilingual', 'Lugha nyingi'], ['Sign or menu', 'Bango au menyu'],
  ['OCR language', 'Lugha ya OCR'], ['English', 'Kiingereza'], ['French', 'Kifaransa'], ['Arabic', 'Kiarabu'], ['Swahili', 'Kiswahili'], ['Portuguese', 'Kireno'], ['Amharic', 'Kiamhari'],
  ['English + French', 'Kiingereza + Kifaransa'], ['English + Swahili', 'Kiingereza + Kiswahili'], ['English + Arabic', 'Kiingereza + Kiarabu'], ['French + Arabic', 'Kifaransa + Kiarabu'],
  ['Result view', 'Mwonekano wa matokeo'], ['Clean text', 'Maandishi safi'], ['Raw OCR', 'OCR ghafi'], ['Line list', 'Orodha ya mistari'], ['Structured fields', 'Sehemu zilizopangwa'], ['Markdown notes', 'Maelezo ya Markdown'],
  ['Rotate', 'Zungusha'], ['No rotation', 'Bila kuzungusha'], ['Rotate right', 'Zungusha kulia'], ['Upside down', 'Geuza juu chini'], ['Rotate left', 'Zungusha kushoto'], ['Upscale before OCR', 'Ongeza ukubwa kabla ya OCR'], ['Keep size', 'Hifadhi ukubwa'],
  ['3. Clean the scan', '3. Safisha picha'], ['Improve contrast before OCR', 'Boresha utofauti kabla ya OCR'],
  ['OCR quality often improves when shadows are reduced, contrast is higher, or a receipt is converted to black and white.', 'Ubora wa OCR mara nyingi huongezeka ukipunguza vivuli, kuongeza utofauti au kugeuza risiti kuwa nyeusi na nyeupe.'],
  ['Convert to grayscale', 'Geuza kuwa kijivu'], ['Invert dark screenshots', 'Geuza rangi za screenshot nyeusi'], ['Contrast', 'Utofauti'], ['Threshold', 'Kizingiti'], ['Off', 'Imezimwa'],
  ['Original', 'Picha asili'], ['No image', 'Hakuna picha'], ['Upload an image to preview the source.', 'Pakia picha ili kukagua chanzo.'], ['OCR preview', 'Muonekano wa OCR'], ['Ready', 'Tayari'], ['The cleaned OCR input appears here.', 'Picha iliyosafishwa itaonekana hapa.'],
  ['Extract text', 'Toa maandishi'], ['Process queue', 'Chakata foleni'], ['Reset cleanup', 'Rudisha usafishaji'], ['Waiting...', 'Inasubiri...'],
  ['4. Edit and export', '4. Hariri na hamisha'], ['Turn OCR into usable text', 'Geuza OCR kuwa maandishi yanayotumika'], ['Edit the result before copying or exporting. The raw OCR stays available while you refine the current view.', 'Hariri matokeo kabla ya kunakili au kuhamisha. OCR ghafi hubaki ili uweze kuikagua.'],
  ['Clean', 'Safi'], ['Raw', 'Ghafi'], ['Lines', 'Mistari'], ['Fields', 'Sehemu'], ['Find in result', 'Tafuta kwenye matokeo'], ['Copy current view', 'Nakili mwonekano huu'], ['CSV fields', 'Sehemu za CSV'], ['Copy handoff brief', 'Nakili muhtasari'],
  ['Quality', 'Ubora'], ['Result summary', 'Muhtasari wa matokeo'], ['Confidence is reported by the OCR engine when available.', 'Kiwango cha uhakika huonyeshwa na injini ya OCR kinapopatikana.'], ['Source', 'Chanzo'], ['Confidence', 'Uhakika'], ['Text', 'Maandishi'], ['Language', 'Lugha'],
  ['Detected data', 'Data iliyotambuliwa'], ['Checklist', 'Orodha ya ukaguzi'], ['Before using the text', 'Kabla ya kutumia maandishi'], ['Names, IDs, and account numbers were manually checked.', 'Majina, vitambulisho na namba za akaunti zimekaguliwa kwa mkono.'], ['Amounts and dates match the image.', 'Kiasi na tarehe zinalingana na picha.'], ['The correct language or mixed-language setting was used.', 'Lugha sahihi au mchanganyiko sahihi wa lugha umetumika.'],
  ['Recent', 'Hivi karibuni'], ['Session history', 'Historia ya kipindi'], ['Next tools', 'Zana zinazofuata'], ['Keep moving', 'Endelea na kazi'], ['PDF OCR', 'OCR ya PDF'], ['Crop the scan', 'Kata picha'], ['Improve photo clarity', 'Boresha uwazi wa picha'], ['Clean structured data', 'Safisha data iliyopangwa'],
  ['OCR result check', 'Ukaguzi wa matokeo ya OCR'], ['Review extracted text before copying or exporting', 'Kagua maandishi kabla ya kunakili au kuhamisha'],
  ['Run OCR locally, edit the raw result, inspect confidence where available, then export TXT, JSON, CSV, Markdown, or a structured handoff brief.', 'Endesha OCR ndani ya kivinjari, hariri matokeo ghafi, kagua uhakika, kisha hamisha TXT, JSON, CSV, Markdown au muhtasari uliopangwa.'],
  ['Reviewed 2026', 'Imekaguliwa 2026'], ['Local-first OCR workflow. Language models may download, but source images are not uploaded to AfroTools.', 'OCR hufanya kazi ndani ya kivinjari. Modeli za lugha zinaweza kupakuliwa kutoka AfroTools, lakini picha chanzo hazipakwi.'],
  ['What to check', 'Mambo ya kukagua'], ['Methodology: browser image cleanup feeds OCR, then the result editor separates raw text, cleaned text, structured fields, and export formats.', 'Mbinu: kivinjari husafisha picha kwa OCR, kisha kihariri hutenganisha maandishi ghafi, maandishi safi, sehemu zilizopangwa na aina za faili.'],
  ['Manually verify names, totals, dates, account numbers, phone numbers, legal wording, and official references before reuse.', 'Kagua kwa mkono majina, jumla, tarehe, namba za akaunti, simu, maneno ya kisheria na marejeo rasmi kabla ya kutumia tena.'],
  ['Use confidence, extracted fields, copy actions, and export formats to keep the next workflow traceable.', 'Tumia kiwango cha uhakika, sehemu zilizotolewa na faili zilizohamishwa ili hatua inayofuata iwe rahisi kufuatilia.'],
  ['Limitations', 'Mipaka'], ['OCR can misread low contrast, handwriting, rotated text, mixed scripts, stamps, watermarks, and curved pages.', 'OCR inaweza kukosea picha zenye utofauti mdogo, mwandiko wa mkono, maandishi yaliyozungushwa, alfabeti mchanganyiko, mihuri, watermark na kurasa zilizopinda.'],
  ['Not a legal transcription, identity verification, translation, accounting, or official record system.', 'Si mfumo wa unukuzi wa kisheria, uthibitishaji wa utambulisho, tafsiri, uhasibu au rekodi rasmi.'],
  ['Privacy note: source images stay in the browser session; avoid pasting sensitive extracted text into third-party tools without consent.', 'Faragha: picha chanzo hubaki katika kipindi cha kivinjari; usibandike maandishi nyeti kwenye zana za wengine bila idhini.'],
  ['Review extracted text', 'Kagua maandishi yaliyotolewa'], ['Source/freshness note: OCR output is a planning extract. Verify against the original image or issuing source before filing, paying, signing, or publishing.', 'Chanzo na upya: matokeo ya OCR ni dondoo la kupanga. Linganisha na picha asili au chanzo rasmi kabla ya kuwasilisha, kulipa, kusaini au kuchapisha.'],
  ['Related tools', 'Zana zinazohusiana'], ['Image Compressor Studio', 'Studio ya Kubana Picha'], ['AI Flyer &amp; Poster Studio', 'Studio ya Flyer na Poster'], ['Background Remover Studio', 'Studio ya Kuondoa Mandharinyuma'], ['Image Resizer Studio', 'Studio ya Kubadilisha Ukubwa'], ['Passport Photo Studio', 'Studio ya Picha ya Pasipoti'], ['QR Code Generator', 'Kitengeneza QR Code'],
  ['OCR is more useful when the tool helps after extraction', 'OCR hufaa zaidi zana inaposaidia baada ya kutoa maandishi'],
  ['Good image-to-text workflows do more than return a text box. They help you prepare the image, choose the language, check confidence, separate raw and cleaned output, identify fields such as amounts, dates, emails, phones, and links, then export the result in the format your next step needs. AfroTools keeps that entire workflow in the browser so receipts, school notices, invoices, screenshots, and multilingual forms can be handled quickly without sending the image to an AfroTools server.', 'Mtiririko mzuri wa OCR hauishii kwenye kisanduku cha maandishi. Unasaidia kuandaa picha, kuchagua lugha, kukagua uhakika, kutenganisha matokeo ghafi na safi, kutambua kiasi, tarehe, barua pepe, simu na viungo, kisha kuhamisha faili inayohitajika. AfroTools hufanya yote ndani ya kivinjari bila kutuma picha kwenye seva.'],
  ['Are my images uploaded?', 'Picha zangu zinapakiwa mtandaoni?'], ['No. The image is decoded and processed in your browser. The bundled OCR engine and language files are downloaded from AfroTools when needed, but your image is not uploaded.', 'Hapana. Picha hufunguliwa na kuchakatwa ndani ya kivinjari. Injini ya OCR na faili za lugha hupakuliwa kutoka AfroTools inapohitajika, lakini picha yako haipakwi.'],
  ['Which image types work best?', 'Ni picha gani hutoa matokeo bora?'], ['Clear screenshots and sharp document photos work best. Avoid motion blur, deep shadows, curved pages, and tiny text. Use crop, contrast, grayscale, and threshold settings when the scan is hard to read.', 'Screenshot zilizo wazi na picha kali za nyaraka hutoa matokeo bora. Epuka picha iliyotikiswa, vivuli vizito, kurasa zilizopinda na maandishi madogo. Tumia kukata, utofauti, kijivu na kizingiti kuboresha picha ngumu.'],
  ['Can it read handwriting?', 'Inaweza kusoma mwandiko wa mkono?'], ['It may read neat handwriting, but printed text is more reliable. Always manually check names, account numbers, dates, totals, and legal or official text before using the result.', 'Inaweza kusoma mwandiko ulio wazi, lakini maandishi yaliyochapishwa ni ya kuaminika zaidi. Kagua majina, namba za akaunti, tarehe, jumla na maneno rasmi kwa mkono.'],
  ['Can I extract text from PDFs?', 'Ninaweza kutoa maandishi kwenye PDF?'], ['This image tool works with browser-supported image files. Use the AfroTools PDF OCR tool for scanned PDFs, or export a PDF page as an image and run it here.', 'Zana hii hutumia faili za picha zinazokubaliwa na kivinjari. Tumia PDF OCR kwa PDF zilizochanganuliwa, au geuza ukurasa wa PDF kuwa picha kwanza.']
]);

function build() {
  let html = fs.readFileSync(sourcePath, 'utf8');
  html = html.replace('lang="en"', 'lang="sw"');
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>OCR ya Picha: Toa Maandishi | AfroTools</title>');
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, '$1Toa maandishi kwenye picha kwa OCR ya ndani, safisha matokeo, kagua uhakika na uhamishe TXT, Markdown, JSON au CSV bila kupakia picha.$2');
  html = html.replace(/(<meta name="keywords" content=")[^"]*(")/, '$1OCR ya picha, kutoa maandishi kwenye picha, OCR ya screenshot, OCR ya risiti, OCR ya Kiswahili$2');
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, '$1OCR ya Picha | AfroTools$2');
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, '$1Toa, hariri na hamisha maandishi ya picha ndani ya kivinjari.$2');
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, '$1https://afrotools.com/sw/zana/kutoa-maandishi-kwenye-picha/$2');
  html = html.replace(/(<meta property="og:locale" content=")[^"]*(")/, '$1sw_TZ$2');
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, '$1OCR ya Picha | AfroTools$2');
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, '$1OCR ya ndani yenye TXT, Markdown, JSON na CSV.$2');
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
  html = html.replace(/<link rel="canonical"[^>]*>[\s\S]*?<link rel="alternate" hreflang="x-default"[^>]*>/,
    '<link rel="canonical" href="https://afrotools.com/sw/zana/kutoa-maandishi-kwenye-picha/">\n<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/image-to-text/">\n<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/image-en-texte/">\n<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/kutoa-maandishi-kwenye-picha/">\n<link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/image-to-text/">');
  html = html.replace(/>[^<]+</g, segment => {
    const raw = segment.slice(1, -1);
    const key = raw.replace(/\s+/g, ' ').trim();
    return copy.has(key) ? `>${raw.replace(key, copy.get(key))}<` : segment;
  });
  for (const [from, to] of copy) {
    html = html.replaceAll(`aria-label="${from}"`, `aria-label="${to}"`);
    html = html.replaceAll(`placeholder="${from}"`, `placeholder="${to}"`);
  }
  html = html.replace('aria-label="Choose, paste, or drop images for OCR"', 'aria-label="Chagua, bandika au dondosha picha kwa OCR"');
  html = html.replace('aria-label="Tool highlights"', 'aria-label="Sifa kuu za zana"');
  html = html.replace('aria-label="Choose images for OCR"', 'aria-label="Chagua picha kwa OCR"');
  html = html.replace('aria-label="Current OCR queue"', 'aria-label="Foleni ya sasa ya OCR"');
  html = html.replace('aria-label="OCR editor"', 'aria-label="Kihariri cha OCR"');
  html = html.replace('aria-label="OCR workflow presets"', 'aria-label="Mipangilio ya mtiririko wa OCR"');
  html = html.replace('aria-label="Result views"', 'aria-label="Mionekano ya matokeo"');
  html = html.replace('aria-label="OCR status and guidance"', 'aria-label="Hali na mwongozo wa OCR"');
  html = html.replace('aria-label="Image to text OCR guidance"', 'aria-label="Mwongozo wa OCR ya picha"');
  html = html.replace('placeholder="Search extracted text"', 'placeholder="Tafuta maandishi yaliyotolewa"');
  html = html.replace('aria-label="Search extracted text"', 'aria-label="Tafuta maandishi yaliyotolewa"');
  html = html.replaceAll('placeholder="Extracted text appears here and can be edited before export."', 'placeholder="Maandishi yaliyotolewa yataonekana hapa na yanaweza kuhaririwa kabla ya kuhamishwa."');
  html = html.replaceAll('aria-label="Extracted text appears here and can be edited before export."', 'aria-label="Maandishi yaliyotolewa yataonekana hapa na yanaweza kuhaririwa kabla ya kuhamishwa."');
  html = html.replace('<main class="ocr-studio" id="main-content">', '<!-- Source owner: scripts/build-sw-image-to-text.js; OCR owners: assets/js/lib/image-to-text-ocr-local.js + assets/js/lib/image-to-text-studio.js -->\n<main class="ocr-studio" id="main-content">');
  html = html.replace(/<afro-related-tools category="image-design" current="image-to-text"[\s\S]*?<\/afro-related-tools>/, '<afro-related-tools category="image-design" current="image-to-text" data-ssr="1"><nav class="seo-links related-tools-ssr" aria-label="Zana zinazohusiana"><h2 class="seo-links-title">Zana zinazohusiana</h2><ul class="seo-links-list"><li><a href="/sw/zana/kubana-picha/">Bana picha</a></li><li><a href="/sw/zana/kukata-picha/">Kata picha</a></li><li><a href="/sw/zana/kubadilisha-ukubwa-wa-picha/">Badilisha ukubwa wa picha</a></li><li><a href="/sw/zana/picha-ya-pasipoti/">Tengeneza picha ya pasipoti</a></li><li><a href="/sw/zana/kitengeneza-qr/">Tengeneza QR Code</a></li></ul></nav></afro-related-tools>');
  html = html.replace('<script src="/assets/js/lib/image-to-text-studio.js?v=a5611fd9" defer></script>', '<script src="/assets/js/lib/image-to-text-studio.js?v=a5611fd9" defer></script>\n<script src="/assets/js/lib/image-to-text-studio-sw.js" defer></script>');
  const schema = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'OCR ya Picha', description: 'Toa, safisha, hariri na hamisha maandishi ya picha ndani ya kivinjari.', url: 'https://afrotools.com/sw/zana/kutoa-maandishi-kwenye-picha/', inLanguage: 'sw', applicationCategory: 'DesignApplication', operatingSystem: 'Web', browserRequirements: 'JavaScript, Canvas, FileReader na WebAssembly', image: 'https://afrotools.com/assets/img/tools/image-to-text.webp', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, author: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' } };
  html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema)}</script>\n</head>`);
  return html;
}

const output = build();
if (process.argv.includes('--check')) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== output) { console.error('Swahili image-to-text route is stale.'); process.exit(1); }
  console.log('Swahili image-to-text route matches the English OCR studio contract.');
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output);
  console.log('Built native Swahili image-to-text studio.');
}
