(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RegulatoryPublicFeed = factory();
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var DAY = 86400000, MAX_BYTES = 262144;
  function fail() { throw new Error('invalid-public-regulatory-feed'); }
  function object(value, keys) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.keys(value).length !== keys.length ||
        keys.some(function (key) { return !Object.prototype.hasOwnProperty.call(value, key); })) fail();
  }
  function text(value, max) {
    if (typeof value !== 'string' || !value.trim() || value !== value.trim() ||
        value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail();
  }
  function id(value) { text(value, 120); if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) fail(); }
  function date(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail();
    var ms = Date.parse(value + 'T00:00:00Z');
    if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== value) fail();
    return ms;
  }
  function url(value) {
    text(value, 2000);
    var parsed;
    try { parsed = new URL(value); } catch (_) { fail(); }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) fail();
    return value;
  }
  function list(value, max) { if (!Array.isArray(value) || value.length > max) fail(); }
  function sameSet(a, b) { return JSON.stringify(a.slice().sort()) === JSON.stringify(b.slice().sort()); }
  function unique(values) { if (new Set(values).size !== values.length) fail(); }
  function validateFeed(input, engine, now) {
    now = now === undefined ? Date.now() : now;
    if (!Number.isFinite(now) || !engine || !engine.CHANGE_TYPES || !engine.TOOL_LABELS) fail();
    object(input, ['schema_version', 'review_cadence_days', 'coverage', 'records']);
    if (input.schema_version !== 1 || input.review_cadence_days !== 90) fail();
    object(input.coverage, ['mode', 'not_exhaustive', 'countries', 'change_types']);
    if (input.coverage.mode !== 'selected-historical-events' || input.coverage.not_exhaustive !== true) fail();
    list(input.coverage.countries, 54); unique(input.coverage.countries);
    list(input.coverage.change_types, 8); unique(input.coverage.change_types);
    list(input.records, 100);
    var ids = [];
    var records = input.records.map(function (r) {
      object(r, ['id', 'country_code', 'change_type', 'title', 'summary', 'source_id',
        'sources', 'source_published_date', 'effective_date', 'reviewed_at',
        'public_approval', 'status', 'superseded_by', 'correction_note', 'tools_referenced']);
      id(r.id); ids.push(r.id); id(r.source_id);
      if (!engine.getCountryByCode(r.country_code) ||
          !Object.prototype.hasOwnProperty.call(engine.CHANGE_TYPES, r.change_type)) fail();
      text(r.title, 300); text(r.summary, 5000);
      date(r.source_published_date);
      if (r.effective_date !== null) date(r.effective_date);
      if (typeof r.reviewed_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(r.reviewed_at)) fail();
      date(r.reviewed_at.slice(0, 10));
      var review = Date.parse(r.reviewed_at);
      if (!Number.isFinite(review) || new Date(review).toISOString() !== r.reviewed_at ||
          review > now || review < date(r.source_published_date)) fail();
      object(r.public_approval, ['decision_id', 'source_review_sha256']);
      id(r.public_approval.decision_id);
      if (!/^[a-f0-9]{64}$/.test(r.public_approval.source_review_sha256)) fail();
      list(r.sources, 5); if (!r.sources.length) fail();
      var primary = 0, sourceURLs = [];
      var sources = r.sources.map(function (s) {
        object(s, ['kind', 'url', 'publisher', 'document']);
        if (s.kind !== 'primary' && s.kind !== 'corroboration') fail();
        if (s.kind === 'primary') primary++;
        url(s.url); text(s.publisher, 200); text(s.document, 300); sourceURLs.push(s.url);
        return {kind:s.kind, url:s.url, publisher:s.publisher, document:s.document};
      });
      if (primary !== 1) fail(); unique(sourceURLs);
      if (['historical', 'superseded', 'withdrawn'].indexOf(r.status) === -1) fail();
      if (r.superseded_by !== null) id(r.superseded_by);
      if ((r.status === 'superseded') !== (r.superseded_by !== null) || r.superseded_by === r.id) fail();
      if (r.correction_note !== null) text(r.correction_note, 1000);
      if (r.status !== 'historical' && r.correction_note === null) fail();
      list(r.tools_referenced, 20); unique(r.tools_referenced);
      r.tools_referenced.forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(engine.TOOL_LABELS, key)) fail();
      });
      return {id:r.id, country_code:r.country_code, change_type:r.change_type,
        title:r.title, summary:r.summary, source_id:r.source_id, sources:sources,
        source_published_date:r.source_published_date, effective_date:r.effective_date,
        reviewed_at:r.reviewed_at, public_approval:{decision_id:r.public_approval.decision_id,
          source_review_sha256:r.public_approval.source_review_sha256},
        status:r.status, superseded_by:r.superseded_by, correction_note:r.correction_note,
        tools_referenced:r.tools_referenced.slice(), review_due:now >= review + 90 * DAY,
        review_due_at:new Date(review + 90 * DAY).toISOString()};
    });
    unique(ids);
    records.forEach(function (r) { if (r.superseded_by && ids.indexOf(r.superseded_by) === -1) fail(); });
    if (!sameSet(input.coverage.countries, Array.from(new Set(records.map(function (r) { return r.country_code; })))) ||
        !sameSet(input.coverage.change_types, Array.from(new Set(records.map(function (r) { return r.change_type; }))))) fail();
    return {records:records, coverage:{mode:input.coverage.mode, not_exhaustive:true,
      countries:input.coverage.countries.slice(), change_types:input.coverage.change_types.slice()}};
  }
  return {validateFeed:validateFeed, MAX_BYTES:MAX_BYTES};
}));
