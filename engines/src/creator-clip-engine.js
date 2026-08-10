(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.CreatorClipEngine = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  function seconds(value) {
    var text = String(value == null ? "" : value).trim();
    if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);
    var match = text.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/);
    if (!match) return NaN;
    return (
      Number(match[1] || 0) * 3600 +
      Number(match[2]) * 60 +
      Number(match[3]) +
      Number("0." + (match[4] || 0))
    );
  }
  function plan(input) {
    var source = input || {},
      start = seconds(source.start),
      end = seconds(source.end),
      title = String(source.title || "").trim();
    if (title.length < 3) throw new Error("title");
    if (!Number.isFinite(start) || start < 0) throw new Error("start");
    if (!Number.isFinite(end) || end <= start) throw new Error("end");
    if (end - start > 300) throw new Error("duration");
    return {
      title: title,
      startSeconds: start,
      endSeconds: end,
      durationSeconds: Number((end - start).toFixed(3)),
      mimeType: "video/webm",
      boundary:
        "The browser records only the selected local media stream; codec support depends on this browser.",
    };
  }
  function isWebm(bytes) {
    var view =
      bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    return (
      view.length >= 4 &&
      view[0] === 0x1a &&
      view[1] === 0x45 &&
      view[2] === 0xdf &&
      view[3] === 0xa3
    );
  }
  return Object.freeze({
    parseTimestamp: seconds,
    createPlan: plan,
    isWebm: isWebm,
  });
});
