"use strict";

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function withWidgetCalculator(html, item, widget) {
  if (!item.fullFrenchLabel) return html;
  if (!/^\/widgets\/iframe\/[a-z0-9-]+\.html$/.test(widget.iframePath)) {
    throw new Error("Unexpected widget path: " + widget.iframePath);
  }
  const replaceOne = (pattern, replacement) => {
    const matches = html.match(pattern);
    if (!matches || matches.length !== 1) throw new Error("Expected one matching parent section: " + item.slug + " " + pattern);
    html = html.replace(pattern, () => replacement);
  };
  const related = item.relatedDestination === true;
  const destinationType = related ? "Ressource complémentaire" : "Calculateur détaillé";
  const target = escapeHtml(item.fullFrenchPath);
  const label = escapeHtml(item.fullFrenchLabel);
  const title = escapeHtml(item.title);
  replaceOne(/<a class="btn btn-primary" href="[^"]*">[^<]*<\/a>/g,
    item.externalCalculator ? '<a class="btn btn-primary" href="' + target + '">' + label + '</a>' : '<a class="btn btn-primary" href="#calculateur">Utiliser le calculateur</a>');
  replaceOne(/<li><strong>(?:Exp[ée]rience principale|Ressource complémentaire|Calculateur détaillé)<\/strong><span>[^\n]*?<\/span><\/li>/g,
    '<li><strong>' + destinationType + '</strong><span><a href="' + target + '">' + label + '</a></span></li>');
  replaceOne(/<strong>(?:Outil complet|Ressource complémentaire|Calculateur détaillé)<\/strong>\s*<span>[^<]+<\/span>/g,
    '<strong>' + destinationType + '</strong>\n          <span>' + target + '</span>');
  const start = '<!-- fr-widget-calculator:start -->';
  const end = '<!-- fr-widget-calculator:end -->';
  if (item.externalCalculator) {
    return html.replace(/<!-- fr-widget-calculator:start -->[\s\S]*?<!-- fr-widget-calculator:end -->\n\n/, '');
  }
  const panel = [
    start,
    '  <section id="calculateur" class="commercial-section" aria-label="Calculateur interactif">',
    '    <div class="container"><h2>' + title + '</h2>',
    '      <iframe src="' + widget.iframePath + '?lang=fr" loading="lazy" width="100%" height="520" title="' + title + '"></iframe>',
    '    </div>',
    '  </section>',
    end,
  ].join("\n");
  if (html.includes(start)) {
    replaceOne(/<!-- fr-widget-calculator:start -->[\s\S]*?<!-- fr-widget-calculator:end -->/g, panel);
  } else {
    const next = '  <section class="commercial-section">';
    const at = html.indexOf(next);
    if (at < 0) throw new Error("Missing parent section: " + item.slug);
    html = html.slice(0, at) + panel + "\n\n" + html.slice(at);
  }
  return html;
}

module.exports = { withWidgetCalculator };
