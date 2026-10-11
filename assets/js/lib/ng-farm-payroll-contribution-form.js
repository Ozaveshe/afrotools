(function (root) {
  'use strict';
  var copy = {
    fr: {
      overtimeHourlyPay: 'Rémunération totale convenue par heure supplémentaire (NGN)', leaveBudget: 'Budget de congés distinct du salaire à payer', leaveInclude: 'Inclure un budget avec une base confirmée', leaveExclude: 'Ne pas inclure de budget de congés', leavePayBase: 'Base mensuelle en espèces pour les congés (NGN)', leaveDays: 'Jours annuels de congés à budgéter', paidDaysPerMonth: 'Jours payés par mois pour convertir la base',
      labourHelp: 'Utilisez la rémunération totale convenue par heure supplémentaire, pas seulement la majoration. Pour les congés, confirmez la base en espèces hors heures supplémentaires et autres indemnités, les droits et le calendrier. Le budget ne remplace pas la prise de congés et ne constitue pas une cotisation.', leaveBudgetAmount: 'Budget mensuel de congés par travailleur',
      wageCoverage: 'Application du salaire minimum national', monthlyWage: 'Rémunération mensuelle à comparer (NGN)', unknown: 'Application non confirmée', applicable: 'Application confirmée', exempt: 'Exemption confirmée',
      wageHelp: 'La loi de 2019 prévoit notamment des exemptions pour le travail agricole saisonnier, certains emplois à temps partiel ou à la pièce et les établissements de moins de 25 personnes. Vérifiez les règles actuelles. Le nombre de travailleurs saisi ne représente pas nécessairement l’effectif de l’établissement.',
      wageUnknown: 'Application non confirmée : aucune conclusion de conformité.', wageExempt: 'Exemption confirmée par l’utilisateur : comparaison non appliquée.', wageBelow: 'Rémunération saisie inférieure au repère national.', wageMeets: 'Rémunération saisie au moins égale au repère national; aucune conclusion sur la conformité globale.', wageReference: 'Repère national mensuel : 70 000 NGN, à compter du 29 juillet 2024.', wageCompared: 'Montant comparé', wageDifference: 'Écart',
      title: 'Cotisations du secteur privé au Nigeria',
      help: 'Confirmez les régimes applicables avec l’employeur ou l’organisme. Le type et le nombre de travailleurs ne déterminent pas l’éligibilité. Indiquez les montants mensuels par travailleur en NGN.',
      choose: 'Choisissez le régime confirmé', none: 'Non applicable, après vérification',
      pension: 'Régime de retraite', standard: 'Salarié 8 %, employeur 10 %',
      health: 'Régime de santé', basic: 'Salaire de base : salarié 5 %, employeur 10 %', consolidated: 'Salaire consolidé : salarié 1,75 %, employeur 3,25 %',
      housing: 'Participation au fonds national du logement', participating: 'Le salarié éligible choisit de cotiser', notParticipating: 'Le salarié ne participe pas',
      pensionablePay: 'Émoluments mensuels pour la retraite (NGN)', healthBasicPay: 'Salaire de base mensuel pour la santé (NGN)', healthConsolidatedPay: 'Salaire consolidé mensuel pour la santé (NGN)', housingMonthlyIncome: 'Revenu mensuel pour le logement (NGN)',
      basisHelp: 'Pour la retraite, utilisez la base contractuelle comprenant au moins le salaire de base et les indemnités de logement et de transport. Vérifiez séparément la base de chaque régime.',
      invalid: 'Complétez les régimes et les bases de cotisation avec un montant positif comportant au maximum deux décimales.',
      invalidWage: 'Indiquez une rémunération mensuelle positive à comparer, avec au maximum deux décimales.',
      invalidCoverage: 'Choisissez une situation d’application du salaire minimum.',
      labourErrors: { leaveBudget: 'Choisissez si vous souhaitez inclure un budget de congés.', overtimeHourlyPay: 'Indiquez la rémunération totale convenue par heure supplémentaire, positive et avec au maximum deux décimales.', leavePayBase: 'Indiquez une base mensuelle en espèces positive pour les congés, avec au maximum deux décimales.', leaveDays: 'Indiquez un nombre entier de jours annuels de congés entre 1 et 366.', paidDaysPerMonth: 'Indiquez un nombre de jours payés par mois supérieur à zéro et inférieur ou égal à 31, avec au maximum deux décimales.' },
      cashExceeded: 'Les cotisations dépassent la rémunération en espèces. Vérifiez les bases de cotisation et la rémunération saisies.',
      totalsTooLarge: 'Le total de la paie est trop élevé pour un calcul fiable. Réduisez les montants ou le nombre de travailleurs.',
      cash: 'Net en espèces avant PAYE', gross: 'Rémunération totale, avantages en nature compris', employee: 'Cotisation du salarié', employer: 'Cotisation de l’employeur', basis: 'Base', sources: 'Sources de référence', eligibility: 'Applicabilité confirmée par l’utilisateur; règles actuelles à vérifier.'
    },
    sw: {
      overtimeHourlyPay: 'Malipo yote yaliyokubaliwa kwa saa ya ziada (NGN)', leaveBudget: 'Bajeti ya likizo tofauti na malipo yanayodaiwa', leaveInclude: 'Jumuisha bajeti kwa msingi uliothibitishwa', leaveExclude: 'Usijumuishe bajeti ya likizo', leavePayBase: 'Msingi wa malipo ya fedha ya mwezi kwa likizo (NGN)', leaveDays: 'Siku za likizo za mwaka za kubajeti', paidDaysPerMonth: 'Siku zinazolipwa kwa mwezi za kubadili msingi',
      labourHelp: 'Tumia malipo yote yaliyokubaliwa kwa saa ya ziada, si nyongeza pekee. Kwa likizo, thibitisha msingi wa fedha bila saa za ziada na posho nyingine, ustahiki na ratiba. Bajeti haibadilishi haki ya kuchukua likizo wala si mchango wa mwajiri.', leaveBudgetAmount: 'Bajeti ya likizo ya mwezi kwa mfanyakazi',
      wageCoverage: 'Utekelezekaji wa kima cha chini cha kitaifa', monthlyWage: 'Malipo ya mwezi ya kulinganisha (NGN)', unknown: 'Utekelezekaji haujathibitishwa', applicable: 'Imethibitishwa kuwa sheria inatumika', exempt: 'Msamaha umethibitishwa',
      wageHelp: 'Sheria ya 2019 ina misamaha ikijumuisha kazi za kilimo za msimu, baadhi ya kazi za muda au malipo kwa kipimo, na maeneo ya kazi yenye watu chini ya 25. Thibitisha kanuni za sasa. Idadi ya wafanyakazi iliyowekwa si lazima iwe jumla ya wafanyakazi wa mwajiri.',
      wageUnknown: 'Utekelezekaji haujathibitishwa; hakuna hitimisho la kufuata sheria.', wageExempt: 'Mtumiaji amethibitisha msamaha; ulinganisho haujatumika.', wageBelow: 'Malipo yaliyowekwa yako chini ya rejea ya kitaifa.', wageMeets: 'Malipo yaliyowekwa yanafikia au kuzidi rejea ya kitaifa; huu si uthibitisho wa kufuata sheria zote.', wageReference: 'Rejea ya kitaifa ya mwezi: NGN 70,000, kuanzia tarehe 29 Julai 2024.', wageCompared: 'Kiasi kilicholinganishwa', wageDifference: 'Tofauti',
      title: 'Michango ya sekta binafsi nchini Nigeria',
      help: 'Thibitisha mifumo inayotumika na mwajiri au msimamizi wa mfuko. Aina na idadi ya wafanyakazi haziamui ustahiki hapa. Weka kiasi cha mwezi kwa kila mfanyakazi kwa NGN.',
      choose: 'Chagua mpango uliothibitishwa', none: 'Hautumiki, baada ya kuthibitisha',
      pension: 'Mpango wa pensheni', standard: 'Mfanyakazi 8%, mwajiri 10%',
      health: 'Mpango wa bima ya afya', basic: 'Mshahara wa msingi: mfanyakazi 5%, mwajiri 10%', consolidated: 'Mshahara uliounganishwa: mfanyakazi 1.75%, mwajiri 3.25%',
      housing: 'Ushiriki katika mfuko wa kitaifa wa nyumba', participating: 'Mfanyakazi anayestahiki amechagua kuchangia', notParticipating: 'Mfanyakazi hashiriki',
      pensionablePay: 'Malipo ya mwezi yanayotumika kwa pensheni (NGN)', healthBasicPay: 'Mshahara wa msingi wa mwezi kwa afya (NGN)', healthConsolidatedPay: 'Mshahara uliounganishwa wa mwezi kwa afya (NGN)', housingMonthlyIncome: 'Mapato ya mwezi kwa mchango wa nyumba (NGN)',
      basisHelp: 'Kwa pensheni, tumia msingi wa mkataba unaojumuisha angalau mshahara wa msingi na posho za nyumba na usafiri. Thibitisha msingi wa kila mpango kando.',
      invalid: 'Kamilisha mipango na misingi ya michango kwa kiasi chanya chenye desimali zisizozidi mbili.',
      invalidWage: 'Weka malipo chanya ya mwezi ya kulinganisha yenye desimali zisizozidi mbili.',
      invalidCoverage: 'Chagua hali ya utekelezekaji wa kima cha chini cha mshahara.',
      labourErrors: { leaveBudget: 'Chagua ikiwa utajumuisha bajeti ya likizo.', overtimeHourlyPay: 'Weka malipo yote yaliyokubaliwa kwa saa ya ziada yanayozidi sifuri, yenye desimali zisizozidi mbili.', leavePayBase: 'Weka msingi wa malipo ya fedha ya mwezi kwa likizo unaozidi sifuri, wenye desimali zisizozidi mbili.', leaveDays: 'Weka idadi kamili ya siku za likizo za mwaka kati ya 1 na 366.', paidDaysPerMonth: 'Weka siku zinazolipwa kwa mwezi zinazozidi sifuri na zisizozidi 31, zenye desimali zisizozidi mbili.' },
      cashExceeded: 'Michango inazidi malipo ya fedha. Hakiki misingi ya michango na malipo uliyoweka.',
      totalsTooLarge: 'Jumla ya mishahara ni kubwa mno kwa hesabu sahihi. Punguza kiasi cha malipo au idadi ya wafanyakazi.',
      cash: 'Malipo ya fedha baada ya michango, kabla ya PAYE', gross: 'Jumla ya malipo pamoja na manufaa yasiyo fedha', employee: 'Mchango wa mfanyakazi', employer: 'Mchango wa mwajiri', basis: 'Msingi', sources: 'Vyanzo vya marejeo', eligibility: 'Ustahiki umethibitishwa na mtumiaji; hakiki kanuni za sasa.'
    }
  };
  var urls = {
    'pencom-faq-2023': 'https://www.pencom.gov.ng/wp-content/uploads/2023/09/FREQUENTLY-ASKED-QUESTIONS-2023.pdf',
    'nhia-faq': 'https://www.nhia.gov.ng/faq/',
    'ng-labour-act-sections-13-18-19': 'https://www.placng.org/lawsofnigeria/laws/L1.pdf',
    'ng-national-minimum-wage-amendment-2024': 'https://www.pencom.gov.ng/wp-content/uploads/2024/12/Circular-on-Implementation-of-Minimum-Wage.pdf',
    'ng-national-minimum-wage-2019-section-4': 'https://archive.gazettes.africa/archive/ng/2019/ng-government-gazette-supplement-dated-2019-04-23-no-62.pdf',
    'bfa-gazette-2023': 'https://nipc.gov.ng/assets/resources/business-facilitation-miscellaneous-provisions-act-2022/business-facilitation-misc-provisions-act-2022.pdf'
  };
  function mount(form, locale) {
    var t = copy[locale];
    if (!t) throw new Error('Unsupported contribution locale');
    var group = document.createElement('fieldset'); group.style.minWidth = '0';
    var legend = document.createElement('legend'); legend.textContent = t.title; group.appendChild(legend);
    function paragraph(text, id) { var node = document.createElement('p'); node.textContent = text; if (id) node.id = id; group.appendChild(node); }
    paragraph(t.help, 'ngContributionHelp'); paragraph(t.basisHelp, 'ngContributionBasisHelp'); paragraph(t.wageHelp, 'ngWageHelp'); paragraph(t.labourHelp, 'ngLabourHelp');
    var grid = document.createElement('div'); grid.className = 'grid'; group.appendChild(grid);
    var controls = {}, wrappers = {};
    var payrollFields = { selWorkerType: 'workerType', inpNumWorkers: 'numWorkers', inpMonthlySalary: 'grossPay', inpDailyRate: 'grossPay', inpDaysWorked: 'daysWorked', inpRatePerUnit: 'ratePerUnit', inpUnitsCompleted: 'unitsCompleted', inpOvertimeHours: 'overtimeHours', inpHousingValue: 'inKindHousing', inpFoodValue: 'inKindFood' };
    var payrollErrors = locale === 'fr' ? {
      workerType: 'Choisissez un type de travailleur.', numWorkers: 'Indiquez un nombre entier de travailleurs entre 1 et 100 000.', grossPay: 'Indiquez une rémunération strictement positive.', daysWorked: 'Indiquez un nombre entier de jours entre 1 et 31.', ratePerUnit: 'Indiquez un tarif par unité strictement positif.', unitsCompleted: 'Indiquez un nombre entier d’unités entre 1 et 1 000 000.', overtimeHours: 'Indiquez un nombre d’heures supplémentaires entre 0 et 744.', inKindHousing: 'Indiquez une valeur de logement positive ou nulle.', inKindFood: 'Indiquez une valeur de nourriture positive ou nulle.', unavailable: 'La validation est indisponible. Rechargez la page avant de calculer.'
    } : {
      workerType: 'Chagua aina ya mfanyakazi.', numWorkers: 'Weka idadi kamili ya wafanyakazi kati ya 1 na 100,000.', grossPay: 'Weka malipo yanayozidi sifuri.', daysWorked: 'Weka siku kamili kati ya 1 na 31.', ratePerUnit: 'Weka malipo kwa kipimo yanayozidi sifuri.', unitsCompleted: 'Weka idadi kamili ya vipimo kati ya 1 na 1,000,000.', overtimeHours: 'Weka saa za ziada kati ya 0 na 744.', inKindHousing: 'Weka thamani ya nyumba isiyopungua sifuri.', inKindFood: 'Weka thamani ya chakula isiyopungua sifuri.', unavailable: 'Uthibitishaji haupatikani. Pakia ukurasa upya kabla ya kukokotoa.'
    };
    var fields = ['pension', 'health', 'housing', 'pensionablePay', 'healthBasicPay', 'healthConsolidatedPay', 'housingMonthlyIncome'];
    var choices = { pension: [['standard', t.standard], ['not-applicable', t.none]], health: [['basic', t.basic], ['consolidated', t.consolidated], ['not-applicable', t.none]], housing: [['participating', t.participating], ['not-participating', t.notParticipating]] };
    fields = fields.concat(['wageCoverage', 'monthlyWage', 'overtimeHourlyPay', 'leaveBudget', 'leavePayBase', 'leaveDays', 'paidDaysPerMonth']);
    choices.wageCoverage = [['unknown', t.unknown], ['applicable-confirmed', t.applicable], ['exempt-confirmed', t.exempt]];
    choices.leaveBudget = [['include', t.leaveInclude], ['exclude', t.leaveExclude]];
    fields.forEach(function (key) {
      var wrapper = document.createElement('div'); wrapper.className = 'field'; wrappers[key] = wrapper;
      var label = document.createElement('label'); label.htmlFor = 'ng_' + key; label.textContent = t[key]; wrapper.appendChild(label);
      var control = document.createElement(choices[key] ? 'select' : 'input'); control.id = 'ng_' + key;
      control.setAttribute('aria-describedby', key === 'wageCoverage' || key === 'monthlyWage' ? 'ngWageHelp' : (choices[key] ? 'ngContributionHelp' : 'ngContributionBasisHelp'));
      if (['overtimeHourlyPay','leaveBudget','leavePayBase','leaveDays','paidDaysPerMonth'].indexOf(key) >= 0) control.setAttribute('aria-describedby', 'ngLabourHelp');
      if (choices[key]) [['', t.choose]].concat(choices[key]).forEach(function (entry) { var option = document.createElement('option'); option.value = entry[0]; option.textContent = entry[1]; control.appendChild(option); });
      else { control.type = 'number'; control.min = '0.01'; control.step = '0.01'; control.inputMode = 'decimal'; }
      if (key === 'leaveDays') { control.min = '1'; control.max = '366'; control.step = '1'; control.inputMode = 'numeric'; }
      if (key === 'paidDaysPerMonth') control.max = '31';
      wrapper.appendChild(control); grid.appendChild(wrapper); controls[key] = control;
    });
    var sourceList = document.createElement('p'); sourceList.textContent = t.sources + ': ';
    Object.keys(urls).forEach(function (key, index) { if (index) sourceList.appendChild(document.createTextNode(' · ')); var link = document.createElement('a'); link.href = urls[key]; link.textContent = key; sourceList.appendChild(link); }); group.appendChild(sourceList);
    form.insertBefore(group, form.querySelector('.actions'));
    function sync() {
      var visible = { pensionablePay: controls.pension.value === 'standard', healthBasicPay: controls.health.value === 'basic', healthConsolidatedPay: controls.health.value === 'consolidated', housingMonthlyIncome: controls.housing.value === 'participating' };
      visible.monthlyWage = controls.wageCoverage.value === 'applicable-confirmed';
      visible.overtimeHourlyPay = Number(form.querySelector('#overtimeHours').value) > 0;
      visible.leavePayBase = visible.leaveDays = visible.paidDaysPerMonth = controls.leaveBudget.value === 'include';
      Object.keys(visible).forEach(function (key) { wrappers[key].hidden = !visible[key]; wrappers[key].style.display = visible[key] ? '' : 'none'; controls[key].disabled = !visible[key]; });
    }
    function clearInvalid() { fields.forEach(function (key) { controls[key].removeAttribute('aria-invalid'); }); Object.keys(payrollErrors).forEach(function (key) { var node = form.querySelector('#' + key); if (node) node.removeAttribute('aria-invalid'); }); }
    form.addEventListener('input', clearInvalid); form.addEventListener('change', clearInvalid);
    form.addEventListener('input', sync); form.addEventListener('change', sync);
    group.addEventListener('input', clearInvalid); group.addEventListener('change', function () { clearInvalid(); sync(); });
    form.addEventListener('reset', function () { setTimeout(function () { clearInvalid(); sync(); }, 0); }); sync();
    function wageSummary(result) {
      if (!result) return t.wageUnknown;
      var messages = { 'coverage-unknown': t.wageUnknown, 'exempt-confirmed': t.wageExempt, 'below-reference': t.wageBelow, 'meets-reference': t.wageMeets };
      var text = (messages[result.status] || t.wageUnknown) + ' ' + t.wageReference;
      if (result.comparedWageKobo != null) {
        var format = new Intl.NumberFormat(locale, { style: 'currency', currency: 'NGN' });
        text += ' ' + t.wageCompared + ': ' + format.format(result.comparedWageKobo / 100) + '; ' + t.wageDifference + ': ' + format.format(result.differenceKobo / 100) + '.';
      }
      return text;
    }
    return {
      validatePayroll: function (status) {
        var validator = root.AfroTools.FarmPayrollValidation, raw = {};
        if (!validator || typeof validator.validate !== 'function') { status.textContent = payrollErrors.unavailable; status.setAttribute('tabindex', '-1'); status.focus(); return null; }
        Object.keys(payrollErrors).forEach(function (key) { if (key !== 'unavailable') raw[key] = form.querySelector('#' + key).value; });
        var checked = validator.validate(raw);
        if (checked.valid) return checked.input;
        var key = payrollFields[checked.field], node = key && form.querySelector('#' + key);
        status.textContent = payrollErrors[key] || payrollErrors.unavailable;
        if (node) { node.setAttribute('aria-invalid', 'true'); node.focus(); }
        else { status.setAttribute('tabindex', '-1'); status.focus(); }
        return null;
      },
      read: function () { var input = { sector: 'private' }; fields.forEach(function (key) { input[key] = controls[key].value; }); return input; },
      readWage: function () { return { coverage: controls.wageCoverage.value, monthlyWage: controls.monthlyWage.value }; },
      readLabour: function () { var result = {}; ['overtimeHourlyPay','leaveBudget','leavePayBase','leaveDays','paidDaysPerMonth'].forEach(function (key) { result[key] = controls[key].value; }); return result; },
      labourText: function (result) {
        var labour = result.labourAssumptions; if (!labour) return [];
        function money(kobo) { return new Intl.NumberFormat(locale, { style: 'currency', currency: 'NGN' }).format(kobo / 100); }
        var lines = [t.labourHelp];
        if (labour.overtimeHourlyPayKobo != null) lines.push(t.overtimeHourlyPay + ': ' + money(labour.overtimeHourlyPayKobo));
        lines.push((labour.leave.included ? t.leaveInclude : t.leaveExclude) + '. ' + t.leaveBudgetAmount + ': ' + money(labour.leaveMonthlyBudgetKobo));
        if (labour.leave.included) lines.push(t.leavePayBase + ': ' + money(labour.leave.monthlyPayBasisKobo) + '; ' + t.leaveDays + ': ' + labour.leave.annualDays + '; ' + t.paidDaysPerMonth + ': ' + labour.leave.paidDaysPerMonth);
        return lines;
      },
      wageSummary: wageSummary,
      error: function (result, status) {
        status.textContent = result.code === 'payroll-total-too-large' ? t.totalsTooLarge : result.code === 'contributions-exceed-cash' ? t.cashExceeded : result.field === 'monthlyWage' ? t.invalidWage : result.field === 'wageCoverage' ? t.invalidCoverage : t.labourErrors[result.field] || t.invalid;
        var field = controls[result.field];
        if (field && !field.disabled) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
        else { status.setAttribute('tabindex', '-1'); status.focus(); }
      },
      text: function (result) {
        var contribution = result.contributionCalculation; if (!contribution) return [];
        function money(kobo) { return new Intl.NumberFormat(locale, { style: 'currency', currency: 'NGN' }).format(kobo / 100); }
        var lines = [t.cash + ': ' + money(Math.round(result.netCashPay * 100)), t.eligibility, wageSummary(result.mwCheck)];
        if (result.labourAssumptions) lines.push.apply(lines, this.labourText(result));
        contribution.rows.forEach(function (row) { lines.push(t[row.scheme] + ' — ' + t.basis + ': ' + money(row.basisKobo) + '; ' + t.employee + ': ' + money(row.employeeKobo) + '; ' + t.employer + ': ' + money(row.employerKobo)); });
        lines.push(t.sources + ': ' + Object.keys(urls).map(function (key) { return urls[key]; }).join(' ; ')); return lines;
      },
      labels: t
    };
  }
  root.AfroTools = root.AfroTools || {}; root.AfroTools.NigeriaContributionForm = { mount: mount };
})(window);
