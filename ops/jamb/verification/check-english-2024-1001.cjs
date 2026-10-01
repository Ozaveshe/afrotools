'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '../../..');
const manifestPath = 'ops/nigeria-exams/jamb-english-2024-curated-batch-04.json';
const snapshotPath = 'ops/nigeria-exams/jamb-english-2024-source-snapshot-04.json';
const reviewPath = 'ops/jamb/verification/english-2024-independent-review-1001.json';
const receiptPath = 'ops/jamb/verification/english-2024-publishable-1001.json';
// Frozen selected IDs, answer texts and source digests are sealed below.
const ACCEPTED = Object.freeze([69970, 69976, 69989, 69990, 70039, 70064, 70066, 70067, 70070, 70083, 70094, 70096, 70097, 70098, 70099, 70145, 70146]);
const WINDOW = ACCEPTED;
const HELD = Object.freeze([]);
const ANSWER_TEXT = Object.freeze({"69970": "very first party dress", "69976": "adorn", "69989": "diminished", "69990": "scarcely", "70039": "pain", "70064": "clear", "70066": "garrulous", "70067": "forthcoming", "70070": "extensive", "70083": "along", "70094": "right", "70096": "hymn", "70097": "rake", "70098": "iMMUnity", "70099": "radioACtive", "70145": "It is highly unlikely that it will snow in June", "70146": "He cheated on his wife with his mistress"});
const SOURCE_HASH = Object.freeze({"69970":"85b2aa62d2673ba04b22c3822a2740cd6195ac19637825df937be19dc2cfc38c","69976":"5b1914f1c6a0620706084b838f196007c4a4f5df225e4df3ea4e9f5905732604","69989":"eb0be2b3e73fc5e7e52bc4faab0e4ef57ae0ab8d923ace4288ff6d86fad2eddd","69990":"02daa183d25a7d2a00924333788e8e6ea602363d9ea818abbdf33e40fa35fcf9","70039":"5c390865c38ad8128a6a91eb5b209579caef52877e96c4d28484d1c4eec140f9","70064":"0340033d7c8699c87737a28d5fe14ecac7a7d828289f3467df005db3dbc95fd6","70066":"f0b510cd845f5c977a5145a6db50f4ed994279ca380bec27a778e66e68d9a129","70067":"81a2ba7e187fcd172a2db780382383e8a44f087e9190b8fbb1274354dd6099cb","70070":"5147f0b4c2a5b530d36959a100b5102248cbb26908f9e8f65f4b6809a48347e5","70083":"d023ba25a665e7d4956f5786a25fd7938ce26263a1f5f3f915fb79789a51019c","70094":"3fc6c4b6df64e794fad3fd92fd82a4811e1ace55eb7107eb7c19ffd3054a9760","70096":"3d96c21f3863a2d9804bf5fa6d0a51584eb58181f2ec39802dff4c89a6463777","70097":"02717d7cb6d0116a6e5427ad9e96609a2c971537b5622bf60ae7b5283ae672d1","70098":"7aa1d6c203988f86036038590723802942a1bf92ac1fa16e66ec44477136f2f7","70099":"67cfade45c6bc7ebf897db93aed315401d3aa97827c41fcc6cc671dd001755ea","70145":"bc0ef6f04796e0e0e088229635e335f7496d1d03d577e871f0f594fbfcefe8dc","70146":"2c0328875905c1026d1d141988f6bc98e2339a8702c304cf5baa82e6f1333b3f"});
const SOURCE_POSITION = Object.freeze({"69970": 48, "69976": 53, "69989": 58, "69990": 59, "70039": 75, "70064": 81, "70066": 82, "70067": 83, "70070": 85, "70083": 94, "70094": 96, "70096": 98, "70097": 99, "70098": 100, "70099": 101, "70145": 109, "70146": 110});
const PAGE_HASH = Object.freeze({"69970": "20a6d7bc332794a6ba6b06fdd567e620e02bac1353a3a1b59626f10857b6c1b9", "69976": "7878fe623b2ac2c7960cf549a76a50ae4b535f9fa54e3085a598d6e172d98162", "69989": "63cfd1773e875c19d4b3b8e10d9d682984ba99ae669b819c6c253c7b11df738c", "69990": "63cfd1773e875c19d4b3b8e10d9d682984ba99ae669b819c6c253c7b11df738c", "70039": "1d74f99e9808fbfa362343158683381635f48b0b15c0558baabcd46d1788ec68", "70064": "f81c4547da36bcb9ca42668707dae0d7fddc867f80373c1e460e12c855f8ea8c", "70066": "f81c4547da36bcb9ca42668707dae0d7fddc867f80373c1e460e12c855f8ea8c", "70067": "f81c4547da36bcb9ca42668707dae0d7fddc867f80373c1e460e12c855f8ea8c", "70070": "f81c4547da36bcb9ca42668707dae0d7fddc867f80373c1e460e12c855f8ea8c", "70083": "2b3c76166f387ae87c0963032e54093a7a441ea6504297f1e3352680bdc10587", "70094": "6c3cd56e55506a5d68c7ed2bca19f7692cc155b46d452a5a44506a6ed1a5a5cb", "70096": "6c3cd56e55506a5d68c7ed2bca19f7692cc155b46d452a5a44506a6ed1a5a5cb", "70097": "6c3cd56e55506a5d68c7ed2bca19f7692cc155b46d452a5a44506a6ed1a5a5cb", "70098": "6c3cd56e55506a5d68c7ed2bca19f7692cc155b46d452a5a44506a6ed1a5a5cb", "70099": "18ab5b367ad9c8af3299ee2319840d03a17787c41818b72af710b5ed46d38863", "70145": "98b39aadde9907e924a3f61ecbe8cc96e5de70516ce94d1006ba85fe2ada7662", "70146": "98b39aadde9907e924a3f61ecbe8cc96e5de70516ce94d1006ba85fe2ada7662"});
const RAW_PROMPT_HASH = Object.freeze({"69970": "859e2b64aa3fdf9e422847e2262ae6b21cb2057d0c661a6e31d665ec65e1c032", "69976": "76793df893824d0b227e9f9854c82aa41fcfa91b296291a66e96648366b15d5d", "69989": "29ba801340bf73969efc9c07e426f24c930efe36132d9669b58242c1dd575ea6", "69990": "199fdcbd9b95198e72394abd6fa975f467476fecda812d3332cbffc2b8ca954d", "70039": "6f7171649cc46c3d66cfd7a4a576d0086dcdfd6404ab598a80ba56d90277fb21", "70064": "5f40169d96637f23cb91f9ee4cb09099d3e5cdb1e7bda7fc6a47ebc48eac2280", "70066": "b8d1b7c4959b735bfe4590573cff33e85abe337f3024658b315dd451a3f8d2ca", "70067": "78a914c5eb3ae3c8e5773a0012a994103af457e7c1fb6903e4931f660f9bd67c", "70070": "0ccd2ceee77f34ce39968683418113a6da4d58c754cb57f81e5133783e5d1650", "70083": "00982be28232f633308963b1727f20aa24f341b459a4caeb2b7241e8591842d3", "70094": "99eb4dc22049acb63bbed1fc1c34195f96542d6161047289e0ef9f00abad4dc1", "70096": "22e96c629b7a3ec5f6c9973e702285160dcc4d1f18a9badba3dfb2dafd22de4b", "70097": "11492996aa6b9cf32917c0f5c630654a1cc5a7115753b3d9020a31c0e334d313", "70098": "be01cc793e039347605e1d67f3118cdc74173bfae9d80b3d87737dfa69bc6ce8", "70099": "60593cdac4c298ed76aa233cad1c2405445042c4340b5106159e4b8513cd533e", "70145": "0f065e2c453e6b61a0e4ce103d722ad0e72bd0ac542ae8ee844e8e8ef6d7bec0", "70146": "1cc15b534be6d8a16356c465f33650df74b39d1fb45e3ab048c01c690b396544"});
const ROOT_REVIEW_HASH = "d2f1e90a1f90642005e9b6a78c6ce1b0295d55cc9fa463669fab9a3c9e32b034";
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const ws = value => value.replace(/\s+/gu, ' ').trim();
const sourceUrl = (id, position) => `https://myschool.ng/classroom/english-language/${id}?exam_type=jamb&exam_year=2024&page=${Math.ceil(position / 5)}`;
const trustFor = referenceRoot => require(path.join(referenceRoot || ROOT, 'scripts/lib/jamb-content-trust.js'));

function displayPrompt(source) {
  const target = source.targeted_text[0];
  if (!target) return source.question_text;
  const note = { p: 'the final p in Gap.', e: 'the e in Market.', a: 'the a in bathe.' }[target] || 'word ' + target + '.';
  return source.question_text + ' Target: ' + note;
}

function checkSnapshotRecord(source, trust) {
  assert.equal(source.source_item, SOURCE_POSITION[source.source_question_id], 'position/ID mapping');
  assert.equal(source.source_url, sourceUrl(source.source_question_id, source.source_item), 'source URL/query/page');
  assert.equal(source.raw_response_sha256, PAGE_HASH[source.source_question_id], 'frozen raw page');
  assert.equal(source.html_fragment_sha256, RAW_PROMPT_HASH[source.source_question_id], 'frozen raw prompt');
  assert.equal(sha(source.question_html), RAW_PROMPT_HASH[source.source_question_id], 'actual raw prompt bytes');
  assert.equal(source.num, null); assert.equal(source.year_basis, 'publisher-collection');
  assert.equal(source.collection_year, 2024); assert.equal(source.http_status, 200);
  assert(Number.isFinite(Date.parse(source.retrieved_at_utc)), 'dated source observation');
  for (const field of ['raw_response_sha256', 'html_fragment_sha256', 'exact_content_sha256', 'reviewer_semantic_sha256']) assert.match(source[field], /^[a-f0-9]{64}$/);
  assert.deepEqual(source.choices.map(choice => choice.label), ['A', 'B', 'C', 'D']);
  assert(source.choices.every(choice => typeof choice.text === 'string' && choice.text.trim()));
  const payload = {
    promptText: ws(source.question_text),
    optionsText: ws(source.choices.map(choice => choice.label.toLowerCase() + ' ' + choice.text).join(' ')),
    underlined: source.targeted_text.map(ws)
  };
  assert.deepEqual(source.reviewer_semantic_payload, payload, 'source exact prompt/options/target payload');
  assert.equal(trust.questionFingerprint(payload), source.reviewer_semantic_sha256, 'source semantic fingerprint');
  const exact = Object.fromEntries(['question_text', 'choices', 'targeted_text', 'prompt_image_count'].map(key => [key, source[key]]));
  assert.equal(trust.questionFingerprint(exact), source.exact_content_sha256, 'exact structured source fingerprint');
  if (SOURCE_HASH[source.source_question_id]) assert.equal(source.reviewer_semantic_sha256, SOURCE_HASH[source.source_question_id], 'independently pinned source digest');
}

function validateManifest(manifest, snapshot, independentReview, options = {}) {
  const trust = trustFor(options.referenceRoot);
  assert.deepEqual([manifest, snapshot, independentReview].map(trust.questionFingerprint), ["4be52d44bccf0eee1bb062f281757e23ceb680fc52e3aac4decde9a9efbab337","4f1e0e87f4fe6d98752c4e5f6476f24c2db43da70b81cff9fc503f243e649813","5b29db75fc47cfd790ea4e4c71cb73c4bc3d0d13a78c3e5c58c1573e45ad451b"], 'frozen independently reviewed batch payloads');
  for (const object of [manifest, snapshot, independentReview]) {
    assert.equal(object.schema_version, 1); assert.equal(object.year_basis, 'publisher-collection');
    assert.equal(object.sitting_authenticated, false); assert.equal(object.official_answer_key, false);
  }
  assert.equal(manifest.observed_at, '2026-10-01'); assert.equal(manifest.publisher, 'Myschool');
  assert.equal(manifest.collection_year, 2024); assert.equal(manifest.implementation_base_sha, null, 'base comes from the later verified implementation invocation');
  assert.equal(snapshot.publisher, 'Myschool'); assert.equal(snapshot.collection_year, 2024);
  assert.deepEqual(manifest.records.map(row => row.source_question_id), ACCEPTED, 'accepted source IDs');
  assert.deepEqual(snapshot.records.map(row => row.source_question_id), ACCEPTED);
  assert.deepEqual(independentReview.records.map(row => row.source_question_id), ACCEPTED);
  assert.deepEqual(manifest.held_source_items.map(row => row.source_question_id), HELD, 'held source IDs');
  assert.deepEqual(snapshot.held_records.map(row => row.source_question_id), HELD);
  const dispositions = [...manifest.records, ...manifest.held_source_items].sort((a, b) => a.source_item - b.source_item);
  assert.deepEqual(dispositions.map(row => row.source_item), ACCEPTED.map(id => SOURCE_POSITION[id]));
  assert.deepEqual(dispositions.map(row => row.source_question_id), WINDOW);
  assert.equal(independentReview.source_file, snapshotPath);
  assert.equal(independentReview.root_review_completed, true);
  assert.equal(independentReview.root_review_proof_sha256, ROOT_REVIEW_HASH);
  for (const source of [...snapshot.records, ...snapshot.held_records]) checkSnapshotRecord(source, trust);
  const answers = {};
  for (const row of manifest.records) {
    const source = snapshot.records.find(item => item.source_question_id === row.source_question_id);
    const proof = independentReview.records.find(item => item.source_question_id === row.source_question_id);
    assert.equal(row.source_item, source.source_item); assert.equal(proof.source_item, source.source_item);
    assert.equal(row.source_url, source.source_url); assert.equal(row.source_observed_at, source.retrieved_at_utc);
    assert.equal(row.source_prompt_sha256, SOURCE_HASH[row.source_question_id]);
    assert.equal(proof.source_prompt_sha256, row.source_prompt_sha256);
    assert.equal(row.num, null, 'collection position is not a paper number');
    assert.equal(row.question, displayPrompt(source), 'complete source stem/context and only explicit target clarification');
    assert.deepEqual(row.choices, source.choices.map(choice => choice.text), 'exact A-D source option text');
    assert.deepEqual(row.observed_options, Object.fromEntries(source.choices.map(choice => [choice.label, choice.text])));
    assert.equal(source.prompt_image_count, 0); assert.equal(source.shared_passage_required, false); assert.equal(source.attached_figure_required, false);
    assert.equal(typeof row.explanation, 'string'); assert(row.explanation.length >= 65);
    assert.doesNotMatch(row.explanation, /publisher|source|repair|transcription|corrected|restored/iu, 'no public repair/source history');
    assert.equal(proof.independent_reasoning, row.explanation);
    assert.equal(proof.verdict, 'accepted'); assert.deepEqual(Object.keys(proof.distractor_review).sort(), ['A', 'B', 'C', 'D']);
    assert.deepEqual(proof.primary_source_urls, row.independent_source_urls);
    assert(row.independent_source_urls.length > 0 && row.independent_source_urls.every(url => /^https:\/\//.test(url) && !url.includes('myschool.ng')));
    const matches = row.choices.map((text, index) => text === ANSWER_TEXT[row.source_question_id] ? 'ABCD'[index] : null).filter(Boolean);
    assert.equal(matches.length, 1, 'independently selected answer text must identify one exact source option');
    answers[row.source_question_id] = matches[0];
    assert.equal(row.answer, matches[0], 'independently selected key');
    assert.equal(proof.answer, matches[0]); assert.equal(proof.answer_text, ANSWER_TEXT[row.source_question_id]);
  }
  for (const [id, selected, index] of [[70098,'iMMUnity',1],[70099,'radioACtive',5]]) {
    const source=snapshot.records.find(row=>row.source_question_id===id);
    assert.match(source.question_text,/stress pattern/iu);
    assert.match(source.question_text,/stressed syllable.*capital letters/iu);
    assert.equal(ANSWER_TEXT[id],selected);
    const main=selected.match(/[A-Z]+/)[0];
    assert.equal(main,id===70098?'MMU':'AC','independently confirmed primary stress syllable');
    assert.equal(selected.slice(0,selected.indexOf(main)).length,index,'frozen uppercase character position');
    assert.equal(new Set(source.choices.map(choice=>choice.text)).size,4,'case-sensitive source stress choices distinct');
  }
  return answers;
}

function verify(manifest, snapshot, independentReview, pool, ledger, receipt, bytes, options = {}) {
  const trust = trustFor(options.referenceRoot);
  const answers = validateManifest(manifest, snapshot, independentReview, options);
  assert.equal(receipt.source_file, snapshotPath); assert.equal(receipt.source_snapshot_sha256, sha(bytes.snapshot));
  assert.equal(receipt.source_manifest_sha256, sha(bytes.manifest)); assert.equal(receipt.independent_review_sha256, sha(bytes.review));
  assert.deepEqual(receipt.records.map(row => row.source_question_id), ACCEPTED);
  const checked = [];
  for (const row of manifest.records) {
    const id = 'english-2024-myschool-' + row.source_question_id;
    const question = pool.questions.find(item => item.id === id), review = ledger.questions[id];
    const proof = receipt.records.find(item => item.id === id), source = review && ledger.sources[review.source_id];
    assert(question && review && proof && source, id);
    assert.equal(question.answer, answers[row.source_question_id], 'independently selected answer');
    assert.equal(question.question, row.question); assert.deepEqual(Object.values(question.options), row.choices);
    assert.equal(question.explanation, row.explanation); assert.equal(question.num, null); assert.equal(question.year, 2024);
    assert.equal(question.subject, 'english'); assert.equal(question.format, 4); assert.equal(question.has_diagram, false);
    assert.equal(question.verification.method, 'ai-source-checked');
    assert.equal(question.verification.reviewed_at, manifest.observed_at);
    assert.deepEqual(Object.keys(question.source_provenance).sort(), ['publisher', 'url', 'year_basis']);
    assert.equal(question.source_provenance.url, row.source_url); assert.equal(question.source_provenance.year_basis, 'publisher-collection');
    assert.deepEqual(Object.keys(question).sort(), ['answer', 'explanation', 'format', 'has_diagram', 'id', 'num', 'options', 'question', 'source_provenance', 'subject', 'verification', 'year']);
    assert.equal(source.source_file, snapshotPath); assert.equal(source.source_url, row.source_url);
    assert.equal(source.sitting_authenticated, false); assert.equal(source.official_answer_key, false);
    assert.equal(source.content_sha256, receipt.source_snapshot_sha256);
    assert.equal(source.reuse_authorization.material_sha256, receipt.source_snapshot_sha256);
    assert.equal(proof.source_item, row.source_item); assert.equal(proof.answer, answers[row.source_question_id]);
    assert.equal(proof.independently_selected_answer, ANSWER_TEXT[row.source_question_id]);
    assert.equal(proof.content_sha256, trust.questionFingerprint(question)); assert.equal(review.content_sha256, proof.content_sha256);
    assert.equal(trust.assessQuestion(question, ledger).state, 'eligible', id);
    checked.push(id);
  }
  for (const heldId of HELD) assert(!pool.questions.some(row => row.id === 'english-2024-myschool-' + heldId), 'held source item must not be introduced');
  return { passed: true, accepted: checked.length, held_or_excluded: HELD.length, question_ids: checked, scope: 'source-faithful publisher collection; formal sitting unconfirmed' };
}

if (require.main === module) {
  const bytes = Object.fromEntries([['manifest', manifestPath], ['snapshot', snapshotPath], ['review', reviewPath]].map(([key, relative]) => [key, fs.readFileSync(path.join(ROOT, relative))]));
  const read = relative => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
  const result = verify(JSON.parse(bytes.manifest), JSON.parse(bytes.snapshot), JSON.parse(bytes.review),
    read('ops/jamb/source-pool.json'), read('data/jamb/review-ledger.json'), read(receiptPath), bytes);
  process.stdout.write(JSON.stringify(result) + '\n');
}
module.exports = { validateManifest, verify, displayPrompt, sha, trustFor, ACCEPTED, HELD, WINDOW, ANSWER_TEXT, SOURCE_HASH, manifestPath, snapshotPath, reviewPath, receiptPath };
