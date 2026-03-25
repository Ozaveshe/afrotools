!function(){"use strict";
window.AfroTools = window.AfroTools || {};

// ═══════════════════════════════════════════════════════════
// HARVEST DATE ENGINE
// Calculates estimated harvest date and growth stage timeline
// based on crop, variety, planting date, region climate, altitude
// ═══════════════════════════════════════════════════════════
window.AfroTools.HarvestDateEngine = (function () {

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  var MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];

  // ── Temperature adjustment (% change to growing period) ──
  function getTempAdj(tempC, cropData) {
    var adj = cropData.tempAdjustment;
    if (!adj) {
      // Default adjustment table
      if (tempC > 32) return -0.08;
      if (tempC > 28) return 0;
      if (tempC > 22) return 0.08;
      if (tempC > 18) return 0.15;
      return 0.22;
    }
    // Map dynamic keys (e.g. above32, t28_32, below18)
    var keys = Object.keys(adj);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k.indexOf('above') === 0) {
        var thresh = parseInt(k.replace('above',''), 10);
        if (tempC > thresh) return adj[k];
      } else if (k.indexOf('below') === 0) {
        var thresh2 = parseInt(k.replace('below',''), 10);
        if (tempC < thresh2) return adj[k];
      } else if (k.charAt(0) === 't') {
        // e.g. t28_32 or t22_28
        var parts = k.slice(1).split('_');
        var lo = parseInt(parts[0], 10), hi = parseInt(parts[1], 10);
        if (tempC >= lo && tempC <= hi) return adj[k];
      }
    }
    return 0;
  }

  // ── Altitude adjustment ──
  function getAltAdj(climateZone) {
    var czAlt = window.AfroTools.climateZoneAltitude || {};
    var altMap = window.AfroTools.altitudeAdjustment || {};
    var altKey = czAlt[climateZone] || 'lowland';
    return altMap[altKey] || 0;
  }

  // ── Date helpers ──
  function addDays(date, days) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + Math.round(days));
    return d;
  }

  function formatDate(d) {
    var day = d.getDate();
    var mon = MONTHS[d.getMonth()];
    var yr = d.getFullYear();
    return day + ' ' + mon + ' ' + yr;
  }

  function formatDateShort(d) {
    return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()];
  }

  // ── Main calculate function ──
  function calculate(inputs, countryData, cropGrowthData) {
    if (!inputs || !countryData || !cropGrowthData) {
      return { error: true, message: 'Missing required data.' };
    }

    var cropId    = inputs.cropId;
    var regionId  = inputs.regionId;
    var variety   = inputs.variety || 'medium';   // early | medium | late
    var plantDate = inputs.plantingDate;           // JS Date object
    var irrigation = inputs.irrigation || 'rainfed'; // rainfed | irrigated

    if (!plantDate || isNaN(plantDate.getTime())) {
      return { error: true, message: 'Please enter a valid planting date.' };
    }

    var cropDef = cropGrowthData[cropId];
    if (!cropDef) {
      return { error: true, message: 'Crop data not found for: ' + cropId };
    }

    // ── Get region climate ──
    var region = null;
    if (countryData.regions) {
      for (var i = 0; i < countryData.regions.length; i++) {
        if (countryData.regions[i].id === regionId) { region = countryData.regions[i]; break; }
      }
    }
    if (!region && countryData.regions && countryData.regions.length > 0) {
      region = countryData.regions[0]; // fallback to first region
    }

    var avgTempC    = (region && region.avgTemp_C   != null) ? region.avgTemp_C   : 26;
    var climateZone = (region && region.climateZone)          ? region.climateZone  : 'tropical';

    // ── Base growing days ──
    var baseDays = cropDef.totalDays[variety] || cropDef.totalDays.medium || 120;

    // ── Apply adjustments ──
    var tempAdj  = getTempAdj(avgTempC, cropDef);
    var altAdj   = getAltAdj(climateZone);
    var irrAdj   = irrigation === 'irrigated' ? -0.05 : 0; // irrigated = 5% faster

    var totalAdj = tempAdj + altAdj + irrAdj;
    var adjustedDays = Math.round(baseDays * (1 + totalAdj));

    // Clamp to reasonable bounds
    adjustedDays = Math.max(Math.round(baseDays * 0.75), Math.min(Math.round(baseDays * 1.35), adjustedDays));

    // ── Harvest date ──
    var harvestDate = addDays(plantDate, adjustedDays);
    var harvestWindowStart = addDays(harvestDate, -7);
    var harvestWindowEnd   = addDays(harvestDate, 7);

    // ── Growth stage timeline ──
    var stages = [];
    if (cropDef.stages) {
      var stageKeys = Object.keys(cropDef.stages);
      var labels = cropDef.stageLabels || stageKeys;
      var colors = cropDef.stageColors || [];
      stageKeys.forEach(function (sk, idx) {
        var rangePct = cropDef.stages[sk][variety] || cropDef.stages[sk].medium || [0, baseDays];
        // Scale stage days proportionally to adjusted total
        var scale = adjustedDays / baseDays;
        var startDay = Math.round(rangePct[0] * scale);
        var endDay   = Math.round(rangePct[1] * scale);
        var startDate = addDays(plantDate, startDay);
        var endDate   = addDays(plantDate, endDay);
        var widthPct  = ((endDay - startDay) / adjustedDays * 100).toFixed(1);

        stages.push({
          key:        sk,
          label:      labels[idx] || sk,
          color:      colors[idx] || '#007AFF',
          startDay:   startDay,
          endDay:     endDay,
          startDate:  startDate,
          endDate:    endDate,
          widthPct:   parseFloat(widthPct)
        });
      });
    }

    // ── Today's stage (if planting is in the past) ──
    var today = new Date();
    var daysSincePlanting = Math.floor((today.getTime() - plantDate.getTime()) / 86400000);
    var currentStageIdx = -1;
    if (daysSincePlanting >= 0 && daysSincePlanting <= adjustedDays) {
      for (var s = stages.length - 1; s >= 0; s--) {
        if (daysSincePlanting >= stages[s].startDay) {
          currentStageIdx = s;
          break;
        }
      }
    }

    // ── Key activity dates ──
    var keyDates = [];
    if (cropDef.keyActivities) {
      cropDef.keyActivities.forEach(function (act) {
        var dayNum;
        if (act.dayOffset != null) {
          dayNum = Math.round(act.dayOffset * (adjustedDays / baseDays));
        } else if (act.fromHarvest != null) {
          dayNum = adjustedDays + act.fromHarvest;
        } else {
          return;
        }
        var actDate = addDays(plantDate, dayNum);
        var isPast  = actDate < today;
        var isDue   = Math.abs(daysSincePlanting - dayNum) <= 7 && daysSincePlanting >= 0;
        keyDates.push({
          day:    dayNum,
          label:  act.label,
          date:   actDate,
          isPast: isPast,
          isDue:  isDue
        });
      });
      // Sort by day
      keyDates.sort(function(a, b) { return a.day - b.day; });
    }

    // Harvest window entry
    keyDates.push({
      day:    adjustedDays,
      label:  'Harvest window: ' + formatDateShort(harvestWindowStart) + ' – ' + formatDateShort(harvestWindowEnd),
      date:   harvestDate,
      isHarvest: true,
      isPast: harvestDate < today
    });

    // ── Season context ──
    var seasonCtx = null;
    if (countryData.seasons && countryData.seasons.length > 0) {
      var plantMonth = plantDate.getMonth() + 1; // 1-indexed
      var harvestMonth = harvestDate.getMonth() + 1;

      // Find which season the planting date falls in
      var matchSeason = null;
      countryData.seasons.forEach(function (season) {
        if (!season.startMonth || !season.endMonth) return;
        var sm = season.startMonth, em = season.endMonth;
        if (sm <= em) {
          if (plantMonth >= sm && plantMonth <= em) matchSeason = season;
        } else {
          // Wraps year (e.g. Nov-Jan)
          if (plantMonth >= sm || plantMonth <= em) matchSeason = season;
        }
      });

      if (matchSeason) {
        seasonCtx = {
          name: matchSeason.name,
          endMonth: matchSeason.endMonth,
          endMonthName: MONTHS[matchSeason.endMonth - 1],
          yieldFactor: matchSeason.yieldFactor || 1
        };
      }
    }

    // ── Late planting warning ──
    var lateWarning = null;
    if (seasonCtx) {
      var sm = countryData.seasons.find(function(s) { return s.name === seasonCtx.name; });
      if (sm && sm.endMonth != null) {
        var plantMonth0 = plantDate.getMonth() + 1;
        var seasonEnd   = sm.endMonth;
        var plantWeeksIntoSeason = 0;
        if (sm.startMonth) {
          var diff = plantMonth0 - sm.startMonth;
          if (diff < 0) diff += 12;
          plantWeeksIntoSeason = diff * 4.3;
        }
        if (plantWeeksIntoSeason > 6) {
          var yieldPenalty = Math.round(plantWeeksIntoSeason * 1.5);
          yieldPenalty = Math.min(yieldPenalty, 40);
          lateWarning = 'Late planting may reduce yield by ' + yieldPenalty + '%. Plant at the start of the season for best results.';
        }
      }
    }

    // ── Summary of adjustments ──
    var adjustmentNote = null;
    var adjParts = [];
    if (tempAdj !== 0) adjParts.push((tempAdj > 0 ? '+' : '') + Math.round(tempAdj * 100) + '% (temperature)');
    if (altAdj !== 0)  adjParts.push('+' + Math.round(altAdj * 100) + '% (altitude)');
    if (irrAdj !== 0)  adjParts.push(Math.round(irrAdj * 100) + '% (irrigated)');
    if (adjParts.length > 0) {
      adjustmentNote = 'Base ' + baseDays + ' days adjusted to ' + adjustedDays + ' days: ' + adjParts.join(', ');
    }

    return {
      error:             false,
      cropName:          cropDef.name,
      variety:           variety,
      regionName:        region ? region.name : countryData.name,
      plantingDate:      plantDate,
      harvestDate:       harvestDate,
      harvestDateStr:    formatDate(harvestDate),
      harvestWindowStart: harvestWindowStart,
      harvestWindowEnd:  harvestWindowEnd,
      adjustedDays:      adjustedDays,
      baseDays:          baseDays,
      avgTempC:          avgTempC,
      climateZone:       climateZone,
      stages:            stages,
      currentStageIdx:   currentStageIdx,
      daysSincePlanting: daysSincePlanting,
      keyDates:          keyDates,
      seasonCtx:         seasonCtx,
      lateWarning:       lateWarning,
      adjustmentNote:    adjustmentNote,
      harvestSigns:      cropDef.harvestSigns || '',
      lateHarvestRisk:   cropDef.lateHarvestRisk || '',
      transplantNote:    cropDef.transplantNote || null
    };
  }

  return { calculate: calculate };

}());
}();
