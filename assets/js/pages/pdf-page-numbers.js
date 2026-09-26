!function () {
  "use strict";

  var ZIP_NAME = "numbered_pdfs.zip";
  var state = {
    files: [],
    results: [],
    download: null,
    busy: false,
    position: "bottom-center",
    previewToken: 0
  };
  var els = {};
  var fonts = {
    Helvetica: "Helvetica",
    HelveticaBold: "HelveticaBold",
    TimesRoman: "TimesRoman",
    TimesRomanBold: "TimesRomanBold",
    Courier: "Courier",
    CourierBold: "CourierBold"
  };


  function localeText(en, fr, sw) { var l=document.documentElement.lang.split('-')[0]; return l==='fr'?fr:l==='sw'?sw:en; }
  var messages = {
    'Remove':['Supprimer','Ondoa'], 'No PDFs selected.':['Aucun PDF sélectionné.','Hakuna PDF iliyochaguliwa.'],
    'Adding Numbers...':['Ajout des numéros…','Inaongeza namba…'], 'Add Page Numbers':['Ajouter les numéros de page','Ongeza namba za kurasa'],
    'Choose at least one PDF file.':['Choisissez au moins un PDF.','Chagua angalau PDF moja.'], 'Preparing page numbering...':['Préparation de la numérotation…','Inaandaa namba za kurasa…'], 'Done.':['Terminé.','Imekamilika.'],
    'Download PDF':['Télécharger le PDF','Pakua PDF'], 'Download ZIP':['Télécharger le ZIP','Pakua ZIP'],
    'No files were numbered.':['Aucun fichier n’a été numéroté.','Hakuna faili iliyowekewa namba.'],
    'Check the page range and try again.':['Vérifiez le fichier et la plage de pages, puis réessayez.','Kagua faili na safu ya kurasa, kisha ujaribu tena.'],
    'Try a different PDF or a smaller page range.':['Essayez un autre PDF ou une plage de pages plus courte.','Jaribu PDF nyingine au safu ndogo ya kurasa.'],
    'Upload a PDF to preview the first numbered page.':['Choisissez un PDF pour afficher la première page numérotée.','Chagua PDF ili kuona ukurasa wa kwanza wenye namba.'],
    'Numbering is drawn onto a new PDF copy. Keep your original file if you may need to change the style later.':['Les numéros sont ajoutés à une nouvelle copie du PDF. Conservez l’original pour modifier le style plus tard.','Namba zinaongezwa kwenye nakala mpya ya PDF. Hifadhi faili asili ili kubadilisha mtindo baadaye.']
  };
  function nativeUi(value) {
    var text=String(value||''), pair=messages[text]; if(pair)return localeText(text,pair[0],pair[1]);
    var m;
    if((m=text.match(/^(\d+) PDFs? selected, (.+) total\.$/)))return localeText(text,m[1]+' PDF sélectionné(s), '+m[2]+' au total.','PDF '+m[1]+' zimechaguliwa, jumla '+m[2]+'.');
    if((m=text.match(/^Skipped (\d+) non-PDF files?\.$/)))return localeText(text,m[1]+' fichier(s) ignoré(s) : format non PDF.','Faili '+m[1]+' zisizo PDF zimerukwa.');
    if((m=text.match(/^Added page numbers to (\d+) pages?\.$/)))return localeText(text,'Numéros ajoutés à '+m[1]+' page(s).','Namba zimeongezwa kwenye kurasa '+m[1]+'.');
    if((m=text.match(/^Loading (.*)\.\.\.$/)))return localeText(text,'Chargement de '+m[1]+'…','Inafungua '+m[1]+'…');
    if((m=text.match(/^Numbering (.*) \((\d+)\/(\d+) pages\)\.\.\.$/)))return localeText(text,'Numérotation de '+m[1]+' ('+m[2]+'/'+m[3]+' pages)…','Inaweka namba kwenye '+m[1]+' (kurasa '+m[2]+'/'+m[3]+')…');
    if((m=text.match(/^Previewing PDF page (\d+) with (\d+) pages? selected\.$/)))return localeText(text,'Aperçu de la page '+m[1]+' ; '+m[2]+' page(s) sélectionnée(s).','Onyesho la ukurasa '+m[1]+'; kurasa '+m[2]+' zimechaguliwa.');
    return text;
  }
  function inputError(kind) {var err=new Error(kind);err.numberingInput=kind;return err;}
  function safeError(err) {
    if(err && err.numberingInput==='range')return localeText('Check the start page, page range and odd/even subset.','Vérifiez la page de départ, la plage et le filtre pair/impair.','Kagua ukurasa wa kuanzia, safu ya kurasa na kichujio cha shufwa/witiri.');
    if(err && err.numberingInput==='fit')return localeText('The numbering does not fit this page. Reduce the font size or shorten the text.','La numérotation ne tient pas sur cette page. Réduisez la police ou raccourcissez le texte.','Namba hazitoshei kwenye ukurasa huu. Punguza ukubwa wa herufi au fupisha maandishi.');
    if(err && err.numberingInput==='font')return localeText('The selected font cannot display this numbering text. Use supported characters.','La police choisie ne peut pas afficher ce texte. Utilisez des caractères pris en charge.','Fonti iliyochaguliwa haiwezi kuonyesha maandishi haya. Tumia herufi zinazotumika.');
    return localeText('This PDF could not be processed. Choose a valid, unlocked PDF and try again.','Ce PDF n’a pas pu être traité. Choisissez un PDF valide et déverrouillé, puis réessayez.','PDF hii haikuweza kuchakatwa. Chagua PDF halali isiyofungwa, kisha ujaribu tena.');
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(el, value) {
    if (el) el.textContent = nativeUi(value);
  }

  function pdfLib() {
    if (!window.PDFLib || !window.PDFLib.PDFDocument) throw new Error("PDF library failed to load. Please refresh the page.");
    return window.PDFLib;
  }

  function pdfJs() {
    if (!window.pdfjsLib) throw new Error("PDF preview renderer failed to load. Please refresh the page.");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/assets/vendor/pdfjs/pdf.worker.min.js";
    return window.pdfjsLib;
  }

  function isPdf(file) {
    return !!file && (file.type === "application/pdf" || /\.pdf$/i.test(file.name || ""));
  }

  function fileKey(file) {
    return [file.name, file.size, file.lastModified].join(":");
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    var units = ["B", "KB", "MB", "GB"];
    var value = bytes;
    var index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index++;
    }
    return (index === 0 ? Math.round(value) : value.toFixed(value >= 10 ? 1 : 2)) + " " + units[index];
  }

  function cleanBaseName(name, fallback) {
    return String(name || fallback || "document")
      .replace(/\.pdf$/i, "")
      .replace(/[^a-z0-9._-]+/gi, "_")
      .replace(/^_+|_+$/g, "") || fallback || "document";
  }

  function renderFiles() {
    els.fileList.innerHTML = "";
    els.fileSummary.classList.toggle("on", state.files.length > 0);
    els.clearFilesBtn.style.display = state.files.length ? "inline-flex" : "none";

    if (!state.files.length) {
      setText(els.fileSummaryText, "No PDFs selected.");
    } else {
      var total = state.files.reduce(function (sum, item) { return sum + item.file.size; }, 0);
      setText(
        els.fileSummaryText,
        state.files.length + " PDF" + (state.files.length === 1 ? "" : "s") + " selected, " + formatBytes(total) + " total."
      );

      state.files.forEach(function (item, index) {
        var row = document.createElement("div");
        row.className = "file-row";
        var info = document.createElement("div");
        info.className = "file-info";
        var name = document.createElement("div");
        name.className = "file-name";
        name.textContent = item.file.name;
        var meta = document.createElement("div");
        meta.className = "file-meta";
        meta.textContent = formatBytes(item.file.size);
        info.appendChild(name);
        info.appendChild(meta);

        var remove = document.createElement("button");
        remove.type = "button";
        remove.className = "mini-btn";
        remove.textContent = nativeUi("Remove");
        remove.addEventListener("click", function () {
          if (state.busy) return;
          state.files.splice(index, 1);
          resetResult("");
          renderFiles();
          updatePreview();
        });

        row.appendChild(info);
        row.appendChild(remove);
        els.fileList.appendChild(row);
      });
    }

    els.numberBtn.disabled = state.busy || state.files.length === 0;
  }

  function addFiles(files) {
    if (state.busy) return;
    var seen = {};
    var skipped = 0;

    state.files.forEach(function (item) {
      seen[fileKey(item.file)] = true;
    });

    Array.from(files || []).forEach(function (file) {
      if (!isPdf(file)) {
        skipped++;
        return;
      }
      var key = fileKey(file);
      if (!seen[key]) {
        seen[key] = true;
        state.files.push({ file: file });
      }
    });

    resetResult(skipped ? "Skipped " + skipped + " non-PDF file" + (skipped === 1 ? "." : "s.") : "");
    renderFiles();
    updatePreview();
  }

  function resetResult(note) {
    state.results = [];
    state.download = null;
    els.resultCard.classList.remove("on");
    els.resultRows.innerHTML = "";
    els.actionRow.classList.remove("on");
    els.progressBar.classList.remove("on");
    els.progressFill.style.width = "0%";
    els.resultNote.classList.toggle("on", !!note);
    setText(els.resultNote, note || "");
    setText(els.resultText, "");
  }

  function setBusy(value) {
    state.busy = value;
    els.numberBtn.disabled = value || state.files.length === 0;
    els.numberBtn.textContent = nativeUi(value ? "Adding Numbers..." : "Add Page Numbers");
    [els.clearFilesBtn].forEach(function (button) {
      if (button) button.disabled = value;
    });
    document.querySelectorAll(".mini-btn,.choice-btn").forEach(function (button) {
      button.disabled = value;
    });
  }

  function showProgress(percent, message) {
    els.progressBar.classList.add("on");
    els.progressFill.style.width = Math.max(0, Math.min(100, percent || 0)) + "%";
    if (message) setText(els.resultText, message);
  }

  function clampNumber(value, min, max, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) number = fallback;
    number = Math.max(min, number);
    if (max != null) number = Math.min(max, number);
    return number;
  }

  function getColor() {
    var raw = String(els.colorText.value || els.colorInput.value || "#111827").trim();
    if (!/^#[0-9a-f]{6}$/i.test(raw)) raw = "#111827";
    raw = raw.toUpperCase();
    els.colorInput.value = raw;
    els.colorText.value = raw;
    setText(els.colorHex, raw);
    return {
      hex: raw,
      r: parseInt(raw.slice(1, 3), 16) / 255,
      g: parseInt(raw.slice(3, 5), 16) / 255,
      b: parseInt(raw.slice(5, 7), 16) / 255
    };
  }

  function toRoman(num) {
    if (num <= 0 || num > 3999) return String(num);
    var map = [
      [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"],
      [100, "c"], [90, "xc"], [50, "l"], [40, "xl"],
      [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]
    ];
    var out = "";
    map.forEach(function (item) {
      while (num >= item[0]) {
        out += item[1];
        num -= item[0];
      }
    });
    return out;
  }

  function toLetters(num, upper) {
    if (num <= 0) return String(num);
    var out = "";
    while (num > 0) {
      num--;
      out = String.fromCharCode(97 + num % 26) + out;
      num = Math.floor(num / 26);
    }
    return upper ? out.toUpperCase() : out;
  }

  function padNumber(value, padLength) {
    var raw = String(value);
    return padLength > 0 && /^-?\d+$/.test(raw) ? raw.padStart(padLength, "0") : raw;
  }

  function selectedPages(pageCount, options) {
    var rangeText = String(options.pageRange || "").trim();
    if (options.startPage > pageCount) throw inputError("range");
    var startPage = Math.max(1, options.startPage || 1);
    var pages = [];
    var seen = {};

    function add(pageNumber) {
      if (pageNumber < startPage || pageNumber < 1 || pageNumber > pageCount) return;
      if (options.subset === "odd" && pageNumber % 2 === 0) return;
      if (options.subset === "even" && pageNumber % 2 !== 0) return;
      if (!seen[pageNumber]) {
        seen[pageNumber] = true;
        pages.push(pageNumber);
      }
    }

    if (!rangeText || /^all$/i.test(rangeText)) {
      for (var p = startPage; p <= pageCount; p++) add(p);
      if (!pages.length) throw inputError("range");
      return pages;
    }

    rangeText.split(",").forEach(function (part) {
      var token = part.trim();
      if (!token) return;
      var range = token.match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        var from = Number(range[1]);
        var to = Number(range[2]);
        if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from || to > pageCount) {
          throw inputError("range");
        }
        for (var page = from; page <= to; page++) add(page);
      } else {
        var single = Number(token);
        if (!Number.isInteger(single) || single < 1 || single > pageCount) {
          throw inputError("range");
        }
        add(single);
      }
    });

    if (!pages.length) throw inputError("range");
    pages.sort(function (a, b) { return a - b; });
    return pages;
  }

  function formatNumber(sequence, total, options) {
    var value = options.startNumber + sequence;
    var formatted;
    if (options.template === "roman-lower") formatted = toRoman(value);
    else if (options.template === "roman-upper") formatted = toRoman(value).toUpperCase();
    else if (options.template === "letters-lower") formatted = toLetters(value, false);
    else if (options.template === "letters-upper") formatted = toLetters(value, true);
    else formatted = padNumber(value, options.padLength);

    if (options.template === "page-number") return localeText("Page ","Page ","Ukurasa ") + formatted;
    if (options.template === "page-of-total") return localeText("Page ","Page ","Ukurasa ") + formatted + localeText(" of "," sur "," kati ya ") + total;
    if (options.template === "number-of-total") return formatted + " / " + total;
    return options.prefix + formatted + options.suffix;
  }

  function mirroredPosition(position, pageNumber, facingMode) {
    if (!facingMode || pageNumber % 2 === 1) return position;
    if (position.indexOf("left") !== -1) return position.replace("left", "right");
    if (position.indexOf("right") !== -1) return position.replace("right", "left");
    return position;
  }

  // Position the complete rotated font box in the visible CropBox, then map its baseline back to PDF user space.
  function stampPage(page, font, text, pageNumber, options) {
    var lib=pdfLib(), media=page.getMediaBox(), crop=page.getCropBox();
    var left=Math.max(media.x,crop.x), bottom=Math.max(media.y,crop.y), right=Math.min(media.x+media.width,crop.x+crop.width), top=Math.min(media.y+media.height,crop.y+crop.height);
    var cw=right-left,ch=top-bottom, rotation=((page.getRotation().angle%360)+360)%360;
    if(![0,90,180,270].includes(rotation)||cw<=0||ch<=0)throw inputError('fit');
    var pw=rotation%180?ch:cw, ph=rotation%180?cw:ch, width;
    try{width=font.widthOfTextAtSize(text,options.fontSize);}catch(_){throw inputError('font');}
    var ascent=font.heightAtSize(options.fontSize,{descender:false}), descent=font.heightAtSize(options.fontSize)-ascent;
    var angle=options.rotation*Math.PI/180, c=Math.cos(angle), sn=Math.sin(angle);
    var corners=[[0,-descent],[width,-descent],[0,ascent],[width,ascent]].map(function(p){return [p[0]*c-p[1]*sn,p[0]*sn+p[1]*c];});
    var minX=Math.min.apply(null,corners.map(function(p){return p[0];})),maxX=Math.max.apply(null,corners.map(function(p){return p[0];})),minY=Math.min.apply(null,corners.map(function(p){return p[1];})),maxY=Math.max.apply(null,corners.map(function(p){return p[1];}));
    var bw=maxX-minX,bh=maxY-minY,pad=1;
    if(bw+2*pad>pw||bh+2*pad>ph)throw inputError('fit');
    var pos=mirroredPosition(options.position,pageNumber,options.facingMode);
    var x=pos.includes('left')?options.marginX:pos.includes('right')?pw-options.marginX-bw:(pw-bw)/2;
    var y=pos.includes('top')?ph-options.marginY-bh:pos.includes('bottom')?options.marginY:(ph-bh)/2;
    x=Math.max(pad,Math.min(pw-bw-pad,x))-minX;y=Math.max(pad,Math.min(ph-bh-pad,y))-minY;
    var point=rotation===0?[left+x,bottom+y]:rotation===90?[left+cw-y,bottom+x]:rotation===180?[left+cw-x,bottom+ch-y]:[left+y,bottom+ch-x];
    page.drawText(text,{x:point[0],y:point[1],font:font,size:options.fontSize,color:lib.rgb(options.color.r,options.color.g,options.color.b),opacity:options.opacity,rotate:lib.degrees(rotation+options.rotation)});
  }

  function currentOptions() {
    return {
      template: els.templateSelect.value,
      startNumber: Math.floor(clampNumber(els.startNumber.value, 0, 999999, 1)),
      padLength: Math.floor(clampNumber(els.padLength.value, 0, 8, 0)),
      startPage: Math.floor(clampNumber(els.startPage.value, 1, 999999, 1)),
      pageRange: els.pageRange.value,
      subset: els.subsetSelect.value,
      prefix: els.prefixInput.value || "",
      suffix: els.suffixInput.value || "",
      position: state.position,
      fontName: fonts[els.fontSelect.value] || "Helvetica",
      fontSize: clampNumber(els.fontSize.value, 6, 72, 12),
      opacity: clampNumber(els.opacity.value, 10, 100, 100) / 100,
      marginX: clampNumber(els.marginX.value, 0, 144, 36),
      marginY: clampNumber(els.marginY.value, 0, 144, 28),
      rotation: clampNumber(els.rotation.value, -90, 90, 0),
      color: getColor(),
      facingMode: els.facingMode.checked
    };
  }

  async function numberPdf(item, options, fileIndex, fileCount) {
    var lib = pdfLib();
    var inputBytes = await item.file.arrayBuffer();
    var pdf = await lib.PDFDocument.load(inputBytes, { ignoreEncryption: true, updateMetadata: false });
    var pages = pdf.getPages();
    var targetPages = selectedPages(pages.length, options);
    var pageSet = {};
    targetPages.forEach(function (pageNumber) { pageSet[pageNumber] = true; });
    var font = await pdf.embedFont(lib.StandardFonts[options.fontName] || lib.StandardFonts.Helvetica);
    var total = targetPages.length;
    var drawn = 0;

    pages.forEach(function (page, index) {
      var pdfPageNumber = index + 1;
      if (!pageSet[pdfPageNumber]) return;
      var text = formatNumber(drawn, total, options);
      stampPage(page, font, text, pdfPageNumber, options);

      drawn++;
      showProgress(8 + (fileIndex + drawn / total) / fileCount * 84, "Numbering " + item.file.name + " (" + drawn + "/" + total + " pages)...");
    });

    if (!drawn) throw new Error("No pages were numbered.");
    var output = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    return {
      ok: true,
      sourceName: item.file.name,
      name: cleanBaseName(item.file.name, "document") + "_numbered.pdf",
      bytes: output,
      originalSize: item.file.size,
      outputSize: output.length,
      pageCount: pages.length,
      numberedCount: drawn
    };
  }

  function renderResult() {
    els.resultRows.innerHTML = "";
    var ok = state.results.filter(function (item) { return item.ok; });
    var failed = state.results.filter(function (item) { return !item.ok; });

    state.results.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "result-row" + (item.ok ? "" : " error");
      var info = document.createElement("div");
      info.className = "result-info";
      var name = document.createElement("div");
      name.className = "result-name";
      name.textContent = item.ok ? item.name : item.sourceName;
      var meta = document.createElement("div");
      meta.className = "result-meta";
      meta.textContent = item.ok ? item.numberedCount + "/" + item.pageCount + localeText(" pages numbered - "," pages numérotées - "," kurasa zimewekewa namba - ") + formatBytes(item.originalSize) + " -> " + formatBytes(item.outputSize) : item.error;
      info.appendChild(name);
      info.appendChild(meta);
      row.appendChild(info);
      els.resultRows.appendChild(row);
    });

    if (ok.length) {
      var pagesNumbered = ok.reduce(function (sum, item) { return sum + item.numberedCount; }, 0);
      setText(els.resultText, "Added page numbers to " + pagesNumbered + " page" + (pagesNumbered === 1 ? "" : "s") + ".");
      setText(
        els.resultNote,
        (failed.length ? failed.length + localeText(" file(s) could not be processed. "," fichier(s) non traité(s). "," faili hazikuchakatwa. ") : "") + nativeUi("Numbering is drawn onto a new PDF copy. Keep your original file if you may need to change the style later.")
      );
      els.resultNote.classList.add("on");
      els.actionRow.classList.add("on");
      els.downloadBtn.textContent = nativeUi(state.download && /\.zip$/i.test(state.download.filename) ? "Download ZIP" : "Download PDF");
    } else {
      setText(els.resultText, "No files were numbered.");
      setText(els.resultNote, failed.length ? "Check the page range and try again." : "");
      els.resultNote.classList.toggle("on", failed.length > 0);
      els.actionRow.classList.remove("on");
    }
  }

  async function processFiles() {
    if (state.busy) return;
    if (!state.files.length) {
      els.resultCard.classList.add("on");
      setText(els.resultText, "Choose at least one PDF file.");
      return;
    }

    setBusy(true);
    state.results = [];
    state.download = null;
    els.resultCard.classList.add("on");
    els.resultRows.innerHTML = "";
    els.resultNote.classList.remove("on");
    els.actionRow.classList.remove("on");
    showProgress(3, "Preparing page numbering...");

    try {
      var options = currentOptions();
      for (var i = 0; i < state.files.length; i++) {
        try {
          showProgress(6 + i / state.files.length * 84, "Loading " + state.files[i].file.name + "...");
          state.results.push(await numberPdf(state.files[i], options, i, state.files.length));
        } catch (fileErr) {
          state.results.push({
            ok: false,
            sourceName: state.files[i].file.name,
            error: safeError(fileErr)
          });
        }
      }

      var successes = state.results.filter(function (item) { return item.ok; });
      if (successes.length === 1) {
        state.download = {
          blob: new Blob([successes[0].bytes], { type: "application/pdf" }),
          filename: successes[0].name
        };
      } else if (successes.length > 1) {
        state.download = {
          blob: buildZip(successes.map(function (item) { return { name: item.name, data: item.bytes }; })),
          filename: ZIP_NAME
        };
      }

      showProgress(100, "Done.");
      renderResult();
    } catch (err) {
      setText(els.resultText, safeError(err));
      els.actionRow.classList.remove("on");
      els.resultNote.classList.add("on");
      setText(els.resultNote, "Try a different PDF or a smaller page range.");
    } finally {
      setBusy(false);
      updatePreview();
    }
  }

  function crc32(bytes) {
    var table = crc32.table;
    if (!table) {
      table = crc32.table = new Uint32Array(256);
      for (var i = 0; i < 256; i++) {
        var c = i;
        for (var j = 0; j < 8; j++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
        table[i] = c >>> 0;
      }
    }
    var crc = 4294967295;
    for (var k = 0; k < bytes.length; k++) crc = table[(crc ^ bytes[k]) & 255] ^ crc >>> 8;
    return (4294967295 ^ crc) >>> 0;
  }

  function buildZip(entries) {
    var encoder = new TextEncoder();
    var parts = [];
    var central = [];
    var offset = 0;

    entries.forEach(function (entry) {
      var nameBytes = encoder.encode(entry.name);
      var data = entry.data instanceof Uint8Array ? entry.data : new Uint8Array(entry.data);
      var crc = crc32(data);
      var local = new Uint8Array(30 + nameBytes.length);
      var localView = new DataView(local.buffer);
      localView.setUint32(0, 67324752, true);
      localView.setUint16(4, 20, true);
      localView.setUint32(14, crc, true);
      localView.setUint32(18, data.length, true);
      localView.setUint32(22, data.length, true);
      localView.setUint16(26, nameBytes.length, true);
      local.set(nameBytes, 30);

      var header = new Uint8Array(46 + nameBytes.length);
      var centralView = new DataView(header.buffer);
      centralView.setUint32(0, 33639248, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint32(16, crc, true);
      centralView.setUint32(20, data.length, true);
      centralView.setUint32(24, data.length, true);
      centralView.setUint16(28, nameBytes.length, true);
      centralView.setUint32(38, 32, true);
      centralView.setUint32(42, offset, true);
      header.set(nameBytes, 46);

      parts.push(local, data);
      central.push(header);
      offset += local.length + data.length;
    });

    var centralOffset = offset;
    var centralSize = 0;
    central.forEach(function (part) {
      parts.push(part);
      centralSize += part.length;
    });

    var end = new Uint8Array(22);
    var endView = new DataView(end.buffer);
    endView.setUint32(0, 101010256, true);
    endView.setUint16(8, entries.length, true);
    endView.setUint16(10, entries.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, centralOffset, true);
    parts.push(end);
    return new Blob(parts, { type: "application/zip" });
  }

  function download() {
    if (!state.download) return;

    function run() {
      var url = URL.createObjectURL(state.download.blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = state.download.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    }

    run();
  }

  function updatePreview() {
    var token=++state.previewToken;window.clearTimeout(updatePreview.timer);
    updatePreview.timer=window.setTimeout(function(){renderPreview(token).catch(function(err){if(token===state.previewToken)setText(els.previewStatus,safeError(err));});},160);
  }
  async function renderPreview(token) {
    var canvas=els.previewCanvas;canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
    if(!state.files.length){setText(els.previewStatus,'Upload a PDF to preview the first numbered page.');return;}
    var options=currentOptions(),bytes=await state.files[0].file.arrayBuffer();if(token!==state.previewToken)return;
    var lib=pdfLib(),pdf=await lib.PDFDocument.load(bytes,{ignoreEncryption:true,updateMetadata:false});
    var pages=selectedPages(pdf.getPageCount(),options),first=pages[0],font=await pdf.embedFont(lib.StandardFonts[options.fontName]||lib.StandardFonts.Helvetica);
    stampPage(pdf.getPage(first-1),font,formatNumber(0,pages.length,options),first,options);
    var stamped=await pdf.save({useObjectStreams:true,addDefaultPage:false});if(token!==state.previewToken)return;
    var doc=await pdfJs().getDocument({data:stamped}).promise;
    try{var page=await doc.getPage(first),unit=page.getViewport({scale:1}),scale=Math.min(340/unit.width,500/unit.height,1.35),view=page.getViewport({scale:scale}),offscreen=document.createElement('canvas');offscreen.width=Math.max(1,Math.floor(view.width));offscreen.height=Math.max(1,Math.floor(view.height));
      await page.render({canvasContext:offscreen.getContext('2d'),viewport:view,background:'white'}).promise;
      if(token!==state.previewToken)return;canvas.width=offscreen.width;canvas.height=offscreen.height;canvas.getContext('2d').drawImage(offscreen,0,0);
      setText(els.previewStatus,'Previewing PDF page '+first+' with '+pages.length+' page'+(pages.length===1?'':'s')+' selected.');
    }finally{await doc.destroy();}
  }

  function syncLabels() {
    setText(els.fontSizeValue, els.fontSize.value + " pt");
    setText(els.opacityValue, els.opacity.value + "%");
    setText(els.marginXValue, els.marginX.value + " pt");
    setText(els.marginYValue, els.marginY.value + " pt");
    setText(els.rotationValue, els.rotation.value + " deg");
    getColor();
  }

  function wireDropZone() {
    els.dropZone.addEventListener("click", function () {
      if (!state.busy) els.pdfFileInput.click();
    });
    els.dropZone.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        els.pdfFileInput.click();
      }
    });
    els.dropZone.addEventListener("dragover", function (event) {
      event.preventDefault();
      els.dropZone.classList.add("dragover");
    });
    els.dropZone.addEventListener("dragleave", function () {
      els.dropZone.classList.remove("dragover");
    });
    els.dropZone.addEventListener("drop", function (event) {
      event.preventDefault();
      els.dropZone.classList.remove("dragover");
      addFiles(event.dataTransfer.files);
    });
  }

  function bindControlUpdates() {
    [
      els.templateSelect, els.startNumber, els.padLength, els.startPage, els.pageRange,
      els.subsetSelect, els.prefixInput, els.suffixInput, els.fontSelect, els.fontSize,
      els.opacity, els.marginX, els.marginY, els.rotation, els.colorInput, els.colorText,
      els.facingMode
    ].forEach(function (control) {
      control.addEventListener("input", function () {
        if (control === els.colorInput) els.colorText.value = els.colorInput.value.toUpperCase();
        syncLabels();
        resetResult("");
        updatePreview();
      });
      control.addEventListener("change", function () {
        if (control === els.colorText && !/^#[0-9a-f]{6}$/i.test(els.colorText.value)) els.colorText.value = "#111827";
        syncLabels();
        resetResult("");
        updatePreview();
      });
    });
  }

  function init() {
    els.dropZone = byId("dropZone");
    els.pdfFileInput = byId("pdfFileInput");
    els.fileSummary = byId("fileSummary");
    els.fileSummaryText = byId("fileSummaryText");
    els.clearFilesBtn = byId("clearFilesBtn");
    els.fileList = byId("fileList");
    ['fileList', 'fileSummaryText', 'resultCard', 'previewStatus', 'numberBtn', 'downloadBtn'].forEach(function (id) {
      var element = byId(id);
      if (element) element.setAttribute('translate', 'no');
    });
    els.templateSelect = byId("templateSelect");
    els.startNumber = byId("startNumber");
    els.padLength = byId("padLength");
    els.startPage = byId("startPage");
    els.pageRange = byId("pageRange");
    els.subsetSelect = byId("subsetSelect");
    els.prefixInput = byId("prefixInput");
    els.suffixInput = byId("suffixInput");
    els.fontSelect = byId("fontSelect");
    els.fontSize = byId("fontSize");
    els.fontSizeValue = byId("fontSizeValue");
    els.opacity = byId("opacity");
    els.opacityValue = byId("opacityValue");
    els.marginX = byId("marginX");
    els.marginXValue = byId("marginXValue");
    els.marginY = byId("marginY");
    els.marginYValue = byId("marginYValue");
    els.rotation = byId("rotation");
    els.rotationValue = byId("rotationValue");
    els.colorInput = byId("colorInput");
    els.colorText = byId("colorText");
    els.colorHex = byId("colorHex");
    els.facingMode = byId("facingMode");
    els.numberBtn = byId("numberBtn");
    els.previewCanvas = byId("previewCanvas");
    els.previewStatus = byId("previewStatus");
    els.resultCard = byId("resultCard");
    els.resultText = byId("resultText");
    els.progressBar = byId("progressBar");
    els.progressFill = byId("progressFill");
    els.resultRows = byId("resultRows");
    els.resultNote = byId("resultNote");
    els.actionRow = byId("actionRow");
    els.downloadBtn = byId("downloadBtn");

    pdfLib();
    pdfJs();
    wireDropZone();
    bindControlUpdates();

    els.pdfFileInput.addEventListener("change", function (event) {
      addFiles(event.target.files);
      event.target.value = "";
    });
    els.clearFilesBtn.addEventListener("click", function () {
      if (state.busy) return;
      state.files = [];
      resetResult("");
      renderFiles();
      updatePreview();
    });
    document.querySelectorAll("[data-position]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (state.busy) return;
        state.position = button.dataset.position;
        document.querySelectorAll("[data-position]").forEach(function (item) {
          item.classList.toggle("on", item === button);
        });
        resetResult("");
        updatePreview();
      });
    });
    els.numberBtn.addEventListener("click", processFiles);
    els.downloadBtn.addEventListener("click", download);

    syncLabels();
    renderFiles();
    updatePreview();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}();
