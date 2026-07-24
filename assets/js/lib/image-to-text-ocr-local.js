(function configureLocalImageOcr() {
  'use strict';

  function configure(runtime) {
    if (!runtime || typeof runtime.recognize !== 'function' || runtime.__afrotoolsLocal) {
      return runtime;
    }

    var recognize = runtime.recognize.bind(runtime);
    runtime.recognize = function recognizeLocally(image, language, options) {
      return recognize(image, language, Object.assign({
        workerPath: '/assets/vendor/tesseract/worker.min.js?v=65249fe4',
        corePath: '/assets/vendor/tesseract/core',
        langPath: '/assets/vendor/tesseract/lang',
        workerBlobURL: false,
        gzip: true
      }, options || {}));
    };
    runtime.__afrotoolsLocal = true;
    return runtime;
  }

  if (window.Tesseract) {
    window.Tesseract = configure(window.Tesseract);
    return;
  }

  var runtime;
  Object.defineProperty(window, 'Tesseract', {
    configurable: true,
    enumerable: true,
    get: function getRuntime() {
      return runtime;
    },
    set: function setRuntime(value) {
      runtime = configure(value);
    }
  });
}());
