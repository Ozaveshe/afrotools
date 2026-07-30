(function () {
  var calculator = document.querySelector('.calculator');
  var sidebar = document.querySelector('.sidebar');
  function fitCalculator() {
    if (!calculator) return;
    if (window.matchMedia('(max-width:420px)').matches) {
      calculator.style.setProperty('inline-size', 'calc(100vw - 32px)', 'important');
      calculator.style.setProperty('max-inline-size', 'calc(100vw - 32px)', 'important');
      if (sidebar) {
        sidebar.style.setProperty('inline-size', 'calc(100vw - 32px)', 'important');
        sidebar.style.setProperty('max-inline-size', 'calc(100vw - 32px)', 'important');
        sidebar.querySelectorAll('button').forEach(function (button) {
          button.style.setProperty('max-inline-size', '100%', 'important');
          button.style.setProperty('white-space', 'normal', 'important');
          button.style.setProperty('overflow-wrap', 'anywhere', 'important');
        });
      }
    } else {
      calculator.style.setProperty('inline-size', 'min(100%, 1200px)', 'important');
      calculator.style.setProperty('max-inline-size', '100%', 'important');
      if (sidebar) {
        sidebar.style.removeProperty('inline-size');
        sidebar.style.removeProperty('max-inline-size');
      }
    }
  }
  fitCalculator();
  window.addEventListener('resize', fitCalculator, { passive: true });
})();
