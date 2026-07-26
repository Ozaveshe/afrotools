(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.citationEngine = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var STYLE_NOTES = {
    apa: 'APA 7 draft. The engine preserves the capitalisation you enter; apply APA sentence case and source-specific exceptions before submitting.',
    mla: 'MLA 9 draft based on core elements. The engine does not decide optional or supplemental elements for you.',
    chicago: 'Chicago author-date draft. This is not a footnote or notes-and-bibliography citation.',
    harvard: 'Generic Harvard author-date draft. Harvard conventions vary by institution, so use your required local guide as the final authority.'
  };

  function clean(value) {
    return String(value == null ? '' : value).trim().replace(/\s+/g, ' ');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function stripTrailingPunctuation(value) {
    return clean(value).replace(/[.,;:]+$/, '');
  }

  function ensurePeriod(value) {
    var text = clean(value);
    return text && !/[.!?]$/.test(text) ? text + '.' : text;
  }

  function normalizeDoi(value) {
    var doi = clean(value)
      .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
      .replace(/^doi:\s*/i, '');
    return doi ? 'https://doi.org/' + doi : '';
  }

  function normalizeUrl(value) {
    var url = clean(value);
    if (!url) return '';
    return /^https?:\/\//i.test(url) ? url : 'https://' + url;
  }

  function mlaLocator(data) {
    var doi = normalizeDoi(data.doi);
    if (doi) return doi;
    return normalizeUrl(data.url).replace(/^https?:\/\//i, '');
  }

  function parseAuthors(value) {
    return clean(value).split(';').map(function (part) {
      var bits = part.split(',').map(clean).filter(Boolean);
      if (!bits.length) return null;
      return { family: bits[0], given: bits.slice(1).join(', ') };
    }).filter(Boolean);
  }

  function initials(given) {
    return clean(given).split(/[\s-]+/).filter(Boolean).map(function (part) {
      return part.charAt(0).toUpperCase() + '.';
    }).join(' ');
  }

  function apaAuthors(authors, organization) {
    if (!authors.length) return clean(organization);
    var formatted = authors.map(function (author) {
      return author.family + (author.given ? ', ' + initials(author.given) : '');
    });
    if (formatted.length === 1) return formatted[0];
    if (formatted.length > 20) {
      return formatted.slice(0, 19).join(', ') + ', … ' + formatted[formatted.length - 1];
    }
    return formatted.slice(0, -1).join(', ') + ', & ' + formatted[formatted.length - 1];
  }

  function mlaAuthors(authors, organization) {
    if (!authors.length) return clean(organization);
    var first = authors[0].family + (authors[0].given ? ', ' + authors[0].given : '');
    if (authors.length === 1) return first;
    if (authors.length === 2) {
      var second = (authors[1].given ? authors[1].given + ' ' : '') + authors[1].family;
      return first + ', and ' + second;
    }
    return first + ', et al.';
  }

  function chicagoAuthors(authors, organization) {
    if (!authors.length) return clean(organization);
    var first = authors[0].family + (authors[0].given ? ', ' + authors[0].given : '');
    if (authors.length === 1) return first;
    var rest = authors.slice(1).map(function (author) {
      return (author.given ? author.given + ' ' : '') + author.family;
    });
    return first + ', ' + (rest.length > 1 ? rest.slice(0, -1).join(', ') + ', and ' : 'and ') + rest[rest.length - 1];
  }

  function harvardAuthors(authors, organization) {
    if (!authors.length) return clean(organization);
    return authors.map(function (author) {
      return author.family + (author.given ? ', ' + initials(author.given) : '');
    }).join(authors.length === 2 ? ' and ' : ', ');
  }

  function authorKey(authors, organization) {
    return authors.length ? authors[0].family : clean(organization) || clean('Title');
  }

  function yearOrNoDate(year, style) {
    var value = clean(year);
    if (value) return value;
    return style === 'mla' ? '' : 'n.d.';
  }

  function formatDate(value, style) {
    var date = clean(value);
    if (!date) return '';
    var parts = date.split('-');
    if (parts.length !== 3) return date;
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var month = months[Number(parts[1]) - 1] || parts[1];
    var day = String(Number(parts[2]));
    if (style === 'mla') return day + ' ' + month.slice(0, 3) + '. ' + parts[0];
    return month + ' ' + day + ', ' + parts[0];
  }

  function formatApaDate(value, fallbackYear) {
    var date = clean(value);
    if (!date) return yearOrNoDate(fallbackYear, 'apa');
    var parts = date.split('-');
    if (parts.length !== 3) return yearOrNoDate(fallbackYear, 'apa');
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var month = months[Number(parts[1]) - 1];
    if (!month) return yearOrNoDate(fallbackYear, 'apa');
    return parts[0] + ', ' + month + ' ' + String(Number(parts[2]));
  }

  function locator(data) {
    return normalizeDoi(data.doi) || normalizeUrl(data.url);
  }

  function formatApa(data, authors) {
    var author = apaAuthors(authors, data.organization);
    var year = yearOrNoDate(data.year, 'apa');
    var lead = author ? ensurePeriod(author) + ' ' : '';
    var place = locator(data);
    var reference = '';
    if (data.sourceType === 'book') {
      var edition = clean(data.edition) ? ' (' + stripTrailingPunctuation(data.edition) + ' ed.)' : '';
      reference = lead + '(' + year + '). ' + ensurePeriod(data.title + edition) + ' ' + ensurePeriod(data.publisher);
    } else if (data.sourceType === 'journal') {
      var issue = clean(data.issue) ? '(' + clean(data.issue) + ')' : '';
      var pages = clean(data.pages) ? ', ' + clean(data.pages) : '';
      reference = lead + '(' + year + '). ' + ensurePeriod(data.title) + ' ' + clean(data.containerTitle) + ', ' + clean(data.volume) + issue + pages + '.';
    } else if (data.sourceType === 'webpage') {
      var date = formatApaDate(data.publicationDate, data.year);
      reference = lead + '(' + date + '). ' + ensurePeriod(data.title);
      if (clean(data.containerTitle) !== clean(data.organization)) reference += ' ' + ensurePeriod(data.containerTitle);
    } else {
      var reportNo = clean(data.reportNumber) ? ' (' + clean(data.reportNumber) + ')' : '';
      reference = lead + '(' + year + '). ' + ensurePeriod(data.title + reportNo);
      if (clean(data.publisher) && clean(data.publisher) !== clean(data.organization)) reference += ' ' + ensurePeriod(data.publisher);
    }
    if (place) reference += ' ' + place;
    var key = authorKey(authors, data.organization);
    var inText = authors.length > 2 ? '(' + key + ' et al., ' + year + ')' : authors.length === 2 ? '(' + authors[0].family + ' & ' + authors[1].family + ', ' + year + ')' : '(' + key + ', ' + year + ')';
    return { reference: clean(reference), inText: inText };
  }

  function formatMla(data, authors) {
    var author = mlaAuthors(authors, data.organization);
    var lead = author ? author + '. ' : '';
    var year = clean(data.year);
    var place = mlaLocator(data);
    var reference = '';
    if (data.sourceType === 'book') {
      reference = lead + ensurePeriod(data.title) + (clean(data.edition) ? ' ' + ensurePeriod(clean(data.edition) + ' ed.') : '') + ' ' + [clean(data.publisher), year].filter(Boolean).join(', ') + '.';
    } else if (data.sourceType === 'journal') {
      reference = lead + '“' + stripTrailingPunctuation(data.title) + '.” ' + clean(data.containerTitle) + ', vol. ' + clean(data.volume);
      if (clean(data.issue)) reference += ', no. ' + clean(data.issue);
      if (year) reference += ', ' + year;
      if (clean(data.pages)) reference += ', pp. ' + clean(data.pages);
      reference += '.';
    } else if (data.sourceType === 'webpage') {
      reference = lead + '“' + stripTrailingPunctuation(data.title) + '.” ' + ensurePeriod(data.containerTitle);
      var published = formatDate(data.publicationDate, 'mla') || year;
      if (published) reference += ' ' + published + '.';
    } else {
      reference = lead + ensurePeriod(data.title) + (clean(data.reportNumber) ? ' ' + ensurePeriod(clean(data.reportNumber)) : '') + ' ' + [clean(data.publisher), year].filter(Boolean).join(', ') + '.';
    }
    if (place) reference += ' ' + place + '.';
    if (clean(data.accessDate) && (data.sourceType === 'webpage' || data.url)) reference += ' Accessed ' + formatDate(data.accessDate, 'mla') + '.';
    var key = authorKey(authors, data.organization);
    return { reference: clean(reference), inText: '(' + key + ')' };
  }

  function formatChicago(data, authors) {
    var author = chicagoAuthors(authors, data.organization);
    var year = yearOrNoDate(data.year, 'chicago');
    var lead = author ? author + '. ' : '';
    var place = locator(data);
    var reference = '';
    if (data.sourceType === 'book') {
      reference = lead + year + '. ' + ensurePeriod(data.title) + (clean(data.edition) ? ' ' + ensurePeriod(clean(data.edition) + ' ed.') : '') + ' ' + ensurePeriod(data.publisher);
    } else if (data.sourceType === 'journal') {
      reference = lead + year + '. “' + stripTrailingPunctuation(data.title) + '.” ' + clean(data.containerTitle) + ' ' + clean(data.volume);
      if (clean(data.issue)) reference += ', no. ' + clean(data.issue);
      if (clean(data.pages)) reference += ': ' + clean(data.pages);
      reference += '.';
    } else if (data.sourceType === 'webpage') {
      reference = lead + year + '. “' + stripTrailingPunctuation(data.title) + '.” ' + ensurePeriod(data.containerTitle);
      if (data.publicationDate) reference += ' ' + formatDate(data.publicationDate, 'chicago') + '.';
    } else {
      reference = lead + year + '. ' + ensurePeriod(data.title) + (clean(data.reportNumber) ? ' ' + ensurePeriod(clean(data.reportNumber)) : '') + ' ' + ensurePeriod(data.publisher);
    }
    if (place) reference += ' ' + place + '.';
    return { reference: clean(reference), inText: '(' + authorKey(authors, data.organization) + ' ' + year + ')' };
  }

  function formatHarvard(data, authors) {
    var author = harvardAuthors(authors, data.organization);
    var year = yearOrNoDate(data.year, 'harvard');
    var lead = author ? author + ' ' : '';
    var place = locator(data);
    var reference = '';
    if (data.sourceType === 'book') {
      reference = lead + '(' + year + ') ' + ensurePeriod(data.title) + (clean(data.edition) ? ' ' + ensurePeriod(clean(data.edition) + ' edn.') : '') + ' ' + ensurePeriod(data.publisher);
    } else if (data.sourceType === 'journal') {
      reference = lead + '(' + year + ') ‘' + stripTrailingPunctuation(data.title) + '’, ' + clean(data.containerTitle) + ', ' + clean(data.volume);
      if (clean(data.issue)) reference += '(' + clean(data.issue) + ')';
      if (clean(data.pages)) reference += ', pp. ' + clean(data.pages);
      reference += '.';
    } else if (data.sourceType === 'webpage') {
      reference = lead + '(' + year + ') ' + ensurePeriod(data.title) + ' ' + ensurePeriod(data.containerTitle);
    } else {
      reference = lead + '(' + year + ') ' + ensurePeriod(data.title) + (clean(data.reportNumber) ? ' ' + ensurePeriod(clean(data.reportNumber)) : '') + ' ' + ensurePeriod(data.publisher);
    }
    if (place) reference += ' Available at: ' + place + '.';
    if (clean(data.accessDate) && place) reference += ' (Accessed: ' + formatDate(data.accessDate, 'harvard') + ').';
    return { reference: clean(reference), inText: '(' + authorKey(authors, data.organization) + ', ' + year + ')' };
  }

  function validate(data) {
    var errors = [];
    if (!clean(data.title)) errors.push('Enter the source title.');
    if (!parseAuthors(data.authors).length && !clean(data.organization)) errors.push('Enter at least one author or an organisation.');
    if (clean(data.year) && !/^\d{4}$/.test(clean(data.year))) errors.push('Use a four-digit publication year.');
    if (data.sourceType === 'book' && !clean(data.publisher)) errors.push('Enter the book publisher.');
    if (data.sourceType === 'journal') {
      if (!clean(data.containerTitle)) errors.push('Enter the journal name.');
      if (!clean(data.volume)) errors.push('Enter the journal volume.');
      if (!clean(data.pages)) errors.push('Enter the article page range.');
    }
    if (data.sourceType === 'webpage') {
      if (!clean(data.containerTitle)) errors.push('Enter the website name.');
      if (!clean(data.url)) errors.push('Enter the webpage URL.');
    }
    if (data.sourceType === 'report' && !clean(data.publisher) && !clean(data.organization)) errors.push('Enter the report publisher or organisation.');
    return errors;
  }

  function referenceHtml(reference, data) {
    var html = escapeHtml(reference);
    var emphasis = '';
    if (data.sourceType === 'journal') emphasis = clean(data.containerTitle);
    else if (data.sourceType === 'book' || data.sourceType === 'report') emphasis = clean(data.title);
    else if (data.sourceType === 'webpage' && data.style === 'mla') emphasis = clean(data.containerTitle);
    else if (data.sourceType === 'webpage' && (data.style === 'apa' || data.style === 'harvard')) emphasis = clean(data.title);
    if (!emphasis) return html;
    var escapedEmphasis = escapeHtml(stripTrailingPunctuation(emphasis));
    var index = html.indexOf(escapedEmphasis);
    if (index === -1) return html;
    return html.slice(0, index) + '<cite>' + escapedEmphasis + '</cite>' + html.slice(index + escapedEmphasis.length);
  }

  function generate(input) {
    var data = Object.assign({ style: 'apa', sourceType: 'book' }, input || {});
    var errors = validate(data);
    if (errors.length) return { valid: false, errors: errors, reference: '', inText: '', note: STYLE_NOTES[data.style] || '' };
    var authors = parseAuthors(data.authors);
    var output = data.style === 'mla' ? formatMla(data, authors)
      : data.style === 'chicago' ? formatChicago(data, authors)
      : data.style === 'harvard' ? formatHarvard(data, authors)
      : formatApa(data, authors);
    return {
      valid: true,
      errors: [],
      reference: output.reference,
      referenceHtml: referenceHtml(output.reference, data),
      inText: output.inText,
      sortKey: authorKey(authors, data.organization).toLocaleLowerCase(),
      note: STYLE_NOTES[data.style] || STYLE_NOTES.apa
    };
  }

  return {
    generate: generate,
    parseAuthors: parseAuthors,
    normalizeDoi: normalizeDoi,
    normalizeUrl: normalizeUrl,
    styleNotes: STYLE_NOTES
  };
});
