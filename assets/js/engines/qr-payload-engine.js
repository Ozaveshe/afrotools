(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.QrPayload = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function escapeVCard(value) {
    return String(value || '').replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\r\n/g, '\\n').replace(/\r/g, '\\n').replace(/\n/g, '\\n');
  }

  function escapeWifi(value) {
    return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/;/g, '\\;').replace(/:/g, '\\:');
  }

  function buildPayload(input) {
    const values = input || {};
    switch (values.mode) {
      case 'text':
        return values.text ? { ok: true, data: String(values.text) } : { ok: false, error: 'required_fields' };
      case 'url':
        return values.url ? { ok: true, data: String(values.url) } : { ok: false, error: 'required_fields' };
      case 'wifi': {
        const ssid = String(values.ssid || '');
        const password = String(values.password || '');
        const security = String(values.security || 'WPA');
        if (!ssid) return { ok: false, error: 'required_fields' };
        if ((security === 'WPA' || security === 'WEP') && !password) return { ok: false, error: 'wifi_password_required' };
        if (security === 'WPA' && (password.length < 8 || password.length > 63)) return { ok: false, error: 'wifi_password_length' };
        return { ok: true, data: `WIFI:T:${security};S:${escapeWifi(ssid)};P:${escapeWifi(password)};;` };
      }
      case 'vcard': {
        const name = escapeVCard(String(values.name || '').trim());
        if (!name) return { ok: false, error: 'required_fields' };
        // The form captures one name. Keep its ordering intact in a single N component.
        const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${name}`, `N:;${name};;;`];
        if (values.phone) lines.push(`TEL:${escapeVCard(values.phone)}`);
        if (values.email) lines.push(`EMAIL:${escapeVCard(values.email)}`);
        if (values.org) lines.push(`ORG:${escapeVCard(values.org)}`);
        lines.push('END:VCARD', '');
        return { ok: true, data: lines.join('\r\n') };
      }
      default:
        return { ok: false, error: 'unsupported_mode' };
    }
  }

  function pngCanvas(canvas, qr, background) {
    const margin = Math.ceil(4 * canvas.width / qr.getModuleCount());
    const output = canvas.ownerDocument.createElement('canvas');
    output.width = canvas.width + 2 * margin;
    output.height = canvas.height + 2 * margin;
    const context = output.getContext('2d');
    context.fillStyle = background;
    context.fillRect(0, 0, output.width, output.height);
    context.drawImage(canvas, margin, margin);
    return output;
  }

  function buildSvg(qr, darkColor, lightColor) {
    const moduleCount = qr && typeof qr.getModuleCount === 'function' ? qr.getModuleCount() : 0;
    if (!moduleCount) return '';
    const quietZone = 4;
    const viewSize = moduleCount + quietZone * 2;
    const modules = [];
    for (let row = 0; row < moduleCount; row += 1) {
      for (let column = 0; column < moduleCount; column += 1) {
        if (qr.isDark(row, column)) modules.push(`M${column + quietZone} ${row + quietZone}h1v1h-1z`);
      }
    }
    return [
      '<svg xmlns="http://www.w3.org/2000/svg"',
      ` viewBox="0 0 ${viewSize} ${viewSize}" width="1024" height="1024"`,
      ' shape-rendering="crispEdges">',
      `<rect width="${viewSize}" height="${viewSize}" fill="${lightColor}"/>`,
      `<path d="${modules.join('')}" fill="${darkColor}"/>`,
      '</svg>'
    ].join('');
  }

  return { escapeVCard, escapeWifi, buildPayload, buildSvg, pngCanvas };
});
