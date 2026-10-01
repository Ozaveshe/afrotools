(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroJAMB = root.AfroJAMB || {};
  root.AfroJAMB.YearPractice = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function parse(search, subjects, currentYear) {
    var params = new URLSearchParams(search);
    if (!params.has('subject') && !params.has('year')) return { scope: null, error: null };
    var subject = params.get('subject'), year = params.get('year'), mode = params.get('mode') || 'subject';
    if (params.getAll('subject').length !== 1 || params.getAll('year').length !== 1 ||
        params.getAll('mode').length > 1 || (params.has('mode') && !['quick', 'subject'].includes(params.get('mode'))) ||
        !Object.prototype.hasOwnProperty.call(subjects, subject) ||
        !/^\d{4}$/.test(year || '') || Number(year) < 1978 || Number(year) > currentYear) {
      return { scope: null, error: 'This year, subject or practice mode link is invalid. Choose a reviewed year page or open the general CBT setup.' };
    }
    return { scope: { subject: subject, year: Number(year), mode: mode }, error: null };
  }
  function url(subject, year, mode) {
    return '/jamb/cbt/?subject=' + encodeURIComponent(subject) + '&year=' + encodeURIComponent(year) +
      (mode === 'quick' ? '&mode=quick' : '');
  }
  function matches(snapshot, scope) {
    return snapshot.year === scope.year && snapshot.mode === scope.mode &&
      Array.isArray(snapshot.subjects) && snapshot.subjects.length === 1 && snapshot.subjects[0] === scope.subject;
  }
  function nonvisual(question) {
    var text = ((question && question.question) || '') + ' ' + Object.values((question && question.options) || {}).join(' ');
    return !!question && !question.image && !question.has_diagram &&
      !/use the diagram|use the figure|diagram below|diagram above|figure above|graph above|illustration above|circuit above|bar chart above|pie chart above|histogram above/i.test(text);
  }
  return { parse: parse, url: url, matches: matches, nonvisual: nonvisual };
});
