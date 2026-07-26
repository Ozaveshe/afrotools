(function () {
  'use strict';

  var STORAGE_KEY = 'afrotools-citation-generator-bibliography-v2';
  var entries = [];
  var latest = null;
  var form;

  var fieldRules = {
    book: ['authors', 'organization', 'year', 'title', 'edition', 'publisher', 'doi', 'url'],
    journal: ['authors', 'organization', 'year', 'title', 'containerTitle', 'volume', 'issue', 'pages', 'doi', 'url'],
    webpage: ['authors', 'organization', 'year', 'publicationDate', 'title', 'containerTitle', 'url', 'accessDate'],
    report: ['authors', 'organization', 'year', 'title', 'publisher', 'reportNumber', 'doi', 'url']
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function selected(name) {
    var input = form.querySelector('input[name="' + name + '"]:checked');
    return input ? input.value : '';
  }

  function readForm() {
    var data = { style: selected('style'), sourceType: selected('sourceType') };
    Array.prototype.forEach.call(form.elements, function (field) {
      if (field.name && field.type !== 'radio') data[field.name] = field.value;
    });
    return data;
  }

  function setFieldsForSource() {
    var source = selected('sourceType');
    var visible = fieldRules[source] || [];
    document.querySelectorAll('[data-field]').forEach(function (wrapper) {
      var show = visible.indexOf(wrapper.dataset.field) !== -1;
      wrapper.hidden = !show;
      wrapper.querySelectorAll('input').forEach(function (input) {
        input.disabled = !show;
      });
    });
    updatePreview();
  }

  function updatePreview() {
    latest = window.AfroTools.citationEngine.generate(readForm());
    byId('styleNote').textContent = latest.note;
    byId('formError').textContent = latest.valid ? '' : latest.errors[0] || '';
    if (latest.valid) byId('referenceOutput').innerHTML = latest.referenceHtml;
    else byId('referenceOutput').textContent = 'Enter a title and the available source details.';
    byId('inTextOutput').textContent = latest.valid ? latest.inText : '—';
    ['copyReferenceBtn', 'copyInTextBtn', 'addBtn'].forEach(function (id) {
      byId(id).disabled = !latest.valid;
    });
    var style = selected('style');
    byId('referenceLabel').textContent = style === 'mla' ? 'Works-cited entry' : 'Reference-list entry';
    byId('inTextLabel').textContent = style === 'chicago' ? 'Parenthetical author-date citation' : 'In-text citation';
  }

  function announce(target, message) {
    byId(target).textContent = message;
  }

  function copyText(text, target, success) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        announce(target, success);
      }).catch(function () {
        fallbackCopy(text, target, success);
      });
    } else {
      fallbackCopy(text, target, success);
    }
  }

  function fallbackCopy(text, target, success) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var copied = false;
    try { copied = document.execCommand('copy'); } catch (error) { copied = false; }
    area.remove();
    announce(target, copied ? success : 'Copy was blocked. Use Download TXT instead.');
  }

  function bibliographyText() {
    return entries.map(function (entry) { return entry.reference; }).join('\n\n');
  }

  function renderBibliography() {
    var list = byId('bibliographyList');
    list.replaceChildren();
    byId('bibCount').textContent = '(' + entries.length + ')';
    if (!entries.length) {
      var empty = document.createElement('li');
      empty.className = 'citation-empty';
      empty.textContent = 'No entries yet. Complete a reference above and add it here.';
      list.appendChild(empty);
      return;
    }
    entries.forEach(function (entry, index) {
      var item = document.createElement('li');
      var text = document.createElement('p');
      text.innerHTML = entry.referenceHtml;
      var actions = document.createElement('div');
      actions.className = 'citation-entry-actions';
      var up = makeEntryButton('Move up', index, function () { move(index, -1); });
      var down = makeEntryButton('Move down', index, function () { move(index, 1); });
      var remove = makeEntryButton('Remove', index, function () {
        entries.splice(index, 1);
        renderBibliography();
        announce('bibliographyStatus', 'Entry removed.');
      });
      up.disabled = index === 0;
      down.disabled = index === entries.length - 1;
      actions.append(up, down, remove);
      item.append(text, actions);
      list.appendChild(item);
    });
  }

  function makeEntryButton(label, index, handler) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-ghost';
    button.textContent = label;
    button.setAttribute('aria-label', label + ' citation ' + (index + 1));
    button.addEventListener('click', handler);
    return button;
  }

  function move(index, direction) {
    var target = index + direction;
    if (target < 0 || target >= entries.length) return;
    var item = entries.splice(index, 1)[0];
    entries.splice(target, 0, item);
    renderBibliography();
    announce('bibliographyStatus', 'Entry moved.');
  }

  function addEntry() {
    if (!latest || !latest.valid) return;
    if (entries.some(function (entry) { return entry.reference === latest.reference; })) {
      announce('previewStatus', 'This exact reference is already in the bibliography.');
      return;
    }
    entries.push({
      reference: latest.reference,
      referenceHtml: latest.referenceHtml,
      inText: latest.inText,
      style: selected('style'),
      sortKey: latest.sortKey,
      input: readForm()
    });
    renderBibliography();
    announce('previewStatus', 'Reference added to the bibliography.');
  }

  function resetFields() {
    form.querySelectorAll('input:not([type="radio"])').forEach(function (input) { input.value = ''; });
    announce('previewStatus', 'Fields reset.');
    updatePreview();
    byId('authors').focus();
  }

  function saveLocally() {
    if (!entries.length) {
      announce('bibliographyStatus', 'Add at least one entry before saving.');
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, savedAt: new Date().toISOString(), entries: entries }));
      announce('bibliographyStatus', 'Bibliography saved in this browser only.');
    } catch (error) {
      announce('bibliographyStatus', 'Browser storage is unavailable. Download TXT instead.');
    }
  }

  function restoreSaved() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || saved.version !== 2 || !Array.isArray(saved.entries) || !saved.entries.length) {
        announce('bibliographyStatus', 'No saved bibliography was found.');
        return;
      }
      entries = saved.entries.filter(function (entry) {
        return entry && entry.input && typeof entry.input === 'object';
      }).map(function (entry) {
        var regenerated = window.AfroTools.citationEngine.generate(entry.input);
        if (!regenerated.valid) return null;
        return {
          reference: regenerated.reference,
          referenceHtml: regenerated.referenceHtml,
          inText: regenerated.inText,
          style: String(entry.input.style || ''),
          sortKey: regenerated.sortKey,
          input: entry.input
        };
      }).filter(Boolean);
      renderBibliography();
      announce('bibliographyStatus', 'Saved bibliography restored.');
    } catch (error) {
      announce('bibliographyStatus', 'The saved bibliography could not be restored.');
    }
  }

  function downloadText() {
    var text = bibliographyText();
    if (!text) {
      announce('bibliographyStatus', 'Add at least one entry before downloading.');
      return;
    }
    var blob = new Blob([text + '\n'], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'bibliography-' + new Date().toISOString().slice(0, 10) + '.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    announce('bibliographyStatus', 'Bibliography TXT downloaded.');
  }

  function clearEntries() {
    if (!entries.length) {
      announce('bibliographyStatus', 'The bibliography is already empty.');
      return;
    }
    if (!window.confirm('Clear the current bibliography? A separately saved local copy will remain until you save again or clear site data.')) return;
    entries = [];
    renderBibliography();
    announce('bibliographyStatus', 'Current bibliography cleared.');
  }

  function bind() {
    form = byId('citationForm');
    form.addEventListener('input', updatePreview);
    form.addEventListener('change', function (event) {
      if (event.target.name === 'sourceType') setFieldsForSource();
      else updatePreview();
    });
    byId('resetBtn').addEventListener('click', resetFields);
    byId('copyReferenceBtn').addEventListener('click', function () { copyText(latest && latest.reference, 'previewStatus', 'Reference copied.'); });
    byId('copyInTextBtn').addEventListener('click', function () { copyText(latest && latest.inText, 'previewStatus', 'In-text citation copied.'); });
    byId('addBtn').addEventListener('click', addEntry);
    byId('sortBtn').addEventListener('click', function () {
      entries.sort(function (a, b) { return a.sortKey.localeCompare(b.sortKey); });
      renderBibliography();
      announce('bibliographyStatus', entries.length ? 'Bibliography sorted A–Z.' : 'Add entries before sorting.');
    });
    byId('copyAllBtn').addEventListener('click', function () { copyText(bibliographyText(), 'bibliographyStatus', 'Bibliography copied.'); });
    byId('downloadBtn').addEventListener('click', downloadText);
    byId('printBtn').addEventListener('click', function () {
      if (!entries.length) {
        announce('bibliographyStatus', 'Add at least one entry before printing.');
        return;
      }
      window.print();
    });
    byId('saveBtn').addEventListener('click', saveLocally);
    byId('restoreBtn').addEventListener('click', restoreSaved);
    byId('bibliographyClearBtn').addEventListener('click', clearEntries);
    setFieldsForSource();
    renderBibliography();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
