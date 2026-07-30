(function (root, factory) {
  'use strict';
  var propertyEngine = root && root.AfroTools && root.AfroTools.PropertyAssumptionEngine;
  var presentation = root && root.AfroTools && root.AfroTools.FrenchMortgagePropertyPresentation;
  var englishOwnerEngine = root && root.AfroTools && root.AfroTools.MortgagePropertyEnglishOwnerEngine;
  if (typeof module === 'object' && module.exports) {
    propertyEngine = require('./property-assumption');
    presentation = require('../lib/french-mortgage-property-presentation');
    englishOwnerEngine = require('./mortgage-property-english-owner');
    module.exports = factory(propertyEngine, presentation, englishOwnerEngine);
  } else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.FrenchMortgagePropertyEngine = factory(propertyEngine, presentation, englishOwnerEngine);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (propertyEngine, presentation, englishOwnerEngine) {
  'use strict';

  var formatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

  function number(value) {
    if (value === '' || value === null || typeof value === 'undefined') return NaN;
    return Number(value);
  }

  function nonNegative(values) {
    return values.every(function (value) {
      return Number.isFinite(value) && value >= 0;
    });
  }

  function money(value, currency) {
    return (currency || 'XOF') + ' ' + formatter.format(value);
  }

  function fail(code, message) {
    return { ok: false, code: code, message: message };
  }

  function accepted(summary, fields, extra) {
    return Object.assign({
      ok: true,
      summary: summary,
      resultFields: fields,
      checkedAt: '2026-07-29',
      planningOnly: true
    }, extra || {});
  }

  function renderProperty(id, values) {
    if (!propertyEngine) return fail('engine-missing', 'Le moteur immobilier partagé est indisponible.');
    var input = Object.assign({}, values);
    input.checked = Object.keys(values).filter(function (key) {
      return /^check\d+$/.test(key) && values[key];
    }).length;
    var result = propertyEngine.calculate(id, input);
    if (!result.ok) return fail(result.code, 'Vérifiez les valeurs saisies avant de recalculer.');
    var currency = values.currency || 'XOF';
    if (result.kind === 'checklist') {
      return accepted(
        'Checklist modifiée : ' + result.checked + ' point(s) confirmé(s) sur 4. Vérification officielle requise.',
        { pointsConfirmes: result.checked, pointsTotal: 4, statut: result.checked === 4 ? 'dossier préparé' : 'dossier incomplet' }
      );
    }
    if (result.kind === 'agreement') {
      return accepted(
        'Projet de bail — bailleur : ' + result.landlord + '; locataire : ' + result.tenant +
        '; bien : ' + result.address + '; début : ' + result.start + '; durée : ' + result.duration +
        ' mois; loyer : ' + money(result.rent, currency) + '; dépôt : ' + money(result.deposit, currency) + '.',
        { bailleur: result.landlord, locataire: result.tenant, dateDebut: result.start, dureeMois: result.duration, loyer: result.rent, depot: result.deposit }
      );
    }
    var renderers = {
      duty: function () {
        return accepted('Droits estimés à partir de vos hypothèses : ' + money(result.total, currency) + '.', { total: result.total, devise: currency });
      },
      yield: function () {
        return accepted('Revenu annuel net : ' + money(result.netAnnual, currency) + '; rendement net : ' + formatter.format(result.yieldPercent) + ' %.', { revenuAnnuelNet: result.netAnnual, rendementNetPourcent: result.yieldPercent, devise: currency });
      },
      cost: function () {
        return accepted('Scénario de coût : ' + money(result.total, currency) + '.', { coutTotal: result.total, devise: currency });
      },
      valuation: function () {
        return accepted('Scénario fondé sur le comparable saisi : ' + money(result.total, currency) + '.', { valeurScenario: result.total, devise: currency });
      },
      affordability: function () {
        return accepted('Loyer saisi : ' + money(result.rent, currency) + '; plafond budgétaire : ' + money(result.boundary, currency) + '; avance : ' + money(result.upfront, currency) + '.', { loyer: result.rent, plafond: result.boundary, avance: result.upfront, devise: currency });
      },
      management: function () {
        return accepted('Frais de gestion par période : ' + money(result.total, currency) + '.', { fraisGestion: result.total, devise: currency });
      },
      development: function () {
        return accepted('Coûts saisis : ' + money(result.totalCost, currency) + '; marge du scénario : ' + money(result.margin, currency) + '.', { coutTotal: result.totalCost, margeScenario: result.margin, devise: currency });
      },
      tax: function () {
        return accepted('Plus-value du scénario : ' + money(result.gain, currency) + '; impôt selon le taux saisi : ' + money(result.tax, currency) + '.', { plusValue: result.gain, impotScenario: result.tax, devise: currency });
      },
      service: function () {
        return accepted('Charge annuelle par unité : ' + money(result.perUnit, currency) + '.', { chargeParUnite: result.perUnit, devise: currency });
      },
      shortlet: function () {
        return accepted('Résultat annuel net du scénario : ' + money(result.netAnnual, currency) + '.', { resultatAnnuelNet: result.netAnnual, devise: currency });
      },
      commission: function () {
        return accepted('Commission totale du scénario : ' + money(result.total, currency) + '.', { commissionTotale: result.total, devise: currency });
      },
      converter: function () {
        return accepted(formatter.format(result.input) + ' ' + result.from + ' = ' + formatter.format(result.converted) + ' ' + result.to + '.', { valeurSaisie: result.input, uniteDepart: result.from, valeurConvertie: result.converted, uniteArrivee: result.to });
      },
      diaspora: function () {
        return accepted('Budget local : ' + money(result.localBudget, currency) + '; besoin d’acquisition : ' + money(result.required, currency) + '; différence : ' + money(result.difference, currency) + '.', { budgetLocal: result.localBudget, besoin: result.required, difference: result.difference, devise: currency });
      },
      offplan: function () {
        return accepted('Bien prêt : ' + money(result.ready, currency) + '; scénario sur plan : ' + money(result.offplanTotal, currency) + '; différence : ' + money(result.difference, currency) + '.', { coutPret: result.ready, coutSurPlan: result.offplanTotal, difference: result.difference, devise: currency });
      }
    };
    if (!renderers[result.kind]) return fail('unsupported-result', 'Résultat non pris en charge.');
    return renderers[result.kind]();
  }

  function renderEnglishOwnerCalculator(contract, values) {
    if (!englishOwnerEngine) return fail('engine-missing', 'Le moteur partagé du propriétaire anglais est indisponible.');
    var id = contract.englishId;
    var input = Object.assign({}, values);
    if (id === 'tenancy-deposit') {
      input.currency = ({ ng: 'NGN', ke: 'KES', za: 'ZAR', gh: 'GHS' })[input.country] || input.currency;
    }
    var semantic = englishOwnerEngine.calculate(id, input);
    if (!semantic || !semantic.ok) return fail(semantic && semantic.code || 'owner-invalid', 'Vérifiez les valeurs saisies avant de recalculer.');
    var routeLabel = function (field, value) {
      return presentation ? presentation.label(id, field, value, value) : value;
    };
    if (id === 'cac-cost') {
      return accepted(
        'Coût CAC pour ' + routeLabel('entityType', semantic.entityType) + ' : NGN ' + formatter.format(semantic.total) + '.',
        { formeCAC: semantic.entityType, lignesDeFrais: semantic.items.length, coutTotalNGN: semantic.total, equivalentUSD: semantic.usdEquivalent }
      );
    }
    if (id === 'cipc-cost') {
      return accepted(
        'Coût CIPC pour ' + routeLabel('entityType', semantic.entityType) + ' : ZAR ' + formatter.format(semantic.total) + '; délai ' + routeLabel('processingTime', semantic.processingTime) + '.',
        { formeCIPC: semantic.entityType, fraisCIPCZAR: semantic.registrationFee, coutTotalZAR: semantic.total, delai: semantic.processingTime }
      );
    }
    if (id === 'tenancy-deposit') {
      return accepted(
        'Coût total d’entrée : ' + money(semantic.total, semantic.currency) + '; avance ' + money(semantic.advanceRent, semantic.currency) + '; dépôt ' + money(semantic.deposit, semantic.currency) + '.',
        { avance: semantic.advanceRent, depot: semantic.deposit, honorairesAgent: semantic.agentFee, fraisJuridiques: semantic.legalFee, chargesService: semantic.serviceTotal, coutEntree: semantic.total, devise: semantic.currency }
      );
    }
    if (id === 'property-tax') {
      return accepted(
        'Taxe foncière annuelle : ' + money(semantic.annualTax, semantic.currency) + '; équivalent mensuel ' + money(semantic.monthlyTax, semantic.currency) + '.',
        { valeurBien: semantic.propertyValue, tauxEffectifPourcent: semantic.effectiveRate * 100, taxeAnnuelle: semantic.annualTax, taxeMensuelle: semantic.monthlyTax, devise: semantic.currency }
      );
    }
    if (id === 'ng-nhf') {
      return accepted(
        'NHF Nigeria : contribution mensuelle NGN ' + formatter.format(semantic.contributionMonthly) + '; mensualité NGN ' + formatter.format(semantic.monthlyPayment) + '.',
        { contributionMensuelleNGN: semantic.contributionMonthly, contributionAnnuelleNGN: semantic.contributionAnnual, totalContribueNGN: semantic.totalContribution, mensualiteNGN: semantic.monthlyPayment, interetsTotauxNGN: semantic.totalInterest, abordable: semantic.affordable }
      );
    }
    if (id === 'child-support') {
      return accepted(
        'Contribution mensuelle indicative : ' + money(semantic.monthly, semantic.currency) + '; ' + formatter.format(semantic.rate * 100) + ' % du revenu du parent non gardien.',
        { pays: semantic.country, contributionMensuelle: semantic.monthly, totalAnnuel: semantic.annual, parEnfant: semantic.perChild, tauxPourcent: semantic.rate * 100, garde: semantic.custody }
      );
    }
    if (id === 'court-fees') {
      return accepted(
        'Frais judiciaires estimés : ' + money(semantic.total, semantic.currency) + ', dont dépôt ' + money(semantic.filingFee, semantic.currency) + '.',
        { pays: semantic.country, montantDemande: semantic.claimAmount, niveauJuridiction: semantic.courtLevel, typeDemande: semantic.claimType, fraisDepot: semantic.filingFee, fraisSignification: semantic.serviceFee, total: semantic.total }
      );
    }
    if (id === 'divorce-settlement') {
      return accepted(
        'Scénario indicatif : ' + semantic.partyAName + ' ' + semantic.splitA + ' %; ' + semantic.partyBName + ' ' + semantic.splitB + ' %.',
        { pays: semantic.country, partieA: semantic.partyAName, partAPourcent: semantic.splitA, valeurA: semantic.valueA, partieB: semantic.partyBName, partBPourcent: semantic.splitB, valeurB: semantic.valueB }
      );
    }
    if (id === 'inheritance-tax') {
      return accepted(
        'Succession nette : ' + money(semantic.netEstate, semantic.currency) + '; droits estimés ' + money(semantic.tax, semantic.currency) + '; frais de succession ' + money(semantic.probate, semantic.currency) + '.',
        { pays: semantic.country, successionBrute: semantic.grossEstate, successionNette: semantic.netEstate, lien: semantic.relationship, droitsEstimes: semantic.tax, fraisSuccession: semantic.probate, netApresFrais: semantic.netAfterAll }
      );
    }
    if (id === 'legal-aid') {
      return accepted(
        'Pré-évaluation de l’aide juridictionnelle : ' + (semantic.eligible ? 'éligibilité probable' : 'éligibilité peu probable') + '.',
        { pays: semantic.country, revenuSousSeuil: semantic.incomePass, actifsSousSeuil: semantic.assetPass, affaireCouverte: semantic.matterCovered, typeAffaire: semantic.matter, seuilRevenuAjuste: semantic.adjustedThreshold, eligible: semantic.eligible }
      );
    }
    return fail('unsupported-owner', 'Ce moteur partagé n’est pas pris en charge.');
  }

  function allText(values, names) {
    return names.every(function (name) { return String(values[name] || '').trim(); });
  }

  function checkedCount(values, names) {
    return names.filter(function (name) { return Boolean(values[name]); }).length;
  }

  function countryName(code) {
    return ({ NG: 'Nigeria', SN: 'Sénégal', CI: 'Côte d’Ivoire', ZA: 'Afrique du Sud', KE: 'Kenya' })[code] || code;
  }

  function specific(contract, values, dependencies) {
    var id = contract.englishId;
    var nums;
    var total;
    var score;
    var legalEngine = dependencies && dependencies.legalEngine;
    var missingField = (contract.fields || []).find(function (field) {
      return field.type !== 'checkbox' && String(values[field.name] === undefined ? '' : values[field.name]).trim() === '';
    });
    if (missingField) return fail('required-field', 'Complétez le champ « ' + missingField.label + ' ».');

    if (id === 'cac-cost') {
      nums = [number(values.baseFee), number(values.shareCapital), number(values.stampRate), number(values.agentFee)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[2] > 100) return fail('cac-invalid', 'Vérifiez les frais CAC, le capital, le taux de timbre et les honoraires.');
      total = nums[0] + nums[1] * nums[2] / 100 + nums[3];
      return accepted('Coût CAC pour ' + values.entityType + ' : NGN ' + formatter.format(total) + ', dont timbre saisi NGN ' + formatter.format(nums[1] * nums[2] / 100) + '.', { formeCAC: values.entityType, fraisOfficiels: nums[0], timbreEstime: nums[1] * nums[2] / 100, honorairesAgent: nums[3], coutTotalNGN: total });
    }
    if (id === 'cipc-cost') {
      nums = [number(values.registrationFee), number(values.nameReservation), number(values.certifiedCopies), number(values.copyFee), number(values.serviceFee)];
      if (!nonNegative(nums) || nums[0] <= 0 || !Number.isInteger(nums[2])) return fail('cipc-invalid', 'Vérifiez les frais CIPC et le nombre entier de copies.');
      total = nums[0] + nums[1] + nums[2] * nums[3] + nums[4];
      return accepted('Coût CIPC pour ' + values.entityType + ' : ZAR ' + formatter.format(total) + ' avec ' + nums[2] + ' copies certifiées.', { formeCIPC: values.entityType, immatriculation: nums[0], reservationNom: nums[1], coutCopies: nums[2] * nums[3], service: nums[4], coutTotalZAR: total });
    }
    if (id === 'data-compliance') {
      score = checkedCount(values, ['lawfulBasis', 'privacyNotice', 'retention', 'breachPlan']) * 25;
      return accepted('Évaluation ' + values.jurisdiction + ' : ' + score + ' %; priorité suivante : ' + (values.breachPlan ? 'audit et maintien' : 'procédure de violation') + '.', { cadre: values.jurisdiction, scorePourcent: score, priorite: values.breachPlan ? 'maintien' : 'violation de données', statut: score === 100 ? 'préparation complète' : 'écarts à traiter' });
    }
    if (id === 'contract-gen') {
      if (!allText(values, ['partyA', 'partyB', 'obligation', 'payment', 'startDate', 'jurisdiction'])) return fail('contract-invalid', 'Complétez les parties, l’obligation, le paiement, la date et la juridiction.');
      return accepted('PROJET DE CONTRAT\nEntre ' + values.partyA + ' et ' + values.partyB + '\nObligation : ' + values.obligation + '\nPaiement : ' + values.payment + '\nDébut : ' + values.startDate + '\nJuridiction à faire vérifier : ' + values.jurisdiction + '.', { partieA: values.partyA, partieB: values.partyB, obligation: values.obligation, paiement: values.payment, dateDebut: values.startDate, juridiction: values.jurisdiction });
    }
    if (id === 'tenancy-deposit') {
      nums = [number(values.rent), number(values.depositMonths), number(values.advanceMonths), number(values.fees)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[1] <= 0) return fail('deposit-invalid', 'Saisissez un loyer positif et des mois/frais non négatifs.');
      total = nums[0] * (nums[1] + nums[2]) + nums[3];
      return accepted('Coût d’entrée locatif : ' + money(total, values.currency) + '; dépôt ' + money(nums[0] * nums[1], values.currency) + '; avance ' + money(nums[0] * nums[2], values.currency) + '.', { loyer: nums[0], depot: nums[0] * nums[1], avance: nums[0] * nums[2], autresFrais: nums[3], coutEntree: total, devise: values.currency });
    }
    if (id === 'leave-days') {
      if (!values.country) return fail('leave-invalid', 'Choisissez un pays.');
      return accepted(
        'Fiche des congés légaux pour ' + countryName(values.country) + ' : droits annuels, maladie, maternité, paternité et jours fériés à vérifier auprès de la source officielle.',
        { pays: countryName(values.country), droitsAnnuels: 'minimum légal à vérifier', congeMaladie: 'règle nationale à vérifier', congeMaternite: 'règle nationale à vérifier', joursFeries: 'calendrier officiel à vérifier' }
      );
    }
    if (id === 'visa-cost') {
      nums = [number(values.officialFee), number(values.serviceFee)];
      if (!nonNegative(nums)) return fail('visa-invalid', 'Saisissez des frais non négatifs confirmés auprès de la source officielle.');
      total = nums[0] + nums[1];
      return accepted('Parcours ' + values.visaType + ' : passeport ' + countryName(values.passport) + ' vers ' + countryName(values.destination) + '; coût saisi USD ' + formatter.format(total) + '. Statut de visa à confirmer officiellement.', { passeport: countryName(values.passport), destination: countryName(values.destination), typeVoyage: values.visaType, fraisOfficielsUSD: nums[0], fraisServiceUSD: nums[1], coutTotalUSD: total, statut: 'à confirmer' });
    }
    if (id === 'property-tax') {
      nums = [number(values.propertyValue), number(values.annualRate), number(values.fixedCharge)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[1] > 100) return fail('property-tax-invalid', 'Saisissez une valeur positive et un taux valide.');
      total = nums[0] * nums[1] / 100 + nums[2];
      return accepted('Taxe foncière annuelle selon le taux saisi : ' + money(total, values.currency) + '.', { valeurImposable: nums[0], tauxAnnuelPourcent: nums[1], chargeFixe: nums[2], taxeAnnuelle: total, devise: values.currency });
    }
    if (id === 'rent-intelligence') {
      if (!allText(values, ['countryCode', 'city', 'propertyType', 'bedrooms'])) return fail('rent-invalid', 'Complétez le pays, la ville, le type de bien et les chambres.');
      return accepted('Veille locative filtrée : seuls les loyers vérifiés et approuvés sont publiés; aucun loyer vérifié n’est injecté dans ce scénario de démonstration.', { pays: values.countryCode === 'DZ' ? 'Algérie' : 'Nigeria', ville: values.city, typeBien: values.propertyType, chambres: values.bedrooms, annoncesVerifiees: 0 });
    }
    if (id === 'lease-risk-check') {
      if (!allText(values, ['countryCode', 'city', 'minimumRisk'])) return fail('lease-risk-invalid', 'Complétez le pays, la ville et le niveau de risque.');
      return accepted('Recherche des signaux de risque locatif : aucun signal publié pour ce filtre de démonstration; seuls les rapports approuvés sont affichés.', { pays: values.countryCode === 'DZ' ? 'Algérie' : 'Nigeria', ville: values.city, risqueMinimum: values.minimumRisk, signauxPublies: 0, statut: 'aucun signal approuvé' });
    }
    if (id === 'ng-nhf') {
      nums = [number(values.salary), number(values.contributionRate), number(values.loan), number(values.annualRate), number(values.years)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[1] > 100 || nums[2] <= 0 || nums[4] <= 0) return fail('nhf-invalid', 'Vérifiez salaire, contribution, prêt, taux et durée.');
      var monthlyRate = nums[3] / 1200;
      var months = nums[4] * 12;
      var payment = monthlyRate === 0 ? nums[2] / months : nums[2] * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
      return accepted('NHF Nigeria : contribution mensuelle NGN ' + formatter.format(nums[0] * nums[1] / 100) + '; mensualité indicative NGN ' + formatter.format(payment) + ' sur ' + months + ' mois.', { contributionMensuelleNGN: nums[0] * nums[1] / 100, mensualiteIndicativeNGN: payment, dureeMois: months, tauxAnnuelPourcent: nums[3] });
    }
    if (id === 'tenancy-agreement') {
      if (!allText(values, ['landlord', 'tenant', 'property', 'startDate', 'rent', 'deposit'])) return fail('tenancy-invalid', 'Complétez bailleur, locataire, bien, date, loyer et dépôt.');
      return accepted('PROJET DE BAIL\nBailleur : ' + values.landlord + '\nLocataire : ' + values.tenant + '\nBien : ' + values.property + '\nDébut : ' + values.startDate + '\nLoyer : ' + values.rent + '\nDépôt : ' + values.deposit + '.', { bailleur: values.landlord, locataire: values.tenant, bienLoue: values.property, dateDebut: values.startDate, loyer: values.rent, depot: values.deposit });
    }
    if (id === 'employment-contract') {
      if (!allText(values, ['employer', 'employee', 'jobTitle', 'salary', 'startDate'])) return fail('employment-invalid', 'Complétez employeur, salarié, poste, salaire et date.');
      nums = [number(values.probationMonths)];
      if (!nonNegative(nums)) return fail('employment-probation', 'La période d’essai doit être non négative.');
      return accepted('PROJET DE CONTRAT DE TRAVAIL\nEmployeur : ' + values.employer + '\nSalarié : ' + values.employee + '\nPoste : ' + values.jobTitle + '\nSalaire : ' + values.salary + '\nDébut : ' + values.startDate + '\nEssai saisi : ' + nums[0] + ' mois.', { employeur: values.employer, salarie: values.employee, poste: values.jobTitle, salaire: values.salary, dateDebut: values.startDate, essaiMois: nums[0] });
    }
    if (id === 'cac-checker') {
      if (!String(values.proposedName || '').trim()) return fail('cac-name-invalid', 'Saisissez un nom proposé.');
      var restricted = values.regulatedWord === 'yes' || /\b(bank|federal|national|government|insurance)\b/i.test(values.proposedName);
      return accepted('Analyse du nom « ' + values.proposedName + ' » pour ' + values.entityType + ' : ' + (restricted ? 'mot potentiellement réglementé, autorisation à vérifier' : 'aucun mot réglementé détecté par ce contrôle local') + '. Ceci n’est pas une recherche CAC.', { nomPropose: values.proposedName, forme: values.entityType, motReglemente: restricted, classification: restricted ? 'autorisation potentielle' : 'contrôle local sans alerte', statut: 'recherche CAC officielle requise' });
    }
    if (id === 'ip-rights-africa') {
      var route = values.assetType === 'brand' ? 'marque' : values.assetType === 'invention' ? 'brevet avant divulgation' : values.assetType === 'work' ? 'droit d’auteur et preuve de date' : 'secret et NDA';
      return accepted('Plan PI : ' + route + '; portée ' + values.markets + '; divulgation publique ' + (values.publicDisclosure === 'yes' ? 'déjà intervenue' : 'non déclarée') + '.', { actif: values.assetType, voiePrioritaire: route, portee: values.markets, divulgationPublique: values.publicDisclosure === 'yes', urgence: values.publicDisclosure === 'yes' && values.assetType === 'invention' ? 'élevée' : 'normale' });
    }
    if (id === 'business-registration') {
      nums = [number(values.founders)];
      if (!nonNegative(nums) || nums[0] < 1) return fail('registration-invalid', 'Saisissez au moins un fondateur.');
      var reg = legalEngine && legalEngine.getBusinessReg ? legalEngine.getBusinessReg(values.country) : null;
      return accepted('Plan d’immatriculation ' + countryName(values.country) + ' : ' + values.entityType + ', ' + nums[0] + ' fondateur(s), salariés ' + (values.employees === 'yes' ? 'prévus' : 'non prévus') + '. Autorité et pièces à confirmer.', { pays: countryName(values.country), forme: values.entityType, fondateurs: nums[0], salariesPrevus: values.employees === 'yes', moteurJuridiqueAnglais: Boolean(reg), etapeSuivante: 'confirmer autorité et pièces' });
    }
    if (id === 'company-type-selector') {
      nums = [number(values.founders), number(values.annualTurnover)];
      if (!nonNegative(nums) || nums[0] < 1) return fail('company-type-invalid', 'Saisissez au moins un fondateur et un chiffre d’affaires non négatif.');
      var recommendation = values.limitedLiability === 'yes' || values.outsideInvestment === 'yes' ? 'société à responsabilité limitée ou par actions' : nums[0] === 1 ? 'entreprise individuelle à comparer' : 'partenariat à comparer';
      return accepted('Orientation de structure : ' + recommendation + '; ' + nums[0] + ' fondateur(s), investissement externe ' + values.outsideInvestment + '.', { fondateurs: nums[0], responsabiliteLimitee: values.limitedLiability === 'yes', investissementExterne: values.outsideInvestment === 'yes', chiffreAffairesPrevu: nums[1], recommandation: recommendation });
    }
    if (id === 'nda-generator') {
      if (!allText(values, ['discloser', 'recipient', 'purpose', 'jurisdiction'])) return fail('nda-invalid', 'Complétez les parties, la finalité et la juridiction.');
      nums = [number(values.durationMonths)];
      if (!nonNegative(nums) || nums[0] < 1) return fail('nda-duration', 'La durée doit être positive.');
      return accepted('PROJET NDA\nDivulgateur : ' + values.discloser + '\nDestinataire : ' + values.recipient + '\nFinalité : ' + values.purpose + '\nDurée : ' + nums[0] + ' mois\nJuridiction : ' + values.jurisdiction + '.', { divulgateur: values.discloser, destinataire: values.recipient, finalite: values.purpose, dureeMois: nums[0], juridiction: values.jurisdiction });
    }
    if (id === 'privacy-policy-gen') {
      if (!allText(values, ['controller', 'website', 'dataCategories', 'retention', 'contact'])) return fail('privacy-invalid', 'Complétez responsable, service, données, conservation et contact.');
      return accepted('PROJET DE POLITIQUE\nService : ' + values.website + '\nResponsable : ' + values.controller + '\nDonnées : ' + values.dataCategories + '\nConservation : ' + values.retention + '\nContact droits : ' + values.contact + '.', { service: values.website, responsable: values.controller, categoriesDonnees: values.dataCategories, conservation: values.retention, contactDroits: values.contact });
    }
    if (id === 'will-generator') {
      if (!allText(values, ['testator', 'executor', 'beneficiary', 'asset', 'date'])) return fail('will-invalid', 'Complétez testateur, exécuteur, bénéficiaire, bien et date.');
      return accepted('PROJET DE TESTAMENT\nTestateur : ' + values.testator + '\nExécuteur proposé : ' + values.executor + '\nBénéficiaire : ' + values.beneficiary + '\nLegs : ' + values.asset + '\nDate : ' + values.date + '.', { testateur: values.testator, executeur: values.executor, beneficiaire: values.beneficiary, legs: values.asset, dateProjet: values.date, statut: 'témoins et règles locales à vérifier' });
    }
    if (id === 'ndpa-checker') {
      score = checkedCount(values, ['lawfulBasis', 'dpo', 'dpia', 'breach72h']) * 25;
      return accepted('Score NDPA : ' + score + ' %; ' + (values.breach72h ? 'procédure de violation déclarée' : 'procédure de violation manquante') + '.', { scoreNDPA: score, controlesValides: score / 25, priorite: values.breach72h ? 'audit annuel' : 'notification de violation', niveau: score >= 75 ? 'avancé' : score >= 50 ? 'partiel' : 'faible' });
    }
    if (id === 'popia-checker') {
      score = checkedCount(values, ['accountability', 'purpose', 'openness', 'security']) * 25;
      return accepted('Score POPIA : ' + score + ' %; condition sécurité ' + (values.security ? 'déclarée' : 'à traiter') + '.', { scorePOPIA: score, conditionsValides: score / 25, securiteDeclaree: Boolean(values.security), niveau: score >= 75 ? 'avancé' : score >= 50 ? 'partiel' : 'faible' });
    }
    if (id === 'child-support') {
      nums = [number(values.parentAIncome), number(values.parentBIncome), number(values.children)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[2] < 1) return fail('child-invalid', 'Saisissez des revenus non négatifs et au moins un enfant.');
      var rate = nums[2] === 1 ? 0.2 : nums[2] === 2 ? 0.27 : 0.33;
      total = values.custody === 'joint' ? Math.max(nums[0] * rate * 0.1, (nums[0] - nums[1]) * rate / 2) : nums[0] * rate;
      return accepted('Contribution indicative : NGN ' + formatter.format(total) + '/mois, soit NGN ' + formatter.format(total / nums[2]) + ' par enfant; garde ' + values.custody + '.', { garde: values.custody, enfants: nums[2], tauxHypothese: rate, contributionMensuelleNGN: total, parEnfantNGN: total / nums[2] });
    }
    if (id === 'court-fees') {
      nums = [number(values.claimAmount), number(values.baseFee), number(values.serviceRate)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[2] > 100) return fail('court-invalid', 'Saisissez une demande positive et un taux de frais valide.');
      total = nums[1] * (1 + nums[2] / 100);
      return accepted('Frais ' + values.courtLevel + ' : dépôt NGN ' + formatter.format(nums[1]) + '; signification/copies NGN ' + formatter.format(total - nums[1]) + '; total NGN ' + formatter.format(total) + '.', { niveauJuridiction: values.courtLevel, montantDemandeNGN: nums[0], fraisDepotNGN: nums[1], fraisAnnexesNGN: total - nums[1], totalNGN: total });
    }
    if (id === 'affidavit-generator') {
      if (!allText(values, ['deponent', 'facts', 'place', 'date', 'annexure'])) return fail('affidavit-invalid', 'Complétez déclarant, faits, lieu, date et pièce.');
      return accepted('PROJET D’AFFIDAVIT\nDéclarant : ' + values.deponent + '\nFaits : ' + values.facts + '\nLieu/date : ' + values.place + ', ' + values.date + '\nAnnexe : ' + values.annexure + '.', { declarant: values.deponent, faits: values.facts, lieu: values.place, date: values.date, annexe: values.annexure, statut: 'assermentation requise' });
    }
    if (id === 'annual-returns') {
      if (!values.country || !values.anniversaryDate || !values.filingStatus) return fail('returns-invalid', 'Choisissez le pays, la date et l’état du dépôt.');
      var returns = legalEngine && legalEngine.getAnnualReturns ? legalEngine.getAnnualReturns(values.country) : null;
      return accepted('Déclaration annuelle ' + countryName(values.country) + ' : état ' + values.filingStatus + ', anniversaire ' + values.anniversaryDate + ', registres ' + values.recordsReady + '.', { pays: countryName(values.country), dateAnniversaire: values.anniversaryDate, registresPrets: values.recordsReady === 'yes', etatDepot: values.filingStatus, moteurJuridiqueAnglais: Boolean(returns), prochaineAction: values.filingStatus === 'filed' ? 'conserver la preuve' : 'confirmer échéance et frais' });
    }
    if (id === 'bail-calculator') {
      var cautionClass = values.offenceCategory === 'serious' || values.flightRisk === 'yes' ? 'examen judiciaire renforcé' : values.priorRecord === 'yes' ? 'conditions supplémentaires possibles' : 'conditions ordinaires possibles';
      return accepted('Fiche de caution ' + countryName(values.country) + ' : ' + cautionClass + '. Aucun montant ou droit à la libération n’est garanti.', { pays: countryName(values.country), categorieInfraction: values.offenceCategory, antecedentDeclare: values.priorRecord === 'yes', risqueNonComparution: values.flightRisk === 'yes', classification: cautionClass });
    }
    if (id === 'board-resolution') {
      nums = [number(values.quorum)];
      if (!allText(values, ['company', 'meetingDate', 'decision', 'chair']) || !nonNegative(nums) || nums[0] < 1) return fail('resolution-invalid', 'Complétez société, réunion, décision, président et quorum.');
      return accepted('PROJET DE RÉSOLUTION\nSociété : ' + values.company + '\nRéunion : ' + values.meetingDate + '\nPrésident : ' + values.chair + '\nQuorum déclaré : ' + nums[0] + '\nDécision : ' + values.decision + '.', { societe: values.company, dateReunion: values.meetingDate, president: values.chair, quorumDeclare: nums[0], decision: values.decision });
    }
    if (id === 'breach-notification') {
      nums = [number(values.affected)];
      if (!allText(values, ['controller', 'incidentDate', 'dataTypes', 'measures']) || !nonNegative(nums)) return fail('breach-invalid', 'Complétez organisation, incident, données, personnes et mesures.');
      return accepted('PROJET DE NOTIFICATION\nOrganisation : ' + values.controller + '\nIncident : ' + values.incidentDate + '\nDonnées : ' + values.dataTypes + '\nPersonnes : ' + nums[0] + '\nMesures : ' + values.measures + '.', { organisation: values.controller, dateIncident: values.incidentDate, donneesConcernees: values.dataTypes, personnesPotentielles: nums[0], mesures: values.measures, statut: 'délai légal à vérifier' });
    }
    if (id === 'business-license') {
      if (!allText(values, ['country', 'activity', 'municipality', 'premises'])) return fail('license-invalid', 'Complétez pays, activité, commune et local.');
      var authorityLevel = values.activity === 'regulated' ? 'autorité sectorielle + commune' : values.premises === 'yes' ? 'commune + sécurité/local' : 'registre/commune';
      return accepted('Plan de licence ' + countryName(values.country) + ' : activité ' + values.activity + ' à ' + values.municipality + '; contrôles ' + authorityLevel + '.', { pays: countryName(values.country), activite: values.activity, commune: values.municipality, localPublic: values.premises === 'yes', autoritesAVerifier: authorityLevel });
    }
    if (id === 'cookie-consent') {
      nums = [number(values.consentExpiry)];
      if (!allText(values, ['website', 'analytics', 'marketing', 'privacyUrl']) || !nonNegative(nums) || nums[0] < 1) return fail('cookie-invalid', 'Complétez le site, les catégories, le lien et la durée.');
      var categories = ['nécessaires'].concat(values.analytics === 'yes' ? ['analytiques'] : [], values.marketing === 'yes' ? ['marketing'] : []);
      return accepted('CONFIGURATION DE CONSENTEMENT\nSite : ' + values.website + '\nCatégories : ' + categories.join(', ') + '\nRefus disponible : oui\nPolitique : ' + values.privacyUrl + '\nExpiration : ' + nums[0] + ' jours.', { site: values.website, categories: categories.join(', '), refusDisponible: true, politique: values.privacyUrl, expirationJours: nums[0] });
    }
    if (id === 'divorce-settlement') {
      nums = [number(values.assets), number(values.debts), number(values.shareA), number(values.children)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[2] > 100) return fail('divorce-invalid', 'Vérifiez actifs, dettes, part et enfants.');
      var netAssets = Math.max(0, nums[0] - nums[1]);
      var amountA = netAssets * nums[2] / 100;
      return accepted('Partage saisi : actif net XOF ' + formatter.format(netAssets) + '; A XOF ' + formatter.format(amountA) + '; B XOF ' + formatter.format(netAssets - amountA) + '; ' + nums[3] + ' enfant(s) à traiter séparément.', { actifNetXOF: netAssets, partAXOF: amountA, partBXOF: netAssets - amountA, pourcentA: nums[2], enfants: nums[3] });
    }
    if (id === 'dpa-generator') {
      if (!allText(values, ['controller', 'processor', 'purpose', 'dataTypes', 'duration', 'security'])) return fail('dpa-invalid', 'Complétez les rôles, la finalité, les données, la durée et la sécurité.');
      return accepted('PROJET DPA\nResponsable : ' + values.controller + '\nSous-traitant : ' + values.processor + '\nFinalité : ' + values.purpose + '\nDonnées : ' + values.dataTypes + '\nDurée : ' + values.duration + '\nSécurité : ' + values.security + '.', { responsable: values.controller, sousTraitant: values.processor, finalite: values.purpose, donnees: values.dataTypes, duree: values.duration, securite: values.security });
    }
    if (id === 'dpia-tool') {
      if (!String(values.purpose || '').trim()) return fail('dpia-invalid', 'Décrivez la finalité évaluée.');
      score = checkedCount(values, ['largeScale', 'sensitiveData', 'systematicMonitoring', 'crossBorder']);
      return accepted('DPIA « ' + values.purpose + ' » : ' + score + '/4 facteurs de risque; niveau ' + (score >= 3 ? 'élevé' : score >= 1 ? 'intermédiaire' : 'limité') + '.', { finalite: values.purpose, facteursRisque: score, facteursTotal: 4, niveauRisque: score >= 3 ? 'élevé' : score >= 1 ? 'intermédiaire' : 'limité', prochaineAction: score ? 'documenter mesures et consultation' : 'confirmer le périmètre' });
    }
    if (id === 'foreign-company-reg') {
      if (!allText(values, ['country', 'presence', 'homeCountry', 'localHiring'])) return fail('foreign-invalid', 'Complétez pays, présence, origine et embauche.');
      var registrationPath = values.presence === 'subsidiary' ? 'constituer une entité locale' : values.presence === 'branch' ? 'enregistrer la société étrangère et son représentant' : 'confirmer si le bureau peut rester non commercial';
      return accepted('Implantation de ' + values.homeCountry + ' vers ' + countryName(values.country) + ' : ' + registrationPath + '; embauche locale ' + values.localHiring + '.', { paysAccueil: countryName(values.country), paysOrigine: values.homeCountry, presence: values.presence, embaucheLocale: values.localHiring === 'yes', parcours: registrationPath });
    }
    if (id === 'gdpr-vs-africa') {
      var overlap = values.topic === 'breach' ? 'délais, autorité et information des personnes' : values.topic === 'rights' ? 'accès, rectification, opposition et effacement' : 'base de transfert et garanties';
      return accepted('Comparaison RGPD / ' + values.africanLaw + ' sur ' + values.topic + ' : vérifier ' + overlap + '; personnes UE ' + values.euResidents + '.', { loiAfricaine: values.africanLaw, sujet: values.topic, personnesUE: values.euResidents === 'yes', pointsComparer: overlap, doubleCadrePossible: values.euResidents === 'yes' });
    }
    if (id === 'inheritance-tax') {
      nums = [number(values.estate), number(values.allowance), number(values.rate)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[2] > 100) return fail('inheritance-invalid', 'Vérifiez succession, abattement et taux.');
      var taxable = Math.max(0, nums[0] - nums[1]);
      total = taxable * nums[2] / 100;
      return accepted('Droits de succession saisis pour ' + values.relationship + ' : base XOF ' + formatter.format(taxable) + '; droits XOF ' + formatter.format(total) + '.', { lien: values.relationship, successionXOF: nums[0], abattementXOF: nums[1], baseTaxableXOF: taxable, tauxPourcent: nums[2], droitsEstimesXOF: total });
    }
    if (id === 'ip-protection') {
      var protection = values.asset === 'brand' ? 'recherche et dépôt de marque' : values.asset === 'invention' ? 'confidentialité puis conseil brevet' : values.asset === 'content' ? 'preuve de création et licence' : 'contrôles d’accès et NDA';
      return accepted('Stratégie PI : ' + protection + ' pour ' + values.markets + '; divulgation ' + values.exposure + '; preuves de propriété ' + values.ownershipDocs + '.', { actif: values.asset, marches: values.markets, divulgation: values.exposure === 'yes', preuvesPropriete: values.ownershipDocs === 'yes', actionPrioritaire: protection });
    }
    if (id === 'legal-aid') {
      nums = [number(values.income), number(values.threshold)];
      if (!nonNegative(nums) || nums[1] <= 0) return fail('aid-invalid', 'Vérifiez revenu et seuil.');
      var under = nums[0] <= nums[1];
      return accepted('Pré-évaluation aide juridique : revenu ' + (under ? 'sous' : 'au-dessus de') + ' votre seuil; affaire ' + values.matterType + '; urgence ' + (values.urgent ? 'oui' : 'non') + '.', { revenuXOF: nums[0], seuilXOF: nums[1], sousSeuil: under, typeAffaire: values.matterType, urgence: Boolean(values.urgent), statut: under ? 'demande à préparer' : 'autres options à examiner' });
    }
    if (id === 'partnership-agreement') {
      if (!allText(values, ['partnerA', 'partnerB', 'business', 'contributionA', 'contributionB', 'profitSplit'])) return fail('partnership-invalid', 'Complétez partenaires, activité, apports et partage.');
      return accepted('PROJET D’ACCORD\nPartenaires : ' + values.partnerA + ' / ' + values.partnerB + '\nActivité : ' + values.business + '\nApports : ' + values.contributionA + ' / ' + values.contributionB + '\nBénéfices : ' + values.profitSplit + '.', { partenaireA: values.partnerA, partenaireB: values.partnerB, activite: values.business, apportA: values.contributionA, apportB: values.contributionB, partageBenefices: values.profitSplit });
    }
    if (id === 'power-of-attorney') {
      if (!allText(values, ['principal', 'agent', 'powers', 'startDate', 'endDate', 'jurisdiction'])) return fail('poa-invalid', 'Complétez mandant, mandataire, pouvoirs, dates et juridiction.');
      if (values.endDate < values.startDate) return fail('poa-dates', 'La date de fin doit suivre la date de début.');
      return accepted('PROJET DE PROCURATION\nMandant : ' + values.principal + '\nMandataire : ' + values.agent + '\nPouvoirs : ' + values.powers + '\nPériode : ' + values.startDate + ' au ' + values.endDate + '\nJuridiction : ' + values.jurisdiction + '.', { mandant: values.principal, mandataire: values.agent, pouvoirs: values.powers, debut: values.startDate, fin: values.endDate, juridiction: values.jurisdiction });
    }
    if (id === 'shareholder-agreement') {
      nums = [number(values.shareA), number(values.shareB)];
      if (!allText(values, ['company', 'shareholderA', 'shareholderB', 'reservedMatter']) || !nonNegative(nums) || Math.abs(nums[0] + nums[1] - 100) > 0.001) return fail('shareholder-invalid', 'Complétez le pacte et assurez une participation totale de 100 %.');
      return accepted('PROJET DE PACTE\nSociété : ' + values.company + '\n' + values.shareholderA + ' : ' + nums[0] + ' %\n' + values.shareholderB + ' : ' + nums[1] + ' %\nDécision réservée : ' + values.reservedMatter + '.', { societe: values.company, actionnaireA: values.shareholderA, participationA: nums[0], actionnaireB: values.shareholderB, participationB: nums[1], decisionReservee: values.reservedMatter });
    }
    if (id === 'statutory-declaration') {
      if (!allText(values, ['declarant', 'purpose', 'facts', 'place', 'date'])) return fail('declaration-invalid', 'Complétez déclarant, objet, faits, lieu et date.');
      return accepted('PROJET DE DÉCLARATION SOLENNELLE\nDéclarant : ' + values.declarant + '\nObjet : ' + values.purpose + '\nFaits : ' + values.facts + '\nLieu/date : ' + values.place + ', ' + values.date + '\nAttestation par une personne habilitée requise.', { declarant: values.declarant, objet: values.purpose, faits: values.facts, lieu: values.place, date: values.date, statut: 'attestation requise' });
    }
    if (id === 'tin-guide') {
      var tin = legalEngine && legalEngine.getTIN ? legalEngine.getTIN(values.country) : null;
      var tinPath = values.registeredBusiness === 'yes' ? 'rassembler l’immatriculation et l’identité du représentant' : 'immatriculer ou justifier le statut avant la demande';
      return accepted('Parcours NIF ' + countryName(values.country) + ' pour ' + values.applicantType + ' : ' + tinPath + '; préférence en ligne ' + values.onlinePreferred + '.', { pays: countryName(values.country), demandeur: values.applicantType, entrepriseImmatriculee: values.registeredBusiness === 'yes', preferenceEnLigne: values.onlinePreferred === 'yes', moteurJuridiqueAnglais: Boolean(tin), prochaineAction: tinPath });
    }
    if (id === 'trademark-registration') {
      nums = [number(values.classes)];
      if (!nonNegative(nums) || !Number.isInteger(nums[0]) || nums[0] < 1) return fail('trademark-invalid', 'Saisissez au moins une classe de Nice.');
      var trademark = legalEngine && legalEngine.getTrademark ? legalEngine.getTrademark(values.country) : null;
      return accepted('Plan de marque : voie ' + values.routeType + ' depuis ' + countryName(values.country) + ', ' + nums[0] + ' classe(s), recherche antérieure ' + values.priorSearch + '.', { paysPrincipal: countryName(values.country), voieDepot: values.routeType, classesNice: nums[0], rechercheAnterieure: values.priorSearch === 'yes', moteurJuridiqueAnglais: Boolean(trademark), prochaineAction: values.priorSearch === 'yes' ? 'confirmer frais et pièces' : 'effectuer une recherche' });
    }
    if (id === 'winding-up') {
      nums = [number(values.employees)];
      if (!nonNegative(nums) || !Number.isInteger(nums[0])) return fail('winding-invalid', 'Saisissez un nombre entier de salariés.');
      var phase = values.solvent === 'no' || values.routeType === 'creditors' ? 'évaluer l’insolvabilité et protéger les créanciers' : values.taxClearance === 'no' ? 'obtenir les soldes fiscaux et sociaux' : 'préparer résolutions, avis et radiation';
      return accepted('Dissolution ' + countryName(values.country) + ' : voie ' + values.routeType + ', solvable ' + values.solvent + ', ' + nums[0] + ' salarié(s), quitus fiscal ' + values.taxClearance + '. Étape : ' + phase + '.', { pays: countryName(values.country), voie: values.routeType, solvable: values.solvent === 'yes', salaries: nums[0], quitusFiscal: values.taxClearance === 'yes', etapePrioritaire: phase });
    }
    return fail('route-contract-missing', 'Le contrat applicatif distinct est introuvable.');
  }

  function runRaw(contract, values, dependencies) {
    var mode = contract.engineMode;
    var currency = values.currency || 'XOF';
    var nums;
    var total;
    var fields = contract.fields || [];
    if (fields.length && fields.every(function (field) { return field.type === 'checkbox'; }) &&
        ['ndpa-checker', 'popia-checker'].indexOf(contract.englishId) === -1 &&
        !fields.some(function (field) { return Boolean(values[field.name]); })) {
      return fail('required-selection', 'Sélectionnez au moins un élément avant de continuer.');
    }

    if (contract.sharedEngine === 'property-assumption') return renderProperty(contract.englishId, values);
    if (contract.sharedEngine === 'mortgage-property-english-owner') return renderEnglishOwnerCalculator(contract, values);
    if (contract.englishId) return specific(contract, values, dependencies);

    if (mode === 'rate-total') {
      nums = [number(values.amount), number(values.rate), number(values.fixed)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[1] > 100) return fail('invalid-rate', 'Saisissez un montant positif, un taux entre 0 et 100 % et des frais non négatifs.');
      total = nums[0] * nums[1] / 100 + nums[2];
      return accepted('Montant calculé : ' + money(total, currency) + ' (base ' + money(nums[0], currency) + ', taux ' + formatter.format(nums[1]) + ' %, frais fixes ' + money(nums[2], currency) + ').', { base: nums[0], tauxPourcent: nums[1], fraisFixes: nums[2], total: total, devise: currency });
    }

    if (mode === 'deposit') {
      nums = [number(values.rent), number(values.months), number(values.fees)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[1] <= 0) return fail('invalid-deposit', 'Saisissez un loyer et un nombre de mois positifs.');
      total = nums[0] * nums[1] + nums[2];
      return accepted('Coût d’entrée : ' + money(total, currency) + ' pour ' + formatter.format(nums[1]) + ' mois et ' + money(nums[2], currency) + ' de frais.', { loyer: nums[0], mois: nums[1], frais: nums[2], total: total, devise: currency });
    }

    if (mode === 'leave') {
      nums = [number(values.monthsWorked), number(values.annualDays), number(values.usedDays)];
      if (!nonNegative(nums) || nums[0] > 12 || nums[1] <= 0) return fail('invalid-leave', 'Saisissez 0 à 12 mois travaillés, des droits annuels positifs et des jours pris non négatifs.');
      total = nums[1] * nums[0] / 12;
      return accepted('Droits acquis selon vos hypothèses : ' + formatter.format(total) + ' jours; solde : ' + formatter.format(total - nums[2]) + ' jours.', { joursAcquis: total, joursPris: nums[2], soldeJours: total - nums[2] });
    }

    if (mode === 'rent-metrics') {
      nums = [number(values.rent), number(values.area), number(values.comparison)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[1] <= 0) return fail('invalid-rent', 'Saisissez un loyer et une surface positifs.');
      return accepted('Loyer par m² : ' + money(nums[0] / nums[1], currency) + '; écart au comparable : ' + money(nums[0] - nums[2], currency) + '.', { loyer: nums[0], surface: nums[1], loyerParMetreCarre: nums[0] / nums[1], ecartComparable: nums[0] - nums[2], devise: currency });
    }

    if (mode === 'nhf') {
      nums = [number(values.salary), number(values.contributionRate), number(values.loan), number(values.annualRate), number(values.years)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[1] > 100 || nums[2] <= 0 || nums[4] <= 0) return fail('invalid-nhf', 'Saisissez des valeurs positives et des taux valides.');
      var monthlyRate = nums[3] / 1200;
      var months = nums[4] * 12;
      var payment = monthlyRate === 0 ? nums[2] / months : nums[2] * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
      var contribution = nums[0] * nums[1] / 100;
      return accepted('Contribution mensuelle : ' + money(contribution, currency) + '; mensualité indicative : ' + money(payment, currency) + '.', { contributionMensuelle: contribution, mensualiteIndicative: payment, dureeMois: months, devise: currency });
    }

    if (mode === 'score') {
      var checked = Object.keys(values).filter(function (key) { return /^check\d+$/.test(key) && values[key]; }).length;
      var score = checked / 4 * 100;
      return accepted('Score de préparation : ' + formatter.format(score) + ' % (' + checked + '/4 exigences confirmées).', { exigencesConfirmees: checked, exigencesTotal: 4, scorePourcent: score, niveau: score >= 75 ? 'avancé' : score >= 50 ? 'intermédiaire' : 'insuffisant' });
    }

    if (mode === 'document') {
      if (!values.partyA || !values.partyB || !values.date || !values.subject) return fail('invalid-document', 'Complétez toutes les parties, la date et l’objet du projet.');
      return accepted(
        contract.name + ' — PROJET À FAIRE RELIRE\nPremière partie : ' + values.partyA +
        '\nDeuxième partie : ' + values.partyB + '\nDate : ' + values.date + '\nObjet : ' + values.subject +
        '\nStatut : projet local non signé, sans valeur de dépôt officiel.',
        { premierePartie: values.partyA, deuxiemePartie: values.partyB, date: values.date, objet: values.subject, statut: 'projet à faire relire' }
      );
    }

    if (mode === 'reference') {
      if (!values.country || !values.option) return fail('invalid-reference', 'Choisissez un pays et un scénario.');
      var countryNames = { NG: 'Nigeria', SN: 'Sénégal', CI: 'Côte d’Ivoire', ZA: 'Afrique du Sud' };
      var sourceValue = null;
      var legalEngine = dependencies && dependencies.legalEngine;
      if (legalEngine) {
        if (contract.englishId === 'business-registration' && legalEngine.getBusinessReg) sourceValue = legalEngine.getBusinessReg(values.country);
        if (contract.englishId === 'annual-returns' && legalEngine.getAnnualReturns) sourceValue = legalEngine.getAnnualReturns(values.country);
        if (contract.englishId === 'trademark-registration' && legalEngine.getTrademark) sourceValue = legalEngine.getTrademark(values.country);
        if (contract.englishId === 'tin-guide' && legalEngine.getTIN) sourceValue = legalEngine.getTIN(values.country);
      }
      var sourceDetail = sourceValue ? ' Données structurées du moteur juridique anglais chargées pour cette sélection.' : '';
      return accepted('Fiche filtrée : ' + (countryNames[values.country] || values.country) + ' — ' + values.option + '. Vérification auprès de l’autorité compétente requise.' + sourceDetail, { pays: countryNames[values.country] || values.country, codePays: values.country, scenario: values.option, statut: 'à vérifier officiellement', moteurJuridiqueAnglais: Boolean(sourceValue) });
    }

    if (mode === 'child-support') {
      nums = [number(values.parentAIncome), number(values.parentBIncome), number(values.children)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[2] < 1) return fail('invalid-child-support', 'Saisissez des revenus non négatifs et au moins un enfant.');
      var rate = nums[2] === 1 ? 0.2 : nums[2] === 2 ? 0.27 : 0.33;
      total = nums[0] * rate;
      return accepted('Contribution mensuelle indicative : ' + money(total, currency) + '; soit ' + money(total / nums[2], currency) + ' par enfant.', { contributionMensuelle: total, parEnfant: total / nums[2], enfants: nums[2], tauxHypothese: rate, devise: currency });
    }

    if (mode === 'court-fees') {
      nums = [number(values.claimAmount), number(values.baseFee), number(values.serviceRate)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[2] > 100) return fail('invalid-court-fees', 'Saisissez un montant positif et un taux de signification entre 0 et 100 %.');
      total = nums[1] * (1 + nums[2] / 100);
      return accepted('Frais saisis : ' + money(nums[1], currency) + '; signification : ' + money(total - nums[1], currency) + '; total : ' + money(total, currency) + '.', { demande: nums[0], fraisDepot: nums[1], fraisSignification: total - nums[1], total: total, devise: currency });
    }

    if (mode === 'divorce') {
      nums = [number(values.assets), number(values.shareA)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[1] > 100) return fail('invalid-divorce', 'Saisissez des actifs positifs et une part entre 0 et 100 %.');
      var amountA = nums[0] * nums[1] / 100;
      return accepted('Scénario de partage : A ' + money(amountA, currency) + ' (' + formatter.format(nums[1]) + ' %); B ' + money(nums[0] - amountA, currency) + '.', { actifs: nums[0], partA: amountA, partB: nums[0] - amountA, pourcentA: nums[1], devise: currency });
    }

    if (mode === 'inheritance') {
      nums = [number(values.estate), number(values.allowance), number(values.rate)];
      if (!nonNegative(nums) || nums[0] <= 0 || nums[2] > 100) return fail('invalid-inheritance', 'Saisissez une succession positive et un taux entre 0 et 100 %.');
      var taxable = Math.max(0, nums[0] - nums[1]);
      total = taxable * nums[2] / 100;
      return accepted('Base taxable selon vos hypothèses : ' + money(taxable, currency) + '; droits estimés : ' + money(total, currency) + '.', { succession: nums[0], abattement: nums[1], baseTaxable: taxable, droitsEstimes: total, devise: currency });
    }

    if (mode === 'legal-aid') {
      nums = [number(values.income), number(values.threshold)];
      if (!nonNegative(nums) || nums[1] <= 0) return fail('invalid-legal-aid', 'Saisissez un revenu non négatif et un seuil positif.');
      var eligible = nums[0] <= nums[1];
      return accepted('Pré-évaluation : ' + (eligible ? 'revenu sous le seuil saisi' : 'revenu au-dessus du seuil saisi') + '; urgence : ' + (values.urgent ? 'oui' : 'non') + '.', { revenu: nums[0], seuil: nums[1], sousSeuil: eligible, urgence: Boolean(values.urgent), statut: 'pré-évaluation uniquement', devise: currency });
    }

    return fail('unsupported-mode', 'Ce workflow n’est pas encore pris en charge.');
  }

  function ascii(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E\n]/g, '?');
  }

  function pdfEscape(value) {
    return ascii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  function toBytes(value) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value);
    return Uint8Array.from(Buffer.from(value, 'utf8'));
  }

  function createPdf(title, lines) {
    var content = ['BT', '/F1 11 Tf', '48 790 Td', '(' + pdfEscape(title) + ') Tj'];
    (lines || []).forEach(function (line) {
      content.push('0 -16 Td', '(' + pdfEscape(line) + ') Tj');
    });
    content.push('ET');
    var stream = content.join('\n');
    var objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      '<< /Length ' + toBytes(stream).length + ' >>\nstream\n' + stream + '\nendstream'
    ];
    var pdf = '%PDF-1.4\n';
    var offsets = [0];
    objects.forEach(function (object, index) {
      offsets.push(toBytes(pdf).length);
      pdf += (index + 1) + ' 0 obj\n' + object + '\nendobj\n';
    });
    var xref = toBytes(pdf).length;
    pdf += 'xref\n0 6\n0000000000 65535 f \n';
    offsets.slice(1).forEach(function (offset) {
      pdf += String(offset).padStart(10, '0') + ' 00000 n \n';
    });
    pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
    return toBytes(pdf);
  }

  function run(contract, values, dependencies) {
    var raw = runRaw(contract, values, dependencies);
    if (!raw || !raw.ok) return raw;
    return presentation && presentation.presentResult
      ? presentation.presentResult(contract.englishId, raw)
      : raw;
  }

  return {
    createPdf: createPdf,
    run: run,
    runRaw: runRaw
  };
}));
