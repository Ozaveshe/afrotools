'use strict';

(function () {
  const contactPath = '/ha/tuntube-mu/';

  function reportParams(href, origin) {
    const url = new URL(href, origin);
    if (url.origin !== origin || ![contactPath, '/contact/'].includes(url.pathname)) return null;
    const outer = url.searchParams;
    let params = outer;
    if (url.pathname === contactPath && outer.has('destination')) {
      const destination = outer.get('destination');
      if (!destination.startsWith('/contact/?')) return null;
      params = new URL(destination, origin).searchParams;
      // Historical Hausa bridge links encoded the HTML separator inside the URL.
      if (params.has('amp;tool') && !params.has('tool')) {
        params.set('tool', params.get('amp;tool'));
        params.delete('amp;tool');
      }
      if (outer.has('return_to')) params.set('return_to', outer.get('return_to'));
    }
    // Older calculation tools put the tool id and topic in a single subject.
    const legacySubject = /^([a-z0-9]+(?:-[a-z0-9]+)*)-calculation-error$/.exec(params.get('subject') || '');
    if (!params.has('topic') && legacySubject) {
      params.set('topic', 'calculation-error');
      if (!params.has('tool')) params.set('tool', legacySubject[1]);
    }
    return params.get('topic') === 'calculation-error' ? params : null;
  }

  function applyReportContext(form, href, origin) {
    const params = reportParams(href, origin);
    if (!params) return;
    const { reason, tool } = form.elements;
    if (!reason.value) reason.value = 'Kuskuren lissafi ko rubutu';
    if (!tool.value && params.has('tool')) tool.value = params.get('tool');
    const returnTo = params.get('return_to');
    if (!returnTo || !returnTo.startsWith('/ha/')) return;
    const url = new URL(returnTo, origin);
    if (url.origin !== origin || !url.pathname.startsWith('/ha/')) return;
    const back = form.querySelector('[data-report-return]');
    back.href = url.pathname + url.search + url.hash;
    back.hidden = false;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { contactPath, reportParams };
  } else {
    const form = document.forms.namedItem('contact-ha');
    if (form) applyReportContext(form, location.href, location.origin);
  }
})();
