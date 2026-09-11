(function (root) {
  'use strict';
  // Only checksum-bound, reviewed static figures are eligible for practice.
  var pathPattern = /^\/assets\/img\/jamb\/([a-f0-9]{64})\.svg$/;
  var tags = new Set(['svg', 'g', 'path', 'line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse', 'text', 'tspan', 'title', 'desc']);
  var attributes = new Set(['xmlns', 'viewBox', 'role', 'aria-labelledby', 'id', 'width', 'height', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'opacity', 'transform', 'font-family', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline']);
  function supports(question) {
    return !!question && typeof question.image === 'string' && pathPattern.test(question.image)
      && typeof question.image_alt === 'string' && question.image_alt.trim().length > 0;
  }
  function validateSvg(text) {
    if (/<\?|<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('Figure contains unsupported document declarations.');
    var doc = new root.DOMParser().parseFromString(text, 'image/svg+xml');
    if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg' || doc.documentElement.namespaceURI !== 'http://www.w3.org/2000/svg') throw new Error('Figure is not a valid SVG.');
    var nodes = doc.querySelectorAll('*');
    if (nodes.length > 1000) throw new Error('Figure is too complex.');
    for (var node of nodes) {
      if (node.namespaceURI !== 'http://www.w3.org/2000/svg' || !tags.has(node.localName)) throw new Error('Figure contains unsupported elements.');
      for (var attr of node.attributes) {
        if (!attributes.has(attr.name)) throw new Error('Figure contains unsupported attributes.');
        if (attr.name === 'xmlns') {
          if (attr.value !== 'http://www.w3.org/2000/svg') throw new Error('Figure namespace changed.');
        } else if (/url\s*\(|javascript:|data:|https?:|\/\//i.test(attr.value)) throw new Error('Figure contains an external reference.');
      }
    }
    var box = (doc.documentElement.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    if (box.length !== 4 || !box.every(Number.isFinite) || box[2] <= 0 || box[3] <= 0 || box[2] > 3000 || box[3] > 3000) throw new Error('Figure has invalid dimensions.');
  }
  async function load(question, revision, signal) {
    root.AfroJAMB.QuestionTrust.assertEligible([question], revision);
    if (!supports(question)) throw new Error('This question has no supported reviewed figure.');
    // Content-addressed paths can reuse cached bytes; every load still verifies the checksum.
    var response = await root.fetch(question.image, {cache:'force-cache', signal:signal});
    if (!response.ok) throw new Error('The question figure could not be loaded.');
    if (Number(response.headers.get('content-length')) > 65536) throw new Error('The question figure is too large.');
    var bytes = await response.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > 65536) throw new Error('The question figure is empty or too large.');
    var hashBytes = await root.crypto.subtle.digest('SHA-256', bytes);
    var hash = Array.from(new Uint8Array(hashBytes)).map(function (b) { return b.toString(16).padStart(2,'0'); }).join('');
    if (hash !== question.image.match(pathPattern)[1]) throw new Error('The question figure changed. Reload the reviewed bank.');
    validateSvg(new TextDecoder('utf-8', {fatal:true}).decode(bytes));
    root.AfroJAMB.QuestionTrust.assertEligible([question], revision);
    if (signal && signal.aborted) throw new DOMException('Figure loading cancelled.', 'AbortError');
    var objectUrl = root.URL.createObjectURL(new Blob([bytes], {type:'image/svg+xml'}));
    try {
      var img = new root.Image(); img.src = objectUrl; await img.decode();
      if (!img.naturalWidth || !img.naturalHeight) throw new Error('The question figure could not be displayed.');
      if (signal && signal.aborted) throw new DOMException('Figure loading cancelled.', 'AbortError');
      root.AfroJAMB.QuestionTrust.assertEligible([question], revision);
      var revoked = false;
      return {url:objectUrl, alt:question.image_alt, revoke:function () {if (!revoked) {root.URL.revokeObjectURL(objectUrl);revoked=true;}}};
    } catch (error) {root.URL.revokeObjectURL(objectUrl);throw error;}
  }
  root.AfroJAMB = root.AfroJAMB || {};
  root.AfroJAMB.ReviewedFigure = Object.freeze({supports:supports, load:load});
}(window));
