(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const form = byId('dose');
  const result = byId('result');
  const errors = byId('errors');
  const fields = {
    medicationName: 'medication-name', basis: 'dose-basis', prescribedDose: 'prescribed-dose',
    doseUnit: 'dose-unit', weight: 'body-weight', weightUnit: 'weight-unit', mode: 'output-mode',
    concentrationMass: 'concentration-mass', concentrationUnit: 'concentration-unit',
    concentrationVolume: 'concentration-volume', unitStrength: 'unit-strength', strengthUnit: 'strength-unit'
  };
  const errorText = {
    'instruction-confirmed': 'Tabbatar da cewa likita ko masanin harhada magunguna ya bayar da umarnin.',
    'prescribed-dose': 'Duba adadin da aka rubuta, gurbin ɗigo da ma’auni. Dole adadin ya fi sifili kuma ya kasance cikin iyakar lissafin.',
    'dose-unit': 'Zaɓi mcg, mg ko g.', 'dose-basis': 'Zaɓi nau’in umarnin.',
    'body-weight': 'Duba nauyi da ma’auninsa. Dole nauyin ya fi sifili kuma ya kasance cikin iyakar lissafin.',
    'weight-unit': 'Zaɓi kg ko lb.', 'concentration-mass': 'Duba adadin maganin da ke jikin kunshi da ma’auninsa.',
    'concentration-volume': 'Duba adadin magani, gurbin ɗigo da yawan ruwan da ke rubuce a mL.',
    'unit-strength': 'Duba adadin magani a cikakkiyar ƙwaya, gurbin ɗigo da ma’aunin da ke jikin kunshi.',
    'output-mode': 'Zaɓi nau’in sakamako.'
  };
  const labels = {'Instruction source':'Tushen umarni','Medication label name':'Sunan magani',
    'Instructed amount':'Adadin da aka rubuta','Weight entered':'Nauyin da aka shigar',
    'Label concentration':'Adadin magani a ruwan da kunshi ya nuna','Strength per whole unit':'Adadin magani a ƙwaya ɗaya'};
  const caution = 'Lissafin nan ba ya tabbatar da cewa adadin magani, nau’insa, hanyar bayarwa ko lokacin amfani ya dace.';
  let worksheet = '';
  function clear() {
    result.hidden = errors.hidden = true;
    worksheet = '';
    for (const field of form.querySelectorAll('[aria-invalid]')) field.removeAttribute('aria-invalid');
    byId('weight-fields').hidden = byId('dose-basis').value !== 'weight';
    byId('liquid-fields').hidden = byId('output-mode').value !== 'liquid';
    byId('solid-fields').hidden = byId('output-mode').value !== 'solid';
  }
  function line(parent,tag,text) {
    const item = document.createElement(tag);
    item.textContent = text;
    parent.append(item);
    return item;
  }
  form.addEventListener('input',clear);
  form.addEventListener('change',clear);
  form.addEventListener('reset',() => setTimeout(clear,0));
  form.addEventListener('submit',event => {
    event.preventDefault();
    clear();
    const input = Object.fromEntries(Object.entries(fields).map(([key,id]) => [key,byId(id).value]));
    input.instructionConfirmed = byId('instruction-confirmed').checked;
    const answer = window.AfroToolsDrugDose.calculate(input);
    if (!answer.ok) {
      const list = errors.querySelector('ul');
      list.replaceChildren();
      for (const error of answer.errors) {
        const link = line(line(list,'li',''),'a',errorText[error.field] || 'Duba bayanin da aka shigar.');
        link.href = '#' + error.field;
        byId(error.field).setAttribute('aria-invalid','true');
        link.addEventListener('click',event => {event.preventDefault();byId(error.field).focus();});
      }
      errors.hidden = false;
      errors.focus();
      return;
    }
    byId('answer').textContent = answer.display.replace('whole tablet/capsule unit(s)','ƙwaya ko kapsul');
    byId('formula').textContent = answer.formula.replace('mg per whole unit','mg a cikakkiyar ƙwaya').replace('unit(s)','ƙwaya');
    const details = result.querySelector('dl');
    details.replaceChildren();
    for (const entry of answer.inputSummary) {
      line(details,'dt',labels[entry.label]);
      const value = entry.label === 'Instruction source' ? 'An tabbatar da umarnin likita ko masanin harhada magunguna.'
        : entry.label === 'Medication label name' ? (answer.medicationName || 'Ba a shigar ba')
        : entry.value.replace(' per kg','/kg');
      line(details,'dd',value);
    }
    const warnings = result.querySelector('ul');
    warnings.replaceChildren();
    line(warnings,'li',caution);
    line(warnings,'li','Kafin amfani, likita ko masanin harhada magunguna ya tabbatar da magani, mutumin da zai karɓa, umarni, hanyar bayarwa da lokutan bayarwa.');
    if (answer.mode === 'liquid') line(warnings,'li','Kwafi ma’aunin daga kunshin wannan maganin. Yi amfani da sirinjin baki, kofin awo ko na’urar aunawa da aka tanada domin maganin.');
    if (answer.mode === 'solid' && !answer.isWholeUnit) line(warnings,'li','Lissafin bai ba da cikakken adadin ƙwayoyi ba. Kada a raba ƙwaya, a niƙa ta, a buɗe kapsul ko a sauya maganin sai likita ko masanin harhada magunguna ya tabbatar cewa hakan ya dace da wannan maganin.');
    result.hidden = false;
    result.focus();
    worksheet = ['Duba lissafin adadin magani',byId('answer').textContent,byId('formula').textContent,
      details.innerText,warnings.innerText,'Idan ana zargin shan magani fiye da kima ko wata mummunar matsala, a nemi taimakon gaggawa.'].join('\n\n');
  });
  byId('print').addEventListener('click',() => window.print());
  byId('download').addEventListener('click',() => {
    if (!worksheet) return;
    const url = URL.createObjectURL(new Blob([worksheet],{type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lissafin-magani.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  });
  clear();
  if (window.AfroToolsDrugDose) form.querySelector('[type=submit]').disabled = false;
})();
