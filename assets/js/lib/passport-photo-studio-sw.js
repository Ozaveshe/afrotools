(function () {
  'use strict';

  const exact = new Map([
    ['Ready. Choose a requirement, upload a photo, then align the face manually.', 'Tayari. Chagua mahitaji, pakia picha, kisha pangilia uso kwa mkono.'],
    ['Requirement changed.', 'Mahitaji yamebadilishwa.'],
    ['Preview updated.', 'Muonekano umesasishwa.'],
    ['Crop reset.', 'Upunguzaji umerudishwa.'],
    ['Choose an image under 15 MB for this browser editor.', 'Chagua picha iliyo chini ya MB 15 kwa kihariri hiki.'],
    ['Choose a browser-supported image file.', 'Chagua faili ya picha inayotumika kwenye kivinjari.'],
    ['This image could not be decoded by the browser.', 'Kivinjari hakikuweza kufungua picha hii.'],
    ['Photo loaded. Align the crown and chin inside the guide before export.', 'Picha imepakiwa. Pangilia utosi na kidevu ndani ya mwongozo kabla ya kutoa faili.'],
    ['Upload a front-facing photo to start framing.', 'Pakia picha ya mbele ili kuanza kuweka fremu.'],
    ['Export ready. Download the file or copy the requirement brief.', 'Faili iko tayari. Ipakue au nakili muhtasari wa mahitaji.'],
    ['Export failed in this browser. Try PNG or JPG.', 'Utoaji umeshindwa kwenye kivinjari hiki. Jaribu PNG au JPG.'],
    ['Upload a photo first.', 'Pakia picha kwanza.'],
    ['Requirement brief copied.', 'Muhtasari wa mahitaji umenakiliwa.'],
    ['Clipboard copy failed.', 'Kunakili kwenye clipboard kumeshindwa.'],
    ['Clipboard is not available in this browser.', 'Clipboard haipatikani kwenye kivinjari hiki.'],
    ['Recent passport photo exports will appear here.', 'Faili za picha ya pasipoti ulizotoa zitaonekana hapa.'],
    ['Source note:', 'Maelezo ya chanzo:'],
    ['No match, use common 35 x 45 mm', 'Hakuna linalolingana; tumia saizi ya kawaida ya 35 x 45 mm'],
    ['Check authority', 'Thibitisha na mamlaka'],
    ['African passports', 'Pasipoti za Afrika'],
    ['African visa and ID', 'Visa na ID za Afrika'],
    ['Popular destinations', 'Maeneo maarufu'],
    ['Common sizes', 'Saizi za kawaida'],
    ['South Africa passport / ID', 'Pasipoti / ID ya Afrika Kusini'],
    ['Nigeria passport packet', 'Nyaraka za pasipoti ya Nigeria'],
    ['Ghana passport embassy packet', 'Nyaraka za pasipoti ya Ghana kwa ubalozi'],
    ['Kenya passport packet', 'Nyaraka za pasipoti ya Kenya'],
    ['Kenya eCitizen visa photo', 'Picha ya visa ya Kenya eCitizen'],
    ['Africa common passport print', 'Picha ya pasipoti ya kawaida Afrika'],
    ['United States passport / visa', 'Pasipoti / visa ya Marekani'],
    ['United Kingdom passport', 'Pasipoti ya Uingereza'],
    ['Schengen visa / Netherlands checklist', 'Visa ya Schengen / orodha ya Uholanzi'],
    ['Netherlands passport / ID', 'Pasipoti / ID ya Uholanzi'],
    ['Canada passport', 'Pasipoti ya Kanada'],
    ['Australia passport', 'Pasipoti ya Australia'],
    ['2 x 2 inch square', 'Mraba wa inchi 2 x 2'],
    ['Light grey, cream, or white', 'Kijivu chepesi, krimu au nyeupe'],
    ['Plain white', 'Nyeupe isiyo na michoro'],
    ['Plain white or light background', 'Nyeupe au rangi nyepesi isiyo na michoro'],
    ['White or off-white', 'Nyeupe au nyeupe iliyofifia'],
    ['Plain light grey or cream', 'Kijivu chepesi au krimu isiyo na michoro'],
    ['White or light-coloured', 'Nyeupe au rangi nyepesi'],
    ['Light grey, light blue, or white', 'Kijivu chepesi, bluu nyepesi au nyeupe'],
    ['Plain white or light background', 'Nyeupe au mandharinyuma mepesi yasiyo na michoro'],
    ['Official size and framing', 'Saizi na fremu rasmi'],
    ['Official photo requirement, common 35 x 45 mm crop', 'Hitaji rasmi la picha, upunguzaji wa kawaida wa 35 x 45 mm'],
    ['Official background and recency, common passport-size crop', 'Mandharinyuma na ukaribuni rasmi, upunguzaji wa kawaida wa pasipoti'],
    ['Official packet requirement, common 35 x 45 mm crop', 'Hitaji rasmi la nyaraka, upunguzaji wa kawaida wa 35 x 45 mm'],
    ['Official eCitizen photo-upload guidance', 'Mwongozo rasmi wa kupakia picha wa eCitizen'],
    ['Common studio fallback', 'Chaguo la kawaida la studio'],
    ['Official size and head range', 'Saizi na kiwango cha kichwa rasmi'],
    ['Official printed photo size', 'Saizi rasmi ya picha iliyochapishwa'],
    ['Official Dutch Schengen checklist size', 'Saizi rasmi ya orodha ya Schengen ya Uholanzi'],
    ['Official Dutch passport/ID requirements', 'Mahitaji rasmi ya pasipoti/ID ya Uholanzi'],
    ['Official size range, 35 x 45 mm working crop', 'Kiwango rasmi cha saizi, upunguzaji wa 35 x 45 mm'],
    ['Common size preset', 'Mpangilio wa saizi ya kawaida'],
    ['2 passport photos, office may capture biometrics', 'Picha 2 za pasipoti; ofisi inaweza kuchukua biometriki'],
    ['NIS asks for passport-sized photos; count varies by application type', 'NIS huomba picha za saizi ya pasipoti; idadi hutegemea aina ya ombi'],
    ['4 photos in the referenced embassy form', 'Picha 4 kwenye fomu ya ubalozi iliyorejelewa'],
    ['3 current passport-size photos in eCitizen passport instructions', 'Picha 3 za sasa za saizi ya pasipoti kwenye maelekezo ya eCitizen'],
    ['Digital upload guidance', 'Mwongozo wa upakiaji wa kidijitali'],
    ['Use when your office says passport-size photo only', 'Tumia ofisi ikisema tu picha ya saizi ya pasipoti'],
    ['1 photo for many passport applications', 'Picha 1 kwa maombi mengi ya pasipoti'],
    ['2 identical printed photos for paper forms', 'Picha 2 zilizochapishwa zinazofanana kwa fomu za karatasi'],
    ['Usually 1 photo unless centre captures digital photo', 'Kwa kawaida picha 1 isipokuwa kituo kinachukua picha ya kidijitali'],
    ['Passport, ID, and driving licence standard', 'Kiwango cha pasipoti, ID na leseni ya udereva'],
    ['2 identical photos for paper applications', 'Picha 2 zinazofanana kwa maombi ya karatasi'],
    ['2 good-quality photos', 'Picha 2 zenye ubora mzuri'],
    ['Digital or print as requested', 'Ya kidijitali au iliyochapishwa kama ilivyoombwa']
  ]);

  const notes = new Map([
    ['35 x 45 mm print.', 'Chapisho la 35 x 45 mm.'],
    ['Face should take about 70 to 80 percent of the photo.', 'Uso uwe takriban asilimia 70 hadi 80 ya picha.'],
    ['Use a recent, clear photo with no shadows or glare.', 'Tumia picha ya karibuni iliyo wazi bila vivuli au mng\'ao.'],
    ['NIS lists passport-sized photographs in the application packet.', 'NIS hutaja picha za saizi ya pasipoti kwenye nyaraka za ombi.'],
    ['Use a conservative 35 x 45 mm print unless the passport office gives a different local size.', 'Tumia chapisho la 35 x 45 mm isipokuwa ofisi ya pasipoti itoe saizi tofauti ya eneo lako.'],
    ['Bring extra copies for guarantor or age-declaration paperwork when requested.', 'Beba nakala za ziada kwa nyaraka za mdhamini au tamko la umri zinapoombwa.'],
    ['The form asks for full-face passport-size photos on a plain white background.', 'Fomu huomba picha ya uso mzima ya saizi ya pasipoti kwenye mandharinyuma meupe yasiyo na michoro.'],
    ['Photos should be within 6 months and without dark glasses or hat.', 'Picha ziwe za ndani ya miezi 6 na bila miwani myeusi au kofia.'],
    ['Exact millimetre size is not printed on the referenced form, so confirm with the mission if strict sizing is required.', 'Saizi kamili ya milimita haijaandikwa kwenye fomu iliyorejelewa; thibitisha na ubalozi ikiwa saizi maalum inahitajika.'],
    ['eCitizen asks for three current passport-size photos during submission.', 'eCitizen huomba picha tatu za sasa za saizi ya pasipoti wakati wa kuwasilisha.'],
    ['Passport processing centres also capture biometrics.', 'Vituo vya kuchakata pasipoti pia huchukua biometriki.'],
    ['Use a clean 35 x 45 mm print for physical packets unless the office asks for another size.', 'Tumia chapisho safi la 35 x 45 mm kwa nyaraka za karatasi isipokuwa ofisi iombe saizi nyingine.'],
    ['Photo should be colour with a white background.', 'Picha iwe ya rangi na mandharinyuma meupe.'],
    ['The page states 5.5 cm x 5.5 cm and 207 px x 207 px.', 'Ukurasa hutaja 5.5 cm x 5.5 cm na 207 px x 207 px.'],
    ['Use this only when the issuing office says passport-size and does not publish exact dimensions.', 'Tumia hii tu ikiwa ofisi inayotoa hati inasema saizi ya pasipoti bila kuchapisha vipimo kamili.'],
    ['Confirm size before printing if rejection would be costly.', 'Thibitisha saizi kabla ya kuchapisha ikiwa kukataliwa kutakuwa na gharama.'],
    ['White background is the safest general choice.', 'Mandharinyuma meupe ndiyo chaguo salama zaidi kwa ujumla.'],
    ['2 x 2 inch photo, which is about 51 x 51 mm.', 'Picha ya inchi 2 x 2, sawa na takriban 51 x 51 mm.'],
    ['Head height should be 25 to 35 mm from chin to top of head.', 'Urefu wa kichwa uwe 25 hadi 35 mm kutoka kidevu hadi juu ya kichwa.'],
    ['Do not use filters, AI, or retouching for official submission.', 'Usitumie filters, AI au uhariri wa picha kwa uwasilishaji rasmi.'],
    ['Printed UK passport photos are 35 mm wide by 45 mm high.', 'Picha za pasipoti ya Uingereza zilizochapishwa ni 35 mm kwa upana na 45 mm kwa urefu.'],
    ['Use a plain light grey or cream background with no shadows.', 'Tumia mandharinyuma ya kijivu chepesi au krimu bila vivuli.'],
    ['Digital UK passport photos should be checked through the official passport flow.', 'Picha za kidijitali za pasipoti ya Uingereza zikaguliwe kupitia mchakato rasmi wa pasipoti.'],
    ['Checklist states colour photo, no more than 6 months old, 3.5 x 4.5 cm.', 'Orodha hutaja picha ya rangi, isiyozidi miezi 6, yenye 3.5 x 4.5 cm.'],
    ['External service providers may capture a digital photo at the appointment.', 'Watoa huduma wa nje wanaweza kuchukua picha ya kidijitali wakati wa miadi.'],
    ['Use destination consulate instructions when a national checklist differs.', 'Fuata maelekezo ya ubalozi wa unakoenda ikiwa orodha ya taifa inatofautiana.'],
    ['Standard format is 35 x 45 mm.', 'Format ya kawaida ni 35 x 45 mm.'],
    ['Face length for ages 11 and above is 26 to 30 mm from chin to crown.', 'Urefu wa uso kwa wenye miaka 11 na zaidi ni 26 hadi 30 mm kutoka kidevu hadi utosi.'],
    ['Background may be light grey, light blue, or white.', 'Mandharinyuma yanaweza kuwa kijivu chepesi, bluu nyepesi au nyeupe.'],
    ['Canada uses 50 x 70 mm, which differs from many countries.', 'Kanada hutumia 50 x 70 mm, tofauti na nchi nyingi.'],
    ['Face height should be 31 to 36 mm from chin to crown.', 'Urefu wa uso uwe 31 hadi 36 mm kutoka kidevu hadi utosi.'],
    ['Canada requires commercial photographer details for many workflows.', 'Kanada huhitaji maelezo ya mpiga picha wa biashara kwa michakato mingi.'],
    ['Australian photos must be 35 to 40 mm wide and 45 to 50 mm high.', 'Picha za Australia lazima ziwe 35 hadi 40 mm kwa upana na 45 hadi 50 mm kwa urefu.'],
    ['This studio outputs a 35 x 45 mm crop inside the accepted range.', 'Studio hii hutoa upunguzaji wa 35 x 45 mm ulio ndani ya kiwango kinachokubalika.'],
    ['Face height should be 32 to 36 mm from chin to crown.', 'Urefu wa uso uwe 32 hadi 36 mm kutoka kidevu hadi utosi.'],
    ['Good for U.S.-style document workflows.', 'Inafaa kwa michakato ya nyaraka ya mtindo wa Marekani.'],
    ['Do not use this for Canada, UK, South Africa, or Schengen unless the authority asks for it.', 'Usitumie hii kwa Kanada, Uingereza, Afrika Kusini au Schengen isipokuwa mamlaka iombe.'],
    ['Check the target portal before upload.', 'Kagua portal lengwa kabla ya kupakia.']
  ]);

  const roots = [
    'ppStatus', 'ppSpecSelect', 'ppSpecTitle', 'ppSpecHead', 'ppSpecBackground', 'ppSpecCopies',
    'ppSpecConfidence', 'ppSourceBox', 'ppNotesList', 'ppPreviewEmpty', 'ppOutputType',
    'ppScoreText', 'ppHistoryList'
  ].map(id => document.getElementById(id)).filter(Boolean);

  function translate(raw) {
    const value = String(raw || '').trim();
    if (exact.has(value)) return exact.get(value);
    if (notes.has(value)) return notes.get(value);
    if (/^([0-9.]+) to ([0-9.]+) mm$/.test(value)) return value.replace(' to ', ' hadi ');
    if (/^(\d+) of 7 checks complete$/.test(value)) return value.replace(/^(\d+) of 7 checks complete$/, 'Ukaguzi $1 kati ya 7 umekamilika');
    return value;
  }

  function localize(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const raw = node.nodeValue.trim();
      const next = translate(raw);
      if (raw && raw !== next) node.nodeValue = node.nodeValue.replace(raw, next);
    });
    if (root.tagName === 'SELECT') {
      Array.from(root.querySelectorAll('optgroup')).forEach(group => { group.label = translate(group.label); });
    }
  }

  function copyLocalizedBrief(event) {
    const button = event.target.closest('#ppCopyBtn');
    if (!button || button.disabled) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const selected = document.querySelector('#ppSpecSelect option:checked');
    const source = document.querySelector('#ppSourceBox a');
    const lines = [
      'AfroTools Studio ya Picha ya Pasipoti',
      `Mahitaji: ${selected ? selected.textContent.trim() : document.getElementById('ppSpecTitle').textContent.trim()}`,
      `Saizi: ${document.getElementById('ppSpecSize').textContent.trim()}`,
      `Kiwango cha kichwa: ${document.getElementById('ppSpecHead').textContent.trim()}`,
      `Mandharinyuma: ${document.getElementById('ppSpecBackground').textContent.trim()}`,
      `Nakala: ${document.getElementById('ppSpecCopies').textContent.trim()}`,
      `Chanzo: ${source ? `${source.textContent.trim()} - ${source.href}` : document.getElementById('ppSourceBox').textContent.replace('Maelezo ya chanzo:', '').trim()}`,
      `Matokeo: ${document.querySelector('#ppLayout option:checked').textContent.trim()}, ${document.getElementById('ppFormat').value.replace('image/', '').toUpperCase()}, 300 DPI`,
      'Kumbuka: thibitisha mwongozo rasmi wa sasa kabla ya kuwasilisha picha ya pasipoti au visa.'
    ];
    const status = document.getElementById('ppStatus');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lines.join('\n')).then(() => { status.textContent = 'Muhtasari wa mahitaji umenakiliwa.'; }).catch(() => { status.textContent = 'Kunakili kwenye clipboard kumeshindwa.'; });
    } else status.textContent = 'Clipboard haipatikani kwenye kivinjari hiki.';
  }

  const observer = new MutationObserver(() => roots.forEach(localize));
  roots.forEach(root => observer.observe(root, { childList: true, subtree: true, characterData: true }));
  document.addEventListener('click', copyLocalizedBrief, true);
  window.setTimeout(() => roots.forEach(localize));
}());
