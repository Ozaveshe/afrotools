const { test, expect } = require('@playwright/test');
const crypto = require('node:crypto');
// Synthetic browser fixtures only: no actual review or permission is asserted.
function canonical(value) { if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value); }
const digest = value => crypto.createHash('sha256').update(canonical(value)).digest('hex');
const revision='a'.repeat(64);
const publish=(value,rev=revision)=>{const body={schema_version:1,review_revision:rev,...value};return {...body,publication:{policy:'reviewed-only',content_sha256:digest(body)}};};
const reviewed=value=>({...value,review:{status:'reviewed',content_sha256:digest(value)}});
function deckFixture(){const card=reviewed({id:'synthetic-deck-card-1',deck_id:'synthetic-deck',subject:'mathematics',front:'Synthetic fixture: what is two plus two?',back:'Four.'});return reviewed({id:'synthetic-deck',subject:'mathematics',name:'Synthetic mathematics',description:'Synthetic test content only',emoji:'M',cards:[card]});}
async function mock(page,{decks=[],patterns={},total=0,indexRevision=revision,bankRevision=revision}={}){
 await page.route('**/data/jamb/pools/index.json',route=>route.fulfill({json:publish({stats:{by_subject:{mathematics:{total}},total}},indexRevision)}));
 await page.route('**/data/jamb/flashcard-decks.json',route=>route.fulfill({json:publish({decks},bankRevision)}));
 await page.route('**/data/jamb/pools/patterns.json',route=>route.fulfill({json:publish({subjects:patterns},bankRevision)}));
}
test.beforeEach(async({context,page})=>{await context.addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));await page.setViewportSize({width:390,height:844});});
for (const width of [320,390]) test('empty reviewed publications preserve useful study paths at '+width+'px',async({page})=>{
 await page.setViewportSize({width,height:844});
 await mock(page);
 await page.route('**/.netlify/functions/jamb-daily-signup',route=>route.fulfill({json:{capabilities:{email:true,whatsapp:false}}}));
 for(const [url,status] of [['/jamb/','#question-readiness'],['/jamb/flashcards/','#deck-status'],['/jamb/patterns/','#pattern-status'],['/jamb/daily/','#channel-note']]){
  await page.goto(url);await expect(page.locator(status)).toContainText(/review|unavailable/i);await expect(page.locator('a[href="/tools/study-planner/"]').first()).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),{message:url}).toBeLessThanOrEqual(1);
 }
 await expect(page.locator('#signup-btn')).toBeDisabled();
 await page.goto('/jamb/mathematics/1987/');await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, follow');await expect(page.locator('h2').first()).toContainText('under review');
 await page.goto('/jamb/mathematics/');await expect(page.getByRole('navigation',{name:'Browse paper years'})).toBeVisible();
});
test('approved synthetic flashcard deck remains usable and progress uses reviewed card IDs',async({page})=>{
 await mock(page,{decks:[deckFixture()],total:1});await page.goto('/jamb/flashcards/');await page.getByRole('button',{name:/Synthetic mathematics/}).click();await expect(page.locator('#card-front-text')).toContainText('two plus two');await page.locator('#show-answer').click();await expect(page.locator('#card-back-text')).toHaveText('Four.');page.once('dialog',d=>d.accept());await page.locator('.rate-btn').last().click();
 const state=await page.evaluate(rev=>JSON.parse(localStorage.getItem('afrojamb-flashcards-reviewed-'+rev)),revision);expect(state['synthetic-deck']['synthetic-deck-card-1']).toBeTruthy();expect(state['synthetic-deck']['0']).toBeUndefined();
});
for(const scenario of ['legacy','stale','tampered'])test('flashcards reject '+scenario+' content',async({page})=>{
 const d=deckFixture();if(scenario==='legacy')delete d.review;if(scenario==='tampered')d.cards[0].front='ALTERED_UNREVIEWED';await mock(page,{decks:[d],total:1,bankRevision:scenario==='stale'?'b'.repeat(64):revision});await page.goto('/jamb/flashcards/');await expect(page.locator('#deck-status')).toContainText('could not be verified');await expect(page.locator('#deck-list button')).toHaveCount(0);await expect(page.locator('body')).not.toContainText('ALTERED_UNREVIEWED');
});
test('reviewed historical topic coverage renders without a future prediction',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await mock(page,{total:1,patterns:{mathematics:{name:'Mathematics',total_questions:1,topics:[{topic:'Synthetic arithmetic',total:1,yearly:{2020:1}}],years_covered:[2020],year_distribution:{2020:1},predictions_2026:[],recent_years_used:[]}}});await page.goto('/jamb/patterns/');await expect(page.locator('#top-topics-grid')).toContainText('Synthetic arithmetic');await expect(page.locator('#pred-list')).toContainText('Future topics are not predicted');await expect.poll(()=>page.evaluate(()=>typeof topicChart==='object'&&topicChart!==null)).toBe(true);expect(errors).toEqual([]);
});

for (const mismatch of [false,true]) test('daily signup requires matching reviewed availability: '+(mismatch?'stale':'ready'),async({page})=>{
 await mock(page,{total:1});
 let posts=0;
 await page.route('**/.netlify/functions/jamb-daily-signup',route=>{
  if(route.request().method()==='POST'){expect(route.request().postDataJSON().pool_revision).toBe(revision);posts++;return route.fulfill({json:{ok:true}});}
  return route.fulfill({json:{capabilities:{email:true,whatsapp:false},review:{status:'ready',review_revision:mismatch?'b'.repeat(64):revision,available_subjects:['mathematics'],counts:{mathematics:1}}}});
 });
 await page.goto('/jamb/daily/');
 if(mismatch){await expect(page.locator('#signup-btn')).toBeDisabled();await expect(page.locator('#channel-note')).toContainText('unavailable');expect(posts).toBe(0);return;}
 await expect(page.locator('#channel-note')).toContainText('available');await page.locator('#subjects').getByRole('checkbox',{name:'Math',exact:true}).click();
 await page.locator('#contact').fill('synthetic@example.invalid');await page.locator('#signup-btn').click();await expect.poll(()=>posts).toBe(1);
});

test('synthetic approved static question renders usable answer details at 320px',async({page})=>{
 const {renderYear}=require('../../scripts/build-jamb-reviewed-pages');
 const {questionFingerprint}=require('../../scripts/lib/jamb-content-trust');
 const q={id:'synthetic-static',subject:'mathematics',year:1987,num:1,question:'Which comparison is correct?',options:{A:'5 < 6',B:'5 > 6',C:'5 = 6',D:'5 = 7'},answer:'A',format:4,has_diagram:false,explanation:'Five is smaller than six.'};
 const evidence={status:'accepted',reviewer:'synthetic fixture',reviewed_at:'2026-09-10',evidence:'synthetic fixture only'};
 const ledger={sources:{fixture:{permission:{status:'permitted',basis:'original-work',evidence:'synthetic fixture',reviewed_by:'test',reviewed_at:'2026-09-10'}}},questions:{[q.id]:{content_sha256:questionFingerprint(q),source_id:'fixture',question_review:evidence,answer_review:evidence,explanation_review:evidence}}};
 const rendered=renderYear('mathematics',1987,[q],ledger);
 await page.route('**/jamb/mathematics/1987/',route=>route.fulfill({contentType:'text/html',body:rendered.html}));
 await page.setViewportSize({width:320,height:844});await page.goto('/jamb/mathematics/1987/');await expect(page.locator('[data-reviewed-question]')).toHaveCount(1);await page.getByText('Answer and explanation',{exact:true}).click();await expect(page.getByText('Five is smaller than six.',{exact:true})).toBeVisible();await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
