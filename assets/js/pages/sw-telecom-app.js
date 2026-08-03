(function initSwahiliTelecomApp(root) {
  'use strict';

  var data = typeof TELECOM_DATA !== 'undefined' ? TELECOM_DATA : root.TELECOM_DATA;
  var engine = root.AfroTools && root.AfroTools.engines && root.AfroTools.engines.telecomPlanning;
  var locale = root.AfroTools && root.AfroTools.swTelecomLocalization;
  var configNode = document.getElementById('sw-telecom-config');
  var form = document.getElementById('telecom-form');
  var resultNode = document.getElementById('telecom-results');
  var errorNode = document.getElementById('telecom-errors');
  var exportStatus = document.getElementById('telecom-export-status');
  var copyButton = document.getElementById('telecom-copy');
  var txtButton = document.getElementById('telecom-download-txt');
  var jsonButton = document.getElementById('telecom-download-json');
  var importInput = document.getElementById('telecom-import');
  if (!data || !engine || !locale || !configNode || !form || !resultNode || !errorNode) return;

  var config;
  try {
    config = JSON.parse(configNode.textContent);
  } catch (error) {
    errorNode.textContent = "Mipangilio ya zana hii haipatikani.";
    return;
  }

  var latest = null;
  var errorMessages = {
    country_unavailable: "Chagua nchi inayotumika.",
    invalid_usage: "Weka muda na matumizi halali bila thamani hasi.",
    invalid_assumption: "Weka kiasi chanya na kiwango kati ya 0% na 100%.",
    operator_unavailable: "Chagua mtoa huduma anayepatikana kwa nchi hii.",
    roaming_data_unavailable: "Snapshot haina bei za roaming kwa nchi hii ya kuanzia.",
    portability_data_unavailable: "Snapshot haina rekodi ya kuhamisha namba kwa nchi hii.",
    sim_data_unavailable: "Snapshot haina rekodi ya usajili wa SIM kwa nchi hii.",
    invalid_business_usage: "Weka idadi ya watu na kasi ya chini iliyo zaidi ya sifuri.",
    invalid_volume: "Weka idadi ya ujumbe iliyo zaidi ya sifuri.",
    sms_pricing_unavailable: "Snapshot haina makisio ya bei ya SMS kwa nchi hii.",
    invalid_message_mix: "Weka idadi chanya na asilimia halali.",
    message_mix_not_100: "Jumla ya marketing, utility na service lazima iwe 100%.",
    comparison_data_unavailable: "Snapshot haina bei zote mbili zinazohitajika kwa ulinganisho huu."
  };
  var labels = {
    browsing: "Kuvinjari wavuti",
    social: "Mitandao ya kijamii",
    youtube: "Video / YouTube",
    music: "Muziki wa streaming",
    videocall: "Simu za video",
    email: "Barua pepe",
    downloads: "Upakuaji na masasisho",
    airtime: "Vocha ya simu",
    balance: "Salio",
    transfer: "Uhamisho",
    borrow: "Mkopo wa vocha",
    data: "Data ya simu",
    customerCare: "Huduma kwa wateja",
    mobileMoney: "Pesa za simu",
    mpesa: "M-Pesa"
  };

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function number(value, digits) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) return '—';
    return parsed.toLocaleString('sw-TZ', {
      maximumFractionDigits: digits === undefined ? 2 : digits,
      minimumFractionDigits: 0
    });
  }

  function money(value, result) {
    var prefix = result.symbol || result.currency || '';
    return (prefix ? escapeHtml(prefix) + ' ' : '') + number(value, 2);
  }

  function destinationMoney(value, result) {
    var prefix = result.destinationSymbol || result.destinationCurrency || '';
    return (prefix ? escapeHtml(prefix) + ' ' : '') + number(value, 2);
  }

  function metric(label, value, note) {
    return '<div class="sw-telecom-metric"><span>' + escapeHtml(label) + '</span><strong>'
      + value + '</strong>' + (note ? '<small>' + escapeHtml(note) + '</small>' : '') + '</div>';
  }

  function table(headers, rows) {
    return '<div class="sw-telecom-table-wrap"><table><thead><tr>'
      + headers.map(function (header) { return '<th scope="col">' + escapeHtml(header) + '</th>'; }).join('')
      + '</tr></thead><tbody>'
      + rows.map(function (row) {
        return '<tr>' + row.map(function (cell, index) {
          return '<td data-label="' + escapeHtml(headers[index]) + '">' + cell + '</td>';
        }).join('') + '</tr>';
      }).join('')
      + '</tbody></table></div>';
  }

  function sourceNotice(result) {
    var source = result.source || engine.snapshotState(data);
    var date = source.reviewedAt || "tarehe haijulikani";
    var age = source.ageDays === null ? '' : ' · ' + source.ageDays + " siku";
    return '<aside class="sw-telecom-source" data-source-state="' + escapeHtml(source.freshness) + '" role="status">'
      + "<strong>Snapshot ya kupanga iliyohifadhiwa</strong>"
      + "<p>Data ilikusanywa " + escapeHtml(date) + age
      + ". Uhakika: mdogo. Hakuna bei, msimbo, kasi, kifurushi, coverage, upatikanaji au hali ya kanuni inayodaiwa kuwa ya sasa.</p>"
      + "<a href=\"/data/telecom/official-sources.json\">Angalia vyanzo na mapengo yanayojulikana</a></aside>";
  }

  function renderDataPlans(result) {
    if (!result.plans.length) return "<p>Hakuna kifurushi kwenye snapshot kinacholingana na vichujio hivi.</p>";
    return (result.best ? metric("Bei ya chini kwa GB kwenye snapshot", money(result.best.pricePerGB, result)) : '')
      + table(
        ["Mtoa huduma", "Kifurushi kilichohifadhiwa", "Kiasi", "Muda", "Bei iliyohifadhiwa", "Bei / GB"],
        result.plans.map(function (row) {
          return [
            escapeHtml(row.operator),
            escapeHtml(locale.planName(row.name)),
            escapeHtml(locale.dataVolume(row.volume)),
            escapeHtml(locale.validity(row.validity)),
            money(row.price, result),
            money(row.pricePerGB, result)
          ];
        })
      );
  }

  function renderUssd(result) {
    if (!result.codes.length) return "<p>Hakuna msimbo uliohifadhiwa unaolingana na utafutaji huu.</p>";
    return "<p class=\"sw-telecom-callout\">Piga msimbo baada ya kuuthibitisha kwenye app au tovuti ya mtoa huduma. Msimbo wa zamani unaweza kufanya kitendo tofauti.</p>"
      + table(["Matumizi", "Mtoa huduma", "Msimbo uliohifadhiwa"], result.codes.map(function (row) {
        return [escapeHtml(labels[row.category] || row.category), escapeHtml(row.operator), '<code>' + escapeHtml(row.code) + '</code>'];
      }));
  }

  function renderRoaming(result) {
    if (result.sameCountry) return metric("Gharama ya roaming", money(0, result), "Nchi ya kuanzia na unakoenda ni sawa");
    var local = result.localTotalHome === null
      ? destinationMoney(result.localTotalDestination, result)
      : money(result.localTotalHome, result);
    var note = result.localTotalHome === null
      ? "Hakuna ubadilishaji: weka kiwango chako cha sarafu ili kulinganisha sarafu hizi."
      : "Ubadilishaji umetumia kiwango ulichoweka; AfroTools haijakithibitisha.";
    return '<div class="sw-telecom-metrics">'
      + metric("Makadirio ya roaming", money(result.roamingTotal, result))
      + metric("Makadirio ya SIM ya ndani", local, note)
      + metric("Sauti", money(result.voiceCost, result), result.totalMinutes + " dakika")
      + metric("SMS", money(result.smsCost, result), result.totalSms + " ujumbe")
      + metric("Data", money(result.dataCost, result), number(result.totalDataMB / 1024, 2) + " GB")
      + '</div>';
  }

  function renderAirtime(result) {
    return '<div class="sw-telecom-metrics">'
      + metric("Kiasi cha vocha", money(result.amount, result), result.operator)
      + metric("Kiwango cha chini", money(result.lowValue, result), number(result.lowRate * 100, 1) + "% - makisio thabiti")
      + metric("Katikati", money(result.midValue, result), "Makisio yaliyokokotolewa")
      + metric("Kiwango cha juu", money(result.highValue, result), number(result.highRate * 100, 1) + "% - makisio thabiti")
      + "</div><p class=\"sw-telecom-callout\">Asilimia hizi zinafuata makisio ya kupanga ya kikokotoo cha Kiingereza. Si ofa iliyothibitishwa wala ahadi ya kubadilisha.</p>";
  }

  function renderPortability(result) {
    var record = result.record;
    return "<p class=\"sw-telecom-callout\">Hali hapa ni ya snapshot iliyohifadhiwa na haithibitishi hali ya sasa. Thibitisha kwa mdhibiti na mtoa huduma mpya.</p>"
      + table(["Sehemu iliyohifadhiwa", "Thamani ya kuthibitisha"], [
        ["Upatikanaji uliohifadhiwa", record.snapshotAvailability ? "Ndiyo kwenye snapshot" : "Haijahifadhiwa kwenye snapshot"],
        ["Mdhibiti aliyetajwa", escapeHtml(locale.regulator(record.regulatorLabel) || "Haijatajwa")],
        ["Ada iliyohifadhiwa", record.fee === null ? "Haijatajwa" : money(record.fee, result)],
        ["Mchakato uliohifadhiwa", escapeHtml(locale.portability(record.processSnapshot || record.notesSnapshot) || "Haijatajwa")]
      ]);
  }

  function renderSim(result) {
    var record = result.record;
    return "<p class=\"sw-telecom-callout\">Sehemu hizi za kisheria zimehifadhiwa na hazijathibitishwa kwa uamuzi wa sasa. Usiingize namba, kitambulisho, NIN, pasipoti au data ya biometriki.</p>"
      + table(["Sehemu iliyohifadhiwa", "Thamani ya kuthibitisha kwa mdhibiti/mtoa huduma"], [
        ["Sharti lililohifadhiwa", record.snapshotMandatory ? "Ndiyo kwenye snapshot" : "Hapana kwenye snapshot"],
        ["Njia iliyohifadhiwa", escapeHtml(locale.sim(record.methodSnapshot) || "Haijatajwa")],
        ["Tarehe iliyohifadhiwa", escapeHtml(locale.sim(record.deadlineSnapshot) || "Haijatajwa")],
        ["Msimbo wa ukaguzi uliohifadhiwa", escapeHtml(locale.sim(record.checkCodeSnapshot) || "Haijatajwa")],
        ["Athari iliyohifadhiwa", escapeHtml(locale.sim(record.penaltySnapshot) || "Haijatajwa")],
        ["Mdhibiti aliyetajwa", escapeHtml(locale.regulator(record.regulatorLabel) || "Haijatajwa")]
      ]);
  }

  function renderInternet(result) {
    if (!result.tiers.length) return "<p>Hakuna ofa ya ISP iliyohifadhiwa kwa nchi hii.</p>";
    return table(["Mtoa huduma", "Teknolojia", "Kasi iliyohifadhiwa", "Bei ya mwezi iliyohifadhiwa", "Gharama / Mbps"], result.tiers.map(function (row) {
      return [
        escapeHtml(row.provider),
        escapeHtml(locale.networkType(row.type)),
        escapeHtml(locale.speed(row.speed)),
        money(row.price, result),
        money(row.costPerMbps, result)
      ];
    }));
  }

  function renderTechnology(result) {
    var rows = ['Fiber', 'LTE', '5G'].map(function (key) {
      var spec = result.specs[key];
      return [
        key === 'Fiber' ? 'Fibre' : key,
        number(spec.avgSpeed, 0) + " Mbps",
        escapeHtml(spec.latency),
        number(spec.reliability, 0) + "% (modeli)",
        number(result.providers[key].length, 0) + " mtoa huduma kwenye snapshot"
      ];
    });
    return metric("Pendekezo la modeli", result.recommendation === "Fiber" ? "Fibre" : result.recommendation,
      "Thibitisha coverage ya anwani yako")
      + table(["Teknolojia", "Kasi ya wastani ya modeli", "Latency ya modeli", "Uaminifu wa modeli", "Data ya eneo iliyohifadhiwa"], rows);
  }

  function renderBusiness(result) {
    var intro = '<div class="sw-telecom-metrics">'
      + metric("Bandwidth inayopendekezwa", number(result.recommendedBandwidth, 0) + " Mbps")
      + metric("Makadirio ya data ya mwezi", number(result.monthlyDataGB, 0) + " GB")
      + '</div>';
    if (!result.options.length) return intro + "<p>Hakuna chaguo lililohifadhiwa kwa nchi hii.</p>";
    return intro + table(["Chaguo lililohifadhiwa", "Aina", "Kasi", "Kwa mwezi", "Gharama ya mwaka wa kwanza"], result.options.map(function (row) {
      return [
        escapeHtml(locale.businessName(row.name)),
        escapeHtml(locale.networkType(row.type)),
        number(row.speed, 0) + " Mbps",
        money(row.monthly, result),
        money(row.setup + row.monthly * 12, result)
      ];
    }));
  }

  function renderBulkSms(result) {
    return '<div class="sw-telecom-metrics">'
      + metric("Makadirio ya gharama ya mwezi", money(result.totalCost, result), number(result.volume, 0) + " ujumbe")
      + metric("Gharama kwa SMS", money(result.effectiveRate, result), number(result.discount * 100, 0) + "% punguzo la modeli")
      + metric("Tofauti na bei ya msingi", money(result.savings, result), "Makisio, si punguzo la mtoa huduma")
      + '</div>';
  }

  function renderWhatsapp(result) {
    return '<div class="sw-telecom-metrics">'
      + metric("WhatsApp Business", money(result.whatsappTotal, result), money(result.whatsappAverage, result) + " / ujumbe")
      + metric("SMS nyingi", money(result.smsTotal, result), money(result.smsEffectiveRate, result) + " / ujumbe")
      + metric("Chaguo la bei ya chini kwenye snapshot", result.cheaper === "whatsapp" ? "WhatsApp Business" : "SMS")
      + '</div>'
      + table(["Aina", "Idadi", "Gharama ya WhatsApp iliyohifadhiwa", "Gharama ya SMS iliyohifadhiwa"], ["marketing", "utility", "service"].map(function (key) {
        return [
          key === "marketing" ? "Marketing" : (key === "utility" ? "Utility" : "Service"),
          number(result.counts[key], 0),
          money(result.whatsappCosts[key], result),
          money(result.counts[key] * result.smsEffectiveRate, result)
        ];
      }));
  }

  function renderTv(result) {
    if (!result.packages.length) return "<p>Hakuna kifurushi cha TV kilichohifadhiwa kwa nchi hii.</p>";
    var best = result.bestValue
      ? metric("Gharama ya chini kwa chaneli kwenye snapshot", escapeHtml(result.bestValue.provider + ' · ' + locale.tvName(result.bestValue.name)),
        money(result.bestValue.pricePerChannel, result) + " / chaneli")
      : '';
    return best + table(["Mtoa huduma", "Kifurushi kilichohifadhiwa", "Bei ya mwezi iliyohifadhiwa", "Chaneli", "Gharama / chaneli"], result.packages.map(function (row) {
      return [
        escapeHtml(row.provider),
        escapeHtml(locale.tvName(row.name)),
        money(row.price, result),
        row.streaming ? "Streaming" : number(row.channels, 0),
        row.streaming ? escapeHtml(locale.tvNote(row.notes) || "Haiwezi kulinganishwa") : money(row.pricePerChannel, result)
      ];
    }));
  }

  function renderStarlink(result) {
    var headline = result.starlink
      ? '<div class="sw-telecom-metrics">'
        + metric("Bei ya Starlink kwa mwezi iliyohifadhiwa", money(result.starlink.monthly, result))
        + metric("Kifaa cha Starlink kilichohifadhiwa", money(result.starlink.hardware, result))
        + metric("Gharama ya miaka 3", money(result.starlink.yearThree, result))
        + '</div>'
      : "<p>Hakuna bei ya Starlink iliyohifadhiwa kwa nchi hii.</p>";
    var availability = "<p class=\"sw-telecom-callout\">Alama ya upatikanaji kwenye snapshot ni "
      + (result.snapshotAvailabilityFlag ? "ndiyo" : "hapana")
      + ", lakini imepitwa na wakati na haithibitishi upatikanaji wa sasa. Angalia ramani rasmi ya Starlink na anwani yako.</p>";
    if (!result.local.length) return availability + headline + "<p>Hakuna ofa ya ISP ya ndani iliyohifadhiwa.</p>";
    return availability + headline + table(["ISP ya ndani iliyohifadhiwa", "Aina", "Kasi iliyotangazwa", "Kwa mwezi", "Gharama ya miaka 3"], result.local.map(function (row) {
      return [
        escapeHtml(row.name),
        escapeHtml(locale.networkType(row.type)),
        escapeHtml(locale.speed(row.speed)),
        money(row.monthly, result),
        money(row.yearThree, result)
      ];
    }));
  }

  function renderDataUsage(result) {
    var breakdown = result.breakdown.filter(function (row) { return row.mb > 0; });
    var html = '<div class="sw-telecom-metrics">'
      + metric("Matumizi ya mwezi", number(result.totalGB, 2) + " GB")
      + metric("Hitaji lenye akiba ya 10%", number(result.bufferedNeedMB / 1024, 2) + " GB")
      + '</div>'
      + table(["Matumizi", "Makadirio ya matumizi"], breakdown.map(function (row) {
        return [escapeHtml(labels[row.id] || row.id), number(row.mb / 1024, 2) + " GB"];
      }));
    if (result.recommendedPlans.length) {
      html += "<h3>Vifurushi vya mwezi vilivyohifadhiwa karibu na hitaji</h3>"
        + table(["Mtoa huduma", "Kifurushi", "Kiasi", "Bei iliyohifadhiwa"], result.recommendedPlans.map(function (row) {
          return [
            escapeHtml(row.operator),
            escapeHtml(locale.planName(row.name)),
            escapeHtml(locale.dataVolume(row.volume)),
            money(row.price, result)
          ];
        }));
    } else {
      html += "<p>Hakuna kifurushi cha mwezi kilichohifadhiwa kinacholingana na hitaji.</p>";
    }
    return html;
  }

  var renderers = {
    dataPlans: renderDataPlans,
    ussdDirectory: renderUssd,
    roaming: renderRoaming,
    airtime: renderAirtime,
    portability: renderPortability,
    simRegistration: renderSim,
    internet: renderInternet,
    technology: renderTechnology,
    businessInternet: renderBusiness,
    bulkSms: renderBulkSms,
    whatsappVsSms: renderWhatsapp,
    tv: renderTv,
    starlink: renderStarlink,
    dataUsage: renderDataUsage
  };

  function populateCountries() {
    Array.prototype.forEach.call(form.querySelectorAll('[data-country-select]'), function (select) {
      var requireKind = select.getAttribute('data-country-requires');
      var current = select.value;
      select.innerHTML = "<option value=\"\">Chagua nchi</option>";
      Object.keys(data.countries).sort(function (a, b) {
        return locale.countryName(a, data.countries[a].name)
          .localeCompare(locale.countryName(b, data.countries[b].name), 'fr');
      }).forEach(function (code) {
        var country = data.countries[code];
        if (requireKind && !country[requireKind]) return;
        var option = document.createElement('option');
        option.value = code;
        option.textContent = locale.countryName(code, country.name) + (country.currency ? ' · ' + country.currency : '');
        select.appendChild(option);
      });
      if (current) select.value = current;
    });
  }

  function updateDependentFields() {
    var countryInput = form.querySelector('[name="country"]');
    var country = countryInput && data.countries[countryInput.value];
    var operator = form.querySelector('[name="operator"]');
    if (operator) {
      var current = operator.value;
      operator.innerHTML = config.kind === 'dataPlans'
        ? "<option value=\"all\">Watoa huduma wote</option>"
        : "<option value=\"\">Chagua mtoa huduma</option>";
      (country && country.operators || []).forEach(function (item) {
        var option = document.createElement('option');
        option.value = item.name;
        option.textContent = item.name;
        operator.appendChild(option);
      });
      if (current) operator.value = current;
    }
    var category = form.querySelector('[name="category"]');
    if (category) {
      var previous = category.value;
      category.innerHTML = "<option value=\"all\">Matumizi yote</option>";
      Object.keys(country && country.ussdCodes || {}).forEach(function (key) {
        var option = document.createElement('option');
        option.value = key;
        option.textContent = labels[key] || key;
        category.appendChild(option);
      });
      if (previous) category.value = previous;
    }
    var maximumPrice = form.querySelector('[name="maxPrice"]');
    if (maximumPrice && config.kind === 'tv') {
      var maximum = 100000;
      if (country) {
        var prices = [];
        (country.tvProviders || []).forEach(function (provider) {
          (provider.packages || []).forEach(function (item) {
            if (Number.isFinite(Number(item.price))) prices.push(Number(item.price));
          });
        });
        if (prices.length) maximum = Math.ceil(Math.max.apply(Math, prices) * 1.1);
      }
      maximumPrice.max = String(maximum);
      maximumPrice.value = String(maximum);
      syncRangeOutput(maximumPrice);
    }
  }

  function collect() {
    var values = {};
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || field.type === 'submit' || field.type === 'file') return;
      if (field.type === 'number' || field.type === 'range') {
        values[field.name] = field.value === '' ? null : Number(field.value);
      } else {
        values[field.name] = field.value;
      }
    });
    if (config.kind === 'airtime') {
      values.lowRate = 0.7;
      values.highRate = 0.85;
    }
    return values;
  }

  function snapshotInputs() {
    var values = {};
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || field.type === 'submit' || field.type === 'file') return;
      values[field.name] = field.value;
    });
    return values;
  }

  function setResultActionsAvailable(available) {
    [copyButton, txtButton, jsonButton].forEach(function (button) {
      if (!button) return;
      button.disabled = !available;
      button.hidden = !available;
    });
  }

  function clearLatestResult() {
    latest = null;
    resultNode.innerHTML = "<p class=\"tel-empty\">Jaza fomu ili kupata matokeo ya ndani.</p>";
    exportStatus.textContent = '';
    setResultActionsAvailable(false);
  }

  function invalidateEditedResult() {
    if (!latest) return;
    clearLatestResult();
    errorNode.textContent = '';
    exportStatus.textContent = "Matokeo ya zamani yameondolewa baada ya kubadilisha fomu.";
  }

  function syncRangeOutput(field) {
    if (!field || field.type !== 'range') return;
    var output = form.querySelector('[data-range-output="' + field.name + '"]');
    if (output) output.value = field.value;
  }

  function syncWhatsappMix(changed) {
    if (config.kind !== 'whatsappVsSms' || !changed) return;
    var marketing = form.elements.namedItem('marketing');
    var utility = form.elements.namedItem('utility');
    var service = form.elements.namedItem('service');
    if (!marketing || !utility || !service) return;
    var marketingValue = parseInt(marketing.value, 10);
    var utilityValue = parseInt(utility.value, 10);
    var serviceValue = parseInt(service.value, 10);
    var total = marketingValue + utilityValue + serviceValue;
    if (total > 100) {
      var excess = total - 100;
      if (changed.name === 'marketing') {
        utilityValue = Math.max(0, utilityValue - Math.ceil(excess / 2));
        serviceValue = Math.max(0, 100 - marketingValue - utilityValue);
        utility.value = utilityValue;
        service.value = serviceValue;
      } else if (changed.name === 'utility') {
        marketingValue = Math.max(0, marketingValue - Math.ceil(excess / 2));
        serviceValue = Math.max(0, 100 - marketingValue - utilityValue);
        marketing.value = marketingValue;
        service.value = serviceValue;
      } else {
        marketingValue = Math.max(0, marketingValue - Math.ceil(excess / 2));
        utilityValue = Math.max(0, 100 - marketingValue - serviceValue);
        marketing.value = marketingValue;
        utility.value = utilityValue;
      }
    }
    [marketing, utility, service].forEach(syncRangeOutput);
  }

  function run() {
    errorNode.textContent = '';
    clearLatestResult();
    if (!form.reportValidity()) {
      errorNode.textContent = "Sahihisha sehemu zinazohitajika kabla ya kukokotoa tena.";
      return null;
    }
    var calculate = engine[config.kind];
    if (typeof calculate !== 'function') {
      errorNode.textContent = "Injini ya zana hii haipatikani.";
      return null;
    }
    var result = calculate(data, collect());
    if (!result || !result.ok) {
      errorNode.textContent = errorMessages[result && result.error] || "Haiwezekani kutoa matokeo kwa data hizi.";
      return null;
    }
    var renderer = renderers[config.kind];
    resultNode.innerHTML = sourceNotice(result) + '<div class="sw-telecom-result-body">'
      + (renderer ? renderer(result) : '<pre>' + escapeHtml(JSON.stringify(result, null, 2)) + '</pre>')
      + '</div>';
    latest = {
      schemaVersion: 1,
      locale: 'sw',
      toolId: config.toolId,
      kind: config.kind,
      route: config.route,
      engineVersion: engine.version,
      datasetReviewedAt: data.lastUpdated || null,
      inputs: snapshotInputs(),
      result: result
    };
    setResultActionsAvailable(true);
    resultNode.focus();
    return result;
  }

  function exportPayload() {
    if (!latest) {
      errorNode.textContent = "Kokotoa au onyesha matokeo kwanza.";
      return null;
    }
    return JSON.stringify(latest, null, 2);
  }

  function download(name, content, type) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    return Promise.resolve();
  }

  function txtSummary() {
    if (!latest) return '';
    return [
      config.title,
      "Njia: " + config.route,
      "Snapshot: " + (data.lastUpdated || "haijulikani"),
      "Uhakika: mdogo - data ya kupanga iliyohifadhiwa",
      '',
      resultNode.innerText.trim(),
      '',
      "Thibitisha bei, coverage, upatikanaji, misimbo na hali ya kanuni kwenye chanzo rasmi kabla ya uamuzi."
    ].join('\n');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    run();
  });
  form.addEventListener('reset', function () {
    latest = null;
    window.setTimeout(function () {
      clearLatestResult();
      errorNode.textContent = '';
      if (importInput) importInput.value = '';
      updateDependentFields();
      Array.prototype.forEach.call(form.querySelectorAll('input[type="range"]'), syncRangeOutput);
      exportStatus.textContent = "Hali imeanzishwa upya.";
    }, 0);
  });
  form.addEventListener('change', function (event) {
    invalidateEditedResult();
    if (event.target && event.target.hasAttribute('data-country-select')) updateDependentFields();
  });
  form.addEventListener('input', function (event) {
    var field = event.target;
    invalidateEditedResult();
    syncRangeOutput(field);
    if (field && ['marketing', 'utility', 'service'].includes(field.name)) syncWhatsappMix(field);
  });

  copyButton.addEventListener('click', function () {
    var text = txtSummary();
    if (!text) { errorNode.textContent = "Tengeneza matokeo kwanza."; return; }
    copyText(text).then(function () { exportStatus.textContent = "Muhtasari umenakiliwa."; })
      .catch(function () { exportStatus.textContent = "Kunakili kumeshindikana. Tumia upakuaji wa TXT."; });
  });
  txtButton.addEventListener('click', function () {
    var text = txtSummary();
    if (!text) { errorNode.textContent = "Tengeneza matokeo kwanza."; return; }
    download(config.slug + '-afrotools.txt', text, 'text/plain;charset=utf-8');
    exportStatus.textContent = "TXT imepakuliwa.";
  });
  jsonButton.addEventListener('click', function () {
    var payload = exportPayload();
    if (!payload) return;
    download(config.slug + '-afrotools.json', payload, 'application/json;charset=utf-8');
    exportStatus.textContent = "JSON imepakuliwa.";
  });
  importInput.addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    clearLatestResult();
    errorNode.textContent = '';
    exportStatus.textContent = "Faili inakaguliwa ndani.";
    file.text().then(function (text) {
      var payload = JSON.parse(text);
      if (!payload || payload.schemaVersion !== 1 || payload.toolId !== config.toolId || !payload.inputs) {
        throw new Error('wrong_tool');
      }
      Object.keys(payload.inputs).forEach(function (name) {
        var field = form.elements.namedItem(name);
        if (field) field.value = payload.inputs[name];
      });
      updateDependentFields();
      Object.keys(payload.inputs).forEach(function (name) {
        var field = form.elements.namedItem(name);
        if (field) {
          field.value = payload.inputs[name];
          syncRangeOutput(field);
        }
      });
      if (run()) exportStatus.textContent = "Hali imefunguliwa tena na kukokotolewa ndani.";
    }).catch(function () {
      exportStatus.textContent = "Faili imekataliwa: tumia export ya JSON ya zana hii.";
    });
    this.value = '';
  });

  populateCountries();
  updateDependentFields();
  Array.prototype.forEach.call(form.querySelectorAll('input[type="range"]'), syncRangeOutput);
  setResultActionsAvailable(false);
  var state = engine.snapshotState(data);
  var pageSource = document.getElementById('telecom-page-source');
  if (pageSource) {
    pageSource.innerHTML = sourceNotice({ source: state });
  }
})(typeof window !== 'undefined' ? window : globalThis);
