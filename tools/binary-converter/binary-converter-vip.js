(function () {
  'use strict';

  window.AFROTOOLS_BINARY_CONVERTER_VIP = true;
  var engine = window.AfroTools && window.AfroTools.binaryConverter;
  if (!engine) return;

  var BASE_NAMES = {
    2: 'Binary',
    8: 'Octal',
    10: 'Decimal',
    16: 'Hexadecimal'
  };
  var currentConversion = null;
  var arithmeticOperation = 'add';

  function byId(id) {
    return document.getElementById(id);
  }

  function setVisible(element, visible) {
    if (element) element.style.display = visible ? '' : 'none';
  }

  function setError(message) {
    var error = byId('errorMsg');
    error.textContent = message || '';
    error.style.display = message ? 'block' : 'none';
  }

  function setStatus(message) {
    byId('conversionStatus').textContent = message || '';
  }

  function showToast(message) {
    var toast = byId('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () {
      toast.classList.remove('show');
    }, 1800);
  }

  function copyTextFallback(text) {
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.left = '-9999px';
    document.body.appendChild(field);
    field.select();
    var success = false;
    try {
      success = document.execCommand('copy');
    } catch (error) {
      success = false;
    }
    field.remove();
    return success;
  }

  function copyText(text, button) {
    function finish(success) {
      showToast(success ? 'Copied' : 'Copy failed');
      if (success && button) {
        var previous = button.textContent;
        button.textContent = 'Copied';
        setTimeout(function () { button.textContent = previous; }, 1200);
      }
    }
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      finish(copyTextFallback(text));
      return;
    }
    navigator.clipboard.writeText(text).then(function () {
      finish(true);
    }).catch(function () {
      finish(copyTextFallback(text));
    });
  }

  function sourceBase() {
    var selected = byId('inputBase').value;
    if (selected !== 'custom') return { ok: true, value: Number(selected) };
    var custom = Number(byId('customBaseInput').value);
    if (!Number.isInteger(custom) || custom < 2 || custom > 36) {
      return { ok: false, error: 'Custom base must be a whole number from 2 to 36.' };
    }
    return { ok: true, value: custom };
  }

  function groupValue(value, base) {
    if (!byId('digitGroup').checked) return value;
    var suffix = value.endsWith('…') ? '…' : '';
    var clean = suffix ? value.slice(0, -1) : value;
    var sign = clean[0] === '-' ? '-' : '';
    if (sign) clean = clean.slice(1);
    var parts = clean.split('.');
    var integer = parts[0];
    var size = base === 10 || base === 8 ? 3 : 4;
    var separator = base === 10 ? ',' : ' ';
    var grouped = '';
    for (var index = integer.length - 1, count = 0; index >= 0; index -= 1, count += 1) {
      if (count && count % size === 0) grouped = separator + grouped;
      grouped = integer[index] + grouped;
    }
    return sign + grouped + (parts.length > 1 ? '.' + parts.slice(1).join('.') : '') + suffix;
  }

  function outputBases(base) {
    var bases = [10, 2, 16, 8];
    if (!bases.includes(base)) bases.push(base);
    return bases;
  }

  function renderOutput(conversion, base) {
    var grid = byId('outputGrid');
    grid.replaceChildren();

    conversion.outputs.forEach(function (output) {
      var box = document.createElement('div');
      box.className = 'output-box' + (output.base === base ? ' active' : '');

      var copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'copy-btn';
      copy.textContent = 'Copy';
      copy.dataset.copyValue = output.value;
      copy.setAttribute('aria-label', 'Copy ' + (BASE_NAMES[output.base] || 'base ' + output.base) + ' result');

      var label = document.createElement('div');
      label.className = 'base-label';
      label.textContent = (BASE_NAMES[output.base] || 'Custom') + ' (base ' + output.base + ')';

      var value = document.createElement('div');
      value.className = 'base-value';
      value.textContent = groupValue(output.value, output.base);

      var note = document.createElement('div');
      note.className = 'precision-note';
      note.textContent = output.note;

      box.appendChild(copy);
      box.appendChild(label);
      box.appendChild(value);
      box.appendChild(note);
      grid.appendChild(box);
    });
  }

  function renderAscii(parsed) {
    var box = byId('asciiBox');
    if (!parsed.isInteger || parsed.numerator < 0n || parsed.numerator > 127n) {
      setVisible(box, false);
      return;
    }
    var number = Number(parsed.numerator);
    byId('asciiChar').textContent = number >= 33 && number <= 126
      ? String.fromCharCode(number)
      : 'Control';
    byId('asciiDesc').textContent = number >= 33 && number <= 126
      ? 'ASCII code ' + number
      : 'Non-printable ASCII code ' + number;
    setVisible(box, true);
  }

  function smallestType(integer) {
    if (integer >= 0n) {
      if (integer <= 255n) return 'uint8';
      if (integer <= 65535n) return 'uint16';
      if (integer <= 4294967295n) return 'uint32';
      if (integer <= 18446744073709551615n) return 'uint64';
      return 'arbitrary precision';
    }
    if (integer >= -128n) return 'int8';
    if (integer >= -32768n) return 'int16';
    if (integer >= -2147483648n) return 'int32';
    if (integer >= -9223372036854775808n) return 'int64';
    return 'arbitrary precision';
  }

  function renderBitLength(parsed) {
    var box = byId('bitLengthBox');
    if (!parsed.isInteger) {
      setVisible(box, false);
      return;
    }
    var absolute = parsed.numerator < 0n ? -parsed.numerator : parsed.numerator;
    var magnitudeBits = absolute === 0n ? 1 : absolute.toString(2).length;
    var values = [
      [magnitudeBits, 'Magnitude bits'],
      [Math.ceil(magnitudeBits / 8), 'Magnitude bytes'],
      [smallestType(parsed.numerator), 'Smallest common type']
    ];
    box.replaceChildren();
    values.forEach(function (entry) {
      var item = document.createElement('div');
      item.className = 'bit-info';
      var value = document.createElement('div');
      value.className = 'bit-info-val';
      value.textContent = String(entry[0]);
      var label = document.createElement('div');
      label.className = 'bit-info-label';
      label.textContent = entry[1];
      item.appendChild(value);
      item.appendChild(label);
      box.appendChild(item);
    });
    setVisible(box, true);
  }

  function renderSteps(conversion, base) {
    var card = byId('stepsCard');
    var content = byId('stepsContent');
    content.replaceChildren();

    var heading = document.createElement('h3');
    heading.textContent = 'How this value is interpreted';
    var method = document.createElement('p');
    method.textContent = 'Each input digit is multiplied by base ' + base
      + ' raised to its position. Fractional positions use negative powers.';
    var exact = document.createElement('p');
    exact.textContent = conversion.parsed.isInteger
      ? 'Exact decimal integer: ' + conversion.parsed.numerator.toString()
      : 'Exact rational value: ' + conversion.parsed.numerator.toString()
        + ' / ' + conversion.parsed.denominator.toString() + '.';
    var precision = document.createElement('p');
    var approximate = conversion.outputs.filter(function (output) { return !output.exact; });
    precision.textContent = approximate.length
      ? 'Some target bases cannot terminate exactly. Parentheses mark a detected repeating cycle; an ellipsis marks the 32-digit display limit.'
      : 'Every displayed target-base representation terminates exactly.';
    content.appendChild(heading);
    content.appendChild(method);
    content.appendChild(exact);
    content.appendChild(precision);
    setVisible(card, true);
  }

  function renderTwos(parsed) {
    var card = byId('twosCard');
    if (!parsed.isInteger) {
      setVisible(card, false);
      return;
    }
    var grid = byId('twosGrid');
    grid.replaceChildren();
    [8, 16, 32, 64].forEach(function (width) {
      var result = engine.twosComplement(parsed.numerator, width);
      var item = document.createElement('div');
      item.className = 'twos-item';
      var label = document.createElement('div');
      label.className = 'twos-label';
      label.textContent = width + '-bit signed';
      var value = document.createElement('div');
      value.className = 'twos-val';
      if (result.ok) {
        value.textContent = result.bits.replace(/(.{4})(?=.)/g, '$1 ');
        var copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'copy-btn';
        copy.textContent = 'Copy';
        copy.dataset.copyValue = result.bits;
        copy.setAttribute('aria-label', 'Copy ' + width + '-bit two’s complement');
        item.appendChild(copy);
      } else {
        value.textContent = 'Out of range';
      }
      item.appendChild(label);
      item.appendChild(value);
      grid.appendChild(item);
    });
    setVisible(card, true);
  }

  function liveConvert() {
    var raw = byId('inputValue').value;
    if (!raw.trim()) {
      currentConversion = null;
      setError('');
      setStatus('');
      setVisible(byId('outputSection'), false);
      setVisible(byId('stepsCard'), false);
      setVisible(byId('twosCard'), false);
      return;
    }

    var base = sourceBase();
    if (!base.ok) {
      currentConversion = null;
      setError(base.error);
      setStatus('');
      setVisible(byId('outputSection'), false);
      return;
    }

    var conversion = engine.convert(raw, base.value, outputBases(base.value), {
      maxFractionDigits: 32
    });
    if (!conversion.ok) {
      currentConversion = null;
      setError(conversion.error);
      setStatus('');
      setVisible(byId('outputSection'), false);
      setVisible(byId('stepsCard'), false);
      setVisible(byId('twosCard'), false);
      return;
    }

    currentConversion = conversion;
    setError('');
    renderOutput(conversion, base.value);
    renderAscii(conversion.parsed);
    renderBitLength(conversion.parsed);
    renderSteps(conversion, base.value);
    renderTwos(conversion.parsed);
    setVisible(byId('outputSection'), true);
    var approximations = conversion.outputs.filter(function (output) { return !output.exact; }).length;
    setStatus(
      'Exact rational parsing completed'
      + (approximations ? '; ' + approximations + ' output' + (approximations === 1 ? '' : 's') + ' repeat or reach the display limit.' : '.')
    );
  }

  function handleBaseChange() {
    var custom = byId('inputBase').value === 'custom';
    byId('customBaseRow').classList.toggle('visible', custom);
    liveConvert();
  }

  function swapBases() {
    if (!currentConversion) {
      showToast('Enter a valid number first');
      return;
    }
    var current = sourceBase();
    var target = current.ok && current.value === 2 ? 10 : 2;
    var output = currentConversion.outputs.find(function (item) { return item.base === target; });
    if (!output || !output.exact) {
      showToast('That target result does not terminate exactly');
      return;
    }
    byId('inputBase').value = String(target);
    byId('customBaseRow').classList.remove('visible');
    byId('inputValue').value = output.value;
    liveConvert();
    showToast('Exact ' + (BASE_NAMES[target] || 'base ' + target) + ' result moved to input');
  }

  function clearAll() {
    ['inputValue', 'ieeeInput', 'bitA', 'bitB', 'arithA', 'arithB'].forEach(function (id) {
      byId(id).value = '';
    });
    currentConversion = null;
    setError('');
    setStatus('All converter fields cleared.');
    ['outputSection', 'stepsCard', 'twosCard', 'ieeeOutput', 'bitwiseOutput', 'arithOutput'].forEach(function (id) {
      setVisible(byId(id), false);
    });
    document.querySelectorAll('.section-error').forEach(function (error) {
      error.textContent = '';
      error.classList.remove('visible');
    });
    byId('inputValue').focus();
  }

  function report() {
    liveConvert();
    if (!currentConversion) return '';
    var base = sourceBase().value;
    var rows = currentConversion.outputs.map(function (output) {
      return (BASE_NAMES[output.base] || 'Base ' + output.base)
        + ' (base ' + output.base + '): ' + output.value + ' — ' + output.note;
    });
    return [
      'Number base conversion summary — AfroTools',
      'Generated: ' + new Date().toLocaleString(),
      'Input: ' + byId('inputValue').value.trim(),
      'Input base: ' + base,
      '',
      rows.join('\n'),
      '',
      currentConversion.parsed.isInteger
        ? 'Exact decimal integer: ' + currentConversion.parsed.numerator.toString()
        : 'Exact rational value: ' + currentConversion.parsed.numerator.toString()
          + ' / ' + currentConversion.parsed.denominator.toString(),
      '',
      'Contract: integers use arbitrary-precision BigInt math. Fraction displays are labelled exact, repeating, or truncated at 32 digits.',
      'Privacy: conversion ran in this browser tab; this tool does not save the input.'
    ].join('\n');
  }

  function copyConversionReport() {
    var text = report();
    if (!text) {
      showToast('Enter a valid number first');
      return;
    }
    copyText(text);
  }

  function downloadConversionReport() {
    var text = report();
    if (!text) {
      showToast('Enter a valid number first');
      return;
    }
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'base-conversion-' + new Date().toISOString().slice(0, 10) + '.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    showToast('TXT summary downloaded');
  }

  function sectionError(output, id) {
    var container = byId(id);
    if (container) return container;
    container = document.createElement('div');
    container.id = id;
    container.className = 'section-error';
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'polite');
    output.parentElement.insertBefore(container, output);
    return container;
  }

  function updateIEEE() {
    var input = byId('ieeeInput').value.trim();
    var output = byId('ieeeOutput');
    var error = sectionError(output, 'ieeeError');
    if (!input) {
      error.classList.remove('visible');
      setVisible(output, false);
      return;
    }
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/iu.test(input)) {
      error.textContent = 'Enter one finite decimal number, optionally using scientific notation.';
      error.classList.add('visible');
      setVisible(output, false);
      return;
    }
    var number = Number(input);
    if (!Number.isFinite(number)) {
      error.textContent = 'The value is outside the finite JavaScript Number range.';
      error.classList.add('visible');
      setVisible(output, false);
      return;
    }
    error.classList.remove('visible');
    var floatBuffer = new ArrayBuffer(4);
    var floatView = new DataView(floatBuffer);
    floatView.setFloat32(0, number);
    var floatBits = '';
    for (var index = 0; index < 4; index += 1) {
      floatBits += floatView.getUint8(index).toString(2).padStart(8, '0');
    }
    var doubleBuffer = new ArrayBuffer(8);
    var doubleView = new DataView(doubleBuffer);
    doubleView.setFloat64(0, number);
    var doubleBits = '';
    for (var offset = 0; offset < 8; offset += 1) {
      doubleBits += doubleView.getUint8(offset).toString(2).padStart(8, '0');
    }
    output.replaceChildren();
    [
      ['32-bit float', floatBits, 8],
      ['64-bit double', doubleBits, 11]
    ].forEach(function (entry) {
      var row = document.createElement('div');
      row.className = 'ieee-row';
      var label = document.createElement('div');
      label.className = 'ieee-label';
      label.textContent = entry[0];
      var bits = document.createElement('div');
      bits.className = 'ieee-bits';
      Array.from(entry[1]).forEach(function (bit, bitIndex) {
        var span = document.createElement('span');
        span.className = bitIndex === 0 ? 'ieee-sign' : bitIndex <= entry[2] ? 'ieee-exp' : 'ieee-man';
        span.textContent = bit;
        bits.appendChild(span);
      });
      var copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'copy-btn';
      copy.style.position = 'static';
      copy.style.marginTop = '6px';
      copy.textContent = 'Copy bits';
      copy.dataset.copyValue = entry[1];
      row.appendChild(label);
      row.appendChild(bits);
      row.appendChild(copy);
      output.appendChild(row);
    });
    setVisible(output, true);
  }

  function updateBitwise() {
    var output = byId('bitwiseOutput');
    var error = sectionError(output, 'bitwiseError');
    var a = byId('bitA').value.trim();
    var b = byId('bitB').value.trim();
    if (!a || !b) {
      error.classList.remove('visible');
      setVisible(output, false);
      return;
    }
    var result = engine.bitwise32(a, b);
    if (!result.ok) {
      error.textContent = result.error;
      error.classList.add('visible');
      setVisible(output, false);
      return;
    }
    error.classList.remove('visible');
    output.replaceChildren();
    var grid = document.createElement('div');
    grid.className = 'bitwise-grid';
    result.operations.forEach(function (operation) {
      var item = document.createElement('div');
      item.className = 'bitwise-result';
      var name = document.createElement('div');
      name.className = 'bitwise-op';
      name.textContent = operation.name;
      var decimal = document.createElement('div');
      decimal.className = 'bitwise-dec';
      decimal.textContent = operation.decimal;
      var binary = document.createElement('div');
      binary.className = 'bitwise-bin';
      binary.textContent = operation.unsignedBinary.replace(/(.{4})(?=.)/g, '$1 ');
      item.appendChild(name);
      item.appendChild(decimal);
      item.appendChild(binary);
      grid.appendChild(item);
    });
    output.appendChild(grid);
    setVisible(output, true);
  }

  function setArithOp(operation, button) {
    arithmeticOperation = operation === 'sub' ? 'subtract' : 'add';
    button.parentElement.querySelectorAll('.tab-btn').forEach(function (item) {
      var active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    updateArith();
  }

  function updateArith() {
    var output = byId('arithOutput');
    var error = sectionError(output, 'arithError');
    var a = byId('arithA').value.trim();
    var b = byId('arithB').value.trim();
    if (!a || !b) {
      error.classList.remove('visible');
      setVisible(output, false);
      return;
    }
    var result = engine.binaryArithmetic(a, b, arithmeticOperation);
    if (!result.ok) {
      error.textContent = result.error;
      error.classList.add('visible');
      setVisible(output, false);
      return;
    }
    error.classList.remove('visible');
    output.replaceChildren();
    var display = document.createElement('div');
    display.className = 'arith-display';
    var operator = result.operation === 'subtract' ? '−' : '+';
    display.textContent = a + ' ' + operator + ' ' + b + ' = ' + result.binary
      + ' (decimal ' + result.decimal + ')';
    output.appendChild(display);
    setVisible(output, true);
  }

  byId('outputGrid').addEventListener('click', function (event) {
    var button = event.target.closest('[data-copy-value]');
    if (button) copyText(button.dataset.copyValue, button);
  });
  ['twosGrid', 'ieeeOutput'].forEach(function (id) {
    byId(id).addEventListener('click', function (event) {
      var button = event.target.closest('[data-copy-value]');
      if (button) copyText(button.dataset.copyValue, button);
    });
  });
  byId('printReportBtn').addEventListener('click', function () {
    if (!currentConversion) {
      showToast('Enter a valid number first');
      return;
    }
    setStatus('Print dialog opened. Choose “Save as PDF” for a PDF summary.');
    window.print();
  });

  window.liveConvert = liveConvert;
  window.handleBaseChange = handleBaseChange;
  window.swapBases = swapBases;
  window.clearAll = clearAll;
  window.copyConversionReport = copyConversionReport;
  window.downloadConversionReport = downloadConversionReport;
  window.updateIEEE = updateIEEE;
  window.updateBitwise = updateBitwise;
  window.setArithOp = setArithOp;
  window.updateArith = updateArith;
  window.copyText = copyText;

  handleBaseChange();
})();
