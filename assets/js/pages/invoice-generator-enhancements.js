/* AfroTools Invoice Generator enhancements */
(function () {
  "use strict";

  var ITEM_KEY = "afro_invoice_saved_items_v2";
  var SAVE_SLUG = "invoice-generator";
  var SHARE_PARAM = "invoice";
  var lastItemRow = null;

  var CURRENCIES = {
    NGN: { s: "\u20A6", name: "Nigerian Naira" },
    KES: { s: "KSh", name: "Kenyan Shilling" },
    GHS: { s: "GH\u20B5", name: "Ghanaian Cedi" },
    ZAR: { s: "R", name: "South African Rand" },
    RWF: { s: "Frw", name: "Rwandan Franc" },
    TZS: { s: "Sh", name: "Tanzanian Shilling" },
    ETB: { s: "Br", name: "Ethiopian Birr" },
    UGX: { s: "Ush", name: "Ugandan Shilling" },
    XOF: { s: "Fr", name: "West African CFA" },
    XAF: { s: "Fr", name: "Central African CFA" },
    EGP: { s: "\u00A3", name: "Egyptian Pound" },
    MAD: { s: "\u062F.\u0645.", name: "Moroccan Dirham" },
    TND: { s: "\u062F.\u062A", name: "Tunisian Dinar" },
    SDG: { s: "\u062C.\u0633.", name: "Sudanese Pound" },
    SOS: { s: "Sh", name: "Somali Shilling" },
    MUR: { s: "\u20A8", name: "Mauritian Rupee" },
    SCR: { s: "\u20A8", name: "Seychellois Rupee" },
    BWP: { s: "P", name: "Botswana Pula" },
    MZN: { s: "MT", name: "Mozambican Metical" },
    USD: { s: "$", name: "US Dollar" },
    GBP: { s: "\u00A3", name: "British Pound" },
    EUR: { s: "\u20AC", name: "Euro" }
  };

  var TERMS_MAP = {
    "due-receipt": "Due on Receipt",
    "net-7": "Net 7 days",
    "net-15": "Net 15 days",
    "net-30": "Net 30 days",
    "net-45": "Net 45 days",
    "net-60": "Net 60 days"
  };

  function $(id) {
    return document.getElementById(id);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function text(id) {
    var el = $(id);
    return el ? el.textContent || "" : "";
  }

  function value(id) {
    var el = $(id);
    return el ? el.value || "" : "";
  }

  function setValue(id, next) {
    var el = $(id);
    if (el) el.value = next == null ? "" : next;
  }

  function number(id) {
    var raw = String(value(id)).replace(/,/g, "");
    var parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function currency() {
    return value("currency") || "NGN";
  }

  function fmt(amount, code) {
    var sym = (CURRENCIES[code] || {}).s || code || "";
    var safe = Number.isFinite(amount) ? amount : 0;
    return sym + " " + safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function escapeHtml(input) {
    var div = document.createElement("div");
    div.textContent = input == null ? "" : String(input);
    return div.innerHTML;
  }

  function toast(message, type) {
    var api = window.AfroTools && window.AfroTools.toast;
    var level = type || "success";
    if (api && typeof api[level] === "function") {
      api[level](message);
    } else if (api && typeof api.success === "function") {
      api.success(message);
    }
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
  }

  function copyText(textToCopy) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(textToCopy).catch(function () {
        return fallbackCopy(textToCopy);
      });
    }
    return fallbackCopy(textToCopy);
  }

  function fallbackCopy(textToCopy) {
    var area = document.createElement("textarea");
    area.value = textToCopy;
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    return Promise.resolve();
  }

  function readItems() {
    return qsa(".line-item").map(function (row) {
      var desc = row.querySelector(".li-desc");
      var qty = row.querySelector(".li-qty");
      var price = row.querySelector(".li-price");
      var tax = row.querySelector(".li-tax");
      var quantity = parseFloat(qty && qty.value) || 0;
      var unitPrice = parseFloat(price && price.value) || 0;
      var itemTax = parseFloat(tax && tax.value) || 0;
      return {
        row: row,
        desc: desc ? desc.value.trim() : "",
        qty: quantity,
        price: unitPrice,
        tax: itemTax
      };
    });
  }

  function calculateTotals() {
    var taxType = value("taxType") || "vat";
    var taxRate = number("taxRate");
    var subtotal = 0;
    var perItemTax = 0;

    readItems().forEach(function (item) {
      var line = item.qty * item.price;
      subtotal += line;
      if (taxType === "per-item") perItemTax += line * item.tax / 100;
    });

    var discountPct = number("discountPercent");
    var discount = subtotal * discountPct / 100;
    var tax = taxType === "none" ? 0 : taxType === "vat" ? (subtotal - discount) * taxRate / 100 : perItemTax;
    var total = subtotal - discount + tax;
    var withholding = (subtotal - discount) * number("withholdingPercent") / 100;
    var paid = number("amountPaid");
    var balance = Math.max(0, total - withholding - paid);

    return {
      subtotal: subtotal,
      discount: discount,
      tax: tax,
      total: total,
      withholding: withholding,
      paid: paid,
      balance: balance
    };
  }

  function setText(id, next) {
    var el = $(id);
    if (el) el.textContent = next;
  }

  function toggleRow(id, visible) {
    var el = $(id);
    if (el) el.style.display = visible ? "" : "none";
  }

  function paymentDetailsPlain() {
    var parts = [];
    var method = value("paymentMethod");
    var methodLabel = {
      bank: "Bank transfer",
      "mobile-money": "Mobile money",
      "card-link": "Card or payment link",
      cash: "Cash",
      mixed: "Mixed payment"
    }[method] || "Bank transfer";
    parts.push("Method: " + methodLabel);
    if (value("poNumber")) parts.push("PO/Ref: " + value("poNumber"));
    if (value("paymentLink")) parts.push("Payment link: " + value("paymentLink"));
    if (value("mobileMoney")) parts.push("Mobile money/WhatsApp: " + value("mobileMoney"));
    if (value("bankDetails")) parts.push(value("bankDetails"));
    return parts;
  }

  function refreshEnhancedTotals() {
    var code = currency();
    var totals = calculateTotals();
    setText("sumWithholding", "-" + fmt(totals.withholding, code));
    setText("sumPaid", "-" + fmt(totals.paid, code));
    setText("sumBalance", fmt(totals.balance, code));
    setText("pWithholding", "-" + fmt(totals.withholding, code));
    setText("pPaid", "-" + fmt(totals.paid, code));
    setText("pBalance", fmt(totals.balance, code));
    toggleRow("sumWithholdingRow", totals.withholding > 0);
    toggleRow("sumPaidRow", totals.paid > 0);
    toggleRow("pWithholdingRow", totals.withholding > 0);
    toggleRow("pPaidRow", totals.paid > 0);

    var details = paymentDetailsPlain();
    var paymentSection = $("pPaymentSection");
    var paymentDetails = $("pPaymentDetails");
    if (paymentSection && paymentDetails) {
      paymentSection.style.display = details.length > 1 || value("bankDetails") ? "" : "none";
      paymentDetails.innerHTML = details.map(escapeHtml).join("<br>");
    }

    var status = $("invoiceStatusPanel");
    if (status) {
      var due = value("dueDate");
      var paid = $("markPaid") && $("markPaid").checked;
      var isOverdue = !paid && due && new Date(due) < new Date(new Date().toISOString().slice(0, 10));
      var statusLabel = paid ? "Paid" : isOverdue ? "Overdue" : totals.balance <= 0 && totals.total > 0 ? "Settled" : "Draft";
      var message = "<strong>" + statusLabel + ":</strong> " +
        "Total " + fmt(totals.total, code) + ", balance due " + fmt(totals.balance, code) + ".";
      if (value("paymentLink") || value("mobileMoney") || value("bankDetails")) {
        message += " Payment instructions are included.";
      } else {
        message += " Add payment instructions before sending.";
      }
      status.innerHTML = message;
    }
  }

  function enhancedState() {
    var base = {};
    if (window.AfroInvoiceState && typeof window.AfroInvoiceState.gatherState === "function") {
      base = window.AfroInvoiceState.gatherState() || {};
    }
    base.po = value("poNumber");
    base.pm = value("paymentMethod");
    base.pl = value("paymentLink");
    base.mm = value("mobileMoney");
    base.bd = value("bankDetails");
    base.ap = value("amountPaid");
    base.wh = value("withholdingPercent");
    base.v = 2;
    return base;
  }

  function restoreEnhancedState(state) {
    if (!state) return false;
    var restored = false;
    if (window.AfroInvoiceState && typeof window.AfroInvoiceState.restoreState === "function") {
      restored = window.AfroInvoiceState.restoreState(state);
    }
    setValue("poNumber", state.po || "");
    setValue("paymentMethod", state.pm || "bank");
    setValue("paymentLink", state.pl || "");
    setValue("mobileMoney", state.mm || "");
    setValue("bankDetails", state.bd || "");
    setValue("amountPaid", state.ap || "0");
    setValue("withholdingPercent", state.wh || "0");
    if (window.AfroInvoiceState && typeof window.AfroInvoiceState.updatePreview === "function") {
      window.AfroInvoiceState.updatePreview();
    }
    refreshEnhancedTotals();
    return restored;
  }

  function encodeState(state) {
    var json = JSON.stringify(state);
    var b64 = btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeState(token) {
    var padded = String(token || "").replace(/-/g, "+").replace(/_/g, "/");
    while (padded.length % 4) padded += "=";
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  }

  function shareInvoice(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    var state = enhancedState();
    var url = new URL(window.location.href.split("?")[0]);
    url.searchParams.set(SHARE_PARAM, encodeState(state));
    var title = "Invoice " + (value("invoiceNumber") || "");
    var message = title + " from " + (value("companyName") || "AfroTools");
    if (navigator.share) {
      navigator.share({ title: title, text: message, url: url.toString() }).then(function () {
        toast("Share sheet opened");
      }).catch(function (err) {
        if (err && err.name === "AbortError") return;
        copyText(url.toString()).then(function () { toast("Invoice link copied"); });
      });
      return;
    }
    copyText(url.toString()).then(function () { toast("Invoice link copied"); });
  }

  function loadSharedInvoice() {
    var token = new URLSearchParams(window.location.search).get(SHARE_PARAM);
    if (!token) return;
    try {
      restoreEnhancedState(decodeState(token));
      toast("Shared invoice loaded", "info");
    } catch (err) {
      toast("Could not load shared invoice", "error");
    }
  }

  function validateInvoice() {
    if (!value("companyName").trim()) return "Company name is required.";
    if (!value("clientName").trim()) return "Client name is required.";
    if (!value("invoiceNumber").trim()) return "Invoice number is required.";
    if (!value("invoiceDate")) return "Invoice date is required.";
    if (!value("dueDate")) return "Due date is required.";
    if (!readItems().some(function (item) { return item.desc; })) return "Add at least one line item with a description.";
    return "";
  }

  function addWrappedText(doc, textValue, x, y, maxWidth, lineHeight) {
    if (!textValue) return y;
    var lines = doc.splitTextToSize(String(textValue), maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * lineHeight;
  }

  function ensurePage(doc, y) {
    if (y < 270) return y;
    doc.addPage();
    return 20;
  }

  function generatePdf(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    var validation = validateInvoice();
    if (validation) {
      toast(validation, "error");
      return;
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      toast("PDF engine did not load. Refresh and try again.", "error");
      return;
    }

    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4" });
    var code = currency();
    var totals = calculateTotals();
    var margin = 16;
    var pageWidth = 210;
    var contentWidth = pageWidth - margin * 2;
    var y = 18;
    var brand = [0, 98, 204];
    var dark = [15, 23, 42];
    var muted = [100, 116, 139];

    doc.setFillColor.apply(doc, dark);
    doc.rect(0, 0, 210, 46, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("INVOICE", margin, y);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("#" + value("invoiceNumber"), margin, y + 7);
    doc.text(value("companyName") || "Your Company", 194, y, { align: "right" });
    doc.setTextColor(180, 198, 220);
    doc.text("Generated by AfroTools", 194, y + 7, { align: "right" });

    var logo = $("previewLogoImg");
    if (logo && logo.src && /^data:image\//.test(logo.src)) {
      try { doc.addImage(logo.src, "PNG", 145, 25, 42, 16, undefined, "FAST"); } catch (err) {}
    }

    y = 58;
    doc.setTextColor.apply(doc, dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("From", margin, y);
    doc.text("Bill To", 112, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor.apply(doc, muted);
    y += 6;
    addWrappedText(doc, [
      value("companyName"),
      value("businessAddress"),
      value("businessEmail"),
      value("businessPhone"),
      value("taxID") ? "Tax ID: " + value("taxID") : ""
    ].filter(Boolean).join("\n"), margin, y, 78, 4.3);
    addWrappedText(doc, [
      value("clientName"),
      value("clientCompany"),
      value("clientAddress"),
      value("clientEmail")
    ].filter(Boolean).join("\n"), 112, y, 78, 4.3);

    y = 94;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y - 6, contentWidth, 20, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor.apply(doc, muted);
    [["Invoice Date", value("invoiceDate")], ["Due Date", value("dueDate")], ["Terms", TERMS_MAP[value("paymentTerms")] || "Net 30"], ["Currency", code]].forEach(function (item, index) {
      var x = margin + index * (contentWidth / 4) + 4;
      doc.text(item[0].toUpperCase(), x, y);
      doc.setTextColor.apply(doc, dark);
      doc.setFontSize(8.5);
      doc.text(String(item[1] || "-"), x, y + 7);
      doc.setFontSize(7);
      doc.setTextColor.apply(doc, muted);
    });

    y = 125;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, dark);
    doc.text("Line Items", margin, y);
    y += 6;
    doc.setFillColor.apply(doc, brand);
    doc.rect(margin, y - 5, contentWidth, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    var headers = [["Description", margin + 2], ["Qty", 105], ["Unit", 126], ["Tax", 151], ["Total", 192]];
    headers.forEach(function (header) { doc.text(header[0], header[1], y, header[0] === "Total" ? { align: "right" } : undefined); });
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setTextColor.apply(doc, dark);
    readItems().filter(function (item) { return item.desc; }).forEach(function (item) {
      y = ensurePage(doc, y);
      var lineSub = item.qty * item.price;
      var lineTax = value("taxType") === "per-item" ? lineSub * item.tax / 100 : 0;
      var lineTotal = lineSub + lineTax;
      var descLines = doc.splitTextToSize(item.desc, 78);
      var rowHeight = Math.max(8, descLines.length * 4.3 + 2);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y - 4, margin + contentWidth, y - 4);
      doc.text(descLines, margin + 2, y);
      doc.text(String(item.qty), 105, y, { align: "right" });
      doc.text(fmt(item.price, code), 142, y, { align: "right" });
      doc.text(item.tax ? item.tax + "%" : "-", 160, y, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(fmt(lineTotal, code), 194, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += rowHeight;
    });

    y = ensurePage(doc, y + 5);
    var totalsX = 118;
    var totalsRows = [
      ["Subtotal", fmt(totals.subtotal, code)],
      ["Discount", "-" + fmt(totals.discount, code)],
      ["Tax", fmt(totals.tax, code)],
      ["Total", fmt(totals.total, code)]
    ];
    if (totals.withholding > 0) totalsRows.push(["Withholding", "-" + fmt(totals.withholding, code)]);
    if (totals.paid > 0) totalsRows.push(["Amount paid", "-" + fmt(totals.paid, code)]);
    totalsRows.push(["Balance due", fmt(totals.balance, code)]);
    totalsRows.forEach(function (row, index) {
      var isFinal = index === totalsRows.length - 1;
      if (isFinal) {
        doc.setDrawColor.apply(doc, brand);
        doc.line(totalsX, y - 2, 194, y - 2);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor.apply(doc, brand);
      } else {
        doc.setFont("helvetica", row[0] === "Total" ? "bold" : "normal");
        doc.setFontSize(8.5);
        doc.setTextColor.apply(doc, dark);
      }
      doc.text(row[0], totalsX, y);
      doc.text(row[1], 194, y, { align: "right" });
      y += isFinal ? 7 : 5.5;
    });

    y = ensurePage(doc, y + 5);
    doc.setTextColor.apply(doc, dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Payment Instructions", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor.apply(doc, muted);
    y = addWrappedText(doc, paymentDetailsPlain().join("\n"), margin, y + 6, contentWidth, 4.2);
    if (value("notes")) {
      y = ensurePage(doc, y + 4);
      doc.setFont("helvetica", "bold");
      doc.setTextColor.apply(doc, dark);
      doc.text("Notes", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor.apply(doc, muted);
      y = addWrappedText(doc, value("notes"), margin, y + 6, contentWidth, 4.2);
    }

    doc.setFillColor(248, 250, 252);
    doc.rect(0, 280, 210, 17, "F");
    doc.setFontSize(7);
    doc.setTextColor.apply(doc, muted);
    doc.text("Generated locally by afrotools.com/tools/invoice-generator/", margin, 287);
    doc.text(new Date().toLocaleDateString("en-GB"), 194, 287, { align: "right" });

    var filename = "invoice-" + (value("invoiceNumber") || "draft").replace(/[^a-z0-9_-]+/gi, "-") + ".pdf";
    doc.save(filename);
    toast("PDF downloaded");
  }

  function exportJson() {
    var name = "invoice-" + (value("invoiceNumber") || "draft").replace(/[^a-z0-9_-]+/gi, "-") + ".json";
    downloadBlob(new Blob([JSON.stringify(enhancedState(), null, 2)], { type: "application/json" }), name);
    toast("Invoice JSON exported");
  }

  function importJsonFile(file) {
    if (!file) return;
    file.text().then(function (textValue) {
      restoreEnhancedState(JSON.parse(textValue));
      toast("Invoice JSON imported");
    }).catch(function (err) {
      toast("Import failed: " + (err && err.message ? err.message : "invalid file"), "error");
    });
  }

  function saveInvoice() {
    if (typeof window.SaveState === "undefined") {
      toast("Saved invoices are not available yet", "error");
      return;
    }
    var state = enhancedState();
    var totals = calculateTotals();
    var title = (value("invoiceNumber") || "Invoice") + " - " + (value("clientName") || "Client");
    var saved = new window.SaveState(SAVE_SLUG, { maxFree: 30 }).save({
      id: state.in || undefined,
      title: title,
      data: {
        client: value("clientName"),
        total: fmt(totals.total, currency()),
        balance: fmt(totals.balance, currency()),
        state: state
      }
    });
    renderSavedInvoices();
    toast("Invoice saved: " + saved.title);
  }

  function renderSavedInvoices() {
    if (typeof window.SaveState === "undefined") return;
    var section = $("inv-saved-section");
    var grid = $("inv-saved-grid");
    if (!section || !grid) return;
    var items = new window.SaveState(SAVE_SLUG, { maxFree: 30 }).getAll();
    if (!items.length) {
      section.style.display = "none";
      return;
    }
    section.style.display = "";
    grid.innerHTML = items.map(function (item) {
      var data = item.data || {};
      return '<button type="button" class="invoice-saved-card" data-id="' + escapeHtml(item.id) + '" style="text-align:left;background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:10px;padding:14px;cursor:pointer;">' +
        '<span style="display:block;font-size:.82rem;font-weight:800;color:#111827;margin-bottom:3px;">' + escapeHtml(item.title) + '</span>' +
        '<span style="display:block;font-size:.72rem;color:#64748b;">Client: ' + escapeHtml(data.client || "-") + '</span>' +
        '<span style="display:block;font-size:.78rem;font-weight:800;color:#0062CC;margin-top:4px;">' + escapeHtml(data.balance || data.total || "") + '</span>' +
        '<span style="display:block;font-size:.65rem;color:#94a3b8;margin-top:5px;">' + new Date(item.updatedAt).toLocaleDateString("en-GB") + '</span>' +
      '</button>';
    }).join("");
    qsa(".invoice-saved-card", grid).forEach(function (card) {
      card.addEventListener("click", function () {
        var saved = new window.SaveState(SAVE_SLUG, { maxFree: 30 }).load(card.dataset.id);
        if (saved && saved.data && saved.data.state) {
          restoreEnhancedState(saved.data.state);
          window.scrollTo({ top: 0, behavior: "smooth" });
          toast("Invoice loaded");
        }
      });
    });
  }

  function savedItems() {
    try { return JSON.parse(localStorage.getItem(ITEM_KEY) || "[]"); } catch (err) { return []; }
  }

  function writeSavedItems(items) {
    localStorage.setItem(ITEM_KEY, JSON.stringify(items.slice(-50)));
  }

  function renderSavedItems() {
    var select = $("savedItemSelect");
    if (!select) return;
    var current = select.value;
    var items = savedItems();
    select.innerHTML = '<option value="">Saved items</option>' + items.map(function (item, index) {
      return '<option value="' + index + '">' + escapeHtml(item.desc) + " - " + fmt(Number(item.price) || 0, currency()) + "</option>";
    }).join("");
    select.value = current;
  }

  function saveItem() {
    var item = readItems().find(function (row) { return row.desc; });
    if (!item) {
      toast("Enter an item description first", "error");
      return;
    }
    var items = savedItems();
    items.push({ desc: item.desc, qty: item.qty || 1, price: item.price || 0, tax: item.tax || 0 });
    writeSavedItems(items);
    renderSavedItems();
    toast("Item saved");
  }

  function writableItemRow() {
    var empty = readItems().find(function (item) { return !item.desc; });
    if (empty) return empty.row;
    var add = $("btnAddItem");
    if (add) add.click();
    var rows = qsa(".line-item");
    return rows[rows.length - 1];
  }

  function applySavedItem() {
    var select = $("savedItemSelect");
    var index = select ? parseInt(select.value, 10) : -1;
    var item = savedItems()[index];
    if (!item) {
      toast("Choose a saved item first", "error");
      return;
    }
    var row = writableItemRow();
    if (!row) return;
    row.querySelector(".li-desc").value = item.desc || "";
    row.querySelector(".li-qty").value = item.qty || 1;
    row.querySelector(".li-price").value = item.price || 0;
    row.querySelector(".li-tax").value = item.tax || 0;
    row.querySelector(".li-desc").dispatchEvent(new Event("input", { bubbles: true }));
    refreshEnhancedTotals();
    toast("Saved item added");
  }

  function reminderText() {
    var totals = calculateTotals();
    var lines = [
      "Hello " + (value("clientName") || "there") + ",",
      "",
      "A quick reminder that invoice " + (value("invoiceNumber") || "") + " from " + (value("companyName") || "us") + " is due on " + (value("dueDate") || "the due date") + ".",
      "Balance due: " + fmt(totals.balance, currency()) + "."
    ];
    if (value("paymentLink")) lines.push("Payment link: " + value("paymentLink"));
    if (value("mobileMoney")) lines.push("Mobile money/WhatsApp: " + value("mobileMoney"));
    if (value("bankDetails")) lines.push(value("bankDetails"));
    lines.push("", "Thank you.");
    return lines.join("\n");
  }

  function copyReminder(event) {
    event.preventDefault();
    copyText(reminderText()).then(function () { toast("Payment reminder copied"); });
  }

  function bindEvents() {
    var pdf = $("btnPDF");
    var share = $("btnShare");
    var save = $("btnSaveInvoice");
    var print = $("btnPrint");
    var exportBtn = $("btnExportJson");
    var importBtn = $("btnImportJson");
    var importInput = $("importJsonInput");
    var reminder = $("btnReminder");
    var saveItemBtn = $("btnSaveItem");
    var applyItemBtn = $("btnApplySavedItem");

    if (pdf) pdf.addEventListener("click", generatePdf, true);
    if (share) share.addEventListener("click", shareInvoice, true);
    if (save) save.addEventListener("click", saveInvoice);
    if (print) print.addEventListener("click", function () { window.print(); });
    if (exportBtn) exportBtn.addEventListener("click", exportJson);
    if (importBtn) importBtn.addEventListener("click", function () { if (importInput) importInput.click(); });
    if (importInput) importInput.addEventListener("change", function () { importJsonFile(importInput.files && importInput.files[0]); });
    if (reminder) reminder.addEventListener("click", copyReminder);
    if (saveItemBtn) saveItemBtn.addEventListener("click", saveItem);
    if (applyItemBtn) applyItemBtn.addEventListener("click", applySavedItem);

    ["poNumber", "paymentMethod", "paymentLink", "mobileMoney", "bankDetails", "amountPaid", "withholdingPercent"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener("input", refreshEnhancedTotals);
      el.addEventListener("change", refreshEnhancedTotals);
    });
    document.addEventListener("input", function (event) {
      if (event.target && event.target.closest && event.target.closest(".line-item, .totals, #currency, #taxType, #taxRate")) {
        setTimeout(refreshEnhancedTotals, 0);
      }
    });
    document.addEventListener("focusin", function (event) {
      if (event.target && event.target.closest) {
        var row = event.target.closest(".line-item");
        if (row) lastItemRow = row;
      }
    });
  }

  function patchStateApi() {
    if (!window.AfroInvoiceState || window.AfroInvoiceState.__enhanced) return;
    var originalGather = window.AfroInvoiceState.gatherState;
    var originalRestore = window.AfroInvoiceState.restoreState;
    var originalUpdate = window.AfroInvoiceState.updatePreview;
    window.AfroInvoiceState.gatherState = function () {
      var base = typeof originalGather === "function" ? originalGather() || {} : {};
      base.po = value("poNumber");
      base.pm = value("paymentMethod");
      base.pl = value("paymentLink");
      base.mm = value("mobileMoney");
      base.bd = value("bankDetails");
      base.ap = value("amountPaid");
      base.wh = value("withholdingPercent");
      base.v = 2;
      return base;
    };
    window.AfroInvoiceState.restoreState = function (state) {
      var ok = typeof originalRestore === "function" ? originalRestore(state) : false;
      setValue("poNumber", state && state.po || "");
      setValue("paymentMethod", state && state.pm || "bank");
      setValue("paymentLink", state && state.pl || "");
      setValue("mobileMoney", state && state.mm || "");
      setValue("bankDetails", state && state.bd || "");
      setValue("amountPaid", state && state.ap || "0");
      setValue("withholdingPercent", state && state.wh || "0");
      refreshEnhancedTotals();
      return ok;
    };
    window.AfroInvoiceState.updatePreview = function () {
      if (typeof originalUpdate === "function") originalUpdate();
      refreshEnhancedTotals();
    };
    window.AfroInvoiceState.__enhanced = true;
  }

  function init() {
    patchStateApi();
    bindEvents();
    renderSavedInvoices();
    renderSavedItems();
    refreshEnhancedTotals();
    loadSharedInvoice();
    setTimeout(renderSavedInvoices, 0);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
