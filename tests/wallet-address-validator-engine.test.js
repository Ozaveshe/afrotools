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
