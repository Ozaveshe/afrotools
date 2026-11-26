const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../tools/degree-checker/degree-route-engine.js');
test('requires destination purpose and qualification',()=>{
  assert.equal(engine.build({}).valid,false);
  assert.equal(engine.build({destination:'us'}).valid,false);
  assert.equal(engine.build({destination:'us',purpose:'study'}).valid,false);
});
test('routes US recognition to the recipient rather than a federal equivalency verdict',()=>{
  assert.equal(engine.build({destination:'us',purpose:'study',qualification:'bachelor',documents:[]}).owner,'The receiving education institution');
  assert.equal(engine.build({destination:'us',purpose:'licensed',qualification:'bachelor',documents:[]}).owner,'The relevant state licensing board');
});
test('routes Canadian immigration to designated assessment process',()=>{
  const route=engine.build({destination:'canada',purpose:'immigration',qualification:'master',institutionStatus:'confirmed',documents:['certificate','transcript','verification','translation']});
  assert.equal(route.valid,true);
  assert.match(route.owner,/IRCC.*designated/i);
  assert.equal(route.gaps.length,0);
  assert.equal('equivalent' in route,false);
  assert.equal('eligible' in route,false);
});
test('keeps licensing separate from general comparison',()=>{
  const route=engine.build({destination:'australia',purpose:'licensed',qualification:'bachelor',documents:[]});
  assert.match(route.owner,/registration|licensing|professional/i);
  assert.match(route.separation,/does not itself grant professional registration/i);
});
test('reports document and institution verification gaps',()=>{
  const route=engine.build({destination:'south-africa',purpose:'study',qualification:'hnd',institutionStatus:'unknown',documents:['certificate']});
  assert.deepEqual(route.gaps,[
    'Confirm the awarding institution with the home-country regulator',
    'Official transcript or statement of results',
    'Direct issuer or registrar verification route',
    'Certified translation if the recipient requires one'
  ]);
});

test('source guidance matches the Canadian and UK recognition purpose', () => {
  function link(destination, purpose) {
    return engine.build({ destination, purpose, qualification: 'hnd', documents: [] }).link.url;
  }
  assert.match(link('canada', 'study'), /cicic.ca\/875\//);
  assert.match(link('canada', 'work'), /cicic.ca\/927\//);
  assert.match(link('canada', 'licensed'), /cicic.ca\/927\//);
  assert.match(link('canada', 'immigration'), /canada.ca.*express-entry/);
  assert.match(link('uk', 'study'), /what-different-qualification-levels-mean/);
  assert.match(link('uk', 'work'), /what-different-qualification-levels-mean/);
  assert.match(link('uk', 'licensed'), /regulated-in-the-uk/);
  assert.match(link('uk', 'immigration'), /check-uk-visa/);
});
