(function () {
  'use strict';

  var DRAFT_KEY = 'afrotools-freelance-invoice-current-v1';
  var CLIENT_KEY = 'afrotools-freelance-invoice-clients-v1';
  var saveState = window.SaveState ? new window.SaveState('freelance-invoice', { maxFree: 40 }) : null;
  var saveTimer = null;
  var currentSavedId = null;
  var state;

  var COUNTRY = {
    Nigeria: { currency: 'NGN', tax: 7.5 },
    Kenya: { currency: 'KES', tax: 16 },
    Ghana: { currency: 'GHS', tax: 15 },
    'South Africa': { currency: 'ZAR', tax: 15 },
    Tanzania: { currency: 'TZS', tax: 18 },
    Uganda: { currency: 'UGX', tax: 18 },
    Rwanda: { currency: 'RWF', tax: 18 },
    Ethiopia: { currency: 'ETB', tax: 15 },
    Egypt: { currency: 'EGP', tax: 14 },
    Morocco: { currency: 'MAD', tax: 20 },
    Senegal: { currency: 'XOF', tax: 18 },
    Cameroon: { currency: 'XAF', tax: 19.25 },
    'Pan-African': { currency: 'USD', tax: 0 }
  };

  var CURRENCY = {
    NGN: '\u20a6',
    KES: 'KSh',
    GHS: 'GH\u20b5',
    ZAR: 'R',
    TZS: 'TSh',
    UGX: 'USh',
    RWF: 'FRw',
    ETB: 'Br',
    EGP: 'E\u00a3',
    MAD: 'MAD',
    XOF: 'CFA',
    XAF: 'FCFA',
    USD: '$',
    EUR: '\u20ac',
    GBP: '\u00a3'
  };

  var METHOD_LABELS = {
    bank: 'Bank transfer',
    mobile: 'Mobile money',
    paystack: 'Paystack',
    flutterwave: 'Flutterwave',
    paypal: 'PayPal',
    wise: 'Wise',
    mixed: 'Mixed payment'
  };

  var TEMPLATES = {
    design: {
      label: 'Design',
      lines: [
        { type: 'service', description: 'Brand identity design', quantity: 1, rate: 250000, taxPct: 0 },
        { type: 'service', description: 'Social media launch assets', quantity: 1, rate: 120000, taxPct: 0 }
      ],
      note: 'Thank you for trusting me with your brand work. Final editable files will be released after payment clears.'
    },
    writing: {
      label: 'Writing',
      lines: [
        { type: 'service', description: 'Long-form article writing', quantity: 3, rate: 75000, taxPct: 0 },
        { type: 'service', description: 'Editing and SEO review', quantity: 1, rate: 60000, taxPct: 0 }
      ],
      note: 'This invoice covers approved writing deliverables for the stated project period.'
    },
    developer: {
      label: 'Developer',
      lines: [
        { type: 'time', description: 'Frontend implementation hours', quantity: 24, rate: 30000, taxPct: 0 },
        { type: 'time', description: 'QA and launch support hours', quantity: 6, rate: 30000, taxPct: 0 }
      ],
      note: 'Source handoff and deployment notes are included in the project workspace.'
    },
    consulting: {
      label: 'Consulting',
      lines: [
        { type: 'time', description: 'Strategy advisory session', quantity: 4, rate: 90000, taxPct: 0 },
        { type: 'service', description: 'Follow-up implementation memo', quantity: 1, rate: 150000, taxPct: 0 }
      ],
      note: 'Advisory work is billed according to the agreed session scope and follow-up deliverable.'
    },
    creator: {
      label: 'Creator',
      lines: [
        { type: 'service', description: 'Sponsored short-form video package', quantity: 2, rate: 180000, taxPct: 0 },
        { type: 'expense', description: 'Production logistics reimbursement', quantity: 1, rate: 50000, taxPct: 0 }
      ],
      note: 'Usage rights follow the campaign agreement. Additional usage requires written approval.'
    },
    retainer: {
      label: 'Retainer',
      lines: [
        { type: 'retainer', description: 'Monthly freelance retainer', quantity: 1, rate: 650000, taxPct: 0 },
        { type: 'time', description: 'Additional billable hours', quantity: 4, rate: 35000, taxPct: 0 }
      ],
      note: 'Retainer renews monthly unless paused in writing before the next invoice cycle.'
    }
  };

  function $(id) {
    return document.getElementById(id);
  }

  function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function invoiceNumber() {
    var d = new Date();
    return 'FI-' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  }

  function defaults() {
    return {
      meta: {
        type: 'invoice',
        country: 'Nigeria',
        currency: 'NGN',
        status: 'draft',
        number: invoiceNumber(),
        issueDate: today(),
        dueDays: 14,
        reference: ''
      },
      freelancer: {
        name: '',
        contact: '',
        address: '',
        taxId: ''
      },
      client: {
        name: '',
        email: '',
        address: ''
      },
      lineItems: [
        { id: uid(), type: 'service', description: 'Freelance service', quantity: 1, rate: 150000, taxPct: 0 }
      ],
      adjustments: {
        discountPct: 0,
        taxPct: 7.5,
        withholdingPct: 0,
        paid: 0
      },
      payment: {
        method: 'bank',
        link: '',
        instructions: 'Bank transfer: [Bank name], [Account number], [Account name]. Use the invoice number as payment reference.'
      },
      notes: {
        clientNote: 'Thank you for your business.',
        terms: 'Payment is due by the stated due date. Late payment may pause further work until the balance is settled.'
      }
    };
  }

  function normalize(input) {
    var next = merge(defaults(), input || {});
    next.meta.dueDays = Number(next.meta.dueDays) || 0;
    next.adjustments.discountPct = num(next.adjustments.discountPct);
    next.adjustments.taxPct = num(next.adjustments.taxPct);
    next.adjustments.withholdingPct = num(next.adjustments.withholdingPct);
    next.adjustments.paid = num(next.adjustments.paid);
    if (!CURRENCY[next.meta.currency]) next.meta.currency = (COUNTRY[next.meta.country] || COUNTRY.Nigeria).currency;
    if (!Array.isArray(next.lineItems) || !next.lineItems.length) next.lineItems = defaults().lineItems;
    next.lineItems = next.lineItems.map(function (item) {
      return {
        id: item.id || uid(),
        type: item.type || 'service',
        description: item.description || '',
        quantity: num(item.quantity || item.qty || 0),
        rate: num(item.rate || item.price || 0),
        taxPct: num(item.taxPct)
      };
    });
    return next;
  }

  function merge(base, extra) {
    Object.keys(extra || {}).forEach(function (key) {
      if (extra[key] && typeof extra[key] === 'object' && !Array.isArray(extra[key]) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
        merge(base[key], extra[key]);
      } else {
        base[key] = extra[key];
      }
    });
    return base;
  }

  function num(value) {
    var parsed = Number(String(value == null ? '' : value).replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function attr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function getPath(path) {
    return path.split('.').reduce(function (obj, part) {
      return obj && obj[part];
    }, state);
  }

  function setPath(path, value) {
    var parts = path.split('.');
    var obj = state;
    for (var i = 0; i < parts.length - 1; i += 1) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = value;
  }

  function money(value) {
    var symbol = CURRENCY[state.meta.currency] || state.meta.currency;
    var amount = num(value);
    var sign = amount < 0 ? '-' : '';
    return sign + symbol + ' ' + Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function plainMoney(value) {
    return state.meta.currency + ' ' + num(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function dueDate() {
    var start = state.meta.issueDate ? new Date(state.meta.issueDate + 'T00:00:00') : new Date();
    start.setDate(start.getDate() + Number(state.meta.dueDays || 0));
    return start;
  }

  function fmtDate(dateLike) {
    if (!dateLike) return '';
    try {
      return new Date(dateLike).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (err) {
      return String(dateLike);
    }
  }

  function titleCase(value) {
    return String(value || '').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function docTitle() {
    return titleCase(state.meta.type || 'invoice');
  }

  function calculate() {
    var subtotal = 0;
    var useLineTax = state.lineItems.some(function (item) { return num(item.taxPct) > 0; });
    state.lineItems.forEach(function (item) {
      subtotal += num(item.quantity) * num(item.rate);
    });
    var discount = subtotal * num(state.adjustments.discountPct) / 100;
    var discountFactor = subtotal > 0 ? (subtotal - discount) / subtotal : 1;
    var tax = useLineTax
      ? state.lineItems.reduce(function (sum, item) {
        return sum + num(item.quantity) * num(item.rate) * discountFactor * num(item.taxPct) / 100;
      }, 0)
      : (subtotal - discount) * num(state.adjustments.taxPct) / 100;
    var gross = subtotal - discount + tax;
    var withholding = (subtotal - discount) * num(state.adjustments.withholdingPct) / 100;
    var paid = num(state.adjustments.paid);
    var balance = Math.max(0, gross - withholding - paid);
    return { subtotal: subtotal, discount: discount, tax: tax, gross: gross, withholding: withholding, paid: paid, balance: balance };
  }

  function lineTotal(item) {
    return num(item.quantity) * num(item.rate);
  }

  function renderTemplates() {
    $('templateRow').innerHTML = Object.keys(TEMPLATES).map(function (id) {
      return '<button class="fi-template-btn" type="button" data-template="' + attr(id) + '">' + escapeHtml(TEMPLATES[id].label) + '</button>';
    }).join('');
  }

  function renderLineItems() {
    $('lineItems').innerHTML = state.lineItems.map(function (item, index) {
      return '<tr data-row-id="' + attr(item.id) + '">' +
        '<td><select data-item-field="type" data-item-index="' + index + '">' +
          option('service', 'Service', item.type) +
          option('time', 'Time', item.type) +
          option('expense', 'Expense', item.type) +
          option('retainer', 'Retainer', item.type) +
        '</select></td>' +
        '<td><input data-item-field="description" data-item-index="' + index + '" value="' + attr(item.description) + '" placeholder="Description"></td>' +
        '<td><input data-item-field="quantity" data-item-index="' + index + '" type="number" min="0" step="0.01" value="' + attr(item.quantity) + '"></td>' +
        '<td><input data-item-field="rate" data-item-index="' + index + '" type="number" min="0" step="0.01" value="' + attr(item.rate) + '"></td>' +
        '<td><input data-item-field="taxPct" data-item-index="' + index + '" type="number" min="0" step="0.01" value="' + attr(item.taxPct) + '"></td>' +
        '<td class="fi-line-total" data-line-total="' + index + '">' + money(lineTotal(item)) + '</td>' +
        '<td><button class="fi-icon-btn" type="button" data-remove-item="' + index + '" aria-label="Remove line item">X</button></td>' +
      '</tr>';
    }).join('');
  }

  function option(value, label, selected) {
    return '<option value="' + attr(value) + '"' + (value === selected ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
  }

  function renderLineTotals() {
    state.lineItems.forEach(function (item, index) {
      var el = document.querySelector('[data-line-total="' + index + '"]');
      if (el) el.textContent = money(lineTotal(item));
    });
  }

  function syncInputs() {
    document.querySelectorAll('[data-bind]').forEach(function (el) {
      var value = getPath(el.getAttribute('data-bind'));
      el.value = value == null ? '' : value;
    });
    document.querySelectorAll('[data-bind-number]').forEach(function (el) {
      var value = getPath(el.getAttribute('data-bind-number'));
      el.value = value == null ? '' : value;
    });
  }

  function paymentInstructions() {
    if (state.payment.instructions) return state.payment.instructions;
    var method = METHOD_LABELS[state.payment.method] || 'Payment';
    var ref = state.meta.number ? ' Reference: ' + state.meta.number + '.' : '';
    if (state.payment.link) return method + ': ' + state.payment.link + '.' + ref;
    return method + '. Please use the invoice number as payment reference.';
  }

  function renderPreview() {
    var totals = calculate();
    $('metricSubtotal').textContent = money(totals.subtotal);
    $('metricTax').textContent = money(totals.tax);
    $('metricTotal').textContent = money(totals.gross);
    $('metricBalance').textContent = money(totals.balance);
    $('invoicePreview').innerHTML = buildInvoiceHtml(false);
    renderQr();
  }

  function partyBlock(person, fallback) {
    var lines = [
      person.name || fallback || '',
      person.contact || person.email || '',
      person.address || '',
      person.taxId ? 'Tax ID: ' + person.taxId : ''
    ].filter(Boolean);
    return escapeHtml(lines.join('\n'));
  }

  function buildInvoiceHtml(forDoc) {
    var totals = calculate();
    var statusLabel = titleCase(state.meta.status || 'draft');
    var html = '<div class="fi-doc-top">' +
      '<div><div class="fi-doc-title">' + escapeHtml(docTitle()) + '</div><div class="fi-doc-muted">' + escapeHtml(state.meta.number || '') + '</div><span class="fi-doc-status">' + escapeHtml(statusLabel) + '</span></div>' +
      '<div class="fi-doc-muted" style="text-align:right"><strong>' + escapeHtml(state.freelancer.name || 'Freelancer') + '</strong><br>' + escapeHtml(state.freelancer.contact || '') + '<br>' + escapeHtml(state.freelancer.address || '') + '</div>' +
    '</div>';
    html += '<div class="fi-doc-parties"><div class="fi-doc-block"><h3>From</h3><p>' + partyBlock(state.freelancer, 'Freelancer') + '</p></div><div class="fi-doc-block"><h3>Bill to</h3><p>' + partyBlock(state.client, 'Client') + '</p></div></div>';
    html += '<div class="fi-doc-meta">' +
      '<div><span>Issue date</span><strong>' + escapeHtml(fmtDate(state.meta.issueDate)) + '</strong></div>' +
      '<div><span>Due date</span><strong>' + escapeHtml(fmtDate(dueDate())) + '</strong></div>' +
      '<div><span>Reference</span><strong>' + escapeHtml(state.meta.reference || 'None') + '</strong></div>' +
    '</div>';
    html += '<table class="fi-doc-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>';
    state.lineItems.forEach(function (item) {
      html += '<tr><td><strong>' + escapeHtml(item.description || 'Line item') + '</strong><br><span class="fi-doc-muted">' + escapeHtml(titleCase(item.type)) + (num(item.taxPct) ? ' | Tax ' + escapeHtml(item.taxPct) + '%' : '') + '</span></td><td>' + escapeHtml(item.quantity) + '</td><td>' + escapeHtml(money(item.rate)) + '</td><td>' + escapeHtml(money(lineTotal(item))) + '</td></tr>';
    });
    html += '</tbody></table>';
    html += '<div class="fi-doc-totals">' +
      totalRow('Subtotal', totals.subtotal) +
      (totals.discount ? totalRow('Discount', -totals.discount) : '') +
      (totals.tax ? totalRow('Tax', totals.tax) : '') +
      totalRow('Total', totals.gross, true) +
      (totals.withholding ? totalRow('Withholding', -totals.withholding) : '') +
      (totals.paid ? totalRow('Paid', -totals.paid) : '') +
      totalRow('Balance due', totals.balance, true) +
    '</div>';
    html += '<div class="fi-payment-box"><div><h3>Payment instructions</h3><p>' + escapeHtml(paymentInstructions()) + '</p>' + (state.payment.link ? '<p><strong>Payment link:</strong> ' + escapeHtml(state.payment.link) + '</p>' : '') + '</div><div class="fi-qr" id="paymentQr" role="img" aria-label="Payment QR code"></div></div>';
    html += '<div class="fi-doc-footer"><p><strong>Note:</strong> ' + escapeHtml(state.notes.clientNote || '') + '</p><p><strong>Terms:</strong> ' + escapeHtml(state.notes.terms || '') + '</p><p>Generated with AfroTools.com</p></div>';
    if (forDoc) return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + escapeHtml(fileTitle()) + '</title></head><body>' + html + '</body></html>';
    return html;
  }

  function totalRow(label, value, grand) {
    return '<div class="fi-total-row ' + (grand ? 'grand' : '') + '"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(money(value)) + '</strong></div>';
  }

  function renderQr() {
    var box = $('paymentQr');
    if (!box) return;
    box.innerHTML = '';
    if (!state.payment.link) {
      box.style.display = 'none';
      return;
    }
    box.style.display = 'grid';
    if (!window.QRCode) {
      box.textContent = 'QR';
      window.setTimeout(renderQr, 250);
      return;
    }
    try {
      var options = {
        text: state.payment.link,
        width: 78,
        height: 78,
        colorDark: '#0f172a',
        colorLight: '#ffffff'
      };
      if (window.QRCode.CorrectLevel) options.correctLevel = window.QRCode.CorrectLevel.M;
      new window.QRCode(box, options);
    } catch (err) {
      box.textContent = 'QR';
    }
  }

  function renderReview() {
    var totals = calculate();
    var checks = [
      { label: 'Freelancer name and contact included', ok: text(state.freelancer.name).length > 2 && text(state.freelancer.contact).length > 4, points: 12 },
      { label: 'Client details included', ok: text(state.client.name).length > 2 && (text(state.client.email).length > 4 || text(state.client.address).length > 4), points: 12 },
      { label: 'Invoice number and dates are set', ok: text(state.meta.number).length > 2 && !!state.meta.issueDate, points: 10 },
      { label: 'At least one clear billable item', ok: state.lineItems.some(function (item) { return text(item.description).length > 4 && num(item.quantity) > 0 && num(item.rate) > 0; }), points: 14 },
      { label: 'Tax or no-tax position is explicit', ok: num(state.adjustments.taxPct) >= 0 && state.meta.country && state.meta.currency, points: 8 },
      { label: 'Payment instructions are usable', ok: text(paymentInstructions()).length > 25, points: 12 },
      { label: 'Terms or client note included', ok: text(state.notes.terms).length > 20 || text(state.notes.clientNote).length > 20, points: 8 },
      { label: 'Balance due is calculated', ok: totals.gross > 0 && totals.balance >= 0, points: 12 },
      { label: 'Payment link or bank/mobile details present', ok: text(state.payment.link).length > 8 || text(state.payment.instructions).length > 30, points: 12 }
    ];
    var score = checks.reduce(function (sum, check) { return sum + (check.ok ? check.points : 0); }, 0);
    $('scoreValue').textContent = String(score);
    $('scoreMeter').style.width = score + '%';
    $('scoreLabel').textContent = score >= 90 ? 'Ready' : score >= 70 ? 'Review' : 'Draft';
    $('checkList').innerHTML = checks.map(function (check) {
      return '<div class="fi-check ' + (check.ok ? 'ok' : '') + '"><span class="fi-check-dot">' + (check.ok ? 'OK' : '!') + '</span><span><strong>' + escapeHtml(check.label) + '</strong></span></div>';
    }).join('');
  }

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function renderClients() {
    var clients = readClients();
    $('clientList').innerHTML = clients.slice(0, 6).map(function (client) {
      return '<button class="fi-client-chip" type="button" data-client-id="' + attr(client.id) + '">' + escapeHtml(client.name || 'Client') + '</button>';
    }).join('');
  }

  function readClients() {
    try {
      return JSON.parse(localStorage.getItem(CLIENT_KEY)) || [];
    } catch (err) {
      return [];
    }
  }

  function writeClients(clients) {
    localStorage.setItem(CLIENT_KEY, JSON.stringify(clients.slice(0, 30)));
  }

  function saveClient() {
    if (!state.client.name) {
      toast('Add a client name first.');
      return;
    }
    var clients = readClients();
    var existing = clients.findIndex(function (client) { return client.name.toLowerCase() === state.client.name.toLowerCase(); });
    var entry = merge({ id: existing >= 0 ? clients[existing].id : uid() }, JSON.parse(JSON.stringify(state.client)));
    if (existing >= 0) clients[existing] = entry;
    else clients.unshift(entry);
    writeClients(clients);
    renderClients();
    toast('Client saved in this browser.');
  }

  function openClient(id) {
    var client = readClients().find(function (item) { return item.id === id; });
    if (!client) return;
    state.client = merge({ name: '', email: '', address: '' }, client);
    renderAll();
    toast('Client loaded.');
  }

  function renderSaved() {
    if (!saveState) return;
    var items = saveState.getAll();
    $('savedPanel').hidden = !items.length;
    $('savedInvoices').innerHTML = items.map(function (item) {
      var data = item.data || {};
      var totals = data.lineItems ? calculateFor(data) : { gross: 0, balance: 0 };
      return '<article class="fi-saved-card"><strong>' + escapeHtml(item.title || 'Freelance invoice') + '</strong><span>' + escapeHtml((data.meta && data.meta.number) || '') + ' | ' + escapeHtml((data.meta && data.meta.currency) || '') + ' ' + escapeHtml(num(totals.gross).toLocaleString('en-US')) + '</span><span>Balance: ' + escapeHtml((data.meta && data.meta.currency) || '') + ' ' + escapeHtml(num(totals.balance).toLocaleString('en-US')) + '</span><div class="fi-saved-actions"><button type="button" data-open-saved="' + attr(item.id) + '">Open</button><button type="button" data-delete-saved="' + attr(item.id) + '">Delete</button></div></article>';
    }).join('');
  }

  function calculateFor(data) {
    var old = state;
    state = normalize(JSON.parse(JSON.stringify(data)));
    var totals = calculate();
    state = old;
    return totals;
  }

  function saveInvoice() {
    if (!saveState) {
      toast('Saved invoices are unavailable in this browser.');
      return;
    }
    var entry = saveState.save({
      id: currentSavedId,
      title: fileTitle(),
      data: JSON.parse(JSON.stringify(state))
    });
    currentSavedId = entry.id;
    renderSaved();
    toast('Invoice saved in this browser.');
  }

  function openSaved(id) {
    var item = saveState && saveState.load(id);
    if (!item || !item.data) return;
    currentSavedId = item.id;
    state = normalize(item.data);
    renderAll();
    toast('Invoice loaded.');
  }

  function deleteSaved(id) {
    var item = saveState && saveState.load(id);
    if (!window.confirm('Delete "' + (item ? item.title : 'this invoice') + '" from this browser?')) return;
    saveState.delete(id);
    renderSaved();
  }

  function renderAll() {
    syncInputs();
    renderTemplates();
    renderLineItems();
    renderClients();
    renderPreview();
    renderReview();
    renderSaved();
    scheduleDraftSave();
  }

  function refresh() {
    renderLineTotals();
    renderPreview();
    renderReview();
    scheduleDraftSave();
  }

  function scheduleDraftSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
        $('draftStatus').textContent = 'Saved locally';
      } catch (err) {
        $('draftStatus').textContent = 'Draft only';
      }
    }, 250);
  }

  function addItem(type) {
    state.lineItems.push({ id: uid(), type: type || 'service', description: type === 'expense' ? 'Billable expense' : type === 'time' ? 'Billable hours' : 'Freelance service', quantity: 1, rate: 0, taxPct: 0 });
    renderLineItems();
    refresh();
  }

  function applyTemplate(id) {
    var template = TEMPLATES[id];
    if (!template) return;
    state.lineItems = template.lines.map(function (item) {
      return merge({ id: uid() }, item);
    });
    state.notes.clientNote = template.note;
    renderAll();
    toast(template.label + ' template applied.');
  }

  function updateCountryDefaults() {
    var preset = COUNTRY[state.meta.country] || COUNTRY.Nigeria;
    state.meta.currency = preset.currency;
    state.adjustments.taxPct = preset.tax;
  }

  function updatePaymentDefaults() {
    if (state.payment.instructions && state.payment.instructions.indexOf('[') === -1) return;
    var map = {
      bank: 'Bank transfer: [Bank name], [Account number], [Account name]. Use the invoice number as payment reference.',
      mobile: 'Mobile money: [Provider], [Number], [Account name]. Use the invoice number as reference.',
      paystack: 'Pay via Paystack using the payment link on this invoice. Cards, bank transfer, and USSD may be available depending on country.',
      flutterwave: 'Pay via Flutterwave using the payment link on this invoice. Cards, bank transfer, and mobile money may be available depending on country.',
      paypal: 'PayPal: [your PayPal email]. Please include the invoice number in the note.',
      wise: 'Wise transfer: [your Wise details]. Please include the invoice number in the note.',
      mixed: 'Payment may be made by bank transfer, mobile money, or card link. Confirm the preferred method before sending.'
    };
    state.payment.instructions = map[state.payment.method] || map.bank;
  }

  function copyToClipboard(content, label) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      window.prompt('Copy ' + label, content);
      return;
    }
    navigator.clipboard.writeText(content).then(function () {
      toast(label + ' copied.');
    }).catch(function () {
      window.prompt('Copy ' + label, content);
    });
  }

  function emailText(reminder) {
    var totals = calculate();
    var greeting = state.client.name ? 'Hello ' + state.client.name + ',' : 'Hello,';
    if (reminder) {
      return greeting + '\n\nThis is a friendly reminder that ' + docTitle().toLowerCase() + ' ' + state.meta.number + ' is still open.\n\nBalance due: ' + money(totals.balance) + '\nDue date: ' + fmtDate(dueDate()) + '\n\nPayment instructions:\n' + paymentInstructions() + '\n\nThank you,\n' + (state.freelancer.name || 'Freelancer');
    }
    return greeting + '\n\nPlease find ' + docTitle().toLowerCase() + ' ' + state.meta.number + ' for ' + money(totals.gross) + '. The balance due is ' + money(totals.balance) + ' and the due date is ' + fmtDate(dueDate()) + '.\n\nPayment instructions:\n' + paymentInstructions() + '\n\nThank you,\n' + (state.freelancer.name || 'Freelancer');
  }

  function whatsappText() {
    var totals = calculate();
    return 'Hi ' + (state.client.name || 'there') + ', ' + docTitle().toLowerCase() + ' ' + state.meta.number + ' from ' + (state.freelancer.name || 'Freelancer') + ' is ready. Total: ' + money(totals.gross) + '. Balance due: ' + money(totals.balance) + '. Due: ' + fmtDate(dueDate()) + '. ' + (state.payment.link || paymentInstructions());
  }

  function exportPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      toast('PDF tools are still loading.');
      return;
    }
    var doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var pageWidth = doc.internal.pageSize.getWidth();
    var pageHeight = doc.internal.pageSize.getHeight();
    var margin = 18;
    var y = 22;
    var maxWidth = pageWidth - margin * 2;
    var totals = calculate();

    doc.setProperties({ title: fileTitle(), subject: 'Freelance invoice generated with AfroTools', creator: 'AfroTools Freelance Invoice Generator' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    y = writeLines(doc, docTitle().toUpperCase(), margin, y, maxWidth, 8, pageHeight - 16) + 1;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y = writeLines(doc, state.meta.number + ' | ' + state.meta.country + ' | ' + state.meta.currency + ' | ' + titleCase(state.meta.status), margin, y, maxWidth, 5.5, pageHeight - 16) + 4;

    doc.setFont('helvetica', 'bold');
    y = writeLines(doc, 'From', margin, y, maxWidth, 6, pageHeight - 16);
    doc.setFont('times', 'normal');
    y = writeLines(doc, [state.freelancer.name, state.freelancer.contact, state.freelancer.address, state.freelancer.taxId ? 'Tax ID: ' + state.freelancer.taxId : ''].filter(Boolean).join('\n'), margin, y, maxWidth, 5.2, pageHeight - 16) + 2;
    doc.setFont('helvetica', 'bold');
    y = writeLines(doc, 'Bill to', margin, y, maxWidth, 6, pageHeight - 16);
    doc.setFont('times', 'normal');
    y = writeLines(doc, [state.client.name, state.client.email, state.client.address].filter(Boolean).join('\n'), margin, y, maxWidth, 5.2, pageHeight - 16) + 3;
    y = writeLines(doc, 'Issue date: ' + fmtDate(state.meta.issueDate) + ' | Due date: ' + fmtDate(dueDate()) + (state.meta.reference ? ' | Ref: ' + state.meta.reference : ''), margin, y, maxWidth, 5.2, pageHeight - 16) + 4;

    doc.setFont('helvetica', 'bold');
    y = writeLines(doc, 'Line items', margin, y, maxWidth, 6, pageHeight - 16);
    doc.setFont('times', 'normal');
    state.lineItems.forEach(function (item) {
      y = writeLines(doc, item.description + ' | ' + item.quantity + ' x ' + plainMoney(item.rate) + ' = ' + plainMoney(lineTotal(item)), margin, y, maxWidth, 5.2, pageHeight - 16);
    });
    y += 3;
    [
      ['Subtotal', totals.subtotal],
      ['Discount', -totals.discount],
      ['Tax', totals.tax],
      ['Total', totals.gross],
      ['Withholding', -totals.withholding],
      ['Paid', -totals.paid],
      ['Balance due', totals.balance]
    ].forEach(function (row) {
      if (!row[1] && row[0] !== 'Subtotal' && row[0] !== 'Total' && row[0] !== 'Balance due') return;
      y = writeLines(doc, row[0] + ': ' + plainMoney(row[1]), margin, y, maxWidth, 5.2, pageHeight - 16);
    });
    y += 4;
    doc.setFont('helvetica', 'bold');
    y = writeLines(doc, 'Payment instructions', margin, y, maxWidth, 6, pageHeight - 16);
    doc.setFont('times', 'normal');
    y = writeLines(doc, paymentInstructions() + (state.payment.link ? '\nPayment link: ' + state.payment.link : ''), margin, y, maxWidth, 5.2, pageHeight - 16) + 4;
    y = writeLines(doc, 'Note: ' + state.notes.clientNote + '\nTerms: ' + state.notes.terms, margin, y, maxWidth, 5.2, pageHeight - 16);

    for (var p = 1; p <= doc.getNumberOfPages(); p += 1) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text('Generated with AfroTools.com', pageWidth / 2, pageHeight - 8, { align: 'center' });
      doc.text(String(p), pageWidth - margin, pageHeight - 8, { align: 'right' });
      doc.setTextColor(0);
    }
    doc.save(fileBase() + '.pdf');
    toast('PDF downloaded.');
  }

  function writeLines(doc, textToWrite, x, y, maxWidth, lineHeight, bottom) {
    var lines = doc.splitTextToSize(String(textToWrite || ''), maxWidth);
    lines.forEach(function (line) {
      if (y > bottom) {
        doc.addPage();
        y = 22;
      }
      doc.text(line, x, y);
      y += lineHeight;
    });
    return y;
  }

  function exportDoc() {
    downloadBlob(buildInvoiceHtml(true), fileBase() + '.doc', 'application/msword;charset=utf-8');
  }

  function exportTxt() {
    var totals = calculate();
    var rows = [
      fileTitle(),
      docTitle() + ' ' + state.meta.number,
      'Issue date: ' + fmtDate(state.meta.issueDate),
      'Due date: ' + fmtDate(dueDate()),
      '',
      'FROM',
      [state.freelancer.name, state.freelancer.contact, state.freelancer.address, state.freelancer.taxId].filter(Boolean).join('\n'),
      '',
      'BILL TO',
      [state.client.name, state.client.email, state.client.address].filter(Boolean).join('\n'),
      '',
      'ITEMS'
    ];
    state.lineItems.forEach(function (item) {
      rows.push(item.description + ' | ' + item.quantity + ' x ' + plainMoney(item.rate) + ' = ' + plainMoney(lineTotal(item)));
    });
    rows.push('', 'Subtotal: ' + plainMoney(totals.subtotal), 'Tax: ' + plainMoney(totals.tax), 'Total: ' + plainMoney(totals.gross), 'Balance due: ' + plainMoney(totals.balance), '', 'Payment: ' + paymentInstructions(), '', state.notes.clientNote, state.notes.terms);
    downloadBlob(rows.join('\n') + '\n', fileBase() + '.txt', 'text/plain;charset=utf-8');
  }

  function exportCsv() {
    var rows = [['Type', 'Description', 'Quantity', 'Rate', 'Tax %', 'Line total']];
    state.lineItems.forEach(function (item) {
      rows.push([item.type, item.description, item.quantity, item.rate, item.taxPct, lineTotal(item)]);
    });
    var totals = calculate();
    rows.push([], ['Subtotal', totals.subtotal], ['Discount', totals.discount], ['Tax', totals.tax], ['Total', totals.gross], ['Withholding', totals.withholding], ['Paid', totals.paid], ['Balance due', totals.balance]);
    downloadBlob(rows.map(csvRow).join('\n'), fileBase() + '-items.csv', 'text/csv;charset=utf-8');
  }

  function exportJson() {
    downloadBlob(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2), fileBase() + '.json', 'application/json;charset=utf-8');
  }

  function importJson(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result || '{}'));
        state = normalize(parsed.data || parsed);
        currentSavedId = null;
        renderAll();
        toast('Invoice imported.');
      } catch (err) {
        toast('Could not import that JSON file.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  function shareLink() {
    try {
      var token = btoa(unescape(encodeURIComponent(JSON.stringify({ version: 1, data: state })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      var url = window.location.origin + window.location.pathname + '?invoice=' + token;
      if (url.length > 7800) {
        toast('Invoice is too large for a share link. Export JSON instead.');
        return;
      }
      copyToClipboard(url, 'Share link');
    } catch (err) {
      toast('Could not create a share link.');
    }
  }

  function csvRow(row) {
    return row.map(function (cell) {
      var value = String(cell == null ? '' : cell);
      return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
    }).join(',');
  }

  function downloadBlob(content, filename, type) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: type || 'application/octet-stream' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 500);
  }

  function fileTitle() {
    return (state.client.name || state.freelancer.name || 'Freelance') + ' ' + docTitle() + ' ' + (state.meta.number || '');
  }

  function fileBase() {
    return fileTitle().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'freelance-invoice';
  }

  function restoreInitialState() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('invoice')) {
      try {
        var token = params.get('invoice').replace(/-/g, '+').replace(/_/g, '/');
        while (token.length % 4) token += '=';
        var shared = JSON.parse(decodeURIComponent(escape(atob(token))));
        return normalize(shared.data || shared);
      } catch (err) {
        toast('The shared invoice link could not be opened.');
      }
    }
    try {
      var draft = localStorage.getItem(DRAFT_KEY);
      if (draft) return normalize(JSON.parse(draft));
    } catch (err) {}
    return normalize(defaults());
  }

  function newInvoice() {
    currentSavedId = null;
    state = normalize(defaults());
    renderAll();
    toast('New invoice ready.');
  }

  function loadSample() {
    state = normalize(defaults());
    state.freelancer = { name: 'Amina Creative Studio', contact: 'amina@example.com | +234 800 000 0000', address: 'Lagos, Nigeria', taxId: 'TIN 01234567' };
    state.client = { name: 'Kijani Foods Ltd', email: 'finance@kijani.example', address: 'Nairobi, Kenya' };
    state.meta.country = 'Nigeria';
    state.meta.currency = 'NGN';
    state.meta.status = 'sent';
    state.meta.reference = 'Brand launch sprint';
    state.adjustments.taxPct = 7.5;
    state.adjustments.withholdingPct = 5;
    state.adjustments.paid = 150000;
    state.payment.method = 'paystack';
    state.payment.link = 'https://paystack.com/pay/sample-invoice';
    state.payment.instructions = 'Pay via Paystack using the payment link. Bank transfer is also accepted with the invoice number as reference.';
    state.lineItems = TEMPLATES.design.lines.map(function (item) { return merge({ id: uid() }, item); });
    renderAll();
    toast('Sample invoice loaded.');
  }

  function bind() {
    document.body.addEventListener('input', function (event) {
      var bindInput = event.target.closest('[data-bind]');
      var bindNumber = event.target.closest('[data-bind-number]');
      var itemInput = event.target.closest('[data-item-field]');
      if (bindInput) {
        setPath(bindInput.getAttribute('data-bind'), bindInput.value);
        if (bindInput.id === 'paymentMethod') updatePaymentDefaults();
        refresh();
        return;
      }
      if (bindNumber) {
        setPath(bindNumber.getAttribute('data-bind-number'), num(bindNumber.value));
        refresh();
        return;
      }
      if (itemInput) {
        var index = Number(itemInput.getAttribute('data-item-index'));
        var field = itemInput.getAttribute('data-item-field');
        state.lineItems[index][field] = ['quantity', 'rate', 'taxPct'].indexOf(field) >= 0 ? num(itemInput.value) : itemInput.value;
        refresh();
      }
    });

    document.body.addEventListener('change', function (event) {
      var bindInput = event.target.closest('[data-bind]');
      var itemInput = event.target.closest('[data-item-field]');
      if (bindInput) {
        setPath(bindInput.getAttribute('data-bind'), bindInput.value);
        if (bindInput.id === 'country') updateCountryDefaults();
        if (bindInput.id === 'paymentMethod') updatePaymentDefaults();
        renderAll();
        return;
      }
      if (itemInput) {
        var index = Number(itemInput.getAttribute('data-item-index'));
        var field = itemInput.getAttribute('data-item-field');
        state.lineItems[index][field] = ['quantity', 'rate', 'taxPct'].indexOf(field) >= 0 ? num(itemInput.value) : itemInput.value;
        refresh();
      }
    });

    document.body.addEventListener('click', function (event) {
      var remove = event.target.closest('[data-remove-item]');
      var template = event.target.closest('[data-template]');
      var client = event.target.closest('[data-client-id]');
      var open = event.target.closest('[data-open-saved]');
      var del = event.target.closest('[data-delete-saved]');
      if (remove) {
        var index = Number(remove.getAttribute('data-remove-item'));
        if (state.lineItems.length > 1) state.lineItems.splice(index, 1);
        renderLineItems();
        refresh();
      }
      if (template) applyTemplate(template.getAttribute('data-template'));
      if (client) openClient(client.getAttribute('data-client-id'));
      if (open) openSaved(open.getAttribute('data-open-saved'));
      if (del) deleteSaved(del.getAttribute('data-delete-saved'));
    });

    $('addItemBtn').addEventListener('click', function () { addItem('service'); });
    $('addTimeBtn').addEventListener('click', function () { addItem('time'); });
    $('addExpenseBtn').addEventListener('click', function () { addItem('expense'); });
    $('saveClientBtn').addEventListener('click', saveClient);
    $('saveInvoiceBtn').addEventListener('click', saveInvoice);
    $('newInvoiceBtn').addEventListener('click', newInvoice);
    $('loadSampleBtn').addEventListener('click', loadSample);
    $('shareBtn').addEventListener('click', shareLink);
    $('pdfBtn').addEventListener('click', exportPdf);
    $('docBtn').addEventListener('click', exportDoc);
    $('txtBtn').addEventListener('click', exportTxt);
    $('csvBtn').addEventListener('click', exportCsv);
    $('jsonBtn').addEventListener('click', exportJson);
    $('printBtn').addEventListener('click', function () { window.print(); });
    $('importJson').addEventListener('change', importJson);
    $('copyEmailBtn').addEventListener('click', function () { copyToClipboard(emailText(false), 'Invoice email'); });
    $('copyReminderBtn').addEventListener('click', function () { copyToClipboard(emailText(true), 'Reminder'); });
    $('copyWhatsappBtn').addEventListener('click', function () { copyToClipboard(whatsappText(), 'WhatsApp text'); });
  }

  function toast(message) {
    var el = document.querySelector('.fi-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'fi-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }

  function init() {
    state = restoreInitialState();
    bind();
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
