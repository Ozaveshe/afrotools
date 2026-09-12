'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const EXPECTED = 'd70da60adbad7d2c2b972ea2e71d33d9f5f512869f416aa73cbc8594c205bc75';

module.exports = function checkSourceMaterial(batch, integrated, pdf) {
  assert.equal(batch.source_pdf_sha256, EXPECTED);
  assert.equal(batch.source.content_sha256, EXPECTED);
  assert.equal(batch.source.reuse_authorization.material_sha256, EXPECTED);
  if (!fs.existsSync(pdf)) {
    assert.ok(integrated, 'Pre-intake verification requires the original source PDF');
    return 'Committed source identity checked; private PDF unavailable in this checkout';
  }
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf)).digest('hex'), EXPECTED);
  return 'Original source PDF bytes checked';
};
