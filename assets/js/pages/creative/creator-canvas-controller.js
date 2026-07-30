(function (window, document) {
  'use strict';

  var root = document.querySelector('[data-creator-canvas-app]');
  if (!root) return;

  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.creatorCanvas;
  var locale = root.getAttribute('data-locale') === 'fr' ? 'fr' : 'en';
  var currentDesign = null;
  var canvas = root.querySelector('canvas');
  var context = canvas.getContext('2d');

  function field(name) {
    return root.querySelector('[name="' + name + '"]');
  }

  function collect() {
    return {
      format: field('format').value,
      title: field('title').value,
      subtitle: field('subtitle').value,
      cta: field('cta').value,
      primaryColor: field('primaryColor').value,
      secondaryColor: field('secondaryColor').value,
      textColor: field('textColor').value,
      align: field('align').value,
    };
  }

  function status(message) {
    root.querySelector('[data-status]').textContent = message;
  }

  function splitLines(ctx, value, maxWidth) {
    var words = String(value || '').split(/\s+/).filter(Boolean);
    var lines = [];
    var line = '';
    words.forEach(function (word) {
      var candidate = line ? line + ' ' + word : word;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line);
    return lines.slice(0, 5);
  }

  function drawTextBlock(text, y, size, weight, width, align, color, lineHeight) {
    context.font = weight + ' ' + size + 'px Arial, sans-serif';
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'top';
    var x = align === 'left' ? width * 0.09 : align === 'right' ? width * 0.91 : width / 2;
    var lines = splitLines(context, text, width * 0.82);
    lines.forEach(function (line, index) {
      context.fillText(line, x, y + index * lineHeight);
    });
    return y + lines.length * lineHeight;
  }

  function render(design) {
    currentDesign = design;
    canvas.width = design.width;
    canvas.height = design.height;

    var gradient = context.createLinearGradient(0, 0, design.width, design.height);
    gradient.addColorStop(0, design.colors[0]);
    gradient.addColorStop(1, design.colors[1]);
    context.fillStyle = gradient;
    context.fillRect(0, 0, design.width, design.height);

    context.globalAlpha = .16;
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(design.width * .88, design.height * .15, Math.min(design.width, design.height) * .17, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(design.width * .1, design.height * .9, Math.min(design.width, design.height) * .26, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;

    var titleSize = Math.max(38, Math.round(Math.min(design.width, design.height) * .09));
    var subtitleSize = Math.max(22, Math.round(titleSize * .38));
    var startY = design.height * .25;
    var afterTitle = drawTextBlock(design.title, startY, titleSize, '900', design.width, design.align, design.colors[2], titleSize * 1.05);
    if (design.subtitle) {
      afterTitle = drawTextBlock(design.subtitle, afterTitle + titleSize * .25, subtitleSize, '600', design.width, design.align, design.colors[2], subtitleSize * 1.25);
    }
    if (design.cta) {
      var ctaWidth = Math.min(design.width * .72, Math.max(design.width * .28, design.cta.length * subtitleSize * .68));
      var ctaHeight = subtitleSize * 2.25;
      var ctaX = design.align === 'left' ? design.width * .09 :
        design.align === 'right' ? design.width * .91 - ctaWidth : (design.width - ctaWidth) / 2;
      var ctaY = Math.min(afterTitle + titleSize * .45, design.height - ctaHeight - design.height * .1);
      context.fillStyle = design.colors[2];
      context.beginPath();
      context.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, ctaHeight / 2);
      context.fill();
      context.fillStyle = design.colors[0];
      context.font = '800 ' + subtitleSize + 'px Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(design.cta, ctaX + ctaWidth / 2, ctaY + ctaHeight / 2);
    }

    root.querySelector('[data-dimensions]').textContent = design.width + '×' + design.height;
    root.querySelector('[data-platform]').textContent = design.platform;
    root.querySelector('[data-safe-zone]').textContent = design.safeZone;
  }

  function generate(showStatus) {
    if (!engine || typeof engine.buildDesign !== 'function') {
      status(locale === 'fr' ? 'Le moteur local est indisponible.' : 'The local engine is unavailable.');
      return null;
    }
    var design = engine.buildDesign(collect());
    render(design);
    if (showStatus) status(locale === 'fr' ? 'Visuel généré localement.' : 'Graphic generated locally.');
    return design;
  }

  function download(content, type, filename) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function baseName() {
    return (currentDesign && currentDesign.title || 'creator-canvas').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'creator-canvas';
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(value);
    var area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    return Promise.resolve();
  }

  root.querySelector('form').addEventListener('submit', function (event) {
    event.preventDefault();
    generate(true);
  });

  root.querySelector('[data-png]').addEventListener('click', function () {
    var design = generate(false);
    if (!design) return;
    canvas.toBlob(function (blob) {
      if (!blob) {
        status(locale === 'fr' ? 'Le PNG ne peut pas être créé.' : 'The PNG could not be created.');
        return;
      }
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = baseName() + '-' + design.width + 'x' + design.height + '.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 500);
      status(locale === 'fr' ? 'PNG téléchargé aux dimensions indiquées.' : 'PNG downloaded at the stated dimensions.');
    }, 'image/png');
  });

  root.querySelector('[data-json]').addEventListener('click', function () {
    var design = generate(false);
    if (!design) return;
    download(JSON.stringify(design, null, 2), 'application/json', baseName() + '-design.json');
    status(locale === 'fr' ? 'Projet JSON téléchargé.' : 'JSON project downloaded.');
  });

  root.querySelector('[data-txt]').addEventListener('click', function () {
    var design = generate(false);
    if (!design) return;
    download(engine.toText(design, locale), 'text/plain;charset=utf-8', baseName() + '-brief.txt');
    status(locale === 'fr' ? 'Brief TXT téléchargé.' : 'TXT brief downloaded.');
  });

  root.querySelector('[data-copy]').addEventListener('click', function () {
    var design = generate(false);
    if (!design) return;
    copyText(engine.toText(design, locale)).then(function () {
      status(locale === 'fr' ? 'Brief copié.' : 'Brief copied.');
    });
  });

  generate(false);
})(window, document);
