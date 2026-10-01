(function (root) {
  'use strict';
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function amount(value, allowZero) {
    var raw = String(value == null ? '' : value).trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) throw new Error('Enter a non-negative amount with at most two decimal places.');
    var cents = Math.round(Number(raw) * 100);
    if (!Number.isSafeInteger(cents) || (!allowZero && cents === 0)) throw new Error('Payment amount must be positive and within the supported range.');
    return cents / 100;
  }
  function required(value, label) {
    var result = String(value || '').trim();
    if (!result) throw new Error(label + ' is required.');
    return result;
  }
  function date(value) {
    value = required(value, 'Date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error('Enter a valid calendar date.');
    return value;
  }
  function id(prefix, records) {
    var key;
    do { key = prefix + '-' + (root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)); }
    while (records.some(function (r) { return r.id === key; }));
    return key;
  }
  function paid(state, invoice, exceptId) {
    var records = state.payments.filter(function (p) { return p.invoiceNumber === invoice.invoiceNumber; });
    if (!records.length) return Number(invoice.received) || 0;
    return records.reduce(function (sum, p) { var cents = Math.round(Number(p.amount) * 100); if (!Number.isSafeInteger(cents) || cents < 0) throw new Error('Historical payment amounts need review before allocation. Export the original records.'); return sum + (p.id === exceptId ? 0 : cents); }, 0) / 100;
  }
  function prepare(state, kind, input, editId) {
    var collection = { invoice: 'invoices', payment: 'payments', expense: 'expenses' }[kind];
    if (!collection) throw new Error('Unknown record type.');
    var previous = editId && state[collection].find(function (r) { return r.id === editId; });
    if (editId && !previous) throw new Error('Record no longer exists. Reopen it before correcting.');
    var record = Object.assign({}, previous || {}, { id: previous ? previous.id : id(kind.toUpperCase(), state[collection]) });
    record.amount = amount(input.amount, kind !== 'payment');
    record.currency = required(input.currency || state.currency, 'Currency');
    if (!/^[A-Z]{3}$/.test(record.currency)) throw new Error('Use a three-letter currency code.');
    if (kind !== 'payment' && record.currency !== (previous ? previous.currency : state.currency)) throw new Error('Keep the record currency equal to its finance file. No automatic conversion is performed.');
    record.receiptNote = String(input.note || '').trim();
    if (record.amount === 0 && !record.receiptNote) throw new Error('Explain the genuine zero-value entry in the note. It remains a draft or review record.');
    if (kind === 'invoice') {
      record.invoiceNumber = previous ? previous.invoiceNumber : required(input.invoiceNumber, 'Invoice number');
      if (state.invoices.some(function (i) { return i.id !== record.id && i.invoiceNumber === record.invoiceNumber; })) throw new Error('Invoice number already exists. Edit the existing invoice instead.');
      record.customer = required(input.customer, 'Customer');
      record.client = record.customer;
      record.issueDate = date(input.date);
      record.dueDate = date(input.dueDate);
      if (record.dueDate < record.issueDate) throw new Error('Due date must be on or after the invoice date.');
      var received = paid(state, record);
      if (record.amount < received) throw new Error('Invoice total cannot be below allocated payments. Correct payments first.');
      if (previous && record.currency !== previous.currency && received > 0) throw new Error('Correct allocated payments before changing currency.');
      var line = Object.assign({}, previous && previous.lines && previous.lines[0] || {}, { item: required(input.description, 'Description'), quantity: 1, unitPrice: record.amount, accountCode: input.accountCode });
      record.lines = [line]; record.discount = 0;
      record.incomeAccountCode = input.accountCode;
      record.status = record.amount === 0 ? 'draft' : previous ? previous.status : 'draft';
      record.received = received;
    } else if (kind === 'payment') {
      var invoice = state.invoices.find(function (i) { return i.invoiceNumber === input.invoiceNumber; });
      if (!invoice || invoice.status === 'cancelled') throw new Error('Choose an existing, uncancelled invoice.');
      if (previous && previous.invoiceNumber !== input.invoiceNumber) throw new Error('Invoice allocation is fixed for corrections.');
      if (record.currency !== invoice.currency) throw new Error('Payment currency must match its invoice.');
      // Never replace an unallocated historical received balance by guessing a payment.
      if (!state.payments.some(function (p) { return p.invoiceNumber === invoice.invoiceNumber; }) && Number(invoice.received) > 0) throw new Error('This invoice has a legacy received balance. Export and review it before adding payments; no historical allocation was guessed.');
      var balance = Math.round((amount(invoice.amount, true) - paid(state, invoice, editId)) * 100) / 100;
      if (record.amount > balance) throw new Error('Payment exceeds the remaining invoice balance (' + balance + ').');
      record.invoiceNumber = invoice.invoiceNumber;
      record.date = date(input.date);
      record.rail = required(input.rail, 'Payment method');
      record.referenceNote = required(input.reference, 'Payment reference');
      if (state.payments.some(function (p) { return p.id !== record.id && p.referenceNote === record.referenceNote && p.invoiceNumber === record.invoiceNumber; })) throw new Error('Payment reference already exists for this invoice.');
      record.partialPayment = record.amount < balance;
    } else {
      record.vendor = required(input.vendor, 'Vendor');
      record.category = required(input.category, 'Category');
      record.date = date(input.date);
      record.dueDate = date(input.dueDate || input.date);
      record.rail = required(input.rail, 'Payment method');
      record.paidStatus = input.paidStatus === 'paid' && record.amount > 0 ? 'paid' : 'unpaid';
      record.receiptStatus = input.receiptStatus === 'received' ? 'received' : 'missing';
      record.expenseAccountCode = input.accountCode;
      record.review = record.amount === 0 ? 'zero-value review' : 'Review needed';
    }
    return record;
  }
  function apply(state, kind, record) {
    var next = copy(state), collection = { invoice: 'invoices', payment: 'payments', expense: 'expenses' }[kind];
    var index = next[collection].findIndex(function (r) { return r.id === record.id; });
    if (index < 0) next[collection].push(record); else next[collection][index] = record;
    var contacts = kind === 'invoice' ? 'customers' : kind === 'expense' ? 'vendors' : '';
    var name = kind === 'invoice' ? record.customer : record.vendor;
    if (contacts && !next[contacts].some(function (r) { return String(r.name).toLowerCase() === name.toLowerCase(); })) next[contacts].push({id:id('CONTACT',next[contacts]),name:name,currency:record.currency});
    if (kind === 'invoice' && record.received > 0 && record.status !== 'cancelled') record.status = record.received >= record.amount ? 'paid' : 'part-paid';
    if (kind === 'payment') {
      var invoice = next.invoices.find(function (i) { return i.invoiceNumber === record.invoiceNumber; });
      invoice.received = paid(next, invoice);
      invoice.status = invoice.received >= invoice.amount ? 'paid' : 'part-paid';
    }
    return next;
  }
  function csvRows(raw) {
    var rows = [], row = [], field = '', quoted = false;
    raw = String(raw).replace(/^\uFEFF/, '');
    for (var n = 0; n < raw.length; n++) {
      var c = raw[n];
      if (c === '"') {
        if (quoted && raw[n + 1] === '"') { field += '"'; n++; } else quoted = !quoted;
      } else if (c === ',' && !quoted) { row.push(field.trim()); field = ''; }
      else if ((c === '\n' || c === '\r') && !quoted) {
        if (c === '\r' && raw[n + 1] === '\n') n++;
        row.push(field.trim()); if (row.some(Boolean)) rows.push(row); row = []; field = '';
      } else field += c;
    }
    if (quoted) throw new Error('CSV has an unclosed quoted field. Nothing imported.');
    row.push(field.trim()); if (row.some(Boolean)) rows.push(row);
    return rows;
  }
  function importCsv(state, raw, accountCode) {
    var rows = csvRows(raw), next = copy(state), errors = [], added = [], duplicates = 0;
    var header = rows.shift() || [];
    if (header.map(function (s) { return s.toLowerCase(); }).join(',') !== 'date,vendor,category,amount,rail,receipt status,note,due date') throw new Error('Use header: date,vendor,category,amount,rail,receipt status,note,due date');
    rows.forEach(function (cells, index) {
      try {
        if (cells.length !== 8) throw new Error('Expected eight columns.');
        var input = { date: cells[0], vendor: cells[1], category: cells[2], amount: cells[3], rail: cells[4], receiptStatus: cells[5], note: cells[6], dueDate: cells[7], currency: state.currency, accountCode: accountCode, paidStatus: /supplier credit|unpaid/i.test(cells[4]) ? 'unpaid' : 'paid' };
        var record = prepare(next, 'expense', input);
        // Store the canonical row itself: collision-free deduplication, local-only.
        record.importRowKey = JSON.stringify(cells);
        if (next.expenses.some(function (r) { return r.importRowKey === record.importRowKey; })) { duplicates++; return; }
        next = apply(next, 'expense', record); added.push(record.id);
      } catch (error) { errors.push({ row: index + 2, error: error.message }); }
    });
    return { state: next, added: added, errors: errors, duplicates: duplicates };
  }
  function download(name, data) {
    var url = URL.createObjectURL(new Blob([data], { type: 'application/json' })), a = document.createElement('a');
    a.href = url; a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function attach(api) {
    var host = document.getElementById('booksEntryControls');
    var status = document.getElementById('booksEntryStatus');
    var dialog = document.getElementById('booksEntryDialog');
    var form = document.getElementById('booksEntryForm');
    var fields = document.getElementById('booksEntryFields');
    var review = document.getElementById('booksEntryReview');
    var error = document.getElementById('booksEntryError');
    var pending = null, kind, editId, openedRaw, returnFocus;
    function message(text) { status.textContent = text; }
    function commit(next) {
      if (api.raw() !== openedRaw) throw new Error('Device records changed in another tab or account load. Export your work and reopen before saving.');
      api.commit(next); openedRaw = api.raw();
      api.render(); renderCorrections();
    }
    function add(name, label, value, type, options) {
      var wrap = document.createElement('label'); wrap.className = 'form-field'; wrap.textContent = label;
      var input = document.createElement(options ? 'select' : 'input'); input.name = name; input.className = 'form-input';
      if (!options) input.type = type || 'text';
      else options.forEach(function (pair) { var option = document.createElement('option'); option.value = pair[0]; option.textContent = pair[1]; input.appendChild(option); });
      input.value = value == null ? '' : value; wrap.appendChild(input); fields.appendChild(wrap); return input;
    }
    function open(type, recordId) {
      kind = type; editId = recordId || ''; pending = null; openedRaw = api.raw(); returnFocus = document.activeElement;
      var state = api.state(), collection = { invoice: 'invoices', payment: 'payments', expense: 'expenses' }[kind];
      var r = state[collection].find(function (item) { return item.id === editId; }) || {};
      if (kind === 'invoice' && editId && ((r.lines || []).length !== 1 || Number(r.discount))) { message('This historical invoice has multiple lines or a discount. Export it for review; the simple editor will not flatten it.'); return; }
      fields.replaceChildren(); review.textContent = ''; error.textContent = '';
      document.getElementById('booksEntryTitle').textContent = (editId ? 'Correct ' : 'Add ') + kind;
      document.getElementById('booksEntrySave').disabled = true;
      var today = new Date().toISOString().slice(0, 10);
      if (kind === 'invoice') {
        add('invoiceNumber', 'Invoice number', r.invoiceNumber || '');
        if (editId) form.elements.invoiceNumber.readOnly = true;
        add('customer', 'Customer', r.customer); add('description', 'Item or service', r.lines && r.lines[0] && r.lines[0].item);
      } else if (kind === 'payment') {
        add('invoiceNumber', 'Allocate to invoice', r.invoiceNumber, '', [['', 'Choose invoice']].concat(state.invoices.filter(function (i) { return i.status !== 'cancelled'; }).map(function (i) { return [i.invoiceNumber, i.invoiceNumber + ' · ' + i.currency + ' ' + i.amount]; })));
        if (editId) form.elements.invoiceNumber.disabled = true;
        add('reference', 'Payment reference (unique per invoice)', r.referenceNote);
      } else { add('vendor', 'Vendor', r.vendor); add('category', 'Category', r.category); }
      add('amount', 'Amount (decimal, no thousands separators)', r.amount, 'text');
      add('currency', 'Currency', r.currency || state.currency).readOnly = kind !== 'payment';
      add('date', kind === 'invoice' ? 'Invoice date' : 'Record date', r.issueDate || r.date || today, 'date');
      if (kind !== 'payment') add('dueDate', 'Due date', r.dueDate || today, 'date');
      if (kind !== 'invoice') add('rail', 'Payment method', r.rail || 'cash', '', [['cash', 'Cash'], ['bank transfer', 'Bank transfer'], ['mobile money', 'Mobile money'], ['supplier credit', 'Supplier credit']]);
      if (kind === 'expense') {
        add('paidStatus', 'Payment status', r.paidStatus || 'unpaid', '', [['unpaid', 'Unpaid'], ['paid', 'Paid']]);
        add('receiptStatus', 'Receipt status', r.receiptStatus || 'missing', '', [['missing', 'Missing'], ['received', 'Received']]);
      }
      add('note', 'Review note (required for zero-value records)', r.receiptNote);
      dialog.showModal(); fields.querySelector('input, select').focus();
    }
    function close() { dialog.close(); pending = null; if (returnFocus && returnFocus.isConnected) returnFocus.focus(); }
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    document.getElementById('booksEntryCancel').addEventListener('click', close);
    document.getElementById('booksDraftExport').addEventListener('click', function () {
      var draft = {}; Array.from(form.elements).forEach(function (el) { if (el.name) draft[el.name] = el.value; });
      download('afrobooks-unsaved-review.json', JSON.stringify({kind:kind,editId:editId,input:draft,reviewedRecord:pending},null,2));
    });
    form.addEventListener('input', function () { pending = null; review.textContent = ''; document.getElementById('booksEntrySave').disabled = true; });
    form.addEventListener('change', function () { pending = null; document.getElementById('booksEntrySave').disabled = true; });
    form.addEventListener('submit', function (event) {
      event.preventDefault(); error.textContent = '';
      try {
        var values = {}; Array.from(form.elements).forEach(function (el) { if (el.name) values[el.name] = el.value; });
        values.accountCode = kind === 'invoice' ? api.incomeCode() : api.expenseCode();
        pending = prepare(api.state(), kind, values, editId);
        review.textContent = 'Review: ' + kind + ' · ' + (pending.invoiceNumber || pending.vendor) + ' · ' + pending.currency + ' ' + pending.amount.toFixed(2) + '. Saves on this device only; no money moves.';
        document.getElementById('booksEntrySave').disabled = false;
      } catch (err) { pending = null; error.textContent = err.message; document.getElementById('booksEntrySave').disabled = true; }
    });
    document.getElementById('booksEntrySave').addEventListener('click', function () {
      if (!pending) return;
      try { var previousCount = api.state().invoices.length + api.state().payments.length + api.state().expenses.length; commit(apply(api.state(), kind, pending));
        var analytics = root.AfroTools && root.AfroTools.analytics;
        try { if (analytics && analytics.track) analytics.track(previousCount ? 'pro_repeat_use' : 'pro_useful_result', {app_id:'books',record_type:kind,action:editId?'correct':'create'}); } catch (measurementError) {}
        message('Reviewed ' + kind + ' saved on this device.'); close(); }
      catch (err) { error.textContent = err.message; }
    });
    function renderCorrections() {
      var select = document.getElementById('booksCorrectionSelect'); select.replaceChildren();
      [['invoice', 'invoices'], ['payment', 'payments'], ['expense', 'expenses']].forEach(function (pair) {
        api.state()[pair[1]].forEach(function (r) { var o = document.createElement('option'); o.value = JSON.stringify([pair[0], r.id]); o.textContent = pair[0] + ' · ' + (r.invoiceNumber || r.vendor || r.id) + ' · ' + r.id; select.appendChild(o); });
      });
    }
    document.getElementById('booksCorrectionBtn').addEventListener('click', function () { var value = document.getElementById('booksCorrectionSelect').value; if (value) { var pair = JSON.parse(value); open(pair[0], pair[1]); } else message('No records to correct yet.'); });
    document.getElementById('booksRecoveryBtn').addEventListener('click', function () { download('afrobooks-device-recovery.json', api.raw() || JSON.stringify(api.state())); });
    var importPending, importRaw;
    document.getElementById('booksImportCancel').addEventListener('click', function () { importPending = null; document.getElementById('booksImportReview').hidden = true; });
    document.getElementById('booksImportSave').addEventListener('click', function () {
      if (!importPending) return;
      try { openedRaw = importRaw; commit(importPending.state); message(importPending.added.length + ' valid expense row(s) saved; ' + importPending.errors.length + ' invalid row(s) rejected; ' + importPending.duplicates + ' duplicate row(s) skipped.'); importPending = null; document.getElementById('booksImportReview').hidden = true; }
      catch (err) { message(err.message); }
    });
    renderCorrections(); host.hidden = false;
    return { open: open, refresh: renderCorrections, importFile: function (file) {
      if (!file) return;
      if (file.size > 1024 * 1024) { message('CSV exceeds the 1 MB local import limit. Nothing imported.'); return; }
      importRaw = api.raw();
      var reader = new FileReader();
      reader.onerror = function () { message('CSV could not be read. Nothing imported.'); };
      reader.onload = function () {
        try {
          importPending = importCsv(api.state(), reader.result, api.expenseCode());
          document.getElementById('booksImportReport').textContent = importPending.added.length + ' valid row(s); ' + importPending.duplicates + ' duplicate(s) skipped. Invalid rows: ' + (importPending.errors.map(function (e) { return 'row ' + e.row + ': ' + e.error; }).join(' | ') || 'none') + '. Only valid rows will be saved if you confirm.';
          document.getElementById('booksImportReview').hidden = false;
        } catch (err) { message(err.message); importPending = null; }
        document.getElementById('expenseCsvInput').value = '';
      }; reader.readAsText(file);
    } };
  }
  var api = { amount: amount, prepare: prepare, apply: apply, importCsv: importCsv, attach: attach };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.AfroBooksEntry = api;
})(typeof window !== 'undefined' ? window : globalThis);
