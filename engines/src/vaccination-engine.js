(function vaccinationEngineModule(root, factory) {
  'use strict';

  var contract = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = contract;
  }

  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.VaccinationEngine = contract.createBrowserAdapter(root);
  }
}(typeof window !== 'undefined' ? window : null, function vaccinationEngineFactory() {
  'use strict';

  var ANIMAL_TYPES = ['all', 'cattle', 'goats_sheep', 'poultry'];
  var REGION_CODES = {
    west_africa: ['NG', 'GH', 'CI', 'SN', 'ML', 'BF', 'NE', 'GN', 'BJ', 'TG', 'SL', 'LR', 'MR', 'GM', 'GW', 'CV'],
    east_africa: ['KE', 'ET', 'TZ', 'UG', 'RW', 'BI', 'SO', 'DJ', 'ER', 'SS'],
    central_africa: ['CD', 'CM', 'CG', 'GA', 'GQ', 'CF', 'TD', 'ST'],
    southern_africa: ['ZA', 'MZ', 'ZM', 'ZW', 'MW', 'AO', 'NA', 'BW', 'LS', 'SZ'],
    north_africa: ['EG', 'MA', 'DZ', 'TN', 'LY', 'SD']
  };
  var CAMPAIGN_TERMS = {
    fmd: 'foot-and-mouth',
    cbpp: 'contagious bovine',
    blackquarter: 'blackleg',
    anthrax: 'anthrax',
    lsd: 'lumpy skin',
    brucellosis: 'brucellosis',
    ecf: 'east coast fever',
    rvf: 'rift valley',
    ppr: 'peste des',
    goat_pox: 'pox',
    clostridial_sr: 'clostridial',
    ccpp: 'contagious caprine',
    bluetongue: 'bluetongue',
    ndv: 'newcastle',
    gumboro: 'gumboro',
    fowl_pox: 'fowl pox',
    marek: 'marek',
    fowl_typhoid: 'typhoid',
    avian_flu: 'avian influenza'
  };
  var PRICE_SUFFIXES = {
    fmd: 'fmd',
    cbpp: 'cbpp',
    blackquarter: 'bq',
    anthrax: 'anthrax',
    lsd: 'lsd',
    brucellosis: 'bruc',
    ecf: 'ecf',
    rvf: 'rvf',
    rabies_cattle: 'rabies',
    botulism: 'botulism',
    ppr: 'ppr',
    goat_pox: 'pox',
    clostridial_sr: 'cdt',
    ccpp: 'ccpp',
    bluetongue: 'bt',
    ndv: 'nd',
    gumboro: 'ibd',
    fowl_pox: 'pox',
    marek: 'marek',
    fowl_typhoid: 'ft',
    avian_flu: 'ai'
  };
  var FALLBACK_USD_PRICES = {
    cattle_fmd: 0.3,
    cattle_cbpp: 0.25,
    cattle_bq: 0.15,
    cattle_anthrax: 0.15,
    cattle_lsd: 0.2,
    cattle_bruc: 0.18,
    cattle_ecf: 0.5,
    cattle_rvf: 0.18,
    cattle_rabies: 0.15,
    cattle_botulism: 0.2,
    gs_ppr: 0.2,
    gs_pox: 0.15,
    gs_cdt: 0.1,
    gs_ccpp: 0.15,
    gs_bt: 0.18,
    poultry_nd: 0.05,
    poultry_ibd: 0.05,
    poultry_pox: 0.04,
    poultry_marek: 0.05,
    poultry_ft: 0.04,
    poultry_ai: 0.06
  };

  function roundCurrency(value) {
    return Math.round(value * 100) / 100;
  }

  function findCountry(countryIndex, countryCode) {
    for (var index = 0; index < countryIndex.length; index += 1) {
      if (countryIndex[index].code === countryCode) return countryIndex[index];
    }
    return {
      code: countryCode,
      name: countryCode,
      flag: '🌍',
      slug: String(countryCode || '').toLowerCase()
    };
  }

  function findRegion(countryCode, program, countryIndex) {
    if (program && program.govService) {
      var country = findCountry(countryIndex, countryCode);
      if (country && country.region) return country.region;
    }

    var regions = Object.keys(REGION_CODES);
    for (var index = 0; index < regions.length; index += 1) {
      if (REGION_CODES[regions[index]].indexOf(countryCode) > -1) return regions[index];
    }
    return 'island_nations';
  }

  function diseaseIsEndemic(disease, countryCode) {
    return !(disease.notEndemic && disease.notEndemic.indexOf(countryCode) > -1)
      && (
        disease.endemicIn === 'ALL'
        || !Array.isArray(disease.endemicIn)
        || disease.endemicIn.indexOf(countryCode) > -1
      );
  }

  function vaccinationMonths(disease, program) {
    if (program && program.govMonths && program.govMonths[disease.id]) {
      return program.govMonths[disease.id];
    }

    var months = [];
    if (disease.intervalMonths === 6) {
      months = [3, 9];
    } else if (disease.intervalMonths !== 12 && disease.intervalMonths) {
      if (disease.intervalMonths === 3) months = [1, 4, 7, 10];
      else if (disease.intervalMonths === 36) months = [4];
    } else {
      months = [4];
      if (disease.id === 'anthrax' || disease.id === 'blackquarter') months = [3];
      if (disease.id === 'brucellosis') months = [3];
    }

    if (disease.id === 'gumboro') months = [1, 7];
    if (disease.id === 'marek') months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    if (disease.id === 'fowl_pox') months = [5];
    return months;
  }

  function hasGovernmentCampaign(diseaseId, program) {
    if (!program || !program.govCampaigns) return false;
    var campaigns = program.govCampaigns.map(function lowerCaseCampaign(campaign) {
      return campaign.toLowerCase();
    });
    var terms = (CAMPAIGN_TERMS[diseaseId] || diseaseId).split(' ');
    return campaigns.some(function campaignMatches(campaign) {
      return terms.some(function termMatches(term) {
        return campaign.indexOf(term) > -1;
      });
    });
  }

  function animalPricePrefix(animalType) {
    if (animalType === 'poultry') return 'poultry';
    if (animalType === 'goats_sheep') return 'gs';
    return 'cattle';
  }

  function priceFor(diseaseId, animalType, program, regionDefaults) {
    var key = animalPricePrefix(animalType) + '_' + (PRICE_SUFFIXES[diseaseId] || diseaseId);
    if (program && program.prices && program.prices[key] != null) {
      return {
        amount: program.prices[key],
        currency: program.currency,
        symbol: program.symbol,
        isLocal: true
      };
    }
    if (regionDefaults && regionDefaults.usdPrices && regionDefaults.usdPrices[key] != null) {
      return {
        amount: regionDefaults.usdPrices[key],
        currency: 'USD',
        symbol: '$',
        isLocal: false
      };
    }
    return {
      amount: FALLBACK_USD_PRICES[key] != null ? FALLBACK_USD_PRICES[key] : 0.1,
      currency: 'USD',
      symbol: '$',
      isLocal: false
    };
  }

  function normalizeInput(input, fallbackMonth) {
    var parsedHerdSize = parseInt(input.herdSize, 10);
    var parsedMonth = parseInt(input.currentMonth, 10);
    return {
      countryCode: String(input.countryCode || ''),
      animalType: ANIMAL_TYPES.indexOf(input.animalType) > -1 ? input.animalType : input.animalType,
      herdSize: Math.max(1, parsedHerdSize || 10),
      currentMonth: Math.min(12, Math.max(1, parsedMonth || fallbackMonth)),
      ageGroup: input.ageGroup,
      purpose: input.purpose
    };
  }

  function validateInput(input) {
    var errors = [];
    if (!input || typeof input !== 'object') {
      return { valid: false, errors: ['input_required'] };
    }
    if (!String(input.countryCode || '').trim()) errors.push('country_required');
    if (ANIMAL_TYPES.indexOf(input.animalType) === -1) errors.push('animal_type_invalid');
    if (!Number.isFinite(Number(input.herdSize)) || Number(input.herdSize) < 1) errors.push('herd_size_invalid');
    if (!Number.isFinite(Number(input.currentMonth))
      || Number(input.currentMonth) < 1
      || Number(input.currentMonth) > 12) {
      errors.push('current_month_invalid');
    }
    return { valid: errors.length === 0, errors: errors };
  }

  function createEngine(dependencies) {
    var vaccinationData = dependencies && dependencies.vaccinationData;
    var countryIndex = dependencies && dependencies.countryIndex || [];
    var now = dependencies && dependencies.now || function currentDate() { return new Date(); };

    if (!vaccinationData || !vaccinationData.programs || !vaccinationData.diseases) {
      throw new Error('vaccinationData with programs and diseases is required');
    }

    function calculate(countryCode, animalType, herdSize, currentMonth, ageGroup, purpose) {
      var input = normalizeInput({
        countryCode: countryCode,
        animalType: animalType,
        herdSize: herdSize,
        currentMonth: currentMonth,
        ageGroup: ageGroup,
        purpose: purpose
      }, now().getMonth() + 1);
      var program = vaccinationData.programs[input.countryCode] || null;
      var region = findRegion(input.countryCode, program, countryIndex);
      var regionDefaults = vaccinationData.regionDefaults[region]
        || vaccinationData.regionDefaults.west_africa;
      var country = findCountry(countryIndex, input.countryCode);
      var diseaseRows = [];
      var selectedAnimals = input.animalType === 'all'
        ? ['cattle', 'goats_sheep', 'poultry']
        : [input.animalType];

      selectedAnimals.forEach(function collectAnimalDiseases(selectedAnimal) {
        (vaccinationData.diseases[selectedAnimal] || []).forEach(function collectDisease(disease) {
          if (!diseaseIsEndemic(disease, input.countryCode)) return;
          if (input.ageGroup === 'young' && disease.id === 'brucellosis') return;
          diseaseRows.push({ disease: disease, animalType: selectedAnimal });
        });
      });

      var schedule = [];
      var byAnimalType = {};
      var governmentSavings = 0;

      diseaseRows.forEach(function buildScheduleRow(row) {
        var disease = row.disease;
        var rowAnimalType = row.animalType;
        var months = vaccinationMonths(disease, program);
        var governmentCampaign = hasGovernmentCampaign(disease.id, program);
        var price = priceFor(disease.id, rowAnimalType, program, regionDefaults);
        var annualDoses = disease.dosesPerYear
          || (disease.intervalMonths ? Math.round((12 / disease.intervalMonths) * 10) / 10 : 1);

        if (disease.id === 'brucellosis') annualDoses = 0.2;
        if (disease.id === 'marek') annualDoses = 0;

        var costPerAnimalPerYear = price.amount * annualDoses;
        var effectiveCostPerAnimal = governmentCampaign
          ? 0.3 * costPerAnimalPerYear
          : costPerAnimalPerYear;
        var totalAnnualCost = effectiveCostPerAnimal * input.herdSize;
        var nextDueMonth = null;

        for (var monthOffset = 0; monthOffset < 12; monthOffset += 1) {
          var candidateMonth = (input.currentMonth - 1 + monthOffset) % 12 + 1;
          if (months.indexOf(candidateMonth) > -1) {
            nextDueMonth = candidateMonth;
            break;
          }
        }
        if (!nextDueMonth) nextDueMonth = months[0] || input.currentMonth;

        var daysUntilNext = ((nextDueMonth - input.currentMonth + 12) % 12) * 30;
        if (!byAnimalType[rowAnimalType]) byAnimalType[rowAnimalType] = 0;
        byAnimalType[rowAnimalType] += totalAnnualCost;
        if (governmentCampaign) {
          governmentSavings += (costPerAnimalPerYear - effectiveCostPerAnimal) * input.herdSize;
        }

        schedule.push({
          id: disease.id,
          name: disease.name,
          short: disease.short,
          animalType: rowAnimalType,
          animalLabel: rowAnimalType === 'goats_sheep'
            ? 'Goats / Sheep'
            : rowAnimalType === 'poultry' ? 'Poultry' : 'Cattle',
          severity: disease.severity,
          severityLabel: disease.severityLabel,
          core: disease.core !== false,
          desc: disease.desc || '',
          notes: disease.notes || '',
          vaccineType: disease.vaccineType || '',
          route: disease.route || 'SC',
          vaccinationMonths: months,
          nextDueMonth: nextDueMonth,
          nextDueLabel: vaccinationData.monthsFull[nextDueMonth - 1],
          daysUntilNext: daysUntilNext,
          urgency: daysUntilNext <= 30 ? 'urgent' : daysUntilNext <= 60 ? 'soon' : 'planned',
          govCampaign: governmentCampaign,
          pricePerAnimal: price.amount,
          currency: price.currency,
          currencySymbol: price.symbol,
          isLocalPrice: price.isLocal,
          annualDoses: annualDoses,
          costPerAnimalPerYear: roundCurrency(costPerAnimalPerYear),
          effectiveCostPerAnimal: roundCurrency(effectiveCostPerAnimal),
          totalAnnualCost: roundCurrency(totalAnnualCost)
        });
      });

      var severityOrder = { critical: 0, high: 1, medium: 2 };
      schedule.sort(function compareSchedule(left, right) {
        if (left.animalType !== right.animalType) {
          var animalOrder = ['cattle', 'goats_sheep', 'poultry'];
          return animalOrder.indexOf(left.animalType) - animalOrder.indexOf(right.animalType);
        }
        // Keep the legacy ordering exactly, including its fallback behavior for rank zero.
        var severityDifference = (severityOrder[left.severity] || 2) - (severityOrder[right.severity] || 2);
        return severityDifference !== 0
          ? severityDifference
          : left.daysUntilNext - right.daysUntilNext;
      });

      var calendar = {};
      for (var calendarMonth = 1; calendarMonth <= 12; calendarMonth += 1) {
        calendar[calendarMonth] = [];
      }
      schedule.forEach(function addToCalendar(row) {
        row.vaccinationMonths.forEach(function addMonth(month) {
          if (month < 1 || month > 12) return;
          calendar[month].push({
            id: row.id,
            short: row.short,
            severity: row.severity,
            animalType: row.animalType
          });
        });
      });

      var totalAnnual = Object.keys(byAnimalType).reduce(function addAnimalCost(total, key) {
        return total + byAnimalType[key];
      }, 0);
      var currency = program && program.currency ? program.currency : 'USD';
      var symbol = program && program.currency ? program.symbol : '$';
      var upcoming = [];
      for (var upcomingOffset = 0; upcomingOffset < 3; upcomingOffset += 1) {
        var upcomingMonth = (input.currentMonth - 1 + upcomingOffset) % 12 + 1;
        if (calendar[upcomingMonth].length) {
          upcoming.push({
            month: vaccinationData.monthsFull[upcomingMonth - 1],
            vaccines: calendar[upcomingMonth]
          });
        }
      }

      return {
        country: { code: input.countryCode, name: country.name, flag: country.flag },
        animalType: input.animalType,
        herdSize: input.herdSize,
        currentMonth: input.currentMonth,
        currentMonthLabel: vaccinationData.monthsFull[input.currentMonth - 1],
        ageGroup: input.ageGroup,
        purpose: input.purpose,
        schedule: schedule,
        calendar: calendar,
        upcoming: upcoming,
        costs: {
          totalAnnual: roundCurrency(totalAnnual),
          perAnimal: roundCurrency(totalAnnual / input.herdSize),
          govSavings: roundCurrency(governmentSavings),
          byAnimalType: byAnimalType,
          currency: currency,
          symbol: symbol
        },
        govInfo: {
          service: program
            ? program.govService
            : 'Contact your national Ministry of Agriculture — Veterinary Department',
          campaigns: program ? program.govCampaigns : regionDefaults.govCampaigns || [],
          note: program && program.note || ''
        },
        vaccineCount: schedule.filter(function countCore(row) { return row.core; }).length,
        criticalCount: schedule.filter(function countCritical(row) {
          return row.severity === 'critical';
        }).length
      };
    }

    return {
      calculate: calculate,
      validateInput: validateInput,
      normalizeInput: function normalizeForEngine(input) {
        return normalizeInput(input, now().getMonth() + 1);
      }
    };
  }

  function createBrowserAdapter(browserRoot) {
    function engine() {
      return createEngine({
        vaccinationData: browserRoot.AfroTools.vaccinationData,
        countryIndex: browserRoot.AfroTools.countryIndex || []
      });
    }
    return {
      calculate: function browserCalculate(countryCode, animalType, herdSize, currentMonth, ageGroup, purpose) {
        return engine().calculate(countryCode, animalType, herdSize, currentMonth, ageGroup, purpose);
      },
      validateInput: validateInput,
      normalizeInput: function browserNormalize(input) {
        return engine().normalizeInput(input);
      },
      createEngine: createEngine
    };
  }

  return {
    ANIMAL_TYPES: ANIMAL_TYPES,
    createEngine: createEngine,
    createBrowserAdapter: createBrowserAdapter,
    validateInput: validateInput
  };
}));
