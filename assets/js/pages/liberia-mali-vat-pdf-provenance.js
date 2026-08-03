(function () {
  "use strict";

  var PDF = window.jspdf && window.jspdf.jsPDF;
  if (!PDF || PDF.__afroToolsLiberiaMaliProvenance) return;

  var sources = {
    "liberia-gst-estimate.pdf": {
      en: "Sources reviewed 2026-07-22: LRA December 2025 Tax Amendment Act and implementation notice. Currency: LRD.",
      fr: "Sources vérifiées le 2026-07-22 : loi fiscale modificative LRA de décembre 2025 et avis de mise en œuvre. Devise : LRD.",
      sw: "Vyanzo vimekaguliwa 2026-07-22: Sheria ya Marekebisho ya Kodi ya LRA ya Desemba 2025 na taarifa ya utekelezaji. Sarafu: LRD."
    },
    "mali-vat-estimate.pdf": {
      en: "Sources reviewed 2026-07-22: DGI Mali General Tax Code and official portal.",
      fr: "Sources vérifiées le 2026-07-22 : Code général des impôts et portail officiel de la DGI Mali.",
      sw: "Vyanzo vimekaguliwa 2026-07-22: Kanuni ya Jumla ya Kodi na tovuti rasmi ya DGI Mali."
    }
  };
  function ProvenancePDF() {
    var documentInstance = Reflect.construct(PDF, Array.prototype.slice.call(arguments));
    var save = documentInstance.save;
    documentInstance.save = function (name) {
      var localeSources = sources[name];
      if (localeSources) {
        var lang = (document.documentElement.lang || "en").slice(0, 2);
        var source = localeSources[lang] || localeSources.en;
        documentInstance.text(documentInstance.splitTextToSize(source, 170), 20, 120);
      }
      return save.apply(documentInstance, arguments);
    };
    return documentInstance;
  }

  Object.setPrototypeOf(ProvenancePDF, PDF);
  ProvenancePDF.prototype = PDF.prototype;
  Object.defineProperty(ProvenancePDF, "__afroToolsLiberiaMaliProvenance", { value: true });
  window.jspdf.jsPDF = ProvenancePDF;
})();
