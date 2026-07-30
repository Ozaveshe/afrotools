(function () {
  "use strict";
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char];
    });
  }
  function buildNewsletter(input) {
    var source = input || {}, subject = String(source.subject || "").trim(), headline = String(source.headline || "").trim(), body = String(source.body || "").trim(), cta = String(source.cta || "").trim(), url = String(source.url || "").trim();
    if (!subject) throw new Error("Subject is required.");
    if (!headline) throw new Error("Headline is required.");
    if (body.length < 20) throw new Error("Body must contain at least 20 characters.");
    if (url && !/^https?:\/\//i.test(url)) throw new Error("CTA URL must use HTTP or HTTPS.");
    return { subject: subject, preheader: String(source.preheader || "").trim(), headline: headline, body: body, cta: cta, url: url, sender: String(source.sender || "").trim() };
  }
  function renderHtml(newsletter, lang) {
    var item = newsletter || {}, locale = lang === "fr" ? "fr" : "en", paragraphs = String(item.body || "").split(/\n+/).filter(Boolean).map(function (paragraph) { return '<p style="margin:0 0 16px;line-height:1.65">' + escapeHtml(paragraph) + "</p>"; }).join("");
    var button = item.cta && item.url ? '<p style="margin:24px 0"><a href="' + escapeHtml(item.url) + '" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">' + escapeHtml(item.cta) + "</a></p>" : "";
    return '<!doctype html><html lang="' + locale + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' + escapeHtml(item.subject) + '</title></head><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827"><div style="display:none;max-height:0;overflow:hidden">' + escapeHtml(item.preheader) + '</div><main style="max-width:640px;margin:0 auto;background:#fff;padding:32px 24px"><h1 style="font-size:28px;line-height:1.2">' + escapeHtml(item.headline) + "</h1>" + paragraphs + button + (item.sender ? '<p style="margin-top:28px;color:#4b5563">' + escapeHtml(item.sender) + "</p>" : "") + '<hr style="margin:32px 0;border:0;border-top:1px solid #e5e7eb"><p style="font-size:12px;color:#6b7280">' + (locale === "fr" ? "Ajoutez ici vos coordonnées d’expéditeur et votre lien de désinscription avant envoi." : "Add your sender details and unsubscribe link here before sending.") + "</p></main></body></html>";
  }
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.CreatorMailEngine = { buildNewsletter: buildNewsletter, renderHtml: renderHtml, escapeHtml: escapeHtml };
}());
