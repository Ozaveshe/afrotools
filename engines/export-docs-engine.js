// /engines/export-docs-engine.js
// AfroTools — Agricultural Export Documentation Checklist Engine
// Reads COUNTRY_CODE global set by each country page
// Depends on: /data/agriculture/export-docs-data.js + /data/agriculture/country-index.js
// ═══════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── Wait for DOM ─────────────────────────────────────────
  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  ready(function () {
    var data     = window.AfroTools.exportDocsData;
    var ci       = window.AfroTools.countryIndex;
    var code     = window.COUNTRY_CODE || 'NG';

    var country  = ci.filter(function (c) { return c.code === code; })[0] || {};
    var specific = data.countrySpecific[code] || {};
    var tradeBloc = specific.tradeBloc || 'AFCFTA';
    var crops    = country.topCrops || [];
    var cropLabels = data.cropLabels;

    // ── DOM refs ──────────────────────────────────────────
    var selProduct  = document.getElementById('edSelProduct');
    var selDest     = document.getElementById('edSelDest');
    var selShipment = document.getElementById('edSelShipment');
    var btnGenerate = document.getElementById('edBtnGenerate');
    var resultsEl   = document.getElementById('edResults');
    var progressEl  = document.getElementById('edProgress');
    var btnPrint    = document.getElementById('edBtnPrint');
    var statsBarEl  = document.getElementById('edStatsBar');

    // ── Populate product dropdown ─────────────────────────
    if (selProduct) {
      crops.forEach(function (cropKey) {
        var label = cropLabels[cropKey];
        if (!label) return;
        var opt = document.createElement('option');
        opt.value = cropKey;
        opt.textContent = label;
        selProduct.appendChild(opt);
      });
      // Add generic option
      var generic = document.createElement('option');
      generic.value = 'other';
      generic.textContent = 'Other Agricultural Product';
      selProduct.appendChild(generic);
    }

    // ── Stats bar (hero pills) ────────────────────────────
    if (statsBarEl && specific.exportAgency) {
      statsBarEl.innerHTML =
        '<span class="ed-stat-pill">&#127968; ' + (specific.exportAgency.split('(')[0].trim()) + '</span>' +
        '<span class="ed-stat-pill">&#127758; ' + tradeBloc + '</span>' +
        '<span class="ed-stat-pill">&#128202; ' + data.commonDocs.length + '+ Required Documents</span>';
    }

    // ── Generate checklist ────────────────────────────────
    function generateChecklist() {
      var product  = selProduct  ? selProduct.value  : 'other';
      var dest     = selDest     ? selDest.value     : 'africa';
      var shipment = selShipment ? selShipment.value : 'container';

      // Build document list
      var docs = [];

      // 1. Common docs (always)
      data.commonDocs.forEach(function (d) { docs.push({ doc: d, source: 'common' }); });

      // 2. AfCFTA CoO (if destination is within Africa)
      if (dest === 'africa') {
        docs.push({ doc: data.afcftaDoc, source: 'afcfta', highlight: true });
        // Trade bloc CoO if applicable
        if (tradeBloc && data.tradeBlocCoo[tradeBloc] && tradeBloc !== 'AFCFTA') {
          var blocCoo = data.tradeBlocCoo[tradeBloc];
          docs.push({
            doc: {
              id: 'bloc_coo',
              name: blocCoo.name,
              description: blocCoo.notes,
              category: 'trade',
              timeToObtain: '1–3 days',
              issuedBy: 'Chamber of Commerce or national customs authority',
              tips: blocCoo.notes
            },
            source: 'tradebloc',
            highlight: true
          });
        }
      }

      // 3. Destination-specific docs
      if (dest === 'eu' && data.destinationDocs.eu) {
        data.destinationDocs.eu.forEach(function (d) { docs.push({ doc: d, source: 'destination' }); });
      }
      if (dest === 'us' && data.destinationDocs.us) {
        data.destinationDocs.us.forEach(function (d) { docs.push({ doc: d, source: 'destination' }); });
      }
      if (dest === 'middle_east' && data.destinationDocs.middle_east) {
        data.destinationDocs.middle_east.forEach(function (d) { docs.push({ doc: d, source: 'destination' }); });
      }

      // 4. Country-specific additional docs
      if (specific.additionalDocs) {
        specific.additionalDocs.forEach(function (d) { docs.push({ doc: d, source: 'country' }); });
      }

      // 5. Commodity-specific docs
      if (specific.commodityDocs && specific.commodityDocs[product]) {
        specific.commodityDocs[product].forEach(function (d) { docs.push({ doc: d, source: 'commodity' }); });
      }

      // 6. Airway Bill override note for air freight
      if (shipment === 'air') {
        docs.forEach(function (item) {
          if (item.doc.id === 'bill_of_lading') {
            item.doc = Object.assign({}, item.doc, {
              name: 'Airway Bill (AWB)',
              description: 'Air transport document issued by the airline or air freight forwarder. Replaces the ocean Bill of Lading for air shipments.',
              tips: 'The AWB is non-negotiable (unlike a BoL). The airline retains a copy; you get the shipper\'s copy (copy 3).'
            });
          }
        });
      }

      return docs;
    }

    // ── Render results ────────────────────────────────────
    function renderResults(docs) {
      if (!resultsEl) return;
      resultsEl.innerHTML = '';

      // Summary bar
      var dest     = selDest     ? selDest.value     : 'africa';
      var product  = selProduct  ? selProduct.options[selProduct.selectedIndex].text : 'Agricultural Product';
      var destText = selDest     ? selDest.options[selDest.selectedIndex].text : 'Africa';

      var summaryDiv = document.createElement('div');
      summaryDiv.className = 'ed-summary-bar';
      summaryDiv.innerHTML = '<span class="ed-summary-item"><span class="ed-s-icon">&#128230;</span><span>' + product + '</span></span>' +
        '<span class="ed-summary-item"><span class="ed-s-icon">&#128205;</span><span>' + destText + '</span></span>' +
        '<span class="ed-summary-item"><span class="ed-s-icon">&#128202;</span><span>' + docs.length + ' documents required</span></span>';
      resultsEl.appendChild(summaryDiv);

      // Group label
      var sectionTitle = document.createElement('h3');
      sectionTitle.className = 'ed-section-title';
      sectionTitle.innerHTML = '&#9989; Your Export Documentation Checklist';
      resultsEl.appendChild(sectionTitle);

      var subTitle = document.createElement('p');
      subTitle.className = 'ed-subtitle';
      subTitle.textContent = 'Tick each item as you obtain it. Tap/click any item to see details.';
      resultsEl.appendChild(subTitle);

      // Checklist
      var checklistEl = document.createElement('div');
      checklistEl.className = 'ed-checklist';

      var catOrder = ['business', 'trade', 'quality', 'customs', 'commercial', 'transport'];
      var catLabels = {
        business:   '&#127968; Business & Registration',
        trade:      '&#127760; Trade & Export Authorisation',
        quality:    '&#9989; Quality & Inspection',
        customs:    '&#128230; Customs & Declarations',
        commercial: '&#128196; Commercial Documents',
        transport:  '&#128674; Transport Documents'
      };

      // Group docs by category
      var grouped = {};
      docs.forEach(function (item) {
        var cat = item.doc.category || 'commercial';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
      });

      catOrder.forEach(function (cat) {
        if (!grouped[cat] || !grouped[cat].length) return;

        var catSection = document.createElement('div');
        catSection.className = 'ed-cat-section';

        var catLabel = document.createElement('div');
        catLabel.className = 'ed-cat-label';
        catLabel.innerHTML = catLabels[cat] || cat;
        catSection.appendChild(catLabel);

        grouped[cat].forEach(function (item, idx) {
          var d = item.doc;
          var itemEl = document.createElement('div');
          itemEl.className = 'ed-item' + (item.highlight ? ' ed-item--highlight' : '');

          var checkId = 'chk_' + cat + '_' + idx;

          // Main row
          var rowEl = document.createElement('div');
          rowEl.className = 'ed-item-row';
          rowEl.innerHTML =
            '<label class="ed-check-label" for="' + checkId + '">' +
              '<input type="checkbox" id="' + checkId + '" class="ed-checkbox" onchange="edUpdateProgress()">' +
              '<span class="ed-check-box"></span>' +
              '<span class="ed-item-name">' + d.name + (item.source === 'afcfta' || item.source === 'tradebloc' ? ' <span class="ed-badge-afcfta">AfCFTA &#127775;</span>' : '') + '</span>' +
            '</label>' +
            '<button class="ed-expand-btn" type="button" aria-expanded="false" aria-controls="detail_' + checkId + '" onclick="edToggleDetail(this, \'detail_' + checkId + '\')">&#8964;</button>';

          // Detail panel
          var detailEl = document.createElement('div');
          detailEl.className = 'ed-item-detail';
          detailEl.id = 'detail_' + checkId;

          var detailHtml = '<p class="ed-detail-desc">' + d.description + '</p>';
          var infoRows = [];
          if (d.issuedBy)      infoRows.push(['Issued by', d.issuedBy]);
          if (d.typicalCost)   infoRows.push(['Typical cost', d.typicalCost]);
          if (d.cost)          infoRows.push(['Typical cost', d.cost]);
          if (d.timeToObtain)  infoRows.push(['Time to obtain', d.timeToObtain]);
          if (d.time)          infoRows.push(['Time to obtain', d.time]);

          if (infoRows.length) {
            detailHtml += '<table class="ed-detail-table">';
            infoRows.forEach(function (r) {
              detailHtml += '<tr><td class="ed-dt-label">' + r[0] + '</td><td>' + r[1] + '</td></tr>';
            });
            detailHtml += '</table>';
          }
          if (d.tips || d.notes) {
            detailHtml += '<div class="ed-tip"><span class="ed-tip-icon">&#128161;</span><span>' + (d.tips || d.notes) + '</span></div>';
          }
          detailEl.innerHTML = detailHtml;

          itemEl.appendChild(rowEl);
          itemEl.appendChild(detailEl);
          catSection.appendChild(itemEl);
        });

        checklistEl.appendChild(catSection);
      });

      resultsEl.appendChild(checklistEl);

      // Timeline estimate
      var timelineHtml = buildTimeline(docs, dest);
      resultsEl.insertAdjacentHTML('beforeend', timelineHtml);

      // AfCFTA callout if applicable
      if (dest !== 'africa') {
        resultsEl.insertAdjacentHTML('beforeend', buildAfcftaCallout());
      }

      // Print button row
      var printRow = document.createElement('div');
      printRow.className = 'ed-print-row';
      printRow.innerHTML = '<button class="ed-btn ed-btn-secondary" onclick="window.print()">&#128438; Print this Checklist</button>';
      resultsEl.appendChild(printRow);

      // Show & scroll
      resultsEl.classList.add('ed-visible');
      updateProgress();
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function buildTimeline(docs, dest) {
      var weeks = 3;
      if (dest === 'eu') weeks += 1; // MRL testing
      if (docs.length > 14) weeks += 1;

      return '<div class="ed-timeline-card">' +
        '<div class="ed-tc-header"><span class="ed-tc-icon">&#9200;</span> <strong>Estimated Timeline: ' + weeks + '–' + (weeks + 2) + ' weeks</strong></div>' +
        '<div class="ed-timeline-steps">' +
          '<div class="ed-ts-item"><span class="ed-ts-num">1</span><div><strong>Week 1–2</strong><br>Register with export agency, obtain business certificates, apply for export licence</div></div>' +
          '<div class="ed-ts-item"><span class="ed-ts-num">2</span><div><strong>Week 2–3</strong><br>Book quality inspection &amp; grading, arrange phytosanitary inspection, get weight certificate</div></div>' +
          '<div class="ed-ts-item"><span class="ed-ts-num">3</span><div><strong>Week 3–4</strong><br>File customs declaration, book fumigation, arrange shipping / airway bill, obtain insurance</div></div>' +
          (dest === 'eu' ? '<div class="ed-ts-item"><span class="ed-ts-num">4</span><div><strong>+5–10 days</strong><br>EU MRL test results from accredited laboratory</div></div>' : '') +
          '<div class="ed-ts-item ed-ts-ship"><span class="ed-ts-num">&#128674;</span><div><strong>Ship sails</strong><br>All documents complete — send copies to buyer immediately</div></div>' +
        '</div>' +
        '<p class="ed-tc-note">&#9888;&#65039; This is an estimate for a first-time export. Experienced exporters with standing approvals can move faster (2–3 weeks).</p>' +
        '</div>';
    }

    function buildAfcftaCallout() {
      return '<div class="ed-afcfta-callout">' +
        '<div class="ed-afcfta-icon">&#127775;</div>' +
        '<div class="ed-afcfta-body">' +
          '<strong>Exporting to another African country?</strong> Use the <strong>AfCFTA Certificate of Origin</strong> to reduce or eliminate import duties at your destination. ' +
          'AfCFTA is operational since 2021 and covers all 54 AU member states. Ask your Chamber of Commerce for the AfCFTA-specific CoO form.' +
        '</div>' +
        '</div>';
    }

    // ── Progress tracker ─────────────────────────────────
    function updateProgress() {
      var checkboxes = document.querySelectorAll('.ed-checkbox');
      var total = checkboxes.length;
      var checked = 0;
      checkboxes.forEach(function (cb) { if (cb.checked) checked++; });

      if (progressEl) {
        progressEl.innerHTML = '<span class="ed-prog-label">&#9989; ' + checked + ' of ' + total + ' documents ready</span>' +
          '<div class="ed-prog-bar"><div class="ed-prog-fill" style="width:' + (total ? Math.round(checked / total * 100) : 0) + '%"></div></div>';
        progressEl.style.display = total ? 'block' : 'none';
      }

      // Strikethrough checked items
      checkboxes.forEach(function (cb) {
        var label = cb.closest('.ed-item');
        if (label) {
          label.classList.toggle('ed-item--done', cb.checked);
        }
      });
    }

    // ── Toggle detail panel ──────────────────────────────
    window.edToggleDetail = function (btn, detailId) {
      var detail = document.getElementById(detailId);
      if (!detail) return;
      var open = detail.classList.toggle('ed-item-detail--open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.innerHTML = open ? '&#8963;' : '&#8964;';
    };

    window.edUpdateProgress = function () { updateProgress(); };

    // ── Button handler ───────────────────────────────────
    if (btnGenerate) {
      btnGenerate.addEventListener('click', function () {
        var docs = generateChecklist();
        renderResults(docs);
      });
    }

    // ── Print cleanup ────────────────────────────────────
    if (btnPrint) {
      btnPrint.addEventListener('click', function () { window.print(); });
    }
  });

}());
