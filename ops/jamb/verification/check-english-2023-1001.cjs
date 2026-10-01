'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '../../..');
const manifestPath = 'ops/nigeria-exams/jamb-english-2023-curated-batch-01.json';
const snapshotPath = 'ops/nigeria-exams/jamb-english-2023-source-snapshot-01.json';
const reviewPath = 'ops/jamb/verification/english-2023-independent-review-1001.json';
const receiptPath = 'ops/jamb/verification/english-2023-publishable-1001.json';
// Independently reviewed selected source and answer pins.
const ACCEPTED=Object.freeze([67322, 67344, 67346, 67350, 67351, 67352, 67353, 67355, 67357, 67361, 67362, 67404, 67428]);
const WINDOW=ACCEPTED;
const HELD=Object.freeze([]);
const ANSWER_TEXT=Object.freeze({"67322": "short", "67344": "courteous", "67346": "Abhorrent", "67350": "unyielding", "67351": "gullible", "67352": "held up", "67353": "imitate", "67355": "brother", "67357": "Did the union congratulate the ousted president?", "67361": "Does a good description exclude specific nouns?", "67362": "seizure", "67404": "The solution can be found in one of the negative options", "67428": "Who finished his home work yesterday?"});
const SOURCE_HASH=Object.freeze({"67322":"9517dba84630fe853425808c461bda3fbb6fa9054915831c772446a4f7d744c5","67344":"092901f69b66979621be702801ccaf20d5bc6da2e8573ab3c99bb89e055749e6","67346":"9878d7f8dbdd8a84e9f95ea3633c244c36f469092990ebb5a00baee8106d9377","67350":"e657332bdfed04a0b43dc8dc583ad393d46662655167ce49c725f0e906a4943d","67351":"5aaa143a2fa3bb011109358b223ffe515d327724dbd18b04e5f3ed7aa3067231","67352":"7f1d539a40829bf096001b59a25da1c5372fdfc48d618df7dbebc4a9f96f7b6a","67353":"0156bb3bbcde0b349f2b5c5d42a0d348b14e55abe5fb9ec9428744b9f60cceb6","67355":"dcbea874b991b28fc40cea1769d4e09c90bef2d88025f39e09ce0b3ec3101b9b","67357":"2814a9063eebd6616bcd1a84b12cf93d1b0223908ac3ca3fc390259828236ed3","67361":"300bea77d633117d27424d24c1042fba2e03c1eeca011db05d0bc353c4aee207","67362":"fd45790d07f9d710aa8233e04ae0b877f647626d77fd5ed65e3e530e53bfaba0","67404":"3b9e5fd8a9a7791d8aafe9585097f9ce9d6105606561df56f73ae51e939086fd","67428":"1306124d46205408fab594ff338c9c93cf070f6fc112f5d0fce035bcef21c879"});
const SOURCE_POSITION=Object.freeze({"67322": 30, "67344": 48, "67346": 50, "67350": 53, "67351": 54, "67352": 55, "67353": 56, "67355": 58, "67357": 60, "67361": 62, "67362": 63, "67404": 65, "67428": 66});
const PAGE_HASH=Object.freeze({"67322": "e3c81acc5222df36c119467edac4100ca1a937e00755cb374d57bd79cf5634de", "67344": "1ee05d71c35a831ba060ddabf38a72ba23fc08ee30e9a080db19f4be5f48324e", "67346": "1ee05d71c35a831ba060ddabf38a72ba23fc08ee30e9a080db19f4be5f48324e", "67350": "1971d41d4f712cadb879af020a65fac9ea7beb39b048a148ed742291290a1164", "67351": "1971d41d4f712cadb879af020a65fac9ea7beb39b048a148ed742291290a1164", "67352": "1971d41d4f712cadb879af020a65fac9ea7beb39b048a148ed742291290a1164", "67353": "6d38be0e5902ff7625a2e9d3b96e5d8daf4079457f78825a4f4d4eb475e82c28", "67355": "6d38be0e5902ff7625a2e9d3b96e5d8daf4079457f78825a4f4d4eb475e82c28", "67357": "6d38be0e5902ff7625a2e9d3b96e5d8daf4079457f78825a4f4d4eb475e82c28", "67361": "a4c8e9b6989fc1140573869fbbd0fe5bcf6c79ff1eff2c28fa0206f95fe34faa", "67362": "a4c8e9b6989fc1140573869fbbd0fe5bcf6c79ff1eff2c28fa0206f95fe34faa", "67404": "a4c8e9b6989fc1140573869fbbd0fe5bcf6c79ff1eff2c28fa0206f95fe34faa", "67428": "08d75c4423693b2a9fb96adc5d2ad4ecbe7853df640680e39c99c3063a57db1f"});
const RAW_PROMPT_HASH=Object.freeze({"67322": "054bdab7357cd100e53b1964f6f5912b7b2c2170fd2dc496ead9c30478f26e30", "67344": "4efb39a24b2527db7184917fd5ec08093028502e07d3e4cf83cec7481ce4bf06", "67346": "131bb2425383171f5e23ba7f3932634c18b5ca18527814a16adb734a3dc9f6c0", "67350": "ca0d3861992a334ef15158396b85ef444066402dcb60febe8a0a7aee862d2716", "67351": "2c8ec6315f8c3c9aea18eccec96ded3c270c70e155a8822a352e9d0432f5f957", "67352": "f2b1c8738fe173259f9fdf8d4689bb4b277adeb51b11f07f9a991fa545d01d5a", "67353": "4db2ebaa02bb1e9fb6d2ee244b06a03d684e65d2adfe946934b93a4d317eb0c3", "67355": "bf999e57a2c05996b415775194693ed1a2c56aa52262d8443ae49425346770eb", "67357": "c4cba242c13e5a09436f98682e63a800eb232246f1caf775468da250044adca4", "67361": "13fa24a268128bb07f5ead8655bd65a648ba88cd1cf638ed93b69e9a740acc12", "67362": "0bbe5b9acf02d74c4003de364e8b5ba70b942d63f2f38c3a25488487786715fb", "67404": "18a1f3372e234bfc771142f90bd73d8caea3f8fb934de0238c426f8db20eb0bb", "67428": "103c15f49c4d3544d231c0d1223f30514bb34cd1beb8c915c0fe15f5d8206b63"});
const DISPLAY_PROMPT=Object.freeze({"67322": "Choose the word that does not have the same vowel sound as the others", "67344": "Choose the word or phrase from A to D which has its meaning opposite to the underlined word or words in each sentence She was impertinent until she met her husband. Target: impertinent.", "67346": "Choose the option that is nearest in meaning to the underlined word(s) Repugnant rules in the society should be repealed. Target: Repugnant.", "67350": "Choose the option that is nearest in meaning to the underlined word The boss is quite inflexible once he has made up his mind. Target: inflexible.", "67351": "From the options lettered A-D, choose the option that is most nearly opposite in meaning to the underlined word. My mother is a shrewd businesswoman. Target: shrewd.", "67352": "In the following question, choose the option that best completes the sentence. The guest would have arrived earlier but he was _______ in traffic.", "67353": "Choose the option that is nearest in meaning to the underlined word(s) No one would complain if you emulate good behaviour Target: emulate.", "67355": "Choose the word that has the same consonant sound as the one in bracket. Smoo[th] Target: th (bracketed in Smooth).", "67357": "In each of the questions, the word in capital letters has the emphatic stress. Choose the option to which the given sentence relates.The union congratulated the ELECTED president.", "67361": "In each of the questions, the word in capital letters has the emphatic stress. Choose the option to which the given sentence relates.A good description INCLUDES specific nouns.", "67362": "Choose the word which has the same consonant sounds as the underlined letter(s) pleasure Target: s.", "67404": "In this question, select the option that best explains the information conveyed in the sentence. The solution lies in choosing between various negative alternatives.", "67428": "In this question, the word in capital letters has the emphatic stress. Choose the option to which the given sentence relates. EMEKA finished his homework yesterday."});
const ROOT_REVIEW_HASH="c2d4ee0601aa12a35b7c53cd381e3c5af172a84219778027094a9869090ea019";
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const ws = value => value.replace(/\s+/gu, ' ').trim();
const sourceUrl = (id, position) => `https://myschool.ng/classroom/english-language/${id}?exam_type=jamb&exam_year=2023&page=${Math.ceil(position / 5)}`;
const trustFor = referenceRoot => require(path.join(referenceRoot || ROOT, 'scripts/lib/jamb-content-trust.js'));

function displayPrompt(source) { return DISPLAY_PROMPT[source.source_question_id]; }

function checkSnapshotRecord(source, trust) {
  assert.equal(source.source_item, SOURCE_POSITION[source.source_question_id], 'position/ID mapping');
  assert.equal(source.source_url, sourceUrl(source.source_question_id, source.source_item), 'source URL/query/page');
  assert.equal(source.raw_response_sha256, PAGE_HASH[source.source_question_id], 'frozen raw page');
  assert.equal(source.html_fragment_sha256, RAW_PROMPT_HASH[source.source_question_id], 'frozen raw prompt');
  assert.equal(sha(source.question_html), RAW_PROMPT_HASH[source.source_question_id], 'actual raw prompt bytes');
  assert.equal(source.num, null); assert.equal(source.year_basis, 'publisher-collection');
  assert.equal(source.collection_year, 2023); assert.equal(source.collection_metadata.exam_year, 2023); assert.equal(source.collection_metadata.exam_type, 'jamb'); assert.equal(source.http_status, 200);
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
  assert.deepEqual([manifest, snapshot, independentReview].map(trust.questionFingerprint), ["85b454f8aec3e04cc205fe0a46b6f688fc7ebf7ebcef18b0e2d81bffff2f4b84","8238624c29a67d0298c107b9d19f15b202966c2cd3e7216fd664b5388b2352b0","fa3b81735a594a0833f6c32108305a9cdd3b0c03c31e2608b756f926ccc8cf6a"], 'frozen independently reviewed batch payloads');
  for (const object of [manifest, snapshot, independentReview]) {
    assert.equal(object.schema_version, 1); assert.equal(object.year_basis, 'publisher-collection');
    assert.equal(object.sitting_authenticated, false); assert.equal(object.official_answer_key, false);
  }
  assert.equal(manifest.observed_at, '2026-10-01'); assert.equal(manifest.publisher, 'Myschool');
  assert.equal(manifest.collection_year, 2023); assert.equal(manifest.implementation_base_sha, null, 'base comes from the later verified implementation invocation');
  assert.equal(snapshot.publisher, 'Myschool'); assert.equal(snapshot.collection_year, 2023);
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
    const id = 'english-2023-myschool-' + row.source_question_id;
    const question = pool.questions.find(item => item.id === id), review = ledger.questions[id];
    const proof = receipt.records.find(item => item.id === id), source = review && ledger.sources[review.source_id];
    assert(question && review && proof && source, id);
    assert.equal(question.answer, answers[row.source_question_id], 'independently selected answer');
    assert.equal(question.question, row.question); assert.deepEqual(Object.values(question.options), row.choices);
    assert.equal(question.explanation, row.explanation); assert.equal(question.num, null); assert.equal(question.year, 2023);
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
  for (const heldId of HELD) assert(!pool.questions.some(row => row.id === 'english-2023-myschool-' + heldId), 'held source item must not be introduced');
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
