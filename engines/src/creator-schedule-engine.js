(function () {
  "use strict";
  var platforms = ["instagram", "tiktok", "youtube", "linkedin", "facebook", "x", "whatsapp"];
  function createPost(input) {
    var source = input || {};
    var title = String(source.title || "").trim();
    var platform = String(source.platform || "").toLowerCase();
    var scheduledAt = String(source.scheduledAt || "").trim();
    if (!title) throw new Error("Post title is required.");
    if (!platforms.includes(platform)) throw new Error("Platform is invalid.");
    if (!scheduledAt || Number.isNaN(Date.parse(scheduledAt))) throw new Error("A valid date and time are required.");
    return { title: title, platform: platform, scheduledAt: scheduledAt, status: "planned", note: String(source.note || "").trim() };
  }
  function sortPosts(posts) {
    return (posts || []).slice().sort(function (a, b) { return Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt); });
  }
  function csvCell(value) {
    var text = String(value == null ? "" : value);
    // Keep formula-like user text literal on the initial spreadsheet import.
    // JSON remains the lossless source; CSV re-save behavior varies by reader.
    if (/^[\s\u0000-\u001f]*[=+@\-\uFF1D\uFF0B\uFF0D\uFF20]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function toCsv(posts) {
    return ["title,platform,scheduled_at,status,note"].concat(sortPosts(posts).map(function (post) {
      return [post.title, post.platform, post.scheduledAt, post.status, post.note].map(csvCell).join(",");
    })).join("\r\n");
  }
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.CreatorScheduleEngine = { createPost: createPost, sortPosts: sortPosts, toCsv: toCsv, platforms: platforms.slice() };
}());
