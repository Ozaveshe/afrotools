(() => {
  'use strict';
  const form = document.getElementById('measurement');
  const result = document.getElementById('result');
  const report = document.getElementById('report');
  const error = document.getElementById('error');
  const status = document.getElementById('status');
  const engine = window.AfroTools?.bloodPressureCheckEngine;
  const messages = {
    'emergency-symptoms': 'Nemi agajin gaggawa a yankinka yanzu. Kada a jira wani ma’auni. Idan kina da ciki ko kin haihu kwanan nan, a kuma tuntubi ma’aikatan sashen haihuwa yayin shirya agaji idan zai yiwu.',
    'pregnancy-severe': 'Nemi kulawar gaggawa a sashen haihuwa yanzu. Aƙalla ma’auni ɗaya ya kai 160 a sama ko 110 a ƙasa, ko ya wuce. Idan ba za a iya samun ma’aikatan sashen haihuwa da sauri ba, a nemi agajin gaggawa a yankin.',
    'pregnancy-review': 'Tuntuɓi ma’aikatan sashen haihuwa a yau. Aƙalla ma’auni ɗaya ya kai 140 a sama ko 90 a ƙasa, ko ya wuce. Ana buƙatar duba ki bisa tsarin kula da cikinki. Wannan ma’auni kaɗai ba ya tabbatar da cuta.',
    'adult-very-high-repeat': 'Tuntuɓi ƙwararren ma’aikacin lafiya nan take. Ma’auni na biyu ya wuce 180 a sama ko 120 a ƙasa. Idan wata alamar gaggawa ta bayyana, a nemi agajin gaggawa nan take.',
    'adult-very-high-first': 'Tuntuɓi ƙwararren ma’aikacin lafiya da sauri don a duba lafiyarka, na’urar da yadda aka auna. Ma’auni na farko ya wuce 180 a sama ko 120 a ƙasa, ko da yake na biyun ya sauka. Nemi agajin gaggawa idan akwai alamomin gaggawa.',
    'adult-review': 'Shirya zuwa wurin ƙwararren ma’aikacin lafiya don a sake duba hawan jini. Aƙalla ma’auni ɗaya ya kai 140 a sama ko 90 a ƙasa, ko ya wuce. Bisa ga WHO, tabbatar da cutar hawan jini yana buƙatar tantancewar ƙwararren ma’aikacin lafiya da ma’aunin da ya kai iyakar a ranaku biyu daban.',
    'repeat-technique': 'Sake auna bayan bin duk matakan shiri. Ma’aunin suna ƙasa da iyakar da wannan dubawa ke amfani da ita, amma ba a tabbatar da duk matakan shiri ba. A bi tsarin bibiyar da ma’aikacin lafiya ya bayar.',
    'pregnancy-below-boundary': 'Ma’aunin biyu suna ƙasa da iyakar jan hankali a lokacin ciki. Har yanzu wata matsalar cikin na iya kasancewa. A tuntubi sashen haihuwa idan akwai alamomin haɗari, wani sauyi mai tayar da hankali, raguwar motsin jariri a ciki, ko idan tsarin kula da ke ya ce a kira.',
    'adult-below-threshold': 'Ma’aunin biyu suna ƙasa da 140/90. Wannan ba ya tabbatar da rashin cuta kuma ba shi ne burin magani ba. A bi shirin ma’aikacin lafiya. A nemi shawara idan akwai abin damuwa ko sauyin ma’auni da ke maimaituwa.'
  };
  function clear() {
    result.hidden = true;
    report.textContent = '';
    error.textContent = '';
    status.textContent = '';
  }
  function validationMessage(message) {
    const match = /^(Systolic|Diastolic) reading ([12])/.exec(message);
    if (!match) return 'Zaɓi halin wanda aka auna.';
    const [, kind, index] = match;
    const upper = kind === 'Systolic';
    form.elements[(upper ? 'systolic' : 'diastolic') + index].focus();
    const label = 'Ma’auni na ' + index + ', lambar ' + (upper ? 'sama' : 'ƙasa');
    if (message.includes('whole number')) return label + ' tana buƙatar cikakkiyar lamba.';
    if (message.includes('higher than')) return label + ' dole ta fi lambar ƙasa girma.';
    return label + ' dole ta kasance tsakanin ' + (upper ? '40 da 260' : '30 da 160') + ' mmHg.';
  }
  const reading = value => value.systolic + '/' + value.diastolic + ' mmHg';
  form.addEventListener('input', clear);
  form.addEventListener('change', clear);
  form.addEventListener('reset', () => {
    clear();
    status.textContent = 'An goge ma’aunin da sakamakon.';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    clear();
    if (!engine) {
      error.textContent = 'Na’urar lissafi ba ta buɗe ba. Sake buɗe shafin.';
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    for (const checkbox of form.querySelectorAll('[type=checkbox]')) {
      values[checkbox.name] = checkbox.checked;
    }
    const assessment = engine.evaluate(values);
    if (!assessment.valid) {
      error.textContent = validationMessage(assessment.error);
      return;
    }
    report.textContent = [
      messages[assessment.band], '',
      'Hali — ' + form.elements.context.selectedOptions[0].textContent,
      'Ma’auni na 1 — ' + reading(assessment.first),
      'Ma’auni na 2 — ' + reading(assessment.second),
      'Matsakaici — ' + reading(assessment.average),
      'Matakan shiri da aka tabbatar — ' + assessment.techniqueCount + ' cikin 4',
      'An zaɓi alamomin gaggawa — ' + (assessment.urgentSymptoms ? 'Eh' : 'A’a'), '',
      'Kada matsakaicin ya ɓoye ma’auni ɗaya mai tsawo. Kuskuren shiri ba dalilin yin watsi da alamar haɗari ko babban ma’auni ba ne.',
      'Ma’auni biyu a gida ba su isa a tabbatar da cuta ko a yanke shawarar magani ba. Alamomin haɗari suna iya buƙatar agajin gaggawa ko da ma’aunin ya yi ƙasa.',
      'Tushen bayani — WHO, American Heart Association, NICE NG133 da NHS. Rahoton nan ya ƙunshi bayanan lafiya na sirri. A duba shi kafin rabawa.'
    ].join('\n');
    result.hidden = false;
    document.getElementById('heading').focus();
  });
  document.getElementById('print').addEventListener('click', () => window.print());
  document.getElementById('download').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([document.title + '\n\n' + report.textContent], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ma-aunin-hawan-jini.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'An shirya rahoton rubutu don saukewa.';
  });
})();
