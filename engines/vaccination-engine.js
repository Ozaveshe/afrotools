!function(){"use strict";window.AfroTools=window.AfroTools||{};

/* ─────────────────────────────────────────────────────────────────
   AfroTools Vaccination Engine v1.0
   Computes annual vaccination schedule + costs per country/animal
   ───────────────────────────────────────────────────────────────── */

window.AfroTools.VaccinationEngine = (function(){

  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  /* ── HELPERS ── */
  function getProgram(cc){
    var VD = window.AfroTools.vaccinationData;
    return VD.programs[cc] || null;
  }

  function getRegion(cc){
    var VD = window.AfroTools.vaccinationData;
    var prog = VD.programs[cc];
    if(prog && prog.govService){
      /* infer region from country-index if loaded */
      var ci = window.AfroTools.countryIndex;
      if(ci){
        for(var i=0;i<ci.length;i++){
          if(ci[i].code===cc) return ci[i].region;
        }
      }
    }
    /* hard-coded fallback */
    var WA=["NG","GH","CI","SN","ML","BF","NE","GN","BJ","TG","SL","LR","MR","GM","GW","CV"];
    var EA=["KE","ET","TZ","UG","RW","BI","SO","DJ","ER","SS"];
    var CA=["CD","CM","CG","GA","GQ","CF","TD","ST"];
    var SA=["ZA","MZ","ZM","ZW","MW","AO","NA","BW","LS","SZ"];
    var NA=["EG","MA","DZ","TN","LY","SD"];
    if(WA.indexOf(cc)>-1) return "west_africa";
    if(EA.indexOf(cc)>-1) return "east_africa";
    if(CA.indexOf(cc)>-1) return "central_africa";
    if(SA.indexOf(cc)>-1) return "southern_africa";
    if(NA.indexOf(cc)>-1) return "north_africa";
    return "island_nations";
  }

  function getCountryInfo(cc){
    var ci = window.AfroTools.countryIndex;
    if(ci){
      for(var i=0;i<ci.length;i++){
        if(ci[i].code===cc) return ci[i];
      }
    }
    return { code:cc, name:cc, flag:"🌍", slug:cc.toLowerCase() };
  }

  /* Is this disease relevant for this country? */
  function isEndemic(disease, cc){
    if(disease.notEndemic && disease.notEndemic.indexOf(cc)>-1) return false;
    if(disease.endemicIn === "ALL") return true;
    if(Array.isArray(disease.endemicIn)){
      return disease.endemicIn.indexOf(cc)>-1;
    }
    /* no endemic list = relevant everywhere */
    return true;
  }

  /* Is disease in government campaign for this country? */
  function isGovCampaign(diseaseId, prog){
    if(!prog || !prog.govCampaigns) return false;
    var campaigns = prog.govCampaigns.map(function(c){ return c.toLowerCase(); });
    var nameMap = {
      fmd:"foot-and-mouth", cbpp:"contagious bovine", blackquarter:"blackleg",
      anthrax:"anthrax", lsd:"lumpy skin", brucellosis:"brucellosis",
      ecf:"east coast fever", rvf:"rift valley", ppr:"peste des", goat_pox:"pox",
      clostridial_sr:"clostridial", ccpp:"contagious caprine", bluetongue:"bluetongue",
      ndv:"newcastle", gumboro:"gumboro", fowl_pox:"fowl pox", marek:"marek",
      fowl_typhoid:"typhoid", avian_flu:"avian influenza"
    };
    var keywords = (nameMap[diseaseId]||diseaseId).split(" ");
    return campaigns.some(function(c){
      return keywords.some(function(k){ return c.indexOf(k)>-1; });
    });
  }

  /* Get months when a disease is typically due in this country */
  function getVaccinationMonths(disease, prog, currentMonth){
    /* Use govMonths if available */
    if(prog && prog.govMonths && prog.govMonths[disease.id]){
      return prog.govMonths[disease.id];
    }
    /* Default schedule based on repeat interval */
    var months = [];
    if(disease.intervalMonths === 6){
      /* Bi-annual: March and September are standard Africa defaults */
      months = [3, 9];
    } else if(disease.intervalMonths === 12 || !disease.intervalMonths){
      /* Annual: April (before rainy season in most of SSA) */
      months = [4];
      /* Anthrax: March */
      if(disease.id === "anthrax" || disease.id === "blackquarter") months = [3];
      /* Brucellosis: once-off */
      if(disease.id === "brucellosis") months = [3];
    } else if(disease.intervalMonths === 3){
      /* Quarterly (Newcastle village) */
      months = [1, 4, 7, 10];
    } else if(disease.intervalMonths === 36){
      /* Every 3 years — show next upcoming */
      months = [4];
    }
    /* Poultry first doses */
    if(disease.id === "gumboro") months = [1, 7]; /* rough bi-annual */
    if(disease.id === "marek") months = [1,2,3,4,5,6,7,8,9,10,11,12]; /* hatchery = ongoing */
    if(disease.id === "fowl_pox") months = [5]; /* once */
    return months;
  }

  /* Get price per animal for a disease */
  function getPrice(diseaseId, animalType, prog, regionDefault){
    /* Build key */
    var prefix = animalType === "poultry" ? "poultry" :
                 (animalType === "goats_sheep" ? "gs" : "cattle");
    /* Map disease IDs to price keys */
    var keyMap = {
      fmd:"fmd", cbpp:"cbpp", blackquarter:"bq", anthrax:"anthrax", lsd:"lsd",
      brucellosis:"bruc", ecf:"ecf", rvf:"rvf", rabies_cattle:"rabies", botulism:"botulism",
      ppr:"ppr", goat_pox:"pox", clostridial_sr:"cdt", ccpp:"ccpp", bluetongue:"bt",
      ndv:"nd", gumboro:"ibd", fowl_pox:"pox", marek:"marek", fowl_typhoid:"ft", avian_flu:"ai"
    };
    var key = prefix + "_" + (keyMap[diseaseId] || diseaseId);

    /* Try country-specific prices */
    if(prog && prog.prices && prog.prices[key] != null){
      return { amount: prog.prices[key], currency: prog.currency, symbol: prog.symbol, isLocal: true };
    }
    /* Fall back to USD regional estimate */
    if(regionDefault && regionDefault.usdPrices && regionDefault.usdPrices[key] != null){
      return { amount: regionDefault.usdPrices[key], currency: "USD", symbol: "$", isLocal: false };
    }
    /* Generic USD estimates */
    var usdFallback = {
      cattle_fmd:0.30, cattle_cbpp:0.25, cattle_bq:0.15, cattle_anthrax:0.15, cattle_lsd:0.20,
      cattle_bruc:0.18, cattle_ecf:0.50, cattle_rvf:0.18, cattle_rabies:0.15, cattle_botulism:0.20,
      gs_ppr:0.20, gs_pox:0.15, gs_cdt:0.10, gs_ccpp:0.15, gs_bt:0.18,
      poultry_nd:0.05, poultry_ibd:0.05, poultry_pox:0.04, poultry_marek:0.05, poultry_ft:0.04, poultry_ai:0.06
    };
    if(usdFallback[key] != null){
      return { amount: usdFallback[key], currency: "USD", symbol: "$", isLocal: false };
    }
    return { amount: 0.10, currency: "USD", symbol: "$", isLocal: false };
  }

  /* Format number with commas */
  function fmtNum(n){
    if(n >= 1000000) return (n/1000000).toFixed(1) + "M";
    if(n >= 10000) return Math.round(n).toLocaleString();
    return Math.round(n * 10) / 10 + (n < 10 ? "" : "");
  }

  /* ── MAIN CALCULATE FUNCTION ── */
  function calculate(cc, animalType, herdSize, currentMonth, ageGroup, purpose){
    var VD = window.AfroTools.vaccinationData;
    var prog = getProgram(cc);
    var region = getRegion(cc);
    var regionDef = VD.regionDefaults[region] || VD.regionDefaults.west_africa;
    var countryInfo = getCountryInfo(cc);

    herdSize = Math.max(1, parseInt(herdSize) || 10);
    currentMonth = Math.min(12, Math.max(1, parseInt(currentMonth) || new Date().getMonth()+1));

    /* Determine which disease lists to use */
    var diseases = [];
    var animalTypes = [];
    if(animalType === "all"){
      animalTypes = ["cattle","goats_sheep","poultry"];
    } else {
      animalTypes = [animalType];
    }

    animalTypes.forEach(function(atype){
      var list = VD.diseases[atype] || [];
      list.forEach(function(d){
        if(isEndemic(d, cc)){
          /* Filter by age group */
          if(ageGroup === "young"){
            /* Young: skip adult-only vaccines */
            if(d.id === "brucellosis") return; /* skip — heifer-only at specific age */
          }
          /* Filter by purpose */
          if(purpose === "dairy" && atype === "cattle"){
            /* Dairy: add brucellosis prominently */
          }
          diseases.push({ disease: d, animalType: atype });
        }
      });
    });

    /* Build schedule entries */
    var schedule = [];
    var totalCostByType = {};
    var govSavings = 0;

    diseases.forEach(function(item){
      var d = item.disease;
      var atype = item.animalType;

      var vacMonths = getVaccinationMonths(d, prog, currentMonth);
      var govCampaign = isGovCampaign(d.id, prog);
      var priceInfo = getPrice(d.id, atype, prog, regionDef);

      /* Calculate annual doses */
      var annualDoses = d.dosesPerYear || (d.intervalMonths ? Math.round(12/d.intervalMonths*10)/10 : 1);
      if(d.id === "brucellosis") annualDoses = 0.2; /* once-off — amortised */
      if(d.id === "marek") annualDoses = 0; /* hatchery — not farmer cost */

      /* Annual cost per animal */
      var costPerAnimal = priceInfo.amount * annualDoses;
      /* Gov campaigns often free/subsidised — show 50% discount */
      var effectiveCost = govCampaign ? costPerAnimal * 0.3 : costPerAnimal;
      var totalCost = effectiveCost * herdSize;

      /* Next due month */
      var nextDue = null;
      for(var i=0; i<12; i++){
        var checkMonth = ((currentMonth - 1 + i) % 12) + 1;
        if(vacMonths.indexOf(checkMonth) > -1){
          nextDue = checkMonth;
          break;
        }
      }
      if(!nextDue) nextDue = vacMonths[0] || currentMonth;

      var daysUntilNext = ((nextDue - currentMonth + 12) % 12) * 30;

      if(!totalCostByType[atype]) totalCostByType[atype] = 0;
      totalCostByType[atype] += totalCost;
      if(govCampaign) govSavings += (costPerAnimal - effectiveCost) * herdSize;

      schedule.push({
        id: d.id,
        name: d.name,
        short: d.short,
        animalType: atype,
        animalLabel: atype === "goats_sheep" ? "Goats / Sheep" :
                     atype === "poultry" ? "Poultry" : "Cattle",
        severity: d.severity,
        severityLabel: d.severityLabel,
        core: d.core !== false,
        desc: d.desc || "",
        notes: d.notes || "",
        vaccineType: d.vaccineType || "",
        route: d.route || "SC",
        vaccinationMonths: vacMonths,
        nextDueMonth: nextDue,
        nextDueLabel: VD.monthsFull[nextDue-1],
        daysUntilNext: daysUntilNext,
        urgency: daysUntilNext <= 30 ? "urgent" : (daysUntilNext <= 60 ? "soon" : "planned"),
        govCampaign: govCampaign,
        pricePerAnimal: priceInfo.amount,
        currency: priceInfo.currency,
        currencySymbol: priceInfo.symbol,
        isLocalPrice: priceInfo.isLocal,
        annualDoses: annualDoses,
        costPerAnimalPerYear: Math.round(costPerAnimal * 100) / 100,
        effectiveCostPerAnimal: Math.round(effectiveCost * 100) / 100,
        totalAnnualCost: Math.round(totalCost * 100) / 100
      });
    });

    /* Sort: critical first, then by next due date */
    var sevOrder = { critical:0, high:1, medium:2 };
    schedule.sort(function(a,b){
      if(a.animalType !== b.animalType){
        var order = ["cattle","goats_sheep","poultry"];
        return order.indexOf(a.animalType) - order.indexOf(b.animalType);
      }
      var sd = (sevOrder[a.severity]||2) - (sevOrder[b.severity]||2);
      if(sd !== 0) return sd;
      return a.daysUntilNext - b.daysUntilNext;
    });

    /* Build 12-month calendar */
    var calendar = {};
    for(var m=1;m<=12;m++) calendar[m] = [];
    schedule.forEach(function(s){
      s.vaccinationMonths.forEach(function(mo){
        if(mo >= 1 && mo <= 12){
          calendar[mo].push({ id:s.id, short:s.short, severity:s.severity, animalType:s.animalType });
        }
      });
    });

    /* Compute totals */
    var totalAnnual = 0;
    Object.keys(totalCostByType).forEach(function(k){ totalAnnual += totalCostByType[k]; });

    /* Determine primary currency */
    var primaryCurrency = "USD";
    var primarySymbol = "$";
    if(prog && prog.currency){ primaryCurrency = prog.currency; primarySymbol = prog.symbol; }

    /* Upcoming in next 3 months */
    var upcoming = [];
    for(var i=0; i<3; i++){
      var m2 = ((currentMonth - 1 + i) % 12) + 1;
      if(calendar[m2].length > 0){
        upcoming.push({ month: VD.monthsFull[m2-1], vaccines: calendar[m2] });
      }
    }

    return {
      country: { code: cc, name: countryInfo.name, flag: countryInfo.flag },
      animalType: animalType,
      herdSize: herdSize,
      currentMonth: currentMonth,
      currentMonthLabel: VD.monthsFull[currentMonth-1],
      ageGroup: ageGroup,
      purpose: purpose,
      schedule: schedule,
      calendar: calendar,
      upcoming: upcoming,
      costs: {
        totalAnnual: Math.round(totalAnnual * 100) / 100,
        perAnimal: Math.round(totalAnnual / herdSize * 100) / 100,
        govSavings: Math.round(govSavings * 100) / 100,
        byAnimalType: totalCostByType,
        currency: primaryCurrency,
        symbol: primarySymbol
      },
      govInfo: {
        service: prog ? prog.govService : "Contact your national Ministry of Agriculture — Veterinary Department",
        campaigns: prog ? prog.govCampaigns : (regionDef.govCampaigns || []),
        note: prog ? (prog.note || "") : ""
      },
      vaccineCount: schedule.filter(function(s){ return s.core; }).length,
      criticalCount: schedule.filter(function(s){ return s.severity === "critical"; }).length
    };
  }

  /* ── RENDER HELPERS ── */

  function renderCalendarGrid(result, containerId){
    var VD = window.AfroTools.vaccinationData;
    var el = document.getElementById(containerId);
    if(!el) return;

    var html = '<div class="cal-wrap">';
    html += '<div class="cal-header">';
    html += '<div class="cal-label-col">Vaccine</div>';
    VD.months.forEach(function(m, i){
      var isNow = (i+1) === result.currentMonth;
      html += '<div class="cal-month' + (isNow ? " cal-now" : "") + '">' + m + '</div>';
    });
    html += '</div>';

    var lastType = "";
    result.schedule.forEach(function(s){
      if(s.animalType !== lastType){
        var label = s.animalType === "goats_sheep" ? "GOATS / SHEEP" :
                    s.animalType === "poultry" ? "POULTRY" : "CATTLE";
        html += '<div class="cal-animal-header">' + label + '</div>';
        lastType = s.animalType;
      }
      html += '<div class="cal-row cal-sev-' + s.severity + (s.core ? "" : " cal-optional") + '">';
      html += '<div class="cal-label-col"><span class="cal-name">' + s.short + '</span>' +
              '<span class="cal-sev-dot"></span></div>';
      for(var m=1;m<=12;m++){
        var active = s.vaccinationMonths.indexOf(m) > -1;
        var isNow = m === result.currentMonth;
        html += '<div class="cal-cell' + (isNow ? " cal-now-col" : "") + '">' +
                (active ? '<span class="cal-dot"></span>' : '') + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

  function renderScheduleTable(result, containerId){
    var el = document.getElementById(containerId);
    if(!el) return;

    var html = '<table class="vax-table">';
    html += '<thead><tr><th>Vaccine</th><th>For</th><th>Priority</th><th>Schedule</th>' +
            '<th>Next Due</th><th>Gov Program</th></tr></thead><tbody>';

    result.schedule.forEach(function(s){
      var urgClass = s.urgency === "urgent" ? " vax-urgent" : (s.urgency === "soon" ? " vax-soon" : "");
      html += '<tr class="vax-row-' + s.severity + '">';
      html += '<td><strong>' + s.name + '</strong>' +
              '<br><span class="vax-route">' + s.route + '</span></td>';
      html += '<td>' + s.animalLabel + '</td>';
      html += '<td><span class="sev-badge sev-' + s.severity + '">' + s.severity.toUpperCase() + '</span></td>';
      var schedText = s.annualDoses >= 2 ? 'Every ' + Math.round(12/s.annualDoses) + ' months' :
                      s.id === 'brucellosis' ? 'Once (heifers)' :
                      s.annualDoses < 1 ? 'Every ' + Math.round(1/s.annualDoses) + ' yrs' : 'Annual';
      html += '<td>' + schedText + '</td>';
      html += '<td class="' + urgClass + '">' + s.nextDueLabel +
              (s.urgency === "urgent" ? ' <span class="due-badge">DUE</span>' :
               s.urgency === "soon" ? ' <span class="due-badge due-soon">SOON</span>' : '') + '</td>';
      html += '<td>' + (s.govCampaign ?
              '<span class="gov-badge">✓ Gov</span>' :
              '<span class="priv-badge">Private vet</span>') + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    el.innerHTML = html;
  }

  function renderCostTable(result, containerId){
    var el = document.getElementById(containerId);
    if(!el) return;

    var isUSD = result.costs.currency === "USD";
    var sym = result.costs.symbol;
    var html = '<div class="cost-summary">';
    html += '<div class="cost-hero"><div class="cost-total">' + sym +
            ' ' + fmtNum(result.costs.totalAnnual) + '</div>' +
            '<div class="cost-sub">Estimated annual vaccination cost — ' +
            result.herdSize.toLocaleString() + ' animals</div></div>';

    if(!isUSD){
      html += '<div class="cost-note">Local prices from government/private vet services</div>';
    } else {
      html += '<div class="cost-note">⚠ Approximate USD estimates — contact your local vet for exact prices</div>';
    }

    html += '<div class="cost-cards">';
    html += '<div class="cost-card"><div class="cost-val">' + sym + ' ' +
            fmtNum(result.costs.perAnimal) + '</div><div class="cost-lbl">Per Animal/Year</div></div>';
    if(result.costs.govSavings > 0){
      html += '<div class="cost-card cost-card-green"><div class="cost-val">' + sym + ' ' +
              fmtNum(result.costs.govSavings) + '</div><div class="cost-lbl">Gov. Savings</div></div>';
    }
    html += '<div class="cost-card"><div class="cost-val">' +
            result.schedule.filter(function(s){ return s.core; }).length +
            '</div><div class="cost-lbl">Core Vaccines</div></div>';
    html += '</div>';

    /* Breakdown table */
    html += '<table class="cost-breakdown"><thead><tr>' +
            '<th>Vaccine</th><th>For</th><th>Per Animal</th><th>Annual Doses</th>' +
            '<th>Total</th><th>Gov?</th></tr></thead><tbody>';
    result.schedule.forEach(function(s){
      if(s.id === 'marek') return; /* hatchery cost — skip */
      html += '<tr>';
      html += '<td>' + s.short + '</td>';
      html += '<td>' + s.animalLabel + '</td>';
      html += '<td>' + s.currencySymbol + s.pricePerAnimal.toFixed(2) + '/dose</td>';
      var doseTxt = s.annualDoses >= 1 ? s.annualDoses.toFixed(0) + 'x/yr' :
                    s.id === 'brucellosis' ? 'Once' : '1x/3yr';
      html += '<td>' + doseTxt + '</td>';
      html += '<td><strong>' + sym + ' ' + fmtNum(s.totalAnnualCost) + '</strong></td>';
      html += '<td>' + (s.govCampaign ? '<span class="gov-badge">Free/Subsidised</span>' : '-') + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
  }

  function renderGovInfo(result, containerId){
    var el = document.getElementById(containerId);
    if(!el) return;

    var html = '<div class="gov-info-box">';
    html += '<h3 class="gov-info-title">&#127963; Government Veterinary Service</h3>';
    html += '<p class="gov-service-name">' + result.govInfo.service + '</p>';

    if(result.govInfo.campaigns && result.govInfo.campaigns.length){
      html += '<h4>Annual Government Vaccination Campaigns</h4>';
      html += '<ul class="gov-campaign-list">';
      result.govInfo.campaigns.forEach(function(c){
        html += '<li>&#9989; ' + c + '</li>';
      });
      html += '</ul>';
      html += '<p class="gov-tip">&#128161; Contact your local veterinary office to register your herd for these free or subsidised campaigns.</p>';
    }

    if(result.govInfo.note){
      html += '<div class="gov-note">ℹ ' + result.govInfo.note + '</div>';
    }
    html += '</div>';
    el.innerHTML = html;
  }

  /* ── PUBLIC API ── */
  return {
    calculate: calculate,
    renderCalendarGrid: renderCalendarGrid,
    renderScheduleTable: renderScheduleTable,
    renderCostTable: renderCostTable,
    renderGovInfo: renderGovInfo
  };

})();

}();
