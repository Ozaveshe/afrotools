(function () {
  'use strict';

  var STORAGE_DRAFT = 'afrotools-receipt-current-v2';
  var STORAGE_PROFILE = 'afrotools-receipt-profile-v2';
  var OLD_PROFILE = 'afro_receipt_template';
  var saveState = window.SaveState ? new window.SaveState('receipt-generator', { maxFree: 30 }) : null;
  var state;
  var saveTimer = null;

  var CURRENCIES = [
    ['NGN', 'NGN - Nigerian naira', '\u20a6'],
    ['KES', 'KES - Kenyan shilling', 'KSh'],
    ['GHS', 'GHS - Ghanaian cedi', 'GH\u20b5'],
    ['ZAR', 'ZAR - South African rand', 'R'],
    ['TZS', 'TZS - Tanzanian shilling', 'TSh'],
    ['UGX', 'UGX - Ugandan shilling', 'USh'],
    ['RWF', 'RWF - Rwandan franc', 'FRw'],
    ['ETB', 'ETB - Ethiopian birr', 'Br'],
    ['EGP', 'EGP - Egyptian pound', 'E\u00a3'],
    ['MAD', 'MAD - Moroccan dirham', 'MAD'],
    ['XOF', 'XOF - West African CFA', 'CFA'],
    ['XAF', 'XAF - Central African CFA', 'FCFA'],
    ['BWP', 'BWP - Botswana pula', 'P'],
    ['USD', 'USD - US dollar', '$'],
    ['GBP', 'GBP - British pound', '\u00a3'],
    ['EUR', 'EUR - Euro', '\u20ac']
  ];

  var CURRENCY_SYMBOLS = CURRENCIES.reduce(function (map, row) {
    map[row[0]] = row[2];
    return map;
  }, {});

  var COUNTRY_PRESETS = {
    NG: { label: 'Nigeria', currency: 'NGN', taxRate: 7.5, taxLabel: 'VAT', provider: 'Paystack', methods: ['Cash', 'Bank transfer', 'POS/Card', 'Mobile money', 'Payment link', 'OPay', 'PalmPay', 'Flutterwave', 'Paystack'] },
    KE: { label: 'Kenya', currency: 'KES', taxRate: 16, taxLabel: 'VAT', provider: 'M-Pesa', methods: ['Cash', 'Bank transfer', 'M-Pesa', 'Airtel Money', 'POS/Card', 'Payment link'] },
    GH: { label: 'Ghana', currency: 'GHS', taxRate: 15, taxLabel: 'VAT', provider: 'MTN MoMo', methods: ['Cash', 'Bank transfer', 'MTN MoMo', 'Vodafone Cash', 'AirtelTigo Money', 'POS/Card'] },
    ZA: { label: 'South Africa', currency: 'ZAR', taxRate: 15, taxLabel: 'VAT', provider: 'Bank transfer', methods: ['Cash', 'EFT', 'POS/Card', 'SnapScan', 'Ozow', 'PayFast'] },
    TZ: { label: 'Tanzania', currency: 'TZS', taxRate: 18, taxLabel: 'VAT', provider: 'M-Pesa', methods: ['Cash', 'Bank transfer', 'M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Halopesa'] },
    UG: { label: 'Uganda', currency: 'UGX', taxRate: 18, taxLabel: 'VAT', provider: 'MTN MoMo', methods: ['Cash', 'Bank transfer', 'MTN MoMo', 'Airtel Money', 'POS/Card'] },
    RW: { label: 'Rwanda', currency: 'RWF', taxRate: 18, taxLabel: 'VAT', provider: 'MTN MoMo', methods: ['Cash', 'Bank transfer', 'MTN MoMo', 'Airtel Money', 'POS/Card'] },
    ET: { label: 'Ethiopia', currency: 'ETB', taxRate: 15, taxLabel: 'VAT', provider: 'Telebirr', methods: ['Cash', 'Bank transfer', 'Telebirr', 'CBE Birr', 'POS/Card'] },
    EG: { label: 'Egypt', currency: 'EGP', taxRate: 14, taxLabel: 'VAT', provider: 'Bank transfer', methods: ['Cash', 'Bank transfer', 'POS/Card', 'Fawry', 'Vodafone Cash'] },
    MA: { label: 'Morocco', currency: 'MAD', taxRate: 20, taxLabel: 'VAT', provider: 'Bank transfer', methods: ['Cash', 'Bank transfer', 'POS/Card', 'Online payment'] },
    SN: { label: 'Senegal / XOF', currency: 'XOF', taxRate: 18, taxLabel: 'VAT', provider: 'Wave', methods: ['Cash', 'Bank transfer', 'Wave', 'Orange Money', 'Free Money', 'POS/Card'] },
    CM: { label: 'Cameroon / XAF', currency: 'XAF', taxRate: 19.25, taxLabel: 'VAT', provider: 'MTN MoMo', methods: ['Cash', 'Bank transfer', 'MTN MoMo', 'Orange Money', 'POS/Card'] },
    US: { label: 'United States', currency: 'USD', taxRate: 0, taxLabel: 'Sales tax', provider: 'Card', methods: ['Cash', 'Bank transfer', 'POS/Card', 'Payment link', 'Cheque'] },
    GB: { label: 'United Kingdom', currency: 'GBP', taxRate: 20, taxLabel: 'VAT', provider: 'Bank transfer', methods: ['Cash', 'Bank transfer', 'Card', 'Payment link'] },
    EU: { label: 'Europe', currency: 'EUR', taxRate: 20, taxLabel: 'VAT', provider: 'Bank transfer', methods: ['Cash', 'Bank transfer', 'Card', 'Payment link'] }
  };

  var DOC_LABELS = {
    sale: 'Sales receipt',
    tax: 'Tax receipt',
    deposit: 'Deposit receipt',
    refund: 'Refund receipt',
    gift: 'Gift receipt',
    declined: 'Declined payment slip'
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

  function nowTime() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function receiptNumber() {
    var d = new Date();
    return 'RCT-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(Math.floor(1000 + Math.random() * 9000));
  }

  function newItem(desc, qty, unit, rate, discount, note) {
    return {
      id: uid(),
      desc: desc || '',
      qty: qty === undefined ? 1 : Number(qty) || 0,
      unit: unit || 'item',
      rate: rate === undefined ? 0 : Number(rate) || 0,
      discount: discount === undefined ? 0 : Number(discount) || 0,
      note: note || ''
    };
  }

  function defaults() {
    return {
      docType: 'sale',
      status: 'PAID',
      template: 'modern',
      country: 'NG',
      currency: 'NGN',
      taxLabel: 'VAT',
      business: {
        name: '',
        taxId: '',
        address: '',
        phone: '',
        email: '',
        logo: ''
      },
      customer: {
        name: '',
        taxId: '',
        address: '',
        phone: '',
        email: ''
      },
      receipt: {
        number: receiptNumber(),
        date: today(),
        time: nowTime(),
        branch: '',
        cashier: '',
        reference: ''
      },
      items: [
        newItem('Product or service', 1, 'item', 0, 0, '')
      ],
      totals: {
        taxRate: 7.5,
        discount: 0,
        discountType: 'percent',
        serviceCharge: 0,
        shipping: 0,
        rounding: 0
      },
      payment: {
        method: 'Mobile money',
        provider: 'Paystack',
        amountPaid: '',
        reference: '',
        authCode: '',
        last4: '',
        showQr: true,
        qrData: ''
      },
      notes: 'Thank you for your business.',
      terms: 'Goods and services received in good condition. Keep this receipt for your records.'
    };
  }

  function deepMerge(base, extra) {
    if (!extra || typeof extra !== 'object') return base;
    Object.keys(extra).forEach(function (key) {
      if (Array.isArray(extra[key])) {
        base[key] = extra[key].slice();
      } else if (extra[key] && typeof extra[key] === 'object' && base[key] && typeof base[key] === 'object') {
        deepMerge(base[key], extra[key]);
      } else if (extra[key] !== undefined) {
        base[key] = extra[key];
      }
    });
    return base;
  }

  function normalize(data) {
    var next = deepMerge(defaults(), data || {});
    next.items = Array.isArray(next.items) && next.items.length ? next.items.map(function (item) {
      return newItem(item.desc || item.description, item.qty, item.unit, item.rate || item.price, item.discount, item.note);
    }) : [newItem('Product or service', 1, 'item', 0, 0, '')];
    if (!isSafeLogo(next.business.logo)) next.business.logo = '';
    if (!COUNTRY_PRESETS[next.country]) next.country = 'NG';
    if (!CURRENCY_SYMBOLS[next.currency]) next.currency = COUNTRY_PRESETS[next.country].currency;
    next.totals.taxRate = numberOr(next.totals.taxRate, COUNTRY_PRESETS[next.country].taxRate);
    next.totals.discount = numberOr(next.totals.discount, 0);
    next.totals.serviceCharge = numberOr(next.totals.serviceCharge, 0);
    next.totals.shipping = numberOr(next.totals.shipping, 0);
    next.totals.rounding = numberOr(next.totals.rounding, 0);
    return next;
  }

  function numberOr(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
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

  function money(value) {
    var symbol = CURRENCY_SYMBOLS[state.currency] || state.currency;
    var n = Number(value) || 0;
    var sign = n < 0 ? '-' : '';
    return sign + symbol + ' ' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function plainMoney(value) {
    return state.currency + ' ' + (Number(value) || 0).toFixed(2);
  }

  function formatDate(value) {
    if (!value) return '';
    var d = new Date(value + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function calculate() {
    var gross = 0;
    var lineDiscount = 0;
    state.items.forEach(function (item) {
      var line = numberOr(item.qty, 0) * numberOr(item.rate, 0);
      gross += line;
      lineDiscount += line * Math.max(0, numberOr(item.discount, 0)) / 100;
    });
    var subtotal = Math.max(0, gross - lineDiscount);
    var globalDiscount = state.totals.discountType === 'amount'
      ? Math.min(Math.max(0, numberOr(state.totals.discount, 0)), subtotal)
      : subtotal * Math.max(0, numberOr(state.totals.discount, 0)) / 100;
    var charges = Math.max(0, numberOr(state.totals.serviceCharge, 0)) + Math.max(0, numberOr(state.totals.shipping, 0));
    var taxable = Math.max(0, subtotal - globalDiscount + charges);
    var tax = taxable * Math.max(0, numberOr(state.totals.taxRate, 0)) / 100;
    var total = taxable + tax + numberOr(state.totals.rounding, 0);
    var autoPaid = state.status === 'PAID' || state.status === 'REFUNDED' ? total : 0;
    if (state.status === 'DECLINED') autoPaid = 0;
    var paid = state.payment.amountPaid === '' || state.payment.amountPaid == null ? autoPaid : numberOr(state.payment.amountPaid, 0);
    var change = Math.max(0, paid - total);
    var balance = Math.max(0, total - paid);
    return {
      gross: gross,
      lineDiscount: lineDiscount,
      subtotal: subtotal,
      globalDiscount: globalDiscount,
      charges: charges,
      taxable: taxable,
      tax: tax,
      total: total,
      paid: paid,
      change: change,
      balance: balance
    };
  }

  function populateSelects() {
    var country = $('country');
    var currency = $('currency');
    var methods = $('paymentMethod');
    country.innerHTML = Object.keys(COUNTRY_PRESETS).map(function (code) {
      return '<option value="' + code + '">' + escapeHtml(COUNTRY_PRESETS[code].label) + '</option>';
    }).join('');
    currency.innerHTML = CURRENCIES.map(function (row) {
      return '<option value="' + row[0] + '">' + escapeHtml(row[1]) + '</option>';
    }).join('');
    methods.innerHTML = getPaymentMethods().map(function (method) {
      return '<option value="' + attr(method) + '">' + escapeHtml(method) + '</option>';
    }).join('');
  }

  function getPaymentMethods() {
    var preset = COUNTRY_PRESETS[state.country] || COUNTRY_PRESETS.NG;
    var base = ['Cash', 'Bank transfer', 'Mobile money', 'POS/Card', 'Cheque', 'Online payment', 'Payment link', 'Store credit', 'Other'];
    return preset.methods.concat(base).filter(function (method, idx, list) {
      return list.indexOf(method) === idx;
    });
  }

  function applyCountryPreset() {
    var preset = COUNTRY_PRESETS[state.country] || COUNTRY_PRESETS.NG;
    state.currency = preset.currency;
    state.taxLabel = preset.taxLabel;
    state.totals.taxRate = preset.taxRate;
    if (!state.payment.provider || !getPaymentMethods().includes(state.payment.method)) {
      state.payment.provider = preset.provider;
      state.payment.method = preset.methods[0] || 'Cash';
    }
    populateSelects();
  }

  function syncForm() {
    document.querySelectorAll('[data-bind]').forEach(function (el) {
      var value = getPath(el.getAttribute('data-bind'));
      if (el.type === 'checkbox') {
        el.checked = Boolean(value);
      } else {
        el.value = value == null ? '' : value;
      }
    });
    renderLogo();
  }

  function renderItems() {
    $('itemsList').innerHTML = state.items.map(function (item) {
      return '<div class="item-row" data-item-row="' + attr(item.id) + '">' +
        '<input data-item-id="' + attr(item.id) + '" data-item-field="desc" type="text" value="' + attr(item.desc) + '" placeholder="Description">' +
        '<input data-item-id="' + attr(item.id) + '" data-item-field="qty" type="number" min="0" step="0.01" value="' + attr(item.qty) + '">' +
        '<input data-item-id="' + attr(item.id) + '" data-item-field="unit" type="text" value="' + attr(item.unit) + '" placeholder="unit">' +
        '<input data-item-id="' + attr(item.id) + '" data-item-field="rate" type="number" min="0" step="0.01" value="' + attr(item.rate) + '">' +
        '<input data-item-id="' + attr(item.id) + '" data-item-field="discount" type="number" min="0" max="100" step="0.01" value="' + attr(item.discount) + '">' +
        '<button class="delete-item" type="button" data-delete-item="' + attr(item.id) + '" aria-label="Remove item">x</button>' +
      '</div>';
    }).join('');
  }

  function renderLogo() {
    var box = $('logoPreview');
    if (!box) return;
    box.innerHTML = state.business.logo ? '<img src="' + attr(state.business.logo) + '" alt="Business logo">' : 'Logo';
  }

  function renderPreview() {
    var calc = calculate();
    var preview = $('receiptPreview');
    var isGift = state.docType === 'gift';
    var docLabel = DOC_LABELS[state.docType] || 'Receipt';
    var contact = [state.business.phone, state.business.email].filter(Boolean).map(escapeHtml).join(' | ');
    var customerContact = [state.customer.phone, state.customer.email].filter(Boolean).map(escapeHtml).join('<br>');
    var rows = state.items.map(function (item) {
      var qty = numberOr(item.qty, 0);
      var rate = numberOr(item.rate, 0);
      var line = qty * rate;
      var discount = line * Math.max(0, numberOr(item.discount, 0)) / 100;
      var total = line - discount;
      if (isGift) {
        return '<tr><td>' + escapeHtml(item.desc || 'Item') + (item.note ? '<span class="item-note">' + escapeHtml(item.note) + '</span>' : '') + '</td><td>' + escapeHtml(qty + ' ' + (item.unit || '')) + '</td></tr>';
      }
      return '<tr><td>' + escapeHtml(item.desc || 'Item') + (item.note ? '<span class="item-note">' + escapeHtml(item.note) + '</span>' : '') + '</td><td>' + escapeHtml(qty + ' ' + (item.unit || '')) + '</td><td>' + money(rate) + '</td><td>' + money(total) + '</td></tr>';
    }).join('');

    preview.className = 'receipt-paper receipt-template-' + state.template;
    preview.innerHTML = [
      state.status ? '<div class="r-watermark">' + escapeHtml(state.status) + '</div>' : '',
      '<div class="r-head">',
        '<div>',
          state.business.logo ? '<div class="r-logo"><img src="' + attr(state.business.logo) + '" alt="Business logo"></div>' : '',
          '<div class="r-biz">' + escapeHtml(state.business.name || 'Business Name') + '</div>',
          state.business.address ? '<div class="r-muted">' + escapeHtml(state.business.address) + '</div>' : '',
          contact ? '<div class="r-muted">' + contact + '</div>' : '',
          state.business.taxId ? '<div class="r-small">' + escapeHtml(state.taxLabel || 'Tax') + ' ID: ' + escapeHtml(state.business.taxId) + '</div>' : '',
        '</div>',
        '<div>',
          '<div class="r-type">' + escapeHtml(docLabel) + '</div>',
          '<div class="r-small">No. ' + escapeHtml(state.receipt.number || '') + '</div>',
          '<div class="r-small">' + escapeHtml(formatDate(state.receipt.date)) + (state.receipt.time ? ' ' + escapeHtml(state.receipt.time) : '') + '</div>',
        '</div>',
      '</div>',
      '<div class="r-grid">',
        '<div class="r-box"><span class="r-label">Customer</span><div class="r-value">' + escapeHtml(state.customer.name || 'Walk-in customer') + '</div>' +
          (customerContact ? '<div class="r-muted">' + customerContact + '</div>' : '') +
          (state.customer.address ? '<div class="r-muted">' + escapeHtml(state.customer.address) + '</div>' : '') +
          (state.customer.taxId ? '<div class="r-small">Customer ID: ' + escapeHtml(state.customer.taxId) + '</div>' : '') +
        '</div>',
        '<div class="r-box"><span class="r-label">Transaction</span><div class="r-value">' + escapeHtml(state.status) + '</div>' +
          (state.receipt.branch ? '<div class="r-muted">Branch: ' + escapeHtml(state.receipt.branch) + '</div>' : '') +
          (state.receipt.cashier ? '<div class="r-muted">Issued by: ' + escapeHtml(state.receipt.cashier) + '</div>' : '') +
          (state.receipt.reference ? '<div class="r-muted">Ref: ' + escapeHtml(state.receipt.reference) + '</div>' : '') +
        '</div>',
      '</div>',
      '<table class="r-table"><thead><tr><th>Description</th><th>Qty</th>' + (isGift ? '' : '<th>Rate</th><th>Total</th>') + '</tr></thead><tbody>' + rows + '</tbody></table>',
      isGift ? '' : renderTotals(calc),
      renderPayment(calc),
      state.notes ? '<div class="r-note"><strong>Note:</strong><br>' + escapeHtml(state.notes) + '</div>' : '',
      state.terms ? '<div class="r-note"><strong>Terms:</strong><br>' + escapeHtml(state.terms) + '</div>' : '',
      '<div class="r-footer"><span>Generated with AfroTools.com</span><span>' + escapeHtml(state.currency) + '</span></div>'
    ].join('');
    renderQr(calc);
  }

  function renderTotals(calc) {
    var discountLabel = state.totals.discountType === 'amount'
      ? money(calc.globalDiscount)
      : (numberOr(state.totals.discount, 0).toFixed(2) + '%');
    return '<div class="r-totals">' +
      '<div class="r-total-row"><span>Subtotal</span><strong>' + money(calc.subtotal) + '</strong></div>' +
      (calc.lineDiscount ? '<div class="r-total-row"><span>Line discounts</span><strong>-' + money(calc.lineDiscount) + '</strong></div>' : '') +
      (calc.globalDiscount ? '<div class="r-total-row"><span>Discount ' + escapeHtml(discountLabel) + '</span><strong>-' + money(calc.globalDiscount) + '</strong></div>' : '') +
      (numberOr(state.totals.serviceCharge, 0) ? '<div class="r-total-row"><span>Service charge</span><strong>' + money(state.totals.serviceCharge) + '</strong></div>' : '') +
      (numberOr(state.totals.shipping, 0) ? '<div class="r-total-row"><span>Delivery</span><strong>' + money(state.totals.shipping) + '</strong></div>' : '') +
      (calc.tax ? '<div class="r-total-row"><span>' + escapeHtml(state.taxLabel || 'Tax') + ' ' + numberOr(state.totals.taxRate, 0).toFixed(2) + '%</span><strong>' + money(calc.tax) + '</strong></div>' : '') +
      (numberOr(state.totals.rounding, 0) ? '<div class="r-total-row"><span>Rounding</span><strong>' + money(state.totals.rounding) + '</strong></div>' : '') +
      '<div class="r-total-row final"><span>Total</span><strong>' + money(calc.total) + '</strong></div>' +
    '</div>';
  }

  function renderPayment(calc) {
    var details = [
      '<span class="r-label">Payment</span>',
      '<div class="r-value">' + escapeHtml(state.payment.method || 'Payment') + (state.payment.provider ? ' - ' + escapeHtml(state.payment.provider) : '') + '</div>',
      state.payment.reference ? '<div class="r-muted">Transaction ref: ' + escapeHtml(state.payment.reference) + '</div>' : '',
      state.payment.authCode ? '<div class="r-muted">Auth code: ' + escapeHtml(state.payment.authCode) + '</div>' : '',
      state.payment.last4 ? '<div class="r-muted">Card ending: ' + escapeHtml(state.payment.last4) + '</div>' : '',
      state.docType === 'gift' ? '' : '<div class="r-muted">Received: ' + money(calc.paid) + (calc.balance ? ' | Balance: ' + money(calc.balance) : '') + (calc.change ? ' | Change: ' + money(calc.change) : '') + '</div>'
    ].join('');
    return '<div class="r-payment"><div>' + details + '</div>' + (shouldShowQr() ? '<div class="r-qr" id="receiptQr" aria-label="Payment QR"></div>' : '') + '</div>';
  }

  function shouldShowQr() {
    return Boolean(state.payment.showQr && getQrPayload());
  }

  function getQrPayload() {
    var manual = String(state.payment.qrData || '').trim();
    if (manual) return manual;
    var calc = calculate();
    var parts = [
      state.business.name || 'Business',
      state.payment.method || '',
      state.payment.provider || '',
      state.payment.reference || state.receipt.number,
      plainMoney(calc.total)
    ].filter(Boolean);
    return parts.join(' | ');
  }

  function renderQr() {
    if (!shouldShowQr()) return;
    var target = $('receiptQr');
    if (!target || !window.QRCode) return;
    target.innerHTML = '';
    new window.QRCode(target, {
      text: getQrPayload(),
      width: 74,
      height: 74,
      colorDark: '#111827',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.M
    });
    target.querySelectorAll('canvas,img,table').forEach(function (node) {
      node.style.display = 'block';
      node.style.maxWidth = '74px';
      node.style.maxHeight = '74px';
    });
  }

  function renderMetrics() {
    var calc = calculate();
    $('metricSubtotal').textContent = money(calc.subtotal);
    $('metricTax').textContent = money(calc.tax);
    $('metricTotal').textContent = money(calc.total);
    $('metricBalance').textContent = money(calc.balance);
  }

  function renderQuality() {
    var calc = calculate();
    var needsReference = !['Cash', 'Other', 'Store credit'].includes(state.payment.method);
    var checks = [
      { label: 'Business details', ok: Boolean(state.business.name && (state.business.phone || state.business.email || state.business.address)), points: 14 },
      { label: 'Receipt number and date', ok: Boolean(state.receipt.number && state.receipt.date), points: 12 },
      { label: 'At least one priced item', ok: state.items.some(function (item) { return item.desc && numberOr(item.qty, 0) > 0 && numberOr(item.rate, 0) >= 0; }), points: 16 },
      { label: 'Customer record', ok: Boolean(state.customer.name || state.customer.phone || state.customer.email), points: 10 },
      { label: 'Payment method selected', ok: Boolean(state.payment.method), points: 10 },
      { label: 'Payment reference for non-cash', ok: !needsReference || Boolean(state.payment.reference || state.payment.authCode || state.payment.qrData), points: 12 },
      { label: 'Tax ID when tax is charged', ok: !(numberOr(state.totals.taxRate, 0) > 0 || state.docType === 'tax') || Boolean(state.business.taxId), points: 12 },
      { label: 'Paid amount matches status', ok: state.status === 'DECLINED' || state.docType === 'gift' || state.status !== 'PAID' || Math.abs(calc.balance) < 0.01, points: 8 },
      { label: 'Notes or return terms', ok: Boolean(state.notes || state.terms), points: 6 }
    ];
    var score = checks.reduce(function (sum, check) { return sum + (check.ok ? check.points : 0); }, 0);
    $('scoreValue').textContent = String(score);
    $('scoreMeter').style.width = score + '%';
    $('scoreBadge').textContent = score >= 90 ? 'Ready' : score >= 70 ? 'Review' : 'Draft';
    $('checkList').innerHTML = checks.map(function (check) {
      return '<div class="check-item ' + (check.ok ? 'ok' : '') + '"><span class="check-dot">' + (check.ok ? 'OK' : '!') + '</span><span><strong>' + escapeHtml(check.label) + '</strong></span></div>';
    }).join('');
  }

  function renderSaved() {
    if (!saveState) return;
    var panel = $('savedPanel');
    var grid = $('savedReceipts');
    var items = saveState.getAll();
    panel.hidden = !items.length;
    if (!items.length) {
      grid.innerHTML = '';
      return;
    }
    grid.innerHTML = items.map(function (item) {
      return '<article class="saved-card" data-saved-id="' + attr(item.id) + '">' +
        '<div class="saved-card-title">' + escapeHtml(item.title || 'Receipt') + '</div>' +
        '<div class="saved-card-date">' + escapeHtml(formatSavedDate(item.updatedAt)) + '</div>' +
        '<div class="saved-card-actions"><button type="button" data-open-saved="' + attr(item.id) + '">Open</button><button type="button" data-delete-saved="' + attr(item.id) + '">Delete</button></div>' +
      '</article>';
    }).join('');
  }

  function formatSavedDate(ts) {
    try {
      return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return 'Saved receipt';
    }
  }

  function renderAll() {
    renderPreview();
    renderMetrics();
    renderQuality();
    scheduleDraftSave();
  }

  function scheduleDraftSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(STORAGE_DRAFT, JSON.stringify(state));
        $('draftStatus').textContent = 'Saved locally';
      } catch (err) {
        $('draftStatus').textContent = 'Draft only';
      }
    }, 250);
  }

  function bindControls() {
    document.querySelectorAll('[data-bind]').forEach(function (el) {
      var path = el.getAttribute('data-bind');
      var handler = function () {
        var value = readControl(el);
        setPath(path, value);
        if (path === 'country') applyCountryPreset();
        if (path === 'status' && state.status === 'DECLINED') state.docType = 'declined';
        if (path === 'docType' && state.docType === 'refund') state.status = 'REFUNDED';
        if (path === 'docType' && state.docType === 'declined') state.status = 'DECLINED';
        if (path === 'payment.method' && !state.payment.provider) {
          state.payment.provider = state.payment.method;
        }
        syncForm();
        renderAll();
      };
      el.addEventListener(el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date' || el.type === 'time' ? 'change' : 'input', handler);
    });

    $('itemsList').addEventListener('input', function (event) {
      var input = event.target.closest('[data-item-id]');
      if (!input) return;
      var item = state.items.find(function (row) { return row.id === input.getAttribute('data-item-id'); });
      if (!item) return;
      var field = input.getAttribute('data-item-field');
      item[field] = ['qty', 'rate', 'discount'].includes(field) ? numberOr(input.value, 0) : input.value;
      renderAll();
    });

    $('itemsList').addEventListener('click', function (event) {
      var button = event.target.closest('[data-delete-item]');
      if (!button) return;
      var id = button.getAttribute('data-delete-item');
      state.items = state.items.filter(function (item) { return item.id !== id; });
      if (!state.items.length) state.items.push(newItem('Product or service', 1, 'item', 0, 0, ''));
      renderItems();
      renderAll();
    });

    $('addItemBtn').addEventListener('click', function () {
      state.items.push(newItem('Product or service', 1, 'item', 0, 0, ''));
      renderItems();
      renderAll();
    });

    $('addServiceBtn').addEventListener('click', function () {
      state.items.push(newItem('Professional service', 1, 'service', 0, 0, ''));
      renderItems();
      renderAll();
    });

    $('renumberBtn').addEventListener('click', function () {
      state.receipt.number = receiptNumber();
      syncForm();
      renderAll();
    });

    $('newReceiptBtn').addEventListener('click', function () {
      var profile = getProfile();
      state = normalize(profile ? deepMerge(defaults(), profile) : defaults());
      state.receipt.number = receiptNumber();
      state.receipt.date = today();
      state.receipt.time = nowTime();
      populateSelects();
      syncForm();
      renderItems();
      renderAll();
      notify('New receipt started.');
    });

    $('saveReceiptBtn').addEventListener('click', saveReceipt);
    $('saveProfileBtn').addEventListener('click', saveProfile);
    $('shareReceiptBtn').addEventListener('click', shareLink);
    $('downloadPdfBtn').addEventListener('click', downloadPdf);
    $('printBtn').addEventListener('click', function () { window.print(); });
    $('copySummaryBtn').addEventListener('click', copySummary);
    $('txtBtn').addEventListener('click', exportTxt);
    $('csvBtn').addEventListener('click', exportCsv);
    $('jsonBtn').addEventListener('click', exportJson);
    $('importJson').addEventListener('change', importJson);
    $('logoInput').addEventListener('change', handleLogo);
    $('clearLogoBtn').addEventListener('click', function () {
      state.business.logo = '';
      $('logoInput').value = '';
      renderLogo();
      renderAll();
    });

    $('savedReceipts').addEventListener('click', function (event) {
      var open = event.target.closest('[data-open-saved]');
      var del = event.target.closest('[data-delete-saved]');
      if (open) {
        var saved = saveState.load(open.getAttribute('data-open-saved'));
        if (saved && saved.data) {
          state = normalize(saved.data);
          populateSelects();
          syncForm();
          renderItems();
          renderAll();
          notify('Receipt loaded.');
        }
      }
      if (del) {
        var id = del.getAttribute('data-delete-saved');
        var item = saveState.load(id);
        if (window.confirm('Delete "' + (item ? item.title : 'this receipt') + '" from this browser?')) {
          saveState.delete(id);
          renderSaved();
        }
      }
    });
  }

  function readControl(el) {
    if (el.type === 'checkbox') return el.checked;
    if (el.type === 'number') return el.value === '' ? '' : numberOr(el.value, 0);
    return el.value;
  }

  function handleLogo(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      notify('Use PNG, JPG, or WebP logos only.');
      event.target.value = '';
      return;
    }
    if (file.size > 1200 * 1024) {
      notify('Logo must be under 1.2 MB.');
      event.target.value = '';
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var result = String(reader.result || '');
      if (!isSafeLogo(result)) {
        notify('Logo preview was blocked.');
        return;
      }
      state.business.logo = result;
      renderLogo();
      renderAll();
    };
    reader.readAsDataURL(file);
  }

  function isSafeLogo(value) {
    return !value || /^data:image\/(png|jpe?g|webp);base64,/i.test(String(value));
  }

  function saveReceipt() {
    if (!saveState) {
      notify('Saved receipts are unavailable in this browser.');
      return;
    }
    var title = (state.receipt.number || 'Receipt') + ' - ' + (state.customer.name || state.business.name || 'Customer');
    saveState.save({ title: title, data: JSON.parse(JSON.stringify(state)) });
    renderSaved();
    notify('Receipt saved in this browser.');
  }

  function saveProfile() {
    var profile = {
      country: state.country,
      currency: state.currency,
      taxLabel: state.taxLabel,
      business: JSON.parse(JSON.stringify(state.business)),
      totals: {
        taxRate: state.totals.taxRate,
        discount: 0,
        discountType: state.totals.discountType,
        serviceCharge: 0,
        shipping: 0,
        rounding: 0
      },
      payment: {
        method: state.payment.method,
        provider: state.payment.provider,
        showQr: state.payment.showQr
      },
      notes: state.notes,
      terms: state.terms
    };
    try {
      localStorage.setItem(STORAGE_PROFILE, JSON.stringify(profile));
      notify('Business profile saved.');
    } catch (err) {
      notify('Could not save profile.');
    }
  }

  function getProfile() {
    try {
      var raw = localStorage.getItem(STORAGE_PROFILE);
      if (raw) return JSON.parse(raw);
      var old = localStorage.getItem(OLD_PROFILE);
      if (old) {
        var data = JSON.parse(old);
        return {
          business: {
            name: data.bizName || '',
            address: data.bizAddr || '',
            phone: data.bizPhone || '',
            email: data.bizEmail || '',
            taxId: data.vatNumber || '',
            logo: isSafeLogo(data.logo) ? data.logo : ''
          },
          currency: data.currency || 'NGN',
          totals: { taxRate: data.taxRate || 7.5 }
        };
      }
    } catch (err) {}
    return null;
  }

  function copySummary() {
    var text = buildTextReceipt();
    if (!navigator.clipboard) {
      notify('Copy is not available in this browser.');
      return;
    }
    navigator.clipboard.writeText(text).then(function () {
      notify('Receipt summary copied.');
    }).catch(function () {
      notify('Copy failed. Use TXT export instead.');
    });
  }

  function exportTxt() {
    downloadBlob(buildTextReceipt(), fileBase() + '.txt', 'text/plain;charset=utf-8');
  }

  function exportCsv() {
    var calc = calculate();
    var rows = [
      ['Receipt', state.receipt.number],
      ['Date', state.receipt.date],
      ['Business', state.business.name],
      ['Customer', state.customer.name],
      [],
      ['Description', 'Qty', 'Unit', 'Rate', 'Discount %', 'Line total']
    ];
    state.items.forEach(function (item) {
      var line = numberOr(item.qty, 0) * numberOr(item.rate, 0);
      var discount = line * Math.max(0, numberOr(item.discount, 0)) / 100;
      rows.push([item.desc, item.qty, item.unit, item.rate, item.discount, (line - discount).toFixed(2)]);
    });
    rows.push([], ['Subtotal', calc.subtotal.toFixed(2)], ['Tax', calc.tax.toFixed(2)], ['Total', calc.total.toFixed(2)], ['Paid', calc.paid.toFixed(2)], ['Balance', calc.balance.toFixed(2)]);
    downloadBlob(rows.map(csvRow).join('\n'), fileBase() + '-items.csv', 'text/csv;charset=utf-8');
  }

  function exportJson() {
    downloadBlob(JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), data: state }, null, 2), fileBase() + '.json', 'application/json;charset=utf-8');
  }

  function importJson(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result || '{}'));
        state = normalize(parsed.data || parsed);
        populateSelects();
        syncForm();
        renderItems();
        renderAll();
        notify('Receipt imported.');
      } catch (err) {
        notify('Could not import that JSON file.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  function csvRow(row) {
    return row.map(function (cell) {
      var value = String(cell == null ? '' : cell);
      return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
    }).join(',');
  }

  function buildTextReceipt() {
    var calc = calculate();
    var lines = [
      DOC_LABELS[state.docType] || 'Receipt',
      'Receipt: ' + (state.receipt.number || ''),
      'Date: ' + (state.receipt.date || '') + (state.receipt.time ? ' ' + state.receipt.time : ''),
      'Business: ' + (state.business.name || ''),
      'Business tax ID: ' + (state.business.taxId || ''),
      'Customer: ' + (state.customer.name || 'Walk-in customer'),
      'Status: ' + state.status,
      '',
      'Items:'
    ];
    state.items.forEach(function (item) {
      var line = numberOr(item.qty, 0) * numberOr(item.rate, 0);
      lines.push('- ' + (item.desc || 'Item') + ' | ' + item.qty + ' ' + item.unit + ' x ' + plainMoney(item.rate) + ' = ' + plainMoney(line));
    });
    lines.push('', 'Subtotal: ' + plainMoney(calc.subtotal), 'Tax: ' + plainMoney(calc.tax), 'Total: ' + plainMoney(calc.total), 'Paid: ' + plainMoney(calc.paid), 'Balance: ' + plainMoney(calc.balance), '', 'Payment: ' + (state.payment.method || '') + ' ' + (state.payment.provider || ''), 'Reference: ' + (state.payment.reference || state.receipt.reference || ''), '', state.notes || '', state.terms || '');
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  function fileBase() {
    return (state.receipt.number || 'receipt').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'receipt';
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

  function downloadPdf() {
    if (!window.html2canvas || !window.jspdf || !window.jspdf.jsPDF) {
      notify('PDF tools are still loading.');
      return;
    }
    var button = $('downloadPdfBtn');
    var old = button.textContent;
    button.disabled = true;
    button.textContent = 'Working';
    window.html2canvas($('receiptPreview'), {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    }).then(function (canvas) {
      var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      var pageWidth = pdf.internal.pageSize.getWidth();
      var pageHeight = pdf.internal.pageSize.getHeight();
      var margin = 10;
      var imgWidth = pageWidth - margin * 2;
      var imgHeight = canvas.height * imgWidth / canvas.width;
      var imgData = canvas.toDataURL('image/png');
      var usableHeight = pageHeight - margin * 2;
      var y = margin;
      var heightLeft = imgHeight;
      pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
      heightLeft -= usableHeight;
      while (heightLeft > 0) {
        pdf.addPage();
        y = margin - (imgHeight - heightLeft);
        pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
        heightLeft -= usableHeight;
      }
      pdf.save(fileBase() + '.pdf');
      notify('PDF downloaded.');
    }).catch(function () {
      notify('PDF export failed. Try Print.');
    }).finally(function () {
      button.disabled = false;
      button.textContent = old;
    });
  }

  function shareLink() {
    try {
      var token = toBase64Url(JSON.stringify({ version: 2, data: state }));
      var url = window.location.origin + window.location.pathname + '?receipt=' + token;
      if (url.length > 7800) {
        notify('Receipt is too large for a share link. Export JSON instead.');
        return;
      }
      navigator.clipboard.writeText(url).then(function () {
        notify('Share link copied.');
      }).catch(function () {
        window.prompt('Copy receipt link', url);
      });
    } catch (err) {
      notify('Could not create share link.');
    }
  }

  function toBase64Url(text) {
    return btoa(unescape(encodeURIComponent(text))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function fromBase64Url(token) {
    var b64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return decodeURIComponent(escape(atob(b64)));
  }

  function restoreInitialState() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('receipt')) {
      try {
        var shared = JSON.parse(fromBase64Url(params.get('receipt')));
        return normalize(shared.data || shared);
      } catch (err) {
        notify('The shared receipt link could not be opened.');
      }
    }
    if (params.get('id') && saveState) {
      var saved = saveState.load(params.get('id'));
      if (saved && saved.data) return normalize(saved.data);
    }
    try {
      var draft = localStorage.getItem(STORAGE_DRAFT);
      if (draft) return normalize(JSON.parse(draft));
    } catch (err) {}
    var profile = getProfile();
    return normalize(profile ? deepMerge(defaults(), profile) : defaults());
  }

  function notify(message) {
    var live = $('receiptToast');
    if (!live) {
      live = document.createElement('div');
      live.id = 'receiptToast';
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');
      live.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:9999;max-width:320px;padding:11px 14px;border-radius:8px;background:#0f172a;color:#fff;font:700 13px DM Sans,system-ui;box-shadow:0 18px 36px rgba(15,23,42,.24);opacity:0;transform:translateY(8px);transition:opacity .18s ease,transform .18s ease;';
      document.body.appendChild(live);
    }
    live.textContent = message;
    live.style.opacity = '1';
    live.style.transform = 'translateY(0)';
    clearTimeout(notify.timer);
    notify.timer = setTimeout(function () {
      live.style.opacity = '0';
      live.style.transform = 'translateY(8px)';
    }, 2400);
  }

  function init() {
    state = restoreInitialState();
    populateSelects();
    syncForm();
    renderItems();
    bindControls();
    renderAll();
    renderSaved();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
