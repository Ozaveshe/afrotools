(function () {
  'use strict';

  var STORAGE_KEY = 'afrotools-cover-letter-current-v2';
  var SHARE_PARAM = 'letter';
  var selectedId = null;
  var manualEdit = false;
  var saveState = window.SaveState ? new window.SaveState('cover-letter') : null;

  var templates = [
    {
      id: 'technology',
      name: 'Technology',
      focus: 'shipping reliable digital products',
      opener: 'technical delivery, product thinking, and practical problem solving',
      proofHint: 'engineering, product, data, cybersecurity, IT support, or cloud work'
    },
    {
      id: 'finance',
      name: 'Finance and Banking',
      focus: 'accuracy, trust, compliance, and measurable commercial outcomes',
      opener: 'financial analysis, controls, customer trust, and operational discipline',
      proofHint: 'banking, fintech, audit, credit, reconciliation, treasury, or risk work'
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      focus: 'patient-centered service, safe operations, and clear communication',
      opener: 'clinical awareness, empathy, compliance, and operational follow-through',
      proofHint: 'clinical, hospital operations, public health, insurance, or health-tech work'
    },
    {
      id: 'education',
      name: 'Education',
      focus: 'learning outcomes, student support, and structured program delivery',
      opener: 'teaching, curriculum support, mentoring, and learner engagement',
      proofHint: 'school, university, edtech, tutoring, training, or program coordination work'
    },
    {
      id: 'engineering',
      name: 'Engineering and Construction',
      focus: 'safe execution, technical judgement, cost control, and site discipline',
      opener: 'technical delivery, site coordination, quality control, and safety awareness',
      proofHint: 'civil, mechanical, electrical, project, facilities, or construction work'
    },
    {
      id: 'ngo',
      name: 'NGO and Development',
      focus: 'community impact, donor accountability, and field execution',
      opener: 'program delivery, stakeholder coordination, reporting, and measurable impact',
      proofHint: 'development, grant, M&E, field operations, community, or donor work'
    },
    {
      id: 'government',
      name: 'Government and Public Sector',
      focus: 'public service, policy execution, compliance, and citizen outcomes',
      opener: 'administration, policy support, compliance, and service delivery',
      proofHint: 'public administration, policy, procurement, compliance, or records work'
    },
    {
      id: 'sales',
      name: 'Sales and Customer Success',
      focus: 'revenue growth, customer trust, and disciplined follow-up',
      opener: 'relationship management, pipeline ownership, negotiation, and service recovery',
      proofHint: 'sales, account management, support, operations, or customer success work'
    },
    {
      id: 'creative',
      name: 'Creative and Media',
      focus: 'clear storytelling, campaign results, and audience understanding',
      opener: 'content strategy, design judgement, campaign execution, and audience insight',
      proofHint: 'brand, content, design, marketing, media, or creator work'
    },
    {
      id: 'graduate',
      name: 'Graduate or Internship',
      focus: 'learning speed, initiative, and evidence of potential',
      opener: 'academic projects, internships, volunteer work, and a strong learning curve',
      proofHint: 'coursework, internships, volunteer work, campus leadership, or portfolio projects'
    }
  ];

  var tones = [
    { id: 'professional', name: 'Professional', intro: 'I am pleased to apply', close: 'I would welcome the opportunity' },
    { id: 'confident', name: 'Confident', intro: 'I am excited to apply', close: 'I am ready to discuss' },
    { id: 'warm', name: 'Warm', intro: 'I am delighted to apply', close: 'I would be grateful for the opportunity' },
    { id: 'concise', name: 'Concise', intro: 'I am applying', close: 'I would welcome a conversation' },
    { id: 'executive', name: 'Senior or Executive', intro: 'I am writing to express my interest', close: 'I would value the opportunity' }
  ];

  var lengths = [
    { id: 'concise', name: 'Concise', target: '180 to 260 words', extra: false },
    { id: 'standard', name: 'Standard', target: '260 to 380 words', extra: true },
    { id: 'detailed', name: 'Detailed', target: '380 to 520 words', extra: true }
  ];

  var markets = [
    'Pan-African',
    'Nigeria',
    'Kenya',
    'Ghana',
    'South Africa',
    'Rwanda',
    'Uganda',
    'Tanzania',
    'Ethiopia',
    'Remote or global role'
  ];

  var fieldIds = [
    'templateId',
    'toneId',
    'market',
    'lengthId',
    'fullName',
    'email',
    'phone',
    'city',
    'portfolio',
    'jobTitle',
    'company',
    'hiringManager',
    'source',
    'jobDescription',
    'years',
    'skills',
    'achievement',
    'whyCompany',
    'resumeSummary',
    'availability',
    'referral',
    'contextNote'
  ];

  var stopWords = {
    and: true, the: true, for: true, with: true, from: true, that: true, this: true, your: true, will: true, have: true,
    role: true, work: true, team: true, job: true, are: true, you: true, our: true, their: true, candidate: true,
    experience: true, skills: true, ability: true, across: true, into: true, about: true, more: true, using: true,
    including: true, responsible: true, responsibilities: true, required: true, preferred: true, years: true
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function slugFile(value, fallback) {
    var cleaned = String(value || fallback || 'cover-letter').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return (cleaned || fallback || 'cover-letter').toLowerCase();
  }

  function toast(message) {
    var node = byId('toast');
    if (!node) return;
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      node.classList.remove('show');
    }, 2600);
  }

  function fillSelect(id, options, selected) {
    var el = byId(id);
    if (!el) return;
    el.innerHTML = '';
    options.forEach(function (item) {
      var opt = document.createElement('option');
      if (typeof item === 'string') {
        opt.value = item;
        opt.textContent = item;
      } else {
        opt.value = item.id;
        opt.textContent = item.name;
      }
      el.appendChild(opt);
    });
    if (selected) el.value = selected;
  }

  function getTemplate(id) {
    return templates.find(function (item) { return item.id === id; }) || templates[0];
  }

  function getTone(id) {
    return tones.find(function (item) { return item.id === id; }) || tones[0];
  }

  function getLength(id) {
    return lengths.find(function (item) { return item.id === id; }) || lengths[1];
  }

  function getValue(id) {
    var el = byId(id);
    return el ? String(el.value || '').trim() : '';
  }

  function setValue(id, value) {
    var el = byId(id);
    if (el) el.value = value == null ? '' : value;
  }

  function collectState() {
    var state = {};
    fieldIds.forEach(function (id) {
      state[id] = getValue(id);
    });
    state.letterText = getValue('letterText');
    state.selectedId = selectedId;
    state.updatedAt = Date.now();
    return state;
  }

  function applyState(state, preserveLetter) {
    if (!state) return;
    fieldIds.forEach(function (id) {
      if (Object.prototype.hasOwnProperty.call(state, id)) setValue(id, state[id]);
    });
    selectedId = state.selectedId || selectedId || null;
    if (!preserveLetter && state.letterText) {
      setValue('letterText', state.letterText);
      manualEdit = true;
    }
    if (!getValue('letterText')) {
      rebuildLetter();
    } else {
      updatePreviewAndScore();
    }
    renderSaved();
  }

  function sentence(value, fallback) {
    var text = String(value || '').trim();
    if (!text) return fallback || '';
    return text.replace(/\s+/g, ' ').replace(/[.]+$/, '');
  }

  function joinContact(state) {
    return [state.email, state.phone, state.city, state.portfolio].filter(Boolean).join(' | ');
  }

  function marketLine(market) {
    if (!market || market === 'Pan-African') {
      return 'I understand the pace, resourcefulness, and cross-market collaboration expected across African teams.';
    }
    if (market === 'Remote or global role') {
      return 'I am comfortable working across time zones and communicating clearly in distributed teams.';
    }
    return 'I also understand the local expectations of the ' + market + ' market while keeping international standards in view.';
  }

  function buildLetter(state) {
    var template = getTemplate(state.templateId);
    var tone = getTone(state.toneId);
    var length = getLength(state.lengthId);
    var name = sentence(state.fullName, 'Your Name');
    var jobTitle = sentence(state.jobTitle, 'the advertised role');
    var company = sentence(state.company, 'your organization');
    var manager = sentence(state.hiringManager, 'Hiring Manager');
    var years = state.years ? state.years + ' years of experience' : 'relevant professional experience';
    var skills = sentence(state.skills, template.opener);
    var achievement = sentence(state.achievement, 'My work has consistently combined ownership, follow-through, and measurable delivery.');
    var whyCompany = sentence(state.whyCompany, 'your mission, your growth plans, and the standard of work your team is building');
    var summary = sentence(state.resumeSummary, '');
    var availability = sentence(state.availability, '');
    var referral = sentence(state.referral, '');
    var contextNote = sentence(state.contextNote, '');
    var source = sentence(state.source, '');
    var contact = joinContact(state);

    var lines = [];
    lines.push(name);
    if (contact) lines.push(contact);
    lines.push('');
    lines.push(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
    lines.push('');
    lines.push(manager);
    lines.push(company);
    lines.push('');
    lines.push('Dear ' + manager + ',');
    lines.push('');

    var intro = tone.intro + ' for the ' + jobTitle + ' position at ' + company + '. With ' + years + ' in ' + skills + ', I bring a practical record of ' + template.focus + '.';
    if (source) intro += ' I found the opportunity through ' + source + ', and the role stood out because it connects directly with the work I do best.';
    lines.push(intro);
    lines.push('');

    var body = 'In my recent work, ' + achievement + ' This experience has strengthened my ability to turn requirements into clear execution, work with different stakeholders, and keep quality high under pressure.';
    if (summary && length.extra) body += ' My background also includes ' + summary + ', which gives me useful context for the priorities described in this role.';
    lines.push(body);
    lines.push('');

    var fit = 'What attracts me to ' + company + ' is ' + whyCompany + '. ' + marketLine(state.market) + ' I would bring a steady, evidence-led approach and a willingness to learn the details that matter to your customers, users, or communities.';
    lines.push(fit);
    lines.push('');

    if (contextNote || referral || availability || length.id === 'detailed') {
      var extra = [];
      if (contextNote) extra.push(contextNote);
      if (referral) extra.push('I was encouraged to apply by ' + referral + '.');
      if (availability) extra.push('My availability is ' + availability + '.');
      if (!extra.length) extra.push('I am especially interested in roles where I can combine ownership, collaboration, and measurable delivery.');
      lines.push(extra.join(' '));
      lines.push('');
    }

    lines.push('Thank you for considering my application. ' + tone.close + ' to discuss how my experience can support ' + company + ' and the goals of the ' + jobTitle + ' role.');
    lines.push('');
    lines.push('Yours sincerely,');
    lines.push(name);

    return lines.join('\n');
  }

  function wordCount(text) {
    var matches = String(text || '').trim().match(/\b[\w'-]+\b/g);
    return matches ? matches.length : 0;
  }

  function extractKeywords(text) {
    var counts = {};
    String(text || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).forEach(function (raw) {
      var word = raw.replace(/^-+|-+$/g, '');
      if (word.length < 4 || stopWords[word]) return;
      counts[word] = (counts[word] || 0) + 1;
    });
    return Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a] || a.localeCompare(b);
    }).slice(0, 18);
  }

  function calculateScore(state, text) {
    var keywords = extractKeywords(state.jobDescription);
    var lower = (text + ' ' + state.skills + ' ' + state.resumeSummary).toLowerCase();
    var matched = keywords.filter(function (word) { return lower.indexOf(word) !== -1; });
    var missing = keywords.filter(function (word) { return lower.indexOf(word) === -1; }).slice(0, 10);
    var words = wordCount(text);
    var checks = [];
    var score = 0;

    function add(label, points, good, detail) {
      if (good) score += points;
      checks.push({ label: label, good: good, detail: detail, points: points });
    }

    add('Contact details', 10, Boolean(state.fullName && (state.email || state.phone)), 'Add name plus email or phone.');
    add('Role and company', 12, Boolean(state.jobTitle && state.company), 'Name the exact role and employer.');
    add('Skills', 10, Boolean(state.skills && state.skills.split(',').filter(Boolean).length >= 2), 'Add at least two relevant skills.');
    add('Proof with result', 14, /\d|percent|increase|reduced|saved|grew|delivered|launched/i.test(state.achievement), 'Use a result, metric, or concrete outcome.');
    add('Company motivation', 10, state.whyCompany.length > 35, 'Explain why this company, not just any job.');
    add('Job keywords', 18, keywords.length ? matched.length >= Math.min(4, Math.ceil(keywords.length * 0.35)) : Boolean(state.jobTitle), 'Paste a job description and cover the important terms.');
    add('Letter length', 10, words >= 180 && words <= 520, 'Aim for 180 to 520 words.');
    add('Professional structure', 8, /Dear /.test(text) && /Yours sincerely/.test(text), 'Keep greeting and sign-off clear.');
    add('No placeholders', 8, !/\[[^\]]+\]|your organization|the advertised role/i.test(text), 'Replace generic fallback text.');

    score = Math.max(0, Math.min(100, score));
    return { score: score, checks: checks, keywords: keywords, matched: matched, missing: missing, words: words };
  }

  function renderPaper(text) {
    var paper = byId('paperPreview');
    if (!paper) return;
    paper.innerHTML = '';
    var blocks = String(text || '').split(/\n{2,}/).map(function (block) { return block.trim(); }).filter(Boolean);
    if (!blocks.length) {
      var empty = document.createElement('p');
      empty.textContent = 'Your cover letter preview will appear here.';
      paper.appendChild(empty);
      return;
    }
    blocks.forEach(function (block, index) {
      var p = document.createElement('p');
      p.textContent = block;
      if (index === 0) p.className = 'paper-name';
      paper.appendChild(p);
    });
    var footer = document.createElement('div');
    footer.className = 'paper-muted';
    footer.textContent = 'Generated privately with AfroTools.com';
    paper.appendChild(footer);
  }

  function renderScore(result) {
    var scoreValue = byId('scoreValue');
    var scoreRing = byId('scoreRing');
    var scoreCopy = byId('scoreCopy');
    if (scoreValue) scoreValue.textContent = String(result.score);
    if (scoreRing) scoreRing.style.setProperty('--score-deg', Math.round(result.score * 3.6) + 'deg');
    if (scoreCopy) {
      var readiness = result.score >= 85 ? 'Strong draft. Do a final human read before sending.' : result.score >= 65 ? 'Good base. Close the warnings below for a sharper letter.' : 'Needs more role-specific proof before applying.';
      scoreCopy.textContent = readiness + ' Word count: ' + result.words + '.';
    }
    var checksList = byId('checksList');
    if (checksList) {
      checksList.innerHTML = result.checks.map(function (check) {
        return '<div class="check ' + (check.good ? 'good' : 'warn') + '"><strong>' + escapeHtml(check.label) + '</strong><br>' + escapeHtml(check.good ? 'Looks good.' : check.detail) + '</div>';
      }).join('');
    }
    var keywordChips = byId('keywordChips');
    if (keywordChips) {
      if (!result.keywords.length) {
        keywordChips.innerHTML = '<span class="chip">Paste a job description</span>';
      } else {
        var hits = result.matched.map(function (word) { return '<span class="chip hit">' + escapeHtml(word) + '</span>'; });
        var misses = result.missing.map(function (word) { return '<span class="chip miss">' + escapeHtml(word) + '</span>'; });
        keywordChips.innerHTML = hits.concat(misses).join('');
      }
    }
  }

  function updatePreviewAndScore() {
    var state = collectState();
    var text = state.letterText;
    renderPaper(text);
    renderScore(calculateScore(state, text));
    persistCurrent(state);
  }

  function rebuildLetter() {
    var state = collectState();
    var text = buildLetter(state);
    setValue('letterText', text);
    manualEdit = false;
    var editState = byId('editState');
    if (editState) editState.textContent = 'Generated from your form. You can edit the text directly before exporting.';
    updatePreviewAndScore();
  }

  function persistCurrent(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state || collectState()));
    } catch (err) {
      // Storage can be full or disabled; the tool should keep working.
    }
  }

  function readCurrent() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (err) {
      return null;
    }
  }

  function titleFor(state) {
    var role = state.jobTitle || 'Cover letter';
    var company = state.company ? ' at ' + state.company : '';
    return role + company;
  }

  function saveLetter() {
    if (!saveState) {
      toast('Saving is not available in this browser.');
      return;
    }
    var state = collectState();
    var saved = saveState.save({
      id: selectedId || undefined,
      title: titleFor(state),
      data: state,
      thumbnail: null
    });
    selectedId = saved.id;
    state.selectedId = selectedId;
    persistCurrent(state);
    history.replaceState(null, '', '?id=' + encodeURIComponent(selectedId));
    renderSaved();
    toast('Saved.');
  }

  function renderSaved() {
    var node = byId('savedList');
    if (!node) return;
    if (!saveState) {
      node.innerHTML = '<div class="helper">Saved letters are not available in this browser.</div>';
      return;
    }
    var items = saveState.getAll();
    if (!items.length) {
      node.innerHTML = '<div class="helper">No saved letters yet.</div>';
      return;
    }
    node.innerHTML = items.map(function (item) {
      var date = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      return '<div class="saved-item" data-id="' + escapeHtml(item.id) + '"><div class="saved-title">' + escapeHtml(item.title || 'Untitled letter') + '</div><div class="saved-meta">' + escapeHtml(date) + '</div><div class="saved-actions"><button class="btn btn-soft" type="button" data-load="' + escapeHtml(item.id) + '">Load</button><button class="btn btn-danger" type="button" data-delete="' + escapeHtml(item.id) + '">Delete</button></div></div>';
    }).join('');
  }

  function loadSaved(id) {
    if (!saveState) return;
    var item = saveState.load(id);
    if (!item || !item.data) {
      toast('Saved letter not found.');
      return;
    }
    selectedId = item.id;
    applyState(item.data, false);
    history.replaceState(null, '', '?id=' + encodeURIComponent(item.id));
    toast('Loaded saved letter.');
  }

  function deleteSaved(id) {
    if (!saveState) return;
    saveState.delete(id);
    if (selectedId === id) selectedId = null;
    renderSaved();
    toast('Deleted.');
  }

  function downloadBlob(filename, mime, content) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  function downloadText() {
    var state = collectState();
    downloadBlob(slugFile(titleFor(state), 'cover-letter') + '.txt', 'text/plain;charset=utf-8', state.letterText);
    toast('TXT downloaded.');
  }

  function downloadJson() {
    var state = collectState();
    downloadBlob(slugFile(titleFor(state), 'cover-letter') + '.json', 'application/json;charset=utf-8', JSON.stringify(state, null, 2));
    toast('JSON downloaded.');
  }

  function downloadWord() {
    var state = collectState();
    var paragraphs = String(state.letterText || '').split(/\n{2,}/).map(function (block) {
      return '<p>' + escapeHtml(block).replace(/\n/g, '<br>') + '</p>';
    }).join('');
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + escapeHtml(titleFor(state)) + '</title><style>body{font-family:Georgia,serif;font-size:12pt;line-height:1.6;margin:54pt;}p{margin:0 0 12pt;}</style></head><body>' + paragraphs + '</body></html>';
    downloadBlob(slugFile(titleFor(state), 'cover-letter') + '.doc', 'application/msword;charset=utf-8', html);
    toast('Word-compatible document downloaded.');
  }

  function downloadPdf() {
    var state = collectState();
    if (!window.jspdf || !window.jspdf.jsPDF) {
      toast('PDF library is still loading. Try again in a moment.');
      return;
    }
    var doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var pageWidth = doc.internal.pageSize.getWidth();
    var pageHeight = doc.internal.pageSize.getHeight();
    var margin = 22;
    var y = 24;
    var lineHeight = 6.2;
    var maxWidth = pageWidth - margin * 2;
    doc.setProperties({
      title: titleFor(state),
      subject: 'Cover letter generated with AfroTools',
      author: state.fullName || 'AfroTools user',
      creator: 'AfroTools Cover Letter Generator'
    });
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    String(state.letterText || '').split(/\n{2,}/).map(function (block) {
      return block.trim();
    }).filter(Boolean).forEach(function (block, index) {
      doc.setFont('times', index === 0 ? 'bold' : 'normal');
      var lines = doc.splitTextToSize(block.replace(/\n/g, ' '), maxWidth);
      lines.forEach(function (line) {
        if (y > pageHeight - 26) {
          doc.addPage();
          y = 24;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });
      y += 3.2;
    });
    var pages = doc.getNumberOfPages();
    for (var p = 1; p <= pages; p += 1) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(130);
      doc.text('Generated privately with AfroTools.com', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.setTextColor(0);
    }
    doc.save(slugFile(titleFor(state), 'cover-letter') + '.pdf');
    toast('PDF downloaded.');
  }

  function copyLetter() {
    var text = getValue('letterText');
    if (!text) {
      toast('Nothing to copy yet.');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Copied to clipboard.');
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var node = byId('letterText');
    if (!node) return;
    node.focus();
    node.select();
    try {
      document.execCommand('copy');
      toast('Copied to clipboard.');
    } catch (err) {
      toast('Select the text and copy manually.');
    }
  }

  function encodeShare(state) {
    var json = JSON.stringify(state);
    var encoded = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    var url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set(SHARE_PARAM, encoded);
    return url.toString();
  }

  function decodeShare(value) {
    try {
      var normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
      while (normalized.length % 4) normalized += '=';
      return JSON.parse(decodeURIComponent(escape(atob(normalized))));
    } catch (err) {
      return null;
    }
  }

  function copyShareLink() {
    var state = collectState();
    var url = encodeShare(state);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        toast('Share link copied.');
      }).catch(function () {
        toast('Could not copy share link.');
      });
    } else {
      toast('Clipboard unavailable.');
    }
  }

  function importJsonFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result || '{}'));
        selectedId = data.selectedId || null;
        applyState(data, false);
        history.replaceState(null, '', window.location.pathname);
        toast('Imported letter.');
      } catch (err) {
        toast('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  }

  function handleFormChange() {
    if (manualEdit) {
      var editState = byId('editState');
      if (editState) editState.textContent = 'Form changed after manual edits. Click Rebuild to regenerate from the form.';
      updatePreviewAndScore();
      return;
    }
    rebuildLetter();
  }

  function attachEvents() {
    fieldIds.forEach(function (id) {
      var el = byId(id);
      if (!el) return;
      el.addEventListener('input', handleFormChange);
      el.addEventListener('change', handleFormChange);
    });

    var letter = byId('letterText');
    if (letter) {
      letter.addEventListener('input', function () {
        manualEdit = true;
        var editState = byId('editState');
        if (editState) editState.textContent = 'Manual edits are preserved. Use Rebuild only when you want a fresh generated version.';
        updatePreviewAndScore();
      });
    }

    document.addEventListener('click', function (event) {
      var actionNode = event.target.closest('[data-action]');
      if (actionNode) {
        var action = actionNode.getAttribute('data-action');
        if (action === 'rebuild') rebuildLetter();
        if (action === 'save') saveLetter();
        if (action === 'copy') copyLetter();
        if (action === 'share') copyShareLink();
        if (action === 'pdf') downloadPdf();
        if (action === 'txt') downloadText();
        if (action === 'word') downloadWord();
        if (action === 'json') downloadJson();
        if (action === 'import') byId('importInput').click();
        if (action === 'print') window.print();
      }

      var loadNode = event.target.closest('[data-load]');
      if (loadNode) loadSaved(loadNode.getAttribute('data-load'));

      var deleteNode = event.target.closest('[data-delete]');
      if (deleteNode) deleteSaved(deleteNode.getAttribute('data-delete'));
    });

    var importInput = byId('importInput');
    if (importInput) {
      importInput.addEventListener('change', function () {
        importJsonFile(importInput.files && importInput.files[0]);
        importInput.value = '';
      });
    }
  }

  function loadInitialState() {
    var params = new URLSearchParams(window.location.search);
    var shared = params.get(SHARE_PARAM);
    if (shared) {
      var sharedState = decodeShare(shared);
      if (sharedState) {
        selectedId = null;
        applyState(sharedState, false);
        toast('Shared letter loaded.');
        return true;
      }
    }
    var id = params.get('id');
    if (id && saveState) {
      var item = saveState.load(id);
      if (item && item.data) {
        selectedId = id;
        applyState(item.data, false);
        return true;
      }
    }
    var current = readCurrent();
    if (current && (current.fullName || current.jobTitle || current.company || current.letterText)) {
      selectedId = current.selectedId || null;
      applyState(current, false);
      return true;
    }
    return false;
  }

  function initDefaults() {
    fillSelect('templateId', templates, 'technology');
    fillSelect('toneId', tones, 'professional');
    fillSelect('market', markets, 'Pan-African');
    fillSelect('lengthId', lengths, 'standard');
    setValue('years', '3');
  }

  function init() {
    initDefaults();
    attachEvents();
    var loaded = loadInitialState();
    if (!loaded) {
      rebuildLetter();
    }
    renderSaved();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
