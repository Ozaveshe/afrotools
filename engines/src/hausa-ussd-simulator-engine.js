(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.hausaUssdSimulator = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var PRESETS = {
    mpesa: {
      code: '*182#',
      name: 'M-Pesa (Kenya)',
      flow: {
        start: { text: 'M-Pesa\n1. Tura kuɗi\n2. Cire kuɗi\n3. Sayi airtime', options: { '1': 'send_phone', '2': 'withdraw_agent', '3': 'airtime_amount' } },
        send_phone: { text: 'Shigar da lambar wayar gwaji:', input: 'phone', next: 'send_amount' },
        send_amount: { text: 'Shigar da adadin gwaji:', input: 'amount', next: 'send_confirm' },
        send_confirm: { text: 'A tura KSh {amount} zuwa {phone}?\n1. Tabbatar\n2. Soke', end: true },
        withdraw_agent: { text: 'Shigar da lambar wakilin gwaji:', input: 'agent', next: 'withdraw_amount' },
        withdraw_amount: { text: 'Shigar da adadin cirewa:', input: 'amount', next: 'withdraw_end' },
        withdraw_end: { text: 'Gwajin cire KSh {amount} ta wakili {agent} ya kai ƙarshe.', end: true },
        airtime_amount: { text: 'Shigar da adadin airtime:', input: 'amount', next: 'airtime_end' },
        airtime_end: { text: 'Gwajin airtime KSh {amount} ya kai ƙarshe.', end: true }
      }
    },
    gtbank: {
      code: '*737#',
      name: 'GTBank (Nigeria)',
      flow: {
        start: { text: 'GTBank\n1. Canja kuɗi\n2. Airtime\n3. Duba maɗauni', options: { '1': 'account', '2': 'gt_airtime', '3': 'balance' } },
        account: { text: 'Shigar da lambar asusun gwaji:', input: 'account', next: 'gt_amount' },
        gt_amount: { text: 'Shigar da adadin gwaji:', input: 'amount', next: 'gt_end' },
        gt_end: { text: 'Gwajin canja NGN {amount} zuwa {account} ya kai ƙarshe. Kada ka saka PIN na gaske.', end: true },
        gt_airtime: { text: 'Shigar da adadin airtime:', input: 'amount', next: 'gt_airtime_end' },
        gt_airtime_end: { text: 'Gwajin airtime NGN {amount} ya kai ƙarshe.', end: true },
        balance: { text: 'Wannan kwaikwayo ne kawai; ba a duba maɗaunin asusu na gaske ba.', end: true }
      }
    },
    momo: {
      code: '*170#',
      name: 'MTN MoMo (Ghana)',
      flow: {
        start: { text: 'MTN MoMo\n1. Tura kuɗi\n2. Sayi airtime\n3. Cash out', options: { '1': 'momo_phone', '2': 'momo_airtime', '3': 'momo_agent' } },
        momo_phone: { text: 'Shigar da lambar wayar gwaji:', input: 'phone', next: 'momo_amount' },
        momo_amount: { text: 'Shigar da adadin GHS:', input: 'amount', next: 'momo_end' },
        momo_end: { text: 'A tura GHS {amount} zuwa {phone}?\nWannan gwaji ne; kada ka saka PIN.', end: true },
        momo_airtime: { text: 'Shigar da adadin airtime:', input: 'amount', next: 'momo_airtime_end' },
        momo_airtime_end: { text: 'Gwajin airtime GHS {amount} ya kai ƙarshe.', end: true },
        momo_agent: { text: 'Shigar da lambar wakilin gwaji:', input: 'agent', next: 'momo_cash' },
        momo_cash: { text: 'Gwajin cash out ta wakili {agent} ya kai ƙarshe.', end: true }
      }
    },
    fnb: {
      code: '*120*321#',
      name: 'FNB (South Africa)',
      flow: {
        start: { text: 'FNB Banking\n1. Biya\n2. Canja kuɗi\n3. eWallet', options: { '1': 'fnb_pay', '2': 'fnb_transfer', '3': 'fnb_phone' } },
        fnb_pay: { text: 'Zaɓi nauʻin biyan gwaji:\n1. Wutar lantarki\n2. Airtime', end: true },
        fnb_transfer: { text: 'Shigar da adadin canji:', input: 'amount', next: 'fnb_transfer_end' },
        fnb_transfer_end: { text: 'Gwajin canja R{amount} ya kai ƙarshe.', end: true },
        fnb_phone: { text: 'Shigar da lambar wayar gwaji:', input: 'phone', next: 'fnb_amount' },
        fnb_amount: { text: 'Shigar da adadin eWallet:', input: 'amount', next: 'fnb_end' },
        fnb_end: { text: 'A tura R{amount} zuwa {phone}?\nWannan kwaikwayo ne kawai.', end: true }
      }
    }
  };

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function validateFlow(flow) {
    if (!flow || typeof flow !== 'object' || Array.isArray(flow)) throw new Error('Tsarin JSON ya zama abu mai jihohi.');
    if (!flow.start || typeof flow.start !== 'object') throw new Error('Tsarin ya ƙunshi jihar start.');
    var keys = Object.keys(flow);
    if (!keys.length || keys.length > 100) throw new Error('Tsarin ya ƙunshi jihohi 1 zuwa 100.');
    var terminals = 0;
    keys.forEach(function (key) {
      var state = flow[key];
      if (!state || typeof state !== 'object' || typeof state.text !== 'string' || !state.text.trim()) throw new Error('Jihar "' + key + '" na buƙatar rubutu.');
      if (state.text.length > 500) throw new Error('Rubutun jihar "' + key + '" ya wuce haruffa 500.');
      if (state.end) terminals += 1;
      if (state.next && !flow[state.next]) throw new Error('Jihar "' + key + '" tana nuni zuwa jihar da babu: ' + state.next + '.');
      if (state.options) Object.keys(state.options).forEach(function (choice) {
        var next = state.options[choice];
        if (typeof next !== 'string' || !flow[next]) throw new Error('Zaɓin "' + choice + '" a jihar "' + key + '" bai da ingantacciyar hanya.');
      });
    });
    return { states: keys.length, terminals: terminals, longScreens: keys.filter(function (key) { return flow[key].text.length > 160; }) };
  }

  function replaceVars(text, vars) {
    return String(text || '').replace(/\{([a-zA-Z0-9_-]+)\}/g, function (_, key) { return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : '{' + key + '}'; });
  }

  function createSession(flow, meta) {
    var checked = validateFlow(flow);
    var session = { flow: copy(flow), state: 'start', variables: {}, log: [], ended: false, cancelled: false, meta: Object.assign({ name: 'Tsarin musamman', code: 'Lambar musamman' }, meta || {}), validation: checked };
    session.log.push({ role: 'SESSION', text: 'An fara ' + session.meta.name + ' a ' + session.meta.code });
    return session;
  }

  function screen(session) {
    if (!session || !session.flow || !session.flow[session.state]) throw new Error('Ba a samu jihar zaman ba.');
    var text = replaceVars(session.flow[session.state].text, session.variables);
    return { state: session.state, text: text, length: text.length, ended: session.ended, variables: copy(session.variables) };
  }

  function respond(session, rawInput) {
    if (!session || session.ended || session.cancelled) throw new Error('Zaman ya riga ya ƙare. Fara sabon gwaji.');
    var input = String(rawInput == null ? '' : rawInput).trim();
    if (!input) throw new Error('Shigar da amsar gwaji.');
    var state = session.flow[session.state];
    session.log.push({ role: 'USER', text: input });
    if (state.input) session.variables[state.input] = input;
    if (state.options) {
      if (!Object.prototype.hasOwnProperty.call(state.options, input)) {
        var invalid = replaceVars(state.text, session.variables) + '\n\nZaɓi bai dace ba. Yi amfani da: ' + Object.keys(state.options).join(', ');
        session.log.push({ role: 'ERROR', text: 'Zaɓi bai dace ba: ' + input });
        return { ok: false, text: invalid, state: session.state };
      }
      session.state = state.options[input];
    } else if (state.next) {
      session.state = state.next;
    } else if (state.end) {
      session.ended = true;
    } else {
      session.ended = true;
    }
    var next = screen(session);
    if (session.flow[session.state].end) session.ended = true;
    next.ended = session.ended;
    next.text += session.ended ? '\n\n[Zaman gwaji ya ƙare]' : '';
    session.log.push({ role: session.ended ? 'END' : 'SYSTEM', text: next.text });
    return Object.assign({ ok: true }, next);
  }

  function cancel(session) {
    if (!session) throw new Error('Babu zaman da za a soke.');
    session.cancelled = true;
    session.ended = true;
    session.log.push({ role: 'SESSION', text: 'An soke zaman gwaji.' });
    return 'An soke zaman gwaji. Ba a kira lambar USSD ba.';
  }

  function exportData(session) {
    if (!session) throw new Error('Fara zaman gwaji tukuna.');
    return { tool: 'ussd-simulator', language: 'ha', mode: 'offline-simulation', service: session.meta.name, code: session.meta.code, currentState: session.state, ended: session.ended, cancelled: session.cancelled, variables: copy(session.variables), transcript: copy(session.log), validation: copy(session.validation), localOnly: true, liveDial: false, transaction: false };
  }

  function qaBrief(session) {
    var data = exportData(session);
    return ['Takaitaccen gwajin USSD', 'Sabis: ' + data.service, 'Lamba: ' + data.code, 'Jihar yanzu: ' + data.currentState, 'Yanayi: kwaikwayo a naʻarar kawai', 'Bayanan da aka kama: ' + (Object.keys(data.variables).length ? JSON.stringify(data.variables) : 'babu'), 'Tarihin gwaji:', data.transcript.map(function (row) { return row.role + ': ' + row.text.replace(/\s*\n\s*/g, ' | '); }).join('\n'), 'Kafin kaddamarwa: tabbatar da lamba, timeout, iyakar haruffa, callback, kuɗi da kaʻidojin mai bayarwa.', 'Kada a saka PIN, BVN, lambar asusu ko bayanan abokin ciniki na gaske.'].join('\n');
  }

  return { presets: copy(PRESETS), validateFlow: validateFlow, createSession: createSession, screen: screen, respond: respond, cancel: cancel, exportData: exportData, qaBrief: qaBrief };
});
