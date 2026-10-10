(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.bloodPressureCheckEngine;
  var form = document.getElementById('blood-pressure-form');
  var results = document.getElementById('blood-pressure-results');
  var errorBox = document.getElementById('form-error');
  var lastResult = null;
  var themeButton = document.getElementById('afro-theme-fallback-toggle');

  function syncThemePressedState() {
    if (!themeButton || !window.AfroTools || !window.AfroTools.darkMode) return;
    themeButton.setAttribute('aria-pressed', String(window.AfroTools.darkMode.isDark()));
  }

  if (themeButton && window.AfroTools && window.AfroTools.darkMode) {
    themeButton.addEventListener('click', function () {
      window.AfroTools.darkMode.toggle();
      syncThemePressedState();
    });
    document.addEventListener('afrotools:theme-change', syncThemePressedState);
    syncThemePressedState();
  }

  function readInput() {
    return {
      context: document.getElementById('health-context').value,
      systolic1: document.getElementById('systolic-1').value,
      diastolic1: document.getElementById('diastolic-1').value,
      systolic2: document.getElementById('systolic-2').value,
      diastolic2: document.getElementById('diastolic-2').value,
      rested: document.getElementById('rested').checked,
      positioned: document.getElementById('positioned').checked,
      cuff: document.getElementById('cuff').checked,
      quiet: document.getElementById('quiet').checked,
      urgentSymptoms: document.getElementById('urgent-symptoms').checked
    };
  }

  function formatReading(reading) {
    return reading.systolic + '/' + reading.diastolic + ' mmHg';
  }

  function render(result) {
    lastResult = result;
    document.getElementById('reading-one').textContent = formatReading(result.first);
    document.getElementById('reading-two').textContent = formatReading(result.second);
    document.getElementById('reading-average').textContent = formatReading(result.average);
    document.getElementById('result-priority').textContent = result.priority;
    document.getElementById('result-priority').dataset.band = result.band;
    document.getElementById('result-action').dataset.band = result.band;
    document.getElementById('action-title').textContent = result.title;
    document.getElementById('action-text').textContent = result.action;
    document.getElementById('technique-note').textContent = result.techniqueComplete
      ? 'All four measurement-setup checks were confirmed.'
      : result.techniqueCount + ' of 4 measurement-setup checks were confirmed. Technique can affect a reading, but it must not be used to dismiss warning symptoms or a high result.';
    results.hidden = false;
    document.getElementById('results-title').focus({ preventScroll: true });
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function invalidateResult() {
    if (!lastResult) return;
    lastResult = null;
    results.hidden = true;
    errorBox.textContent = '';
    setStatus('');
  }

  function submit(event) {
    event.preventDefault();
    if (!engine) {
      errorBox.textContent = 'The local reading engine did not load. Refresh and try again.';
      return;
    }
    var result = engine.evaluate(readInput());
    if (!result.valid) {
      invalidateResult();
      errorBox.textContent = result.error;
      document.getElementById('systolic-1').focus();
      return;
    }
    errorBox.textContent = '';
    render(result);
  }

  function isFrenchReport(){return document.documentElement.lang.toLowerCase().split('-')[0]==='fr';}
  function frenchExportText(result){
    var bands={"emergency-symptoms":["Symptômes d’urgence","Demandez immédiatement une aide médicale d’urgence locale","N’attendez pas une autre mesure et n’utilisez pas ce résultat pour décider si les symptômes sont graves. En cas de grossesse ou d’accouchement récent, contactez également l’équipe de maternité pendant l’organisation des secours, si possible."],"pregnancy-severe":["Évaluation urgente en maternité","Contactez immédiatement les urgences de la maternité","Au moins une mesure atteint le seuil sévère de grossesse de 160 pour la pression systolique ou de 110 pour la pression diastolique. Demandez immédiatement une évaluation urgente en maternité ; faites appel aux secours locaux si l’équipe de maternité n’est pas rapidement joignable."],"pregnancy-review":["Contact avec la maternité le jour même","Contactez votre équipe de maternité aujourd’hui","Au moins une mesure atteint le seuil de grossesse de 140 pour la pression systolique ou de 90 pour la pression diastolique. Cela ne pose pas un diagnostic de prééclampsie ou d’hypertension, mais nécessite un examen rapide selon votre plan local de suivi de maternité."],"adult-very-high-repeat":["Contact clinique immédiat","La deuxième mesure reste très élevée","La deuxième mesure dépasse encore 180 pour la pression systolique ou 120 pour la pression diastolique. Contactez immédiatement un clinicien qualifié. Si un symptôme d’urgence apparaît, demandez immédiatement une aide médicale d’urgence locale."],"adult-very-high-first":["Contact clinique rapide","Une mesure dépassait le seuil très élevé","La première mesure dépassait 180 pour la pression systolique ou 120 pour la pression diastolique, même si la deuxième était plus basse. Contactez rapidement un clinicien qualifié pour vérifier l’appareil, la technique et la situation clinique ; demandez une aide d’urgence pour tout symptôme d’urgence."],"adult-review":["Évaluation clinique","Organisez une évaluation de la pression artérielle","Au moins une mesure atteint le seuil clinique de l’OMS de 140 pour la pression systolique ou de 90 pour la pression diastolique. Un diagnostic nécessite une évaluation professionnelle et des mesures répondant aux critères sur deux jours différents."],"repeat-technique":["Répéter avec une préparation complète","Répétez avec une préparation complète de la mesure","Les mesures sont inférieures au seuil utilisé par cette fiche pour votre contexte, mais au moins une vérification de la technique n’a pas été confirmée. Répétez correctement et suivez tout plan de surveillance donné par votre clinicien."],"pregnancy-below-boundary":["En dessous du seuil de la fiche","Ces deux mesures sont inférieures au seuil d’alerte de grossesse de cette fiche","Cela n’exclut pas une prééclampsie ni un autre problème. Contactez l’équipe de maternité en cas de symptômes d’alerte, de changement préoccupant, de diminution des mouvements du fœtus ou selon toute consigne de votre plan de soins."],"adult-below-threshold":["En dessous du seuil clinique de l’OMS","Ces deux mesures sont inférieures à 140/90","Ceci n’est ni un diagnostic, ni un objectif de traitement, ni une assurance concernant les symptômes. Continuez à suivre tout plan de surveillance prescrit par un clinicien et demandez un avis en cas d’inquiétude ou de changements répétés."]},review=bands[result.band];if(!review)return null;
    return ['AFROTOOLS — VÉRIFICATION DES MESURES DE PRESSION ARTÉRIELLE','','Contexte : '+({adult:'Adulte, sans grossesse ni accouchement récent',pregnant:'Grossesse',postpartum:'Dans les 6 semaines après l’accouchement'}[result.context]),'Mesure 1 : '+formatReading(result.first),'Mesure 2 : '+formatReading(result.second),'Moyenne arithmétique : '+formatReading(result.average),'Préparation de la mesure confirmée : '+result.techniqueCount+' vérifications sur 4','Symptômes d’urgence sélectionnés : '+(result.urgentSymptoms?'Oui':'Non'),'','Priorité d’évaluation : '+review[0],review[1],review[2],'','Deux mesures à domicile ne permettent ni de confirmer ni d’exclure une hypertension, une prééclampsie, un besoin de traitement ou une autre affection.','Une moyenne arithmétique ne doit pas masquer une mesure élevée isolée. La fiche utilise la mesure la plus élevée pour la plupart des messages de sécurité.','Contexte général chez l’adulte : le diagnostic selon l’OMS nécessite des mesures répondant aux critères sur deux jours différents.','Grossesse ou 6 premières semaines après l’accouchement : 140/90 conduit à contacter la maternité ; 160/110 est un seuil sévère nécessitant une évaluation urgente.','Les symptômes peuvent nécessiter une aide d’urgence quelle que soit la valeur. Suivez le plan de votre clinicien ou de votre équipe de maternité.','','Sources : OMS, hypertension ; American Heart Association, surveillance à domicile ; NICE NG133 ; ACOG, prééclampsie après l’accouchement ; NHS, prééclampsie.','Sources vérifiées le 26 juillet 2026.','Créé localement. Sans compte, e-mail, téléversement, analyse d’utilisation ni historique enregistré dans le navigateur.','Cet export contient des données de santé sensibles. Vérifiez-le avant de le partager.'].join('\n');
  }

  function exportText(result) {
    if(isFrenchReport()){var french=frenchExportText(result);if(french)return french;}
    return [
      'AFROTOOLS BLOOD PRESSURE MEASUREMENT CHECK',
      '',
      'Context: ' + result.contextLabel,
      'Reading 1: ' + formatReading(result.first),
      'Reading 2: ' + formatReading(result.second),
      'Arithmetic average: ' + formatReading(result.average),
      'Measurement setup confirmed: ' + result.techniqueCount + ' of 4 checks',
      'Urgent symptoms selected: ' + (result.urgentSymptoms ? 'Yes' : 'No'),
      '',
      'Review priority: ' + result.priority,
      result.title,
      result.action,
      '',
      result.boundary,
      'An arithmetic average must not hide a single high reading. The card uses the highest reading for most safety prompts.',
      'General adult context: WHO diagnosis requires qualifying measurements on two different days.',
      'Pregnancy or first 6 weeks after birth: 140/90 prompts maternity contact; 160/110 is a severe boundary needing urgent assessment.',
      'Symptoms can require emergency help at any number. Follow your clinician or maternity team plan.',
      '',
      'Sources: WHO hypertension; American Heart Association home monitoring; NICE NG133; ACOG postpartum preeclampsia; NHS pre-eclampsia.',
      'Sources checked: 26 July 2026.',
      'Created locally. No account, email, upload, analytics or saved browser history.',
      'This export contains sensitive health data. Review it before sharing.'
    ].join('\n');
  }

  function setStatus(message) {
    document.getElementById('export-status').textContent = message;
  }

  function downloadBlob(filename, type, content) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function ensurePdfLibrary() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = '/assets/vendor/jspdf/jspdf.umd.min.js';
      script.dataset.localJspdf = 'true';
      script.onload = function () { resolve(window.jspdf.jsPDF); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function downloadPdf() {
    if (!lastResult) return setStatus('Review readings before exporting.');
    var exportingResult = lastResult;
    setStatus('Preparing local PDF...');
    ensurePdfLibrary().then(function (JsPdf) {
      if (lastResult !== exportingResult) return;
      var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
      pdf.setProperties({ title: isFrenchReport() ? 'AfroTools - vérification des mesures de pression artérielle' : 'AfroTools blood pressure measurement check' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      var text=exportText(exportingResult);var lines = pdf.splitTextToSize(isFrenchReport()?text.replace(/\u202f/g,' '):text, 500);
      var y = 54;
      lines.forEach(function (line) {
        if (y > 790) {
          pdf.addPage();
          y = 54;
        }
        pdf.text(line, 48, y);
        y += 14;
      });
      pdf.save('afrotools-blood-pressure-measurement-check.pdf');
      setStatus('PDF downloaded locally.');
    }).catch(function () {
      setStatus('PDF could not be created. Use the TXT export instead.');
    });
  }

  form.addEventListener('input', invalidateResult);
  form.addEventListener('change', invalidateResult);
  form.addEventListener('submit', submit);
  document.getElementById('download-txt').addEventListener('click', function () {
    if (!lastResult) return setStatus('Review readings before exporting.');
    downloadBlob('afrotools-blood-pressure-measurement-check.txt', 'text/plain;charset=utf-8', exportText(lastResult));
    setStatus('TXT downloaded locally.');
  });
  document.getElementById('download-pdf').addEventListener('click', downloadPdf);
  document.getElementById('clear-check').addEventListener('click', function () {
    form.reset();
    results.hidden = true;
    lastResult = null;
    errorBox.textContent = '';
    setStatus('Readings and current result cleared.');
    document.getElementById('health-context').focus();
  });

  window.AfroBloodPressureCheck = {
    getResult: function () { return lastResult; },
    getOverflowDetails: function () {
      return Array.from(document.querySelectorAll('body *')).filter(function (element) {
        var rect = element.getBoundingClientRect();
        return rect.width > document.documentElement.clientWidth + 1 ||
          rect.right > document.documentElement.clientWidth + 1 ||
          rect.left < -1;
      }).map(function (element) {
        var rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          id: element.id,
          className: String(element.className || ''),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        };
      }).slice(0, 12);
    }
  };
})();
