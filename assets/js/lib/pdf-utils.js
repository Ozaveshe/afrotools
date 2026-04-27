!function () {
  "use strict";

  var pdfJsPromise = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (window.pdfjsLib || existing.dataset.loaded === "true") {
          resolve();
          return;
        }
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", function () { reject(new Error("Failed to load " + src)); }, { once: true });
        return;
      }
      var script = document.createElement("script");
      script.src = src;
      script.onload = function () {
        script.dataset.loaded = "true";
        resolve();
      };
      script.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(script);
    });
  }

  function configurePdfJs(pdfjs) {
    if (!pdfjs || !pdfjs.GlobalWorkerOptions) return pdfjs;
    pdfjs.GlobalWorkerOptions.workerSrc = "/assets/vendor/pdfjs/pdf.worker.min.js";
    return pdfjs;
  }

  async function ensurePdfJs() {
    if (window.pdfjsLib) return configurePdfJs(window.pdfjsLib);
    if (pdfJsPromise) return pdfJsPromise;
    pdfJsPromise = loadScript("/assets/vendor/pdfjs/pdf.min.js?v=96de3233").then(function () {
      if (!window.pdfjsLib) throw new Error("PDF preview renderer failed to load.");
      return configurePdfJs(window.pdfjsLib);
    });
    return pdfJsPromise;
  }

  function downloadBlob(blob, fileName) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  window.PdfUtils = {
    ensurePdfJs: ensurePdfJs,
    getPdfJs: function () { return window.pdfjsLib || null; },
    async loadPdf(file) {
      if (!file) throw new Error("No file provided");
      var arrayBuffer = await file.arrayBuffer();
      var pdfjs = await ensurePdfJs();
      var pdfDoc = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;
      return {
        arrayBuffer: arrayBuffer,
        pdfDoc: pdfDoc,
        pageCount: pdfDoc.numPages,
        fileName: file.name,
        fileSize: file.size
      };
    },
    async extractText(pdfDoc) {
      var pages = [];
      for (var pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
        var page = await pdfDoc.getPage(pageNumber);
        var content = await page.getTextContent();
        var items = content.items.map(function (item) {
          return {
            str: item.str,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width,
            height: item.height,
            fontName: item.fontName
          };
        });
        pages.push({
          page: pageNumber,
          text: content.items.map(function (item) { return item.str; }).join(" "),
          items: items
        });
      }
      return pages;
    },
    async renderPage(pdfDoc, pageNumber, scale) {
      var page = await pdfDoc.getPage(pageNumber);
      var viewport = page.getViewport({ scale: scale || 1.5 });
      var canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport }).promise;
      return canvas;
    },
    async renderThumb(pdfDoc, pageNumber) {
      return this.renderPage(pdfDoc, pageNumber, 0.4);
    },
    async generateThumbnails(pdfDoc, onProgress) {
      var thumbs = {};
      for (var pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
        try {
          var canvas = await this.renderThumb(pdfDoc, pageNumber);
          thumbs[pageNumber - 1] = canvas.toDataURL("image/jpeg", 0.6);
        } catch (error) {}
        if (onProgress) onProgress(pageNumber, pdfDoc.numPages);
      }
      return thumbs;
    },
    downloadBlob: downloadBlob,
    downloadPdf: function (bytes, fileName) {
      downloadBlob(new Blob([bytes], { type: "application/pdf" }), fileName || "document.pdf");
    },
    async downloadZip(files, fileName) {
      if (!window.JSZip) throw new Error("ZIP export is not available on this page.");
      var zip = new window.JSZip();
      files.forEach(function (file) { zip.file(file.name, file.data); });
      var blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, fileName || "download.zip");
    },
    formatSize: function (bytes) {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / 1048576).toFixed(1) + " MB";
    },
    initDragDrop: function (el, options) {
      var multiple = !!options.multiple;
      var onFiles = options.onFiles;
      var dropClass = options.dropClass || "dragover";
      el.addEventListener("dragover", function (event) {
        event.preventDefault();
        event.stopPropagation();
        el.classList.add(dropClass);
      });
      el.addEventListener("dragleave", function (event) {
        event.preventDefault();
        el.classList.remove(dropClass);
      });
      el.addEventListener("drop", function (event) {
        event.preventDefault();
        event.stopPropagation();
        el.classList.remove(dropClass);
        var files = Array.from(event.dataTransfer.files);
        if (!multiple) files = files.slice(0, 1);
        if (onFiles) onFiles(files);
      });
    },
    showToast: function (message, error) {
      var old = document.getElementById("pu-toast");
      if (old) old.remove();
      var toast = document.createElement("div");
      toast.id = "pu-toast";
      toast.textContent = message;
      toast.style.cssText = "position:fixed;bottom:20px;right:20px;background:" + (error ? "#dc2626" : "#111") + ";color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.2);z-index:9999;font-family:DM Sans,sans-serif;max-width:350px;animation:toastIn .3s ease";
      document.body.appendChild(toast);
      setTimeout(function () { toast.remove(); }, 3500);
    }
  };

  var style = document.createElement("style");
  style.textContent = "@keyframes toastIn{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}";
  document.head.appendChild(style);
}();
