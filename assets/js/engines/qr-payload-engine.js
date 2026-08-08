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
        const name = String(values.name || '');
        if (!name) return { ok: false, error: 'required_fields' };
        const phone = String(values.phone || '');
        const email = String(values.email || '');
        const org = String(values.org || '');
        return {
          ok: true,
          data: `BEGIN:VCARD\nVERSION:3.0\nFN:${escapeVCard(name)}\n${phone ? `TEL:${escapeVCard(phone)}\n` : ''}${email ? `EMAIL:${escapeVCard(email)}\n` : ''}${org ? `ORG:${escapeVCard(org)}\n` : ''}END:VCARD`
        };
      }
      default:
        return { ok: false, error: 'unsupported_mode' };
    }
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

  return { escapeVCard, escapeWifi, buildPayload, buildSvg };
});
