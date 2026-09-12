const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const claims = require('../scripts/lib/public-claims');
const os = require('node:os');
const {execFileSync} = require('node:child_process');

test('unchanged committed reports remain reproducible across midnight', () => {
  const root = path.resolve(__dirname, '..');
  const previousJson = fs.readFileSync(path.join(root, 'reports/public-claims.json'), 'utf8');
  const previousMarkdown = fs.readFileSync(path.join(root, 'reports/public-claims.md'), 'utf8');
  const previous = JSON.parse(previousJson);
  const registry = claims.loadClaimsRegistry();
  const date = new Date(previous.generatedAt + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + 1);
  const next = { ...previous, generatedAt: date.toISOString().slice(0, 10) };
  assert.deepEqual(claims.stableReportDate(next, registry, previousJson, previousMarkdown), previous);

  const changedEvidence = structuredClone(next);
  changedEvidence.summary.approvedHits += 1;
  assert.equal(claims.stableReportDate(changedEvidence, registry, previousJson, previousMarkdown).generatedAt, next.generatedAt);
  const changedRegistry = structuredClone(registry);
  changedRegistry.claims[0].evidenceOwner += ' changed';
  assert.equal(claims.stableReportDate(next, changedRegistry, previousJson, previousMarkdown).generatedAt, next.generatedAt);
  assert.equal(claims.stableReportDate(next, registry, '{invalid', previousMarkdown).generatedAt, next.generatedAt);
  assert.equal(claims.stableReportDate(next, registry, previousJson, 'stale markdown').generatedAt, next.generatedAt);

  const expired = structuredClone(registry);
  expired.claims[0].reviewAfter = previous.generatedAt;
  const validation = claims.validateRegistries({ claims: expired, flows: claims.loadDataFlows(), today: next.generatedAt, root });
  assert.ok(validation.errors.some(error => error.code === 'CLAIM_REVIEW_EXPIRED'));
});

test('final report recovers committed date after intermediate build scan churn', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'claims-report-date-'));
  try {
    const previousJson=fs.readFileSync(path.join(__dirname,'../reports/public-claims.json'),'utf8');
    const previousMarkdown=fs.readFileSync(path.join(__dirname,'../reports/public-claims.md'),'utf8');
    const previous=JSON.parse(previousJson),registry=claims.loadClaimsRegistry();
    fs.mkdirSync(path.join(root,'reports'));
    fs.writeFileSync(path.join(root,'reports/public-claims.json'),previousJson);
    fs.writeFileSync(path.join(root,'reports/public-claims.md'),previousMarkdown);
    const git=(...args)=>execFileSync('git',args,{cwd:root,stdio:'pipe'});
    git('init');git('add','reports');
    git('-c','user.name=Test','-c','user.email=test@example.invalid','-c','commit.gpgsign=false','commit','-m','fixture');
    const day=new Date(previous.generatedAt+'T00:00:00Z');day.setUTCDate(day.getUTCDate()+1);
    const next={...previous,generatedAt:day.toISOString().slice(0,10)};
    const interim=structuredClone(next);interim.summary.approvedHits+=1;
    fs.writeFileSync(path.join(root,'reports/public-claims.json'),JSON.stringify(interim));
    fs.writeFileSync(path.join(root,'reports/public-claims.md'),'intermediate build report');
    assert.deepEqual(claims.committedReportDate(next,registry,root),previous);
    assert.equal(claims.committedReportDate(interim,registry,root).generatedAt,next.generatedAt);
    assert.deepEqual(claims.committedReportDate(next,registry,path.join(root,'absent')),next);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
