(function () {
  'use strict';
  var engine = window.AfroToolsVaccineHandoff;
  var form = document.getElementById('programme-form');
  if (!engine || !form) return;

  var country = document.getElementById('country');
  var ageBand = document.getElementById('age-band');
  var recordStatus = document.getElementById('record-status');
  var recordProduct = document.getElementById('record-product');
  var errorSummary = document.getElementById('error-summary');
  var errorList = document.getElementById('error-list');
  var handoff = document.getElementById('handoff');
  var current = null;

  function clearErrors() {
    errorSummary.hidden = true;
    errorList.textContent = '';
    [country, ageBand, recordStatus].forEach(function (field) { field.removeAttribute('aria-invalid'); });
  }

  function showErrors(errors) {
    clearErrors();
    errors.forEach(function (error) {
      var field = document.getElementById(error.field);
      if (field) field.setAttribute('aria-invalid', 'true');
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = '#' + error.field;
      link.textContent = error.message;
      link.addEventListener('click', function (event) {
        event.preventDefault();
        if (field) field.focus();
      });
      item.appendChild(link);
      errorList.appendChild(item);
    });
    errorSummary.hidden = false;
    errorSummary.focus();
  }

  function render(result) {
    current = result;
    var status = document.getElementById('source-status');
    status.textContent = '';
    var heading = document.createElement('h3');
    heading.textContent = result.country;
    var programme = document.createElement('p');
    programme.innerHTML = '<strong></strong>';
    programme.querySelector('strong').textContent = result.programme;
    var note = document.createElement('p');
    note.textContent = result.sourceNote;
    status.appendChild(heading);
    status.appendChild(programme);
    status.appendChild(note);

    var official = document.getElementById('official-link');
    if (result.officialUrl) {
      official.href = result.officialUrl;
      official.textContent = 'Open ' + result.country + ' official programme source';
      official.hidden = false;
    } else {
      official.hidden = true;
      official.removeAttribute('href');
      official.textContent = '';
    }

    var list = document.getElementById('question-list');
    list.textContent = '';
    result.questions.forEach(function (question) {
      var item = document.createElement('li');
      item.textContent = question;
      list.appendChild(item);
    });
    handoff.hidden = false;
    handoff.focus();
    handoff.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function frenchBriefText() {
    var labels={"programmes":{"NPHCDA National Emergency Routine Immunization Coordination Centre":"Centre national de coordination d’urgence de la vaccination systématique de la NPHCDA","Ministry of Health clinical guidance for community health services":"Directives cliniques du ministère de la Santé pour les services de santé communautaires","Ghana Health Service national childhood immunisation schedule page":"Page du Ghana Health Service sur le calendrier national de vaccination des enfants","National Department of Health immunization programme":"Programme de vaccination du ministère national de la Santé","No current country schedule page safely verified":"Aucune page actuelle du calendrier national vérifiée de manière fiable","No country programme page configured":"Aucune page de programme national configurée"},"notes":{"Official routine-immunization programme page. It is a programme handoff, not an embedded current dose table.":"Page officielle du programme de vaccination systématique. Il s’agit d’une orientation vers le programme, pas d’un tableau intégré et actualisé des doses.","Official 2024 clinical guidance published online in 2025. Confirm later revisions and the live programme with the Ministry or clinic.":"Directives cliniques officielles de 2024 publiées en ligne en 2025. Vérifiez les révisions ultérieures et le programme en vigueur auprès du ministère ou de la clinique.","Official schedule page indexed by Ghana Health Service; the live page timed out during the 26 July 2026 check, so confirm directly with GHS or a clinic.":"Page officielle du calendrier référencée par le Ghana Health Service ; la page n’a pas répondu dans le délai imparti lors de la vérification du 26 juillet 2026. Confirmez directement auprès du GHS ou d’une clinique.","Official programme page. Its linked schedule material includes older dated documents, so use it as a handoff and confirm the current programme at a clinic.":"Page officielle du programme. Les documents de calendrier liés comprennent des documents anciens ; utilisez cette page pour vous orienter et confirmez le programme actuel auprès d’une clinique.","Fail-closed: use the WHO country-reported schedule portal and confirm with the Ministry of Health or an authorised local provider.":"En l’absence de vérification fiable, utilisez le portail de l’OMS des calendriers déclarés par les pays et confirmez auprès du ministère de la Santé ou d’un prestataire local autorisé.","Fail-closed: use the WHO country-reported schedule portal and confirm with the relevant ministry or an authorised local provider.":"En l’absence de vérification fiable, utilisez le portail de l’OMS des calendriers déclarés par les pays et confirmez auprès du ministère concerné ou d’un prestataire local autorisé."},"age":{"Newborn / under 6 weeks":"Nouveau-né / moins de 6 semaines","6 weeks to under 1 year":"De 6 semaines à moins de 1 an","1 to 4 years":"De 1 à 4 ans","5 to 9 years":"De 5 à 9 ans","10 to 17 years":"De 10 à 17 ans","18 years or older":"18 ans ou plus"},"reasons":{"Checking the next routine programme step":"Vérification de la prochaine étape du programme de routine","A dose may have been missed or delayed":"Une dose a peut-être été oubliée ou retardée","The card or product entry is unclear":"La carte ou la mention du produit manque de clarté","The record is unavailable":"Le carnet n’est pas disponible","A non-emergency post-vaccination concern":"Une inquiétude non urgente après la vaccination"},"countries":{"NG":"Nigeria","KE":"Kenya","GH":"Ghana","ZA":"Afrique du Sud","ET":"Éthiopie","OTHER":"Pays sélectionné"},"questions":{"Can you reconcile every available official record and explain which entries count in the current programme?":"Pouvez-vous rapprocher tous les documents officiels disponibles et expliquer quelles mentions sont prises en compte dans le programme actuel ?","Are any product, minimum-age, interval, campaign, school-programme, travel, pregnancy, immune-condition or health-history rules relevant?":"Des règles relatives au produit, à l’âge minimal, aux intervalles, aux campagnes, aux programmes scolaires, aux voyages, à la grossesse, à l’état immunitaire ou aux antécédents médicaux sont-elles pertinentes ?","Please create the catch-up plan from the exact record; which dose, product and interval apply now?":"Veuillez établir le plan de rattrapage à partir du carnet exact : quelle dose, quel produit et quel intervalle s’appliquent maintenant ?","What does the unclear record entry mean, and does it need confirmation from the administering facility?":"Que signifie la mention peu claire du carnet, et doit-elle être confirmée par l’établissement qui a administré le vaccin ?","How can the official record be recovered or safely reconciled without inventing dates or doses?":"Comment récupérer le document officiel ou reconstituer les informations de manière sûre sans inventer de dates ni de doses ?","How should the non-emergency concern be clinically assessed and documented before any future vaccination decision?":"Comment cette inquiétude non urgente doit-elle être évaluée cliniquement et documentée avant toute décision de vaccination ultérieure ?","What is the next documented programme step, and where should it be recorded after administration?":"Quelle est la prochaine étape documentée du programme, et où doit-elle être consignée après l’administration ?","Which symptoms after vaccination require routine follow-up, urgent review, or immediate emergency care locally?":"Quels symptômes après la vaccination nécessitent un suivi habituel, une consultation urgente ou des soins d’urgence immédiats dans votre région ?"}};
    var countryLabel=labels.countries[current.countryCode], ageLabel=labels.age[current.ageBand];
    var questions=current.questions.map(function(question,index){
      if(index===0)return 'Que recommande le programme actuel du pays « '+countryLabel+' » pour la tranche d’âge « '+ageLabel+' » ?';
      if(current.recordProduct && question==='The record says “'+current.recordProduct+'”. What exact product and dose does that entry represent?')return 'Le carnet indique « '+current.recordProduct+' ». À quel produit exact et à quelle dose cette mention correspond-elle ?';
      return labels.questions[question]||question;
    });
    return [
      'FICHE DE VISITE POUR LE PROGRAMME DE VACCINATION — NI CALENDRIER NI DOSSIER MÉDICAL','',
      'Créée localement : '+new Date().toISOString(),
      'Pays / programme : '+countryLabel,
      'Tranche d’âge : '+ageLabel,
      'Motif de clarification : '+labels.reasons[current.recordStatus],
      'Texte du produit dans le carnet : '+(current.recordProduct||'Non renseigné'),
      'Source du programme : '+labels.programmes[current.programme],
      'URL de la source officielle : '+(current.officialUrl||'Aucune page nationale vérifiée de manière fiable n’est configurée'),
      'Portail de l’OMS des calendriers déclarés par les pays : '+current.whoUrl,
      'État de la source vérifié le : '+current.checkedDate,
      'Note sur la source : '+labels.notes[current.sourceNote],'',
      'QUESTIONS POUR LE PRESTATAIRE QUALIFIÉ EN VACCINATION',
      questions.map(function(question,index){return(index+1)+'. '+question;}).join('\n'),'',
      'AUCUNE CONCLUSION SUR L’ACHÈVEMENT DE LA VACCINATION',
      'Cette fiche n’indique pas quel vaccin est dû, ne calcule ni dates ni intervalles de rattrapage, ne recommande ni n’écarte un produit, n’établit aucune contre-indication et ne conclut pas que la vaccination est complète.',
      'Une difficulté respiratoire, une respiration sifflante, un gonflement du visage, des lèvres ou de la gorge, un effondrement, une convulsion, des lèvres bleues, un état de choc ou une absence de réaction nécessitent des soins d’urgence locaux immédiats.',
      'Ce document n’est ni une carte de vaccination, ni un certificat, ni un rendez-vous, ni un dossier médical, ni une preuve qu’une dose a été administrée.'
    ].join('\n');
  }

  function briefText() {
    if (!current) return '';
    if (document.documentElement.lang.toLowerCase().split('-')[0] === 'fr') return frenchBriefText();
    return [
      'VACCINATION PROGRAMME VISIT BRIEF - NOT A SCHEDULE OR MEDICAL RECORD',
      '',
      'Created locally: ' + new Date().toISOString(),
      'Country/programme: ' + current.country,
      'Age band: ' + current.ageBand,
      'Reason for clarification: ' + current.recordStatus,
      'Record product text: ' + (current.recordProduct || 'Not entered'),
      'Programme source: ' + current.programme,
      'Official source URL: ' + (current.officialUrl || 'No safely verified country page configured'),
      'WHO country-reported schedule portal: ' + current.whoUrl,
      'Source status checked: ' + current.checkedDate,
      'Source note: ' + current.sourceNote,
      '',
      'QUESTIONS FOR THE QUALIFIED VACCINATION PROVIDER',
      current.questions.map(function (question, index) { return (index + 1) + '. ' + question; }).join('\n'),
      '',
      'NO COMPLETION VERDICT',
      'This brief does not say which vaccine is due, calculate dates or catch-up intervals, recommend or withhold a product, establish a contraindication, or say vaccination is complete.',
      'Trouble breathing, wheezing, face/lip/throat swelling, collapse, seizure, blue lips, shock or unresponsiveness requires immediate local emergency care.',
      'This document is not a vaccination card, certificate, appointment, medical record or proof that a dose was given.'
    ].join('\n');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearErrors();
    handoff.hidden = true;
    current = null;
    var result = engine.prepare({
      country: country.value,
      ageBand: ageBand.value,
      recordStatus: recordStatus.value,
      recordProduct: recordProduct.value
    });
    if (!result.ok) {
      showErrors(result.errors);
      return;
    }
    render(result);
  });
  form.addEventListener('reset', function () {
    window.setTimeout(function () {
      clearErrors();
      handoff.hidden = true;
      current = null;
    }, 0);
  });
  document.getElementById('print-button').addEventListener('click', function () {
    if (current) window.print();
  });
  document.getElementById('download-button').addEventListener('click', function () {
    if (!current) return;
    var blob = new Blob([briefText()], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'vaccination-programme-visit-brief.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
})();
