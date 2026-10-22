(function (root, factory) {
  'use strict';
  var engine = typeof module === 'object' && module.exports ? require('../../../engines/src/whatsapp-link-engine.js') : root.AfroTools.engines.whatsappLink;
  var api = factory(engine);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) { root.AfroTools.whatsappLocal = api; api.mount(root.document); }
})(typeof window === 'undefined' ? null : window, function (engine) {
  'use strict';
  var countries = [
    ['234','Najeriya','Naijiria'],['254','Kenya','Kenya'],['233','Ghana','Ghana'],['27','Afirka ta Kudu','Gúúsù Áfíríkà'],['20','Masar','Íjíbítì'],
    ['255','Tanzania','Tanzania'],['256','Uganda','Uganda'],['237','Kamaru','Kamẹrúùn'],['225',"Cote d’Ivoire",'Kóòtù Dìvuá'],['251','Habasha','Étíópíà'],
    ['212','Maroko','Mòrókò'],['213','Aljeriya','Algeria'],['216','Tunisiya','Tùnísíà'],['250','Rwanda','Rwanda'],['263','Zimbabwe','Zimbabwe'],
    ['260','Zambia','Zambia'],['265','Malawi','Malawi'],['221','Senegal','Senegal'],['1','Amurka/Kanada','USA/Canada'],['44','UK','UK'],
    ['91','Indiya','India'],['971','UAE','UAE'],['966','Saudiyya','Saudi Arabia'],['86','Sin','Ṣáínà'],['49','Jamus','Jámánì'],['33','Faransa','Fáránsè']
  ];
  var bulkCodes = ['234','254','233','27','20','1','44'];
  var text = {
    ha: {
      single:'Link daya', bulk:'Link masu yawa', modes:'Yanayin aikin WhatsApp', country:'Lambar kasa', choose:'Zabi lambar kasa', phone:'Lambar WhatsApp',
      phoneHelp:'Zabi kasar lambar. Za ka iya saka lambar gida mai 0 a farko ko cikakkiyar lamba da lambar kasa. Bayan hada lambar kasa, lambobi 7 zuwa 15 ake bukata. Wannan ba tabbacin asusun WhatsApp ba ne.',
      business:'Sunan kasuwanci (idan kana so)', item:'Kaya ko hidima (idan kana so)', template:'Samfurin sako', apply:'Saka samfurin sako', message:'Sakon farko (idan kana so)',
      generate:'Gina link', reset:'Sake farawa', generateBulk:'Gina link din taro', numbers:'Lambobin waya, daya a kowane layi', bulkHelp:'Har layi 500. Za a nuna layukan da ba su dace ba; ba za a boye kuskure ba.',
      privacy:'Lamba da sako suna cikin link, QR da fayil din da ka raba. Ana shirya su a naurarka. Bude a WhatsApp ne kawai zai kai ka zuwa WhatsApp. Kada ka saka PIN, BVN, NIN ko bayanan kati.',
      result:'An shirya link.', preview:'Sakon da ke cikin link', url:'Link din da za a raba', open:'Bude a WhatsApp', copy:'Kwafi link', copyAll:'Kwafi duka', txt:'Sauke TXT', qr:'Sauke QR PNG',
      qrHelp:'QR yana dauke da link din nan. Duba lamba da sako kafin rabawa.', qrFail:'Ba a iya gina QR ba. Rage tsawon sako, sannan sake ginawa. Link da TXT suna nan.',
      countryError:'Zabi lambar kasa.', phoneError:'Saka lambobi 7–15.', formatError:'Saka lambar waya.', mismatch:'Duba lambar kasa.',
      messageError:'Gyara harafin sakon.', empty:'Saka akalla lamba daya.', limit:'Iyakar: lambobi 500.', none:'Gyara lambobin da ka saka.',
      stale:'Bayanai sun sauya. Sake ginawa kafin rabawa.', resetDone:'An goge bayanai da sakamako.', copied:'An kwafi link.', copyFailed:'Ba a iya kwafi ba. Sauke TXT ko zabi rubutun link.',
      downloaded:'An shirya fayil din.', downloadFailed:'Ba a iya saukewa ba. Sake gwadawa.', line:'Layi', ready:'An shirya', invalid:'ba su dace ba', errors:'Layukan da za a gyara', links:'Link din taro',
      templateNames:['Neman oda','Taimakon kwastoma','Ajiyar lokaci','Tabbacin biya','Bayani kan isarwa'], defaultBusiness:'kasuwancinku', defaultItem:'kaya ko hidimarku',
      templates:[
        'Sannu {business}, ina son yin odar {item}. A turo farashi, ko akwai, da zabukan isarwa.',
        'Sannu {business}, ina bukatar taimako kan {item}. A sanar da ni mataki na gaba.',
        'Sannu {business}, ina son ajiyar lokacin {item}. Wadanne lokuta ake da su?',
        'Sannu {business}, na biya kudin {item}. A tabbatar an karba.',
        'Sannu {business}, ina neman sabon bayani kan isar da {item}.'
      ]
    },
    yo: {
      single:'Ìjápọ̀ kan', bulk:'Ọ̀pọ̀ ìjápọ̀', modes:'Ọ̀nà iṣẹ́ WhatsApp', country:'Kóòdù orílẹ̀-èdè', choose:'Yan kóòdù orílẹ̀-èdè', phone:'Nọ́ńbà WhatsApp',
      phoneHelp:'Yan orílẹ̀-èdè nọ́ńbà náà. O lè tẹ nọ́ńbà agbègbè tó bẹ̀rẹ̀ pẹ̀lú 0 tàbí nọ́ńbà kíkún pẹ̀lú kóòdù orílẹ̀-èdè. Díjíìtì 7 sí 15 ni nọ́ńbà kíkún pẹ̀lú kóòdù. Èyí kì í jẹ́rìí àkọọ́lẹ̀ WhatsApp.',
      business:'Orúkọ ilé-iṣẹ́ (bí o bá fẹ́)', item:'Ọjà tàbí iṣẹ́ (bí o bá fẹ́)', template:'Àpẹẹrẹ ọ̀rọ̀', apply:'Lo àpẹẹrẹ ọ̀rọ̀', message:'Ọ̀rọ̀ ìfiránṣẹ́ (bí o bá fẹ́)',
      generate:'Ṣẹ̀dá ìjápọ̀', reset:'Bẹ̀rẹ̀ padà', generateBulk:'Ṣẹ̀dá ọ̀pọ̀ ìjápọ̀', numbers:'Àwọn nọ́ńbà, ọ̀kan ní ìlà kọ̀ọ̀kan', bulkHelp:'Ìlà 500 ni ó pọ̀ jù. A ó fi àwọn ìlà tí kò tọ́ hàn; a kò ní fi àṣìṣe pamọ́.',
      privacy:'Nọ́ńbà àti ọ̀rọ̀ wà nínú ìjápọ̀, QR àti fáìlì tí o pín. A pèsè wọn lórí ẹ̀rọ rẹ. Ṣí nínú WhatsApp nìkan ló máa gbé ọ lọ sí WhatsApp. Má fi PIN, BVN, NIN tàbí àlàyé káàdì kún un.',
      result:'A ti pèsè ìjápọ̀.', preview:'Ọ̀rọ̀ inú ìjápọ̀', url:'Ìjápọ̀ tí a ó pín', open:'Ṣí nínú WhatsApp', copy:'Da ìjápọ̀ kọ́', copyAll:'Da gbogbo rẹ̀ kọ́', txt:'Gba TXT', qr:'Gba QR PNG',
      qrHelp:'QR yìí ní ìjápọ̀ yìí nínú. Ṣàyẹ̀wò nọ́ńbà àti ọ̀rọ̀ kí o tó pín in.', qrFail:'A kò lè ṣẹ̀dá QR. Dín ọ̀rọ̀ kù, kí o sì tún ṣẹ̀dá rẹ̀. Ìjápọ̀ àti TXT ṣì wà.',
      countryError:'Yan kóòdù orílẹ̀-èdè.', phoneError:'Tẹ díjíìtì 7–15.', formatError:'Lo díjíìtì fóònù.', mismatch:'Ṣàyẹ̀wò kóòdù.',
      messageError:'Ṣàtúnṣe àmì inú ọ̀rọ̀.', empty:'Tẹ nọ́ńbà kan.', limit:'Ó pọ̀ jù: nọ́ńbà 500.', none:'Ṣàtúnṣe àwọn nọ́ńbà.',
      stale:'Àwọn àlàyé ti yí padà. Tún ṣẹ̀dá rẹ̀ kí o tó pín in.', resetDone:'A ti pa àlàyé àti àbájáde rẹ́.', copied:'A ti da ìjápọ̀ kọ́.', copyFailed:'A kò lè dà á kọ́. Gba TXT tàbí yan ọ̀rọ̀ ìjápọ̀.',
      downloaded:'A ti pèsè fáìlì.', downloadFailed:'A kò lè gba fáìlì. Gbìyànjú lẹ́ẹ̀kan sí i.', line:'Ìlà', ready:'A ti pèsè', invalid:'kò tọ́', errors:'Àwọn ìlà láti ṣàtúnṣe', links:'Ọ̀pọ̀ ìjápọ̀',
      templateNames:['Ìbéèrè ọjà','Ìrànlọ́wọ́ alábàárà','Ìpàdé','Ìjẹ́rìísí ìsanwó','Ìròyìn ìfiránṣẹ́ ọjà'], defaultBusiness:'ilé-iṣẹ́ yín', defaultItem:'ọjà tàbí iṣẹ́ yín',
      templates:[
        'Ẹ káàrọ̀ {business}, mo fẹ́ ra {item}. Ẹ fi iye owó, bóyá ó wà, àti ọ̀nà ìfiránṣẹ́ ọjà hàn mí.',
        'Ẹ káàrọ̀ {business}, mo nílò ìrànlọ́wọ́ lórí {item}. Ẹ jọ̀wọ́ ẹ sọ ìgbésẹ̀ tó kàn.',
        'Ẹ káàrọ̀ {business}, mo fẹ́ ṣètò ìpàdé fún {item}. Àkókò wo ló wà?',
        'Ẹ káàrọ̀ {business}, mo ti san owó fún {item}. Ẹ jọ̀wọ́ ẹ jẹ́rìí pé ẹ ti gbà á.',
        'Ẹ káàrọ̀ {business}, mo fẹ́ mọ bí ìfiránṣẹ́ {item} ṣe ń lọ.'
      ]
    }
  };
  var kinds = ['order','support','booking','payment','delivery'];
  function copy(locale) { if (!text[locale]) throw new RangeError('Unsupported locale'); return text[locale]; }
  function problem(field, code) { var error = new RangeError(code); error.field = field; error.code = code; return error; }
  function build(code, phone, message) {
    if (!countries.some(function (row) { return row[0] === code; })) throw problem('country','countryError');
    var raw = String(phone || '').trim();
    if (!raw) throw problem('phone','phoneError');
    if (!/^\+?[\d\s()\-]+$/.test(raw)) throw problem('phone','formatError');
    var digits = raw.replace(/\D/g,'').replace(/^0+/,'');
    if (/^(\+|00)/.test(raw) && digits.indexOf(code) !== 0) throw problem('phone','mismatch');
    try { engine.normalize(code,raw); } catch (_) { throw problem('phone','phoneError'); }
    try { return engine.build(code,raw,message); } catch (_) { throw problem('message','messageError'); }
  }
  function bulk(code, value, message) {
    if (bulkCodes.indexOf(code) < 0) throw problem('country','countryError');
    try { encodeURIComponent(String(message || '').trim()); } catch (_) { throw problem('message','messageError'); }
    var lines = String(value || '').split(/\r?\n/);
    if (lines.filter(function (line) { return line.trim(); }).length > 500) throw problem('numbers','limit');
    var items = [], errors = [];
    lines.forEach(function (line,index) {
      if (!line.trim()) return;
      try { var row = build(code,line,message); row.line = index + 1; items.push(row); }
      catch (error) { errors.push({ line:index + 1, code:error.code }); }
    });
    if (!items.length && !errors.length) throw problem('numbers','empty');
    return { items:items, errors:errors };
  }
  function template(locale, kind, business, item) {
    var t = copy(locale), index = kinds.indexOf(kind);
    if (index < 0) throw new RangeError('Unknown template');
    var fields = { business:String(business || '').trim() || t.defaultBusiness, item:String(item || '').trim() || t.defaultItem };
    return t.templates[index].replace(/\{(business|item)\}/g,function (_,key) { return fields[key]; });
  }
  function copyText(clipboard, value) {
    if (!clipboard || typeof clipboard.writeText !== 'function') return Promise.resolve(false);
    try { return Promise.resolve(clipboard.writeText(value)).then(function () { return true; }, function () { return false; }); }
    catch (_) { return Promise.resolve(false); }
  }
  function markup(locale) {
    var t = copy(locale), prefix = 'wa-' + locale + '-';
    function field(key,label,control,help) {
      var id = prefix + key;
      return '<div class="form-field wa-field"><label class="form-label" for="' + id + '">' + label + '</label>' + control.replace('{id}',id).replace('{name}',key).replace('{described}',id + '-error' + (help ? ' ' + id + '-help' : '')) +
        '<p class="form-error wa-error" id="' + id + '-error" data-wa-error="' + key + '" aria-live="polite"></p>' + (help ? '<p class="form-help" id="' + id + '-help">' + help + '</p>' : '') + '</div>';
    }
    function input(key,label) { return field(key,label,'<input class="form-input" id="{id}" name="{name}" aria-describedby="{described}" autocomplete="off">'); }
    function select(key,label,options) { return field(key,label,'<select class="form-select" id="{id}" name="{name}" aria-describedby="{described}">' + options + '</select>'); }
    function options(isBulk) { return '<option value="">' + t.choose + '</option>' + countries.filter(function (row) { return !isBulk || bulkCodes.indexOf(row[0]) >= 0; }).map(function (row) { return '<option value="' + row[0] + '">+' + row[0] + ' — ' + row[locale === 'ha' ? 1 : 2] + '</option>'; }).join(''); }
    function button(label,attr) { return '<button class="btn btn-secondary" type="button" ' + attr + '>' + label + '</button>'; }
    function actions(generate) { return '<div class="wa-actions"><button class="btn btn-primary" type="submit">' + generate + '</button><button class="btn btn-secondary" type="reset">' + t.reset + '</button></div>'; }
    function textarea(key,label,help) { return field(key,label,'<textarea class="form-input" id="{id}" name="{name}" rows="3" aria-describedby="{described}"></textarea>',help); }
    function result(mode) {
      return '<div data-wa-result role="status" aria-live="polite" aria-atomic="true" tabindex="-1" hidden></div><div data-wa-details hidden>' +
        (mode === 'single' ? '<label class="form-label" for="' + prefix + 'url">' + t.url + '</label><textarea id="' + prefix + 'url" data-wa-url readonly rows="3"></textarea><h3>' + t.preview + '</h3><p class="wa-preview" data-wa-preview></p><div data-wa-qr aria-label="QR"></div><p data-wa-qr-status role="status" aria-live="polite"></p><p>' + t.qrHelp + '</p><div class="wa-actions">' + button(t.copy,'data-wa-copy') + '<a class="btn btn-secondary" data-wa-open target="_blank" rel="noopener noreferrer">' + t.open + '</a>' + button(t.qr,'data-wa-download-qr') + button(t.txt,'data-wa-download-txt') + '</div>' : '<ol data-wa-links></ol><h3>' + t.errors + '</h3><ol data-wa-line-errors></ol><div class="wa-actions">' + button(t.copyAll,'data-wa-copy-all') + button(t.txt,'data-wa-download-txt') + '</div>') + '</div><p data-wa-status role="status" aria-live="polite"></p>';
    }
    return '<div data-wa-workflow="' + locale + '"><p class="wa-privacy">' + t.privacy + '</p><div class="wa-actions" role="group" aria-label="' + t.modes + '">' +
      '<button class="btn btn-primary" type="button" data-wa-mode="single" aria-pressed="true" aria-controls="' + prefix + 'single">' + t.single + '</button><button class="btn btn-secondary" type="button" data-wa-mode="bulk" aria-pressed="false" aria-controls="' + prefix + 'bulk">' + t.bulk + '</button></div>' +
      '<form id="' + prefix + 'single" data-wa-form="single" novalidate aria-label="' + t.single + '"><h2>' + t.generate + '</h2><div class="wa-grid">' +
      select('country',t.country,options(false)) + field('phone',t.phone,'<input class="form-input" id="{id}" name="{name}" inputmode="tel" autocomplete="off" aria-describedby="{described}">',t.phoneHelp) + input('business',t.business) + input('item',t.item) +
      select('template',t.template,kinds.map(function (kind,index) { return '<option value="' + kind + '">' + t.templateNames[index] + '</option>'; }).join('')) + '</div>' + button(t.apply,'data-wa-template') + textarea('message',t.message) + actions(t.generate) + result('single') + '</form>' +
      '<form id="' + prefix + 'bulk" data-wa-form="bulk" novalidate aria-label="' + t.bulk + '" hidden><h2>' + t.generateBulk + '</h2>' + select('bulk-country',t.country,options(true)) + textarea('numbers',t.numbers,t.bulkHelp) + textarea('bulk-message',t.message) + actions(t.generateBulk) + result('bulk') + '</form></div>';
  }
  function mount(doc) {
    doc.querySelectorAll('[data-wa-workflow]').forEach(function (panel) {
      if (panel.dataset.waReady) return; panel.dataset.waReady = 'true';
      var locale = panel.dataset.waWorkflow, t = copy(locale), view = doc.defaultView;
      function node(tag,value) { var e = doc.createElement(tag); e.textContent = value; return e; }
      function reveal(target,extra) {
        var top = 72, bottom = view.innerHeight - 12;
        ['afro-cookie-consent','afro-pwa-banner'].forEach(function (id) { var e = doc.getElementById(id); if (!e) return; var r = e.getBoundingClientRect(); if (r.width && r.height && r.top >= 0) bottom = Math.min(bottom,r.top - 12); });
        var first = target.getBoundingClientRect(), last = extra ? extra.getBoundingClientRect() : first;
        view.scrollBy({ top:(Math.min(first.top,last.top) + Math.max(first.bottom,last.bottom)) / 2 - (top + Math.max(top + 80,bottom)) / 2, behavior:'instant' });
      }
      panel.addEventListener('focusin',function (event) {
        var target = event.target;
        if (!target.matches('input,select,textarea,button,a[href]')) return;
        view.requestAnimationFrame(function () {
          if (doc.activeElement !== target) return;
          var field = target.closest('.wa-field'), label = field && field.querySelector('label'), error = field && field.querySelector('[data-wa-error]');
          reveal(label || target,error && error.textContent ? error : target);
        });
      });
      panel.querySelectorAll('[data-wa-mode]').forEach(function (button) {
        button.addEventListener('click',function () {
          var mode = button.dataset.waMode;
          panel.querySelectorAll('[data-wa-mode]').forEach(function (b) { b.setAttribute('aria-pressed',String(b === button)); });
          panel.querySelectorAll('form').forEach(function (form) { form.hidden = form.dataset.waForm !== mode; });
          var first = panel.querySelector('[data-wa-form="' + mode + '"] select'); first.focus({preventScroll:true}); reveal(first.closest('.wa-field'));
        });
      });
      panel.querySelectorAll('form').forEach(function (form) {
        var single = form.dataset.waForm === 'single', result = form.querySelector('[data-wa-result]'), details = form.querySelector('[data-wa-details]'), status = form.querySelector('[data-wa-status]');
        var current = null, staleText = t.stale;
        function errorsClear() { form.querySelectorAll('[aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); }); form.querySelectorAll('[data-wa-error]').forEach(function (e) { e.textContent = ''; }); }
        function invalidate() {
          current = null; result.hidden = true; result.textContent = ''; details.hidden = true;
          details.querySelector('.wa-actions').hidden = false;
          if (single) { form.querySelector('[data-wa-url]').value = ''; form.querySelector('[data-wa-open]').removeAttribute('href'); form.querySelector('[data-wa-qr]').replaceChildren(); }
          else { form.querySelector('[data-wa-links]').replaceChildren(); form.querySelector('[data-wa-line-errors]').replaceChildren(); }
        }
        function edited() { var stale = !!current || status.textContent === staleText; errorsClear(); invalidate(); status.textContent = stale ? staleText : ''; }
        function showError(field,code) {
          var control = form.elements[field], error = form.querySelector('[data-wa-error="' + field + '"]');
          control.setAttribute('aria-invalid','true'); error.textContent = t[code]; control.focus({preventScroll:true}); reveal(control,error);
        }
        function renderQr() {
          var qr = form.querySelector('[data-wa-qr]'), qrStatus = form.querySelector('[data-wa-qr-status]'); qr.replaceChildren(); qrStatus.textContent = '';
          try { if (!view.QRCode) throw new Error('QR unavailable'); new view.QRCode(qr,{text:current.url,width:256,height:256,colorDark:'#0f172a',colorLight:'#ffffff',correctLevel:view.QRCode.CorrectLevel.M}); }
          catch (_) { qr.replaceChildren(); qrStatus.textContent = t.qrFail; }
        }
        function calculate() {
          errorsClear(); invalidate(); status.textContent = '';
          try {
            if (single) {
              current = build(form.elements.country.value,form.elements.phone.value,form.elements.message.value);
              result.append(node('strong',t.result),node('p',current.masked));
              form.querySelector('[data-wa-url]').value = current.url; form.querySelector('[data-wa-open]').href = current.url;
              form.querySelector('[data-wa-preview]').textContent = form.elements.message.value.trim(); renderQr();
            } else {
              current = bulk(form.elements['bulk-country'].value,form.elements.numbers.value,form.elements['bulk-message'].value);
              current.errors.forEach(function (row) { form.querySelector('[data-wa-line-errors]').appendChild(node('li',t.line + ' ' + row.line + ': ' + t[row.code])); });
              if (!current.items.length) { current = null; details.hidden = false; details.querySelector('.wa-actions').hidden = true; showError('numbers','none'); return false; }
              result.append(node('strong',t.ready + ': ' + current.items.length),node('p',current.errors.length + ' ' + t.invalid));
              current.items.forEach(function (row) {
                var li = node('li',''), label = node('label',t.line + ' ' + row.line), url = node('textarea','');
                url.id = 'wa-' + locale + '-line-' + row.line; url.value = row.url; url.readOnly = true; url.rows = 2; label.htmlFor = url.id;
                var button = node('button',t.copy + ' — ' + t.line + ' ' + row.line); button.type = 'button'; button.className = 'btn btn-secondary';
                button.addEventListener('click',function () { copyText(view.navigator.clipboard,row.url).then(function (ok) { status.textContent = ok ? t.copied : t.copyFailed; }); });
                li.append(label,url,button); form.querySelector('[data-wa-links]').appendChild(li);
              });
            }
          } catch (error) {
            current = null;
            var field = error.field || 'message';
            if (!single && field === 'country') field = 'bulk-country';
            if (!single && field === 'message') field = 'bulk-message';
            showError(field,error.code || 'messageError'); return false;
          }
          result.hidden = false; details.hidden = false; result.focus({preventScroll:true}); reveal(result); return true;
        }
        form.addEventListener('submit',function (event) { event.preventDefault(); calculate(); });
        form.addEventListener('input',function (event) { if (!event.target.readOnly) edited(); });
        form.addEventListener('change',function (event) { if (!event.target.readOnly) edited(); });
        form.addEventListener('reset',function () { errorsClear(); invalidate(); status.textContent = t.resetDone; var first = form.querySelector('select'); first.focus({preventScroll:true}); reveal(first.closest('.wa-field')); });
        var apply = form.querySelector('[data-wa-template]');
        if (apply) apply.addEventListener('click',function () { edited(); form.elements.message.value = template(locale,form.elements.template.value,form.elements.business.value,form.elements.namedItem('item').value); form.elements.message.focus({preventScroll:true}); reveal(form.elements.message.closest('.wa-field')); });
        function linksText() { return single ? current.url + '\n' : current.items.map(function (row) { return row.url; }).join('\n') + '\n'; }
        var copyButton = form.querySelector(single ? '[data-wa-copy]' : '[data-wa-copy-all]');
        copyButton.addEventListener('click',function () { if (!current && !calculate()) return; copyText(view.navigator.clipboard,linksText().trim()).then(function (ok) { status.textContent = ok ? t.copied : t.copyFailed; }); });
        function download(filename,href,revoke) {
          var a;
          try { a = doc.createElement('a'); a.href = href; a.download = filename; doc.body.appendChild(a); a.click(); status.textContent = t.downloaded; }
          catch (_) { status.textContent = t.downloadFailed; }
          finally { if (a) a.remove(); if (revoke) view.setTimeout(function () { view.URL.revokeObjectURL(href); },1000); }
        }
        form.querySelector('[data-wa-download-txt]').addEventListener('click',function () {
          if (!current && !calculate()) return;
          try { var value = linksText(); if (!single && current.errors.length) value += '\n' + t.errors + ':\n' + current.errors.map(function (row) { return t.line + ' ' + row.line + ': ' + t[row.code]; }).join('\n') + '\n'; download('whatsapp-links.txt',view.URL.createObjectURL(new view.Blob([value],{type:'text/plain;charset=utf-8'})),true); }
          catch (_) { status.textContent = t.downloadFailed; }
        });
        var qrDownload = form.querySelector('[data-wa-download-qr]');
        if (qrDownload) qrDownload.addEventListener('click',function () {
          if (!current && !calculate()) return;
          var canvas = form.querySelector('[data-wa-qr] canvas');
          if (!canvas) { form.querySelector('[data-wa-qr-status]').textContent = t.qrFail; return; }
          try { download('whatsapp-qr.png',canvas.toDataURL('image/png'),false); } catch (_) { status.textContent = t.downloadFailed; }
        });
      });
    });
  }
  return { build:build, bulk:bulk, template:template, copyText:copyText, markup:markup, mount:mount };
});
