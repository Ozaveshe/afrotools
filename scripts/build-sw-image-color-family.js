#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const OWNER = 'scripts/build-sw-image-color-family.js';
const rows = [
  { source: 'tools/color-picker/index.html', target: 'sw/zana/kichagua-rangi/index.html', en: '/tools/color-picker/', sw: '/sw/zana/kichagua-rangi/' },
  { source: 'tools/colour-palette/index.html', target: 'sw/zana/paleti-ya-rangi/index.html', en: '/tools/colour-palette/', sw: '/sw/zana/paleti-ya-rangi/' }
];

function replaceAll(html, pairs) {
  for (const [from, to] of pairs) html = html.split(from).join(to);
  return html;
}

function head(html, row, title, description) {
  html = html.replace('lang="en"', 'lang="sw"');
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title} | AfroTools</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title} | AfroTools">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  html = html.replaceAll(`https://afrotools.com${row.en}`, `https://afrotools.com${row.sw}`);
  html = html.replace(/<link rel="alternate" hreflang="en" href="[^"]+">/, `<link rel="alternate" hreflang="en" href="https://afrotools.com${row.en}">`);
  html = html.replace(/<link rel="alternate" hreflang="sw" href="[^"]+">/, `<link rel="alternate" hreflang="sw" href="https://afrotools.com${row.sw}">`);
  html = html.replace(/<link rel="alternate" hreflang="x-default" href="[^"]+">/, `<link rel="alternate" hreflang="x-default" href="https://afrotools.com${row.en}">`);
  html = html.replaceAll('"inLanguage": "en"', '"inLanguage": "sw"');
  html = html.replaceAll('content="en_US"', 'content="sw_TZ"');
  html = html.replace('</head>', `<meta name="content-language" content="sw"><meta name="afrotools-source-owner" content="${OWNER}"></head>`);
  return html;
}

function colorPicker(html, row) {
  html = head(html, row, 'Kichagua Rangi: HEX, RGB, HSL na Utofautishaji', 'Chagua rangi, geuza HEX, RGB, HSL, OKLCH na CMYK, kagua utofautishaji wa WCAG, tengeneza gradient na upakue paleti ndani ya kivinjari.');
  html = replaceAll(html, [
    ['<span>Tools</span>', '<span>Zana</span>'],
    ['Color <em>Picker</em>', 'Kichagua <em>Rangi</em>'],
    [' &amp; Converter</h1>', ' na Kigeuzi</h1>'],
    ['Pick colors and convert between HEX, RGB, HSL, OKLCH, CMYK. Gradient builder, contrast checker, Tailwind class finder, and African flag palettes.', 'Chagua rangi na ugeuze kati ya HEX, RGB, HSL, OKLCH na CMYK. Tengeneza gradient, kagua utofautishaji, pata class ya Tailwind na utumie paleti za bendera za Afrika.'],
    ['6 Formats', 'Miundo 6'], ['Instant', 'Papo hapo'], ['WCAG Checker', 'Kikagua WCAG'],
    ['All processing happens in your browser', 'Uchakataji wote unafanyika kwenye kivinjari chako'],
    ['Pick Color', 'Chagua Rangi'], ['Pick a color', 'Chagua rangi'], ['Pick from Screen', 'Chagua kwenye Skrini'], ['Copy</button>', 'Nakili</button>'],
    ['Valid six-digit HEX color.', 'Rangi halali ya HEX yenye tarakimu sita.'],
    ['Tailwind Class Finder', 'Kitafuta Class ya Tailwind'], ['Closest Tailwind Class', 'Class ya Tailwind iliyo karibu'], ['Closest Tailwind class', 'Class ya Tailwind iliyo karibu'],
    ['Palette Generator', 'Kitengeneza Paleti'], ['Generated Palette', 'Paleti Iliyotengenezwa'],
    ['Gradient Builder', 'Kitengeneza Gradient'], ['Color 1', 'Rangi ya 1'], ['Color 2', 'Rangi ya 2'], ['CSS Code', 'Msimbo wa CSS'],
    ['Gradient color 1', 'Rangi ya kwanza ya gradient'], ['Gradient color 2', 'Rangi ya pili ya gradient'], ['Gradient direction', 'Mwelekeo wa gradient'], ['Gradient CSS code', 'Msimbo wa CSS wa gradient'],
    ['To Right', 'Kulia'], ['To Left', 'Kushoto'], ['To Bottom', 'Chini'], ['To Top', 'Juu'], ['To Bottom Right', 'Chini kulia'], ['To Top Left', 'Juu kushoto'],
    ['WCAG Contrast Checker', 'Kikagua Utofautishaji cha WCAG'], ['Foreground', 'Rangi ya mbele'], ['Background', 'Mandharinyuma'],
    ['Sample Text', 'Maandishi ya mfano'], ['Large Text', 'Maandishi makubwa'],
    ['Named CSS Colors', 'Rangi za CSS Zenye Majina'], ['Search 148 CSS named colors...', 'Tafuta rangi 148 za CSS kwa jina...'], ['Search 148 named colors...', 'Tafuta rangi 148 kwa jina...'], ['Search 148 named colors', 'Tafuta rangi 148 kwa jina'],
    ['African Flag Palettes', 'Paleti za Bendera za Afrika'], ['Export Palette', 'Pakua Paleti'],
    ['Download CSS Variables', 'Pakua Vigezo vya CSS'], ['Download Tailwind Config', 'Pakua Mpangilio wa Tailwind'],
    ['Export the current generated palette as CSS variables or a Tailwind config snippet.', 'Pakua paleti ya sasa kama vigezo vya CSS au kipande cha mpangilio wa Tailwind.'],
    ['Color Formats', 'Miundo ya Rangi'], ['About Colors', 'Kuhusu Rangi'], ['WCAG Guidelines', 'Miongozo ya WCAG'],
    ['#RRGGBB (6 digits)', '#RRGGBB (tarakimu 6)'], ['values 0-255', 'thamani 0-255'], ['hue 0-360, saturation and lightness 0-100%', 'hue 0-360, ukolezi na uangavu 0-100%'], ['perceptually uniform, modern CSS', 'nafasi inayolingana na mtazamo, CSS ya kisasa'], ['for print', 'kwa uchapishaji'],
    ['Colors can be specified using HEX codes (#000000 to #FFFFFF), RGB triplets, or HSL values. Different color models serve different purposes in design and development.', 'Rangi zinaweza kuandikwa kwa misimbo ya HEX (#000000 hadi #FFFFFF), thamani tatu za RGB au HSL. Kila mfumo wa rangi una matumizi yake katika ubunifu na uundaji wa programu.'],
    ['Large text is 18pt+ or 14pt bold.', 'Maandishi makubwa ni 18pt au zaidi, au 14pt yaliyo mazito.'],
    ['Enter a valid six-digit HEX color such as #008751.', 'Weka rangi halali ya HEX yenye tarakimu sita, kwa mfano #008751.'],
    ['Copy not available. Select and copy manually.', 'Kunakili hakupatikani. Chagua na unakili mwenyewe.'],
    ['Copy blocked. Select and copy manually.', 'Kunakili kumezuiwa. Chagua na unakili mwenyewe.'],
    ['Copied!', 'Imenakiliwa!'], ['Downloaded!', 'Imepakuliwa!'], [' palette loaded', ' imepakiwa'],
    ['AA Normal ', 'AA Maandishi ya kawaida '], ['AA Large ', 'AA Maandishi makubwa '], ['AAA Normal ', 'AAA Maandishi ya kawaida '], ['AAA Large ', 'AAA Maandishi makubwa '],
    ["?'Pass':'Fail'", "?'Imefaulu':'Imeshindwa'"],
    ["{name:'South Africa'", "{name:'Afrika Kusini'"], ["{name:'Egypt'", "{name:'Misri'"],
    ['Review palette exports', 'Kagua faili za paleti'], ['Privacy note: color selection and exports happen locally.', 'Faragha: uchaguzi wa rangi na upakuaji hufanyika kwenye kifaa chako.'],
    ['Color handoff check', 'Ukaguzi wa kukabidhi rangi'], ['Check contrast, formats, and CSS output before shipping', 'Kagua utofautishaji, miundo na matokeo ya CSS kabla ya kutumia'],
    ['Pick and convert colors locally, test WCAG contrast, copy usable formats, then export CSS variables or Tailwind config for implementation.', 'Chagua na ugeuze rangi kwenye kifaa chako, kagua utofautishaji wa WCAG, nakili miundo inayofaa, kisha pakua vigezo vya CSS au mpangilio wa Tailwind.'],
    ['Reviewed 2026', 'Imekaguliwa 2026'], ['Local design utility. Browser support controls whether screen eyedropper is available.', 'Zana ya ubunifu ya ndani. Uwezo wa kivinjari huamua kama kichagua rangi cha skrini kinapatikana.'],
    ['What to check', 'Mambo ya kukagua'], ['Methodology: selected color, generated palette, contrast pair, gradient settings, and export action produce copyable or downloadable design tokens.', 'Mbinu: rangi iliyochaguliwa, paleti, jozi ya utofautishaji, mipangilio ya gradient na upakuaji huzalisha thamani za ubunifu zinazoweza kunakiliwa au kupakuliwa.'],
    ['Check AA/AAA contrast for real text sizes and backgrounds before putting the colors into production.', 'Kagua utofautishaji wa AA/AAA kwa ukubwa halisi wa maandishi na mandharinyuma kabla ya kutumia rangi hadharani.'],
    ['Copy HEX, RGB, HSL, OKLCH, CMYK, Tailwind class, gradient CSS, or export CSS/Tailwind files for handoff.', 'Nakili HEX, RGB, HSL, OKLCH, CMYK, class ya Tailwind au CSS ya gradient; pia unaweza kupakua faili za CSS/Tailwind.'],
    ['Limitations', 'Mipaka'], ['Not a substitute for full brand accessibility review, print proofing, or color-managed production software.', 'Si mbadala wa ukaguzi kamili wa ufikivu wa chapa, uthibitishaji wa uchapishaji au programu maalumu ya usimamizi wa rangi.'],
    ['Screen eyedropper support depends on the browser and may be unavailable on some devices.', 'Kichagua rangi cha skrini hutegemea kivinjari na huenda kisipatikane kwenye baadhi ya vifaa.'],
    ['Source/freshness note: browser support and CSS color syntax evolve; verify target browser support before shipping newer formats like OKLCH.', 'Chanzo na uhalisia: uwezo wa vivinjari na sintaksia ya rangi za CSS hubadilika; thibitisha vivinjari unavyolenga kabla ya kutumia miundo mipya kama OKLCH.'],
    ['This colour picker tool lets you explore, select, and convert colours across multiple formats including HEX, RGB, HSL, and CMYK. Use the interactive colour wheel and spectrum to find the perfect shade, then copy the colour code in whatever format your project needs. The tool also generates complementary, analogous, triadic, and other colour harmonies to help you build cohesive palettes. Designers, front-end developers, and digital artists will find it useful for everything from web design to branding projects. All processing happens in your browser, making it fast, private, and available even when you are offline.', 'Zana hii hukuruhusu kuchagua na kugeuza rangi katika miundo ya HEX, RGB, HSL, OKLCH na CMYK. Nakili msimbo unaohitaji, tengeneza gradient na paleti, au kagua utofautishaji wa WCAG. Uchakataji na upakuaji wote hufanyika ndani ya kivinjari chako bila kutuma rangi zako kwenye seva.'],
    ['What is the difference between HEX, RGB, and HSL color formats?', 'Tofauti kati ya miundo ya HEX, RGB na HSL ni ipi?'], ['HEX uses a six-digit hexadecimal code (e.g. #FF5733) for red, green, and blue. RGB specifies each channel as 0-255. HSL uses Hue (0-360), Saturation (0-100%), and Lightness (0-100%), which is more intuitive for adjusting colours.', 'HEX hutumia msimbo wa heksadesimali wenye tarakimu sita kwa nyekundu, kijani na buluu. RGB huonyesha kila njia kwa 0-255. HSL hutumia hue, ukolezi na uangavu, hivyo ni rahisi kurekebisha rangi.'],
    ['What is OKLCH and why should I use it?', 'OKLCH ni nini na kwa nini nitumie?'], ['OKLCH is a perceptually uniform colour space now supported in modern CSS. It defines colours by Lightness, Chroma, and Hue in a way that matches how humans see differences, producing smoother gradients and more predictable adjustments than HSL.', 'OKLCH ni nafasi ya rangi inayolingana vizuri na mtazamo wa binadamu. Hutumia uangavu, chroma na hue, na hutoa gradient laini na marekebisho yanayotabirika kuliko HSL.'],
    ['How does the WCAG contrast checker work?', 'Kikagua utofautishaji cha WCAG hufanyaje kazi?'], ['It calculates the luminance ratio between foreground and background colours. WCAG AA requires 4.5:1 for normal text and 3:1 for large text. AAA requires 7:1 for normal and 4.5:1 for large text, ensuring readability for people with visual impairments.', 'Hesabu uwiano wa mwangaza kati ya rangi ya mbele na mandharinyuma. WCAG AA huhitaji 4.5:1 kwa maandishi ya kawaida na 3:1 kwa makubwa; AAA huhitaji 7:1 na 4.5:1.'],
    ['How do I find the closest Tailwind CSS class for my colour?', 'Ninapataje class ya Tailwind CSS iliyo karibu na rangi yangu?'], ['The Tailwind Class Finder compares your chosen colour against every colour in the default Tailwind palette by measuring perceptual distance. It returns the closest match (e.g. bg-blue-500) so you can use Tailwind without custom configuration.', 'Kitafuta class ya Tailwind hulinganisha rangi yako na paleti chaguomsingi ya Tailwind na kurudisha class iliyo karibu zaidi, kwa mfano bg-blue-500.'],
    ['What is CMYK and how does it relate to RGB?', 'CMYK ni nini na inahusianaje na RGB?'], ['CMYK (Cyan, Magenta, Yellow, Key/black) is used in print. RGB is additive (light) while CMYK is subtractive (ink). Converting between them is approximate because they have different colour gamuts; on-screen colours may not match print exactly.', 'CMYK hutumika katika uchapishaji, ilhali RGB hutumika kwa mwanga wa skrini. Ugeuzaji ni makisio kwa sababu nafasi zao za rangi hutofautiana; rangi ya skrini inaweza kutolingana kabisa na chapisho.'],
    ['Frequently Asked Questions', 'Maswali Yanayoulizwa Mara kwa Mara'],
    ['Related tools', 'Zana zinazohusiana'], ['Related Image Tools', 'Zana za Picha Zinazohusiana'], ['Color Picker', 'Kichagua Rangi'], ['Logo Maker', 'Kitengeneza Nembo'], ['Social Media Card', 'Kadi ya Mitandao ya Kijamii'], ['View All Image Tools', 'Tazama Zana Zote za Picha']
  ]);
  html = html.replace(/<section style="max-width:900px;margin:32px auto;padding:0 20px;">[\s\S]*?<\/section>\s*<!-- FAQ Accordion -->/, '<section style="max-width:900px;margin:32px auto;padding:0 20px;"><div style="font-size:0.88rem;color:#475569;line-height:1.7;margin-bottom:24px;"><p>Zana hii hukuruhusu kuchagua na kugeuza rangi katika miundo ya HEX, RGB, HSL, OKLCH na CMYK. Nakili msimbo unaohitaji, tengeneza gradient na paleti, au kagua utofautishaji wa WCAG. Uchakataji na upakuaji wote hufanyika ndani ya kivinjari chako bila kutuma rangi zako kwenye seva.</p></div></section>\n<!-- FAQ Accordion -->');
  html = html.replace(/The Kitafuta Class ya Tailwind compares[\s\S]*?custom configuration\./, 'Kitafuta class ya Tailwind hulinganisha rangi yako na paleti chaguomsingi ya Tailwind na kurudisha class iliyo karibu zaidi, kwa mfano bg-blue-500.');
  html = replaceAll(html, [
    ['AA Normal:', 'AA Maandishi ya kawaida:'], ['AA Large:', 'AA Maandishi makubwa:'], ['AAA Normal:', 'AAA Maandishi ya kawaida:'], ['AAA Large:', 'AAA Maandishi makubwa:'],
    ['4.5:1 ratio<br>', '4.5:1 uwiano<br>'], ['3:1 ratio<br>', '3:1 uwiano<br>'], ['7:1 ratio<br>', '7:1 uwiano<br>'],
    ['African Colour Palette', 'Paleti ya Rangi za Afrika'], ['Favicon Generator', 'Kitengeneza Favicon'],
    ['Image Compressor Studio', 'Zana ya Kubana Picha'], ['Image Resizer Studio', 'Zana ya Kubadilisha Ukubwa wa Picha'], ['Passport Photo Studio', 'Zana ya Picha ya Pasipoti'], ['QR Code Generator', 'Kitengeneza Msimbo wa QR'],
    ['Batch compress, resize, convert, compare, and target file-size limits locally in the browser.', 'Bana, badili ukubwa na muundo wa picha ndani ya kivinjari.'], ['Generate QR codes for M-Pesa links, WhatsApp, WiFi, URLs. Download as PNG/SVG.', 'Tengeneza misimbo ya QR na uipakue kama PNG au SVG.']
  ]);
  return html;
}

function colourPalette(html, row) {
  html = head(html, row, 'Kitengeneza Paleti za Rangi za Afrika', 'Vinjari paleti za rangi zilizoongozwa na sanaa, mandhari, vitambaa na utamaduni wa Afrika; nakili HEX na pakua CSS au JSON ndani ya kivinjari.');
  html = replaceAll(html, [
    ['African Colour Palette Generator', 'Kitengeneza Paleti za Rangi za Afrika'],
    ['50+ beautiful colour palettes inspired by African art, landscapes, textiles, and culture. Click any colour to copy its hex code.', 'Paleti zaidi ya 50 zilizoongozwa na sanaa, mandhari, vitambaa na utamaduni wa Afrika. Bonyeza rangi ili kunakili msimbo wake wa HEX.'],
    ['Browse Palettes', 'Vinjari Paleti'], ['Random Palette', 'Paleti ya Nasibu'], ['Export All as CSS', 'Pakua Zote kama CSS'], ['Export as JSON', 'Pakua kama JSON'],
    ['Click hex code to copy â€¢ Click Export on a palette to download', 'Bonyeza msimbo wa HEX ili kunakili; bonyeza CSS kwenye paleti ili kupakua'],
    ['Click hex code to copy • Click Export on a palette to download', 'Bonyeza msimbo wa HEX ili kunakili; bonyeza CSS kwenye paleti ili kupakua'], ['Copied!', 'Imenakiliwa!'],
    ['Colour in African Design', 'Rangi katika Ubunifu wa Afrika'], ['Textile Traditions', 'Tamaduni za Vitambaa'], ['Symbolism of Colour', 'Maana za Rangi'], ['Modern African Design', 'Ubunifu wa Kisasa wa Afrika'],
    ["Colour plays a profoundly symbolic role in African art and culture. From the bold geometric patterns of Kente cloth to the earth tones of Maasai beadwork, African colour traditions carry deep meaning and have influenced global design for centuries. These curated palettes draw from textile traditions, natural landscapes, architectural heritage, and contemporary African design movements.", 'Rangi zina maana kubwa katika sanaa na tamaduni za Afrika. Kuanzia michoro ya Kente hadi rangi za udongo katika shanga za Wamaasai, paleti hizi huchota msukumo kutoka vitambaa, mandhari, usanifu na ubunifu wa kisasa wa Afrika.'],
    ["African textiles are among the world's most colourful and iconic. Ghanaian Kente cloth uses specific colour combinations with symbolic meanings â€” gold for royalty, green for fertility, blue for peace. Nigerian Ankara (African wax print) features bold, high-contrast patterns. Maasai shuka cloth is known for its distinctive red and blue checks. Ndebele art from South Africa uses vibrant primary colours in geometric wall paintings.", 'Vitambaa vya Afrika vina rangi na alama zinazotambulika. Kente ya Ghana hutumia mchanganyiko wenye maana; Ankara ya Nigeria hutumia michoro yenye utofautishaji mkubwa; shuka ya Kimaasai hujulikana kwa miraba myekundu na ya buluu; sanaa ya Ndebele hutumia rangi angavu katika maumbo ya kijiometri.'],
    ['Across many African cultures, colours carry specific meanings. Red often represents life force, blood, and spiritual power. White symbolizes purity, peace, and the spirit world. Black represents maturity, spiritual energy, and ancestral connection. Green represents growth, fertility, and the land. Gold/yellow signifies wealth, royalty, and the harvest. Understanding these associations enriches the use of African-inspired colour palettes in design work.', 'Katika tamaduni nyingi za Afrika, rangi hubeba maana maalumu. Nyekundu inaweza kuwakilisha nguvu ya maisha, nyeupe amani na usafi, nyeusi ukomavu na uhusiano wa mababu, kijani ukuaji na ardhi, na dhahabu utajiri au mavuno. Kuelewa muktadha huu huboresha matumizi ya paleti katika ubunifu.'],
    ['Contemporary African designers and brands are creating a distinct visual language that draws from traditional colour palettes while embracing modern aesthetics. From Lagos to Nairobi to Cape Town, a new generation of graphic designers, fashion designers, and architects are defining what African design looks like in the 21st century â€” often characterized by bold colour, pattern mixing, and a connection to cultural roots.', 'Wabunifu wa kisasa wa Afrika huunganisha paleti za jadi na mitindo ya sasa. Kutoka Lagos hadi Nairobi na Cape Town, wabunifu wa michoro, mavazi na usanifu hutumia rangi angavu, mchanganyiko wa michoro na uhusiano na mizizi ya kitamaduni.'],
    ['CSS vars', 'Vigezo vya CSS'], ['Copy all', 'Nakili zote'], ['Click to copy', 'Bonyeza ili kunakili'], ['aria-label="Copy ', 'aria-label="Nakili '],
    ["'Copied '+p.colors.length+' colors!'", "'Rangi '+p.colors.length+' zimenakiliwa!'"], ["'Copied '+hex", "'Imenakiliwa '+hex"],
    ['Copy blocked. Select manually.', 'Kunakili kumezuiwa. Chagua mwenyewe.'],
    ['Copy and export palettes with context intact', 'Nakili na pakua paleti pamoja na maelezo yake'],
    ['Palette handoff check', 'Ukaguzi wa kukabidhi paleti'], ['Browse curated African-inspired palettes, copy individual hex codes, then export one palette or the full set as CSS or JSON for design handoff.', 'Vinjari paleti zilizoongozwa na Afrika, nakili misimbo ya HEX, kisha pakua paleti moja au zote kama CSS au JSON.'],
    ['Reviewed 2026', 'Imekaguliwa 2026'], ['Local palette browser. Cultural inspiration should be credited thoughtfully.', 'Kivinjari cha paleti cha ndani. Taja msukumo wa kitamaduni kwa uangalifu inapofaa.'],
    ['What to check', 'Mambo ya kukagua'], ['Methodology: curated palette data renders cards with hex codes, category filters, copy actions, and CSS or JSON exports.', 'Mbinu: data ya paleti huonyesha kadi zenye HEX, vichujio vya aina, vitendo vya kunakili na faili za CSS au JSON.'],
    ['Check contrast, cultural context, and brand fit before using a palette in a public identity.', 'Kagua utofautishaji, muktadha wa kitamaduni na ulinganifu wa chapa kabla ya kutumia paleti hadharani.'], ['Use per-palette CSS exports for small projects and full JSON/CSS exports for design-system handoff.', 'Tumia CSS ya paleti moja kwa mradi mdogo na JSON/CSS ya paleti zote kwa mfumo wa ubunifu.'],
    ['Limitations', 'Mipaka'], ['Not an official cultural authority, textile archive, trademark review, or accessibility guarantee.', 'Si mamlaka rasmi ya kitamaduni, kumbukumbu ya vitambaa, ukaguzi wa alama ya biashara wala dhamana ya ufikivu.'],
    ['Color inspiration can be used freely, but patterns, names, symbols, photos, and brand applications may have separate rights or cultural context.', 'Msukumo wa rangi unaweza kutumiwa kwa uhuru, lakini michoro, majina, alama, picha na matumizi ya chapa yanaweza kuwa na haki au muktadha tofauti.'],
    ['Review palette grid', 'Kagua gridi ya paleti'], ['Source/freshness note: palettes are design inspiration, not official cultural documentation; verify context before using heritage references in commercial branding.', 'Chanzo na uhalisia: paleti hizi ni msukumo wa ubunifu, si nyaraka rasmi za kitamaduni; thibitisha muktadha kabla ya kutumia marejeo ya urithi katika chapa ya biashara.'],
    ['Privacy note: copying and exports happen in the browser.', 'Faragha: kunakili na kupakua hufanyika ndani ya kivinjari.'],
    ['Can I use these palettes commercially?', 'Naweza kutumia paleti hizi kibiashara?'], ['Yes, these colour palettes are freely available for any commercial or personal use. Colours themselves cannot be copyrighted. However, we encourage crediting African design traditions as inspiration when using these palettes in your work.', 'Ndiyo. Paleti hizi zinapatikana kwa matumizi ya biashara au binafsi. Rangi zenyewe hazimilikiwi, lakini ni vizuri kutaja tamaduni za ubunifu wa Afrika kama msukumo inapofaa.'],
    ['What formats are the colours in?', 'Rangi zinapatikana katika miundo gani?'], ['All colours are provided as hex codes (e.g., #E4572E). Click any hex code to copy it to your clipboard. You can convert hex codes to RGB, HSL, or other formats using any colour converter tool.', 'Rangi zote zinatolewa kama misimbo ya HEX, kwa mfano #E4572E. Bonyeza msimbo wowote ili kuunakili. Unaweza kuugeuza kuwa RGB, HSL au muundo mwingine kwa kigeuzi cha rangi.'],
    ['How were these palettes created?', 'Paleti hizi ziliundwaje?'], ['Each palette was curated by studying actual African textiles, artworks, landscapes, and architectural traditions. Colours were sampled from authentic sources and harmonized for use in digital design. The palettes aim to capture the spirit and feel of their inspirations while being practical for web and graphic design applications.', 'Kila paleti ilipangwa kwa kuchunguza vitambaa, sanaa, mandhari na mila za usanifu za Afrika. Rangi ziliratibiwa ili zitumike katika ubunifu wa kidijitali huku zikihifadhi hisia ya chanzo cha msukumo.'],
    ['Frequently Asked Questions', 'Maswali Yanayoulizwa Mara kwa Mara'], ['Related tools', 'Zana zinazohusiana'], ['Related Image Tools', 'Zana za Picha Zinazohusiana'], ['Color Picker', 'Kichagua Rangi'], ['Logo Maker', 'Kitengeneza Nembo'], ['Social Media Card', 'Kadi ya Mitandao ya Kijamii'], ['View All Image Tools', 'Tazama Zana Zote za Picha']
  ]);
  html = replaceAll(html, [
    ["African textiles are among the world's most colourful and iconic. Ghanaian Kente cloth uses specific colour combinations with symbolic meanings — gold for royalty, green for fertility, blue for peace. Nigerian Ankara (African wax print) features bold, high-contrast patterns. Maasai shuka cloth is known for its distinctive red and blue checks. Ndebele art from South Africa uses vibrant primary colours in geometric wall paintings.", 'Vitambaa vya Afrika vina rangi na alama zinazotambulika. Kente ya Ghana hutumia mchanganyiko wenye maana; Ankara ya Nigeria hutumia michoro yenye utofautishaji mkubwa; shuka ya Kimaasai hujulikana kwa miraba myekundu na ya buluu; sanaa ya Ndebele hutumia rangi angavu katika maumbo ya kijiometri.'],
    ['Contemporary African designers and brands are creating a distinct visual language that draws from traditional colour palettes while embracing modern aesthetics. From Lagos to Nairobi to Cape Town, a new generation of graphic designers, fashion designers, and architects are defining what African design looks like in the 21st century — often characterized by bold colour, pattern mixing, and a connection to cultural roots.', 'Wabunifu wa kisasa wa Afrika huunganisha paleti za jadi na mitindo ya sasa. Kutoka Lagos hadi Nairobi na Cape Town, wabunifu wa michoro, mavazi na usanifu hutumia rangi angavu, mchanganyiko wa michoro na uhusiano na mizizi ya kitamaduni.'],
    ['Image Compressor Studio', 'Zana ya Kubana Picha'], ['Image Resizer Studio', 'Zana ya Kubadilisha Ukubwa wa Picha'], ['Passport Photo Studio', 'Zana ya Picha ya Pasipoti'], ['QR Code Generator', 'Kitengeneza Msimbo wa QR'],
    ['Batch compress, resize, convert, compare, and target file-size limits locally in the browser.', 'Bana, badili ukubwa na muundo wa picha ndani ya kivinjari.'], ['Generate QR codes for M-Pesa links, WhatsApp, WiFi, URLs. Download as PNG/SVG.', 'Tengeneza misimbo ya QR na uipakue kama PNG au SVG.']
  ]);
  html = html.replace("let activeCat='All';", "const CATEGORY_LABELS={All:'Zote',Textiles:'Vitambaa',Landscapes:'Mandhari','Flags & Symbols':'Bendera na alama',Culture:'Utamaduni',Modern:'Kisasa'};\nlet activeCat='All';");
  html = html.replace('class="cat-btn active" aria-pressed="true" onclick=', 'class="cat-btn active" aria-pressed="true" data-cat="All" onclick=');
  html = html.replace(">All</button>'+cats.map", ">${CATEGORY_LABELS.All}</button>'+cats.map");
  html = html.replace("onclick=\"setCat('${c}')\">${c}</button>", "data-cat=\"${c}\" onclick=\"setCat('${c}')\">${CATEGORY_LABELS[c]||c}</button>");
  html = html.replace('const selected=b.textContent===c;', 'const selected=(b.dataset.cat||\'All\')===c;');
  html = html.replace("const selected=b.textContent==='All';", "const selected=(b.dataset.cat||'All')==='All';");
  html = html.replace('function render(){', "function localizeOrigin(origin){return origin.replace(/ — /g,' — ').replace('South Africa','Afrika Kusini').replace('East Africa','Afrika Mashariki').replace('West Africa','Afrika Magharibi').replace('North Africa','Afrika Kaskazini').replace('Central Africa','Afrika ya Kati').replace('National Colours','Rangi za taifa').replace('Traditional','ya jadi').replace('Landscape','Mandhari').replace('Textiles','Vitambaa');}\n\nfunction render(){");
  html = html.replace('<div class="origin">${p.origin}</div>', '<div class="origin">${localizeOrigin(p.origin)}</div>');
  return html;
}

const built = [colorPicker, colourPalette].map((fn, index) => {
  const row = rows[index];
  return { row, value: fn(fs.readFileSync(path.join(ROOT, row.source), 'utf8'), row).replace(/\r\n/g, '\n') };
});
const stale = [];
for (const { row, value } of built) {
  const file = path.join(ROOT, row.target);
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : '';
  if (current === value) continue;
  if (!WRITE) stale.push(row.target);
  else { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value, 'utf8'); }
}
if (stale.length) { console.error(`Stale Swahili color-family owners:\n${stale.join('\n')}`); process.exit(1); }
console.log(`${WRITE ? 'Wrote' : 'Verified'} ${built.length} exact Swahili color-family owners.`);
