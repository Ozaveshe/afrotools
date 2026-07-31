'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../assets/js/engines/wallet-address-validator.js');

test('validates official Bitcoin witness vectors and rejects mutations', async () => {
  assert.equal((await engine.validate('bitcoin', 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).status, 'valid');
  assert.equal((await engine.validate('bitcoin', 'bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7kt5nd6y')).status, 'valid');
  assert.equal((await engine.validate('bitcoin', 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5')).status, 'invalid');
  assert.equal((await engine.validate('bitcoin', 'bc1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4')).status, 'invalid');
});

test('validates Base58Check Bitcoin and TRON vectors', async () => {
  assert.equal((await engine.validate('bitcoin', '1BoatSLRHtKNngkdXEeobR76b53LETtpyT')).status, 'valid');
  assert.equal((await engine.validate('tron', 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL')).status, 'valid');
  assert.equal((await engine.validate('tron', 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeM')).status, 'invalid');
});

test('fails closed for EIP-55 mixed case and checks Solana decoded bytes', async () => {
  assert.equal((await engine.validate('evm', '0xde709f2102306220921060314715629080e2fb77')).status, 'valid');
  const mixed = await engine.validate('evm', '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
  assert.equal(mixed.status, 'unverified');
  assert.match(mixed.warning, /checksum-verified/);
  assert.equal((await engine.validate('solana', '11111111111111111111111111111111')).status, 'valid');
  assert.equal((await engine.validate('solana', '1111111111111111111111111111111')).status, 'invalid');
});

test('redacts receipts without preserving the full address', () => {
  const address = '0xde709f2102306220921060314715629080e2fb77';
  const redacted = engine.redact(address);
  assert.equal(redacted.includes(address), false);
  assert.match(redacted, /\.\.\./);
  assert.equal(engine.redact('abc').includes('abc'), false);
  assert.equal(engine.redact('abc'), '[redacted 3 chars]');
});

test('returns exact deterministic outputs and fails closed at input boundaries', async () => {
  const evm = await engine.validate('evm', '0xde709f2102306220921060314715629080e2fb77');
  assert.deepEqual(evm, {
    status: 'valid',
    network: 'Ethereum / EVM',
    type: '20-byte hexadecimal address',
    checksum: 'Not present',
    method: '20-byte hexadecimal structure validation',
    details: ['Uniform-case EVM address; EIP-55 checksum is not present'],
    warning: ''
  });
  const empty = await engine.validate('evm', '');
  assert.equal(empty.status, 'invalid');
  assert.equal(empty.method, 'No validation run');
  assert.deepEqual(empty.details, ['Enter an address.']);
  const overLimit = await engine.validate('evm', 'x'.repeat(121));
  assert.equal(overLimit.status, 'invalid');
  assert.equal(overLimit.method, 'Input limit');
  assert.deepEqual(overLimit.details, ['Address exceeds the 120-character limit.']);
  const unsupported = await engine.validate('unsupported', 'abc');
  assert.equal(unsupported.status, 'invalid');
  assert.equal(unsupported.method, 'Explicit network selection required');
  const zero = await engine.validate('evm', '0x0000000000000000000000000000000000000000');
  assert.equal(zero.status, 'valid');
  assert.match(zero.warning, /zero address/i);
});
