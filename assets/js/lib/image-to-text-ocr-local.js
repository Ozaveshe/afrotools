(function configureLocalImageOcr() {
  'use strict';

  if (!window.Tesseract || typeof window.Tesseract.recognize !== 'function') return;

  var recognize = window.Tesseract.recognize.bind(window.Tesseract);
  window.Tesseract.recognize = function recognizeLocally(image, language, options) {
    return recognize(image, language, Object.assign({
      workerPath: '/assets/vendor/tesseract/worker.min.js?v=65249fe4',
      corePath: '/assets/vendor/tesseract/core',
      langPath: '/assets/vendor/tesseract/lang',
      workerBlobURL: false,
      gzip: true
    }, options || {}));
  };
}());
