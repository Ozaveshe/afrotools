(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.WalletAddressValidator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  var BECH32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  function result(status, network, type, checksum, method, details, warning) {
    return { status: status, network: network, type: type, checksum: checksum, method: method, details: details || [], warning: warning || '' };
  }

  function decodeBase58(value) {
    if (!value || value.length > 120) throw new Error('Invalid Base58 length.');
    var number = 0n;
    for (var i = 0; i < value.length; i += 1) {
      var digit = BASE58.indexOf(value[i]);
      if (digit < 0) throw new Error('Invalid Base58 character.');
      number = number * 58n + BigInt(digit);
    }
    var bytes = [];
    while (number > 0n) {
      bytes.unshift(Number(number & 255n));
      number >>= 8n;
    }
    for (var j = 0; j < value.length && value[j] === '1'; j += 1) bytes.unshift(0);
    return Uint8Array.from(bytes);
  }

  async function sha256(bytes) {
    var subtle = globalThis.crypto && globalThis.crypto.subtle;
    if (!subtle) throw new Error('Local SHA-256 is unavailable.');
    return new Uint8Array(await subtle.digest('SHA-256', bytes));
  }

  async function checkBase58(value) {
    var decoded = decodeBase58(value);
    if (decoded.length < 5) return { ok: false, bytes: decoded };
    var payload = decoded.slice(0, -4);
    var expected = decoded.slice(-4);
    var first = await sha256(payload);
    var second = await sha256(first);
    var ok = expected.every(function (byte, index) { return byte === second[index]; });
    return { ok: ok, bytes: decoded, payload: payload };
  }

  function polymod(values) {
    var generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    var chk = 1;
    values.forEach(function (value) {
      var top = chk >>> 25;
      chk = ((chk & 0x1ffffff) << 5) ^ value;
      for (var i = 0; i < 5; i += 1) if ((top >>> i) & 1) chk ^= generators[i];
    });
    return chk >>> 0;
  }

  function expandHrp(hrp) {
    var expanded = [];
    for (var i = 0; i < hrp.length; i += 1) expanded.push(hrp.charCodeAt(i) >>> 5);
    expanded.push(0);
    for (var j = 0; j < hrp.length; j += 1) expanded.push(hrp.charCodeAt(j) & 31);
    return expanded;
  }

  function convertBits(values, from, to, pad) {
    var accumulator = 0;
    var bits = 0;
    var output = [];
    var max = (1 << to) - 1;
    for (var i = 0; i < values.length; i += 1) {
      if (values[i] < 0 || (values[i] >>> from) !== 0) throw new Error('Invalid witness data.');
      accumulator = (accumulator << from) | values[i];
      bits += from;
      while (bits >= to) {
        bits -= to;
        output.push((accumulator >>> bits) & max);
      }
    }
    if (pad && bits) output.push((accumulator << (to - bits)) & max);
    if (!pad && (bits >= from || ((accumulator << (to - bits)) & max))) throw new Error('Invalid witness padding.');
    return output;
  }

  function decodeSegwit(address) {
    if (address.length > 90 || (address !== address.toLowerCase() && address !== address.toUpperCase())) throw new Error('Bech32 must not mix letter case.');
    var lower = address.toLowerCase();
    var separator = lower.lastIndexOf('1');
    if (separator < 1 || separator + 7 > lower.length) throw new Error('Invalid Bech32 separator or checksum length.');
    var hrp = lower.slice(0, separator);
    if (hrp !== 'bc') throw new Error('Only Bitcoin mainnet addresses with the bc prefix are supported.');
    var data = [];
    for (var i = separator + 1; i < lower.length; i += 1) {
      var value = BECH32.indexOf(lower[i]);
      if (value < 0) throw new Error('Invalid Bech32 character.');
      data.push(value);
    }
    var check = polymod(expandHrp(hrp).concat(data));
    var encoding = check === 1 ? 'Bech32' : (check === 0x2bc830a3 ? 'Bech32m' : '');
    if (!encoding) throw new Error('Bitcoin witness checksum does not match.');
    var payload = data.slice(0, -6);
    var version = payload[0];
    if (version === undefined || version > 16) throw new Error('Invalid witness version.');
    var program = convertBits(payload.slice(1), 5, 8, false);
    if (program.length < 2 || program.length > 40) throw new Error('Invalid witness program length.');
    if (version === 0 && program.length !== 20 && program.length !== 32) throw new Error('Witness v0 programs must contain 20 or 32 bytes.');
    if ((version === 0 && encoding !== 'Bech32') || (version > 0 && encoding !== 'Bech32m')) throw new Error('Checksum encoding does not match the witness version.');
    return { version: version, bytes: program.length, encoding: encoding };
  }

  async function validateBitcoin(address) {
    try {
      if (/^bc1/i.test(address)) {
        var witness = decodeSegwit(address);
        var type = witness.version === 0 ? (witness.bytes === 20 ? 'P2WPKH' : 'P2WSH') : (witness.version === 1 && witness.bytes === 32 ? 'Taproot' : 'Witness v' + witness.version);
        return result('valid', 'Bitcoin', type, 'Passed', witness.encoding + ' checksum and witness-program validation', [witness.bytes + '-byte witness program']);
      }
      var checked = await checkBase58(address);
      if (checked.bytes.length !== 25 || !checked.ok) throw new Error('Base58Check checksum or decoded length does not match.');
      var version = checked.payload[0];
      if (version !== 0 && version !== 5) throw new Error('Address is not a supported Bitcoin mainnet P2PKH or P2SH address.');
      return result('valid', 'Bitcoin', version === 0 ? 'P2PKH' : 'P2SH', 'Passed', 'Base58Check with double SHA-256', ['25 decoded bytes', 'Bitcoin mainnet version byte']);
    } catch (error) {
      return result('invalid', 'Bitcoin', 'Not established', 'Failed', 'Bitcoin mainnet Base58Check or SegWit validation', [error.message]);
    }
  }

  async function validateTron(address) {
    try {
      var checked = await checkBase58(address);
      if (checked.bytes.length !== 25 || !checked.ok || checked.payload[0] !== 0x41 || address[0] !== 'T') throw new Error('TRON Base58Check checksum, prefix, or decoded length does not match.');
      return result('valid', 'TRON', 'Base58Check account address', 'Passed', 'Base58Check with double SHA-256', ['25 decoded bytes', 'TRON 0x41 payload prefix']);
    } catch (error) {
      return result('invalid', 'TRON', 'Not established', 'Failed', 'TRON Base58Check validation', [error.message]);
    }
  }

  function validateSolana(address) {
    try {
      var bytes = decodeBase58(address);
      if (bytes.length !== 32) throw new Error('A Solana account address must decode to exactly 32 bytes.');
      var allZero = bytes.every(function (byte) { return byte === 0; });
      return result('valid', 'Solana', '32-byte public key', 'Not applicable', 'Base58 decoding and byte-length validation', ['32 decoded bytes'], allZero ? 'This is the all-zero/default public key. Confirm that this is intentional.' : '');
    } catch (error) {
      return result('invalid', 'Solana', 'Not established', 'Not applicable', 'Solana Base58 and decoded-length validation', [error.message]);
    }
  }

  function validateEvm(address) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return result('invalid', 'Ethereum / EVM', 'Not established', 'Failed', '20-byte hexadecimal structure validation', ['Use 0x followed by exactly 40 hexadecimal characters.']);
    var body = address.slice(2);
    var allLower = body === body.toLowerCase();
    var allUpper = body === body.toUpperCase();
    var zero = /^0{40}$/.test(body);
    if (!allLower && !allUpper) return result('unverified', 'Ethereum / EVM', '20-byte hexadecimal address', 'Not evaluated', '20-byte structure validation only', ['Mixed-case EIP-55 checksum requires Keccak-256 and is not evaluated by this browser-local validator.'], 'Do not treat this result as checksum-verified. Confirm the address in a trusted wallet.');
    return result('valid', 'Ethereum / EVM', '20-byte hexadecimal address', 'Not present', '20-byte hexadecimal structure validation', ['Uniform-case EVM address; EIP-55 checksum is not present'], zero ? 'This is the zero address and is commonly not a usable recipient. Confirm before any transfer.' : '');
  }

  async function validate(network, rawAddress) {
    var address = String(rawAddress || '').trim();
    if (!address) return result('invalid', '', 'Not established', 'Not evaluated', 'No validation run', ['Enter an address.']);
    if (address.length > 120) return result('invalid', '', 'Not established', 'Not evaluated', 'Input limit', ['Address exceeds the 120-character limit.']);
    if (network === 'bitcoin') return validateBitcoin(address);
    if (network === 'evm') return validateEvm(address);
    if (network === 'solana') return validateSolana(address);
    if (network === 'tron') return validateTron(address);
    return result('invalid', '', 'Not established', 'Not evaluated', 'Explicit network selection required', ['Choose one of the four supported networks.']);
  }

  function redact(address) {
    var value = String(address || '').trim();
    if (value.length <= 12) return '[redacted ' + value.length + ' chars]';
    return value.slice(0, 6) + '...' + value.slice(-6);
  }

  return { validate: validate, redact: redact, decodeBase58: decodeBase58, decodeSegwit: decodeSegwit };
});
