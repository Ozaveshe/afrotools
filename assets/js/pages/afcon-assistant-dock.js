(function () {
  'use strict';

  function init() {
    var calculator = document.getElementById('sports-tool-root');
    var askButton = document.getElementById('afcon-ask');
    var status = document.getElementById('afcon-ask-status');
    if (!calculator || !askButton || !status) return;

    var mobile = window.matchMedia('(max-width: 600px)');
    var observedPanel = null;
    var returnFocus = false;
    var openPending = false;
    var panelObserver = new MutationObserver(function () {
      updateDock();
      if (returnFocus && observedPanel && observedPanel.getAttribute('aria-hidden') === 'true') {
        returnFocus = false;
        askButton.focus({ preventScroll: true });
      }
    });

    function updateDock() {
      var assistant = document.querySelector('afro-site-assistant');
      var panel = assistant && assistant.shadowRoot && assistant.shadowRoot.getElementById('panel');
      if (panel && panel !== observedPanel) {
        panelObserver.disconnect();
        observedPanel = panel;
        panelObserver.observe(panel, { attributes: true, attributeFilter: ['aria-hidden'] });
      }

      var rect = calculator.getBoundingClientRect();
      var calculatorVisible = rect.bottom > 0 && rect.top < window.innerHeight;
      var panelOpen = panel && panel.getAttribute('aria-hidden') === 'false';
      document.body.classList.toggle('afcon-assistant-docked', mobile.matches && calculatorVisible && !panelOpen);
    }

    new IntersectionObserver(updateDock).observe(calculator);
    window.addEventListener('resize', updateDock);
    var assistantObserver = new MutationObserver(function () {
      if (!document.querySelector('afro-site-assistant')) return;
      assistantObserver.disconnect();
      updateDock();
    });
    if (!document.querySelector('afro-site-assistant')) {
      assistantObserver.observe(document.body, { childList: true });
    }
    updateDock();

    function openAssistant() {
      var assistant = document.querySelector('afro-site-assistant');
      var shadow = assistant && assistant.shadowRoot;
      var fab = shadow && shadow.getElementById('fab');
      var panel = shadow && shadow.getElementById('panel');
      if (!fab || !panel) return false;

      status.textContent = '';
      document.body.classList.remove('afcon-assistant-docked');
      if (panel.getAttribute('aria-hidden') !== 'false') fab.click();
      if (panel.getAttribute('aria-hidden') !== 'false') {
        updateDock();
        return false;
      }
      returnFocus = true;
      updateDock();
      return true;
    }

    askButton.addEventListener('click', function (event) {
      // The shared assistant closes on clicks outside its shadow root.
      event.stopPropagation();
      if (openPending || openAssistant()) return;

      // The footer loads the assistant after the first pointer interaction.
      openPending = true;
      status.textContent = 'Opening Ask AfroTools…';
      var timeout = setTimeout(function () {
        openPending = false;
        status.textContent = 'Ask AfroTools could not open. Try again in a moment.';
      }, 8000);
      customElements.whenDefined('afro-site-assistant').then(function () {
        if (!openPending) return;
        clearTimeout(timeout);
        openPending = false;
        if (!openAssistant()) {
          status.textContent = 'Ask AfroTools could not open. Try again in a moment.';
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
