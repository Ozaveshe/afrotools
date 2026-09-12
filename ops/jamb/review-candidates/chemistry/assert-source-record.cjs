'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const pins={
  "chemistry-1983-13-226552c20011": {
    "file": "recovery-001.json",
    "file_sha256": "e80b0428b1ec1ca89843e4b662cc2ca02ebdf6a8786e2eff71f0c1c3946eeb17",
    "original": "dd69cbc4d5b622625bd6f3539966f45f8940df771bc3026ad1ab112e7bb5668d",
    "candidate": "8e433a89635f0843c0f96f172680481117591fa7638f36be89ecc5a0f87ed308",
    "first_pass_file": "batch-001.json",
    "first_pass_file_sha256": "c8f82f6dd76d4b5f6ec34ca2f072a057bb739f9a2a7b268d57594c34408fa10a",
    "first_pass_record_sha256": "4ed0b365eaf9842daa0fb247e5b0b0361dff5c94c79b7098329f23acca884ab6"
  },
  "chemistry-1983-17-ff5dd9189448": {
    "file": "recovery-001.json",
    "file_sha256": "e80b0428b1ec1ca89843e4b662cc2ca02ebdf6a8786e2eff71f0c1c3946eeb17",
    "original": "a57914be23977fd9cff6f228f6df14ccff2c553c1d6bc949d7c530a7190be58e",
    "candidate": "39a22e3993131eeb735f2a61e61170ac6fe7f7fd6396de9b69bf49e2ff04261b",
    "first_pass_file": "batch-001.json",
    "first_pass_file_sha256": "c8f82f6dd76d4b5f6ec34ca2f072a057bb739f9a2a7b268d57594c34408fa10a",
    "first_pass_record_sha256": "ca906c597b94d71b0028415cc4ba6fcc62b5ee020d75e2a21766951545d7d5a7"
  },
  "chemistry-1984-16-917ac93637fa": {
    "file": "recovery-001.json",
    "file_sha256": "e80b0428b1ec1ca89843e4b662cc2ca02ebdf6a8786e2eff71f0c1c3946eeb17",
    "original": "a1a3e87fcc5908bfc43cebad7bdf42c96c47db78a7442cbf52b3c0ccae69f4fa",
    "candidate": "9242930d57350dac595a2fa3405bd74466fe40ae08daa0bdfc0ea5284c14825f",
    "first_pass_file": "batch-002.json",
    "first_pass_file_sha256": "797c1c003ac54e9c50ebd7ffcdfd8778d3b93fe69764952fc50a33809d1dda6d",
    "first_pass_record_sha256": "556ecc0d607034cd77d7a4be9aebdc69b56d7fed4b5df4bab01800cd3996b107"
  },
  "chemistry-1988-1-86ebc84326bc": {
    "file": "recovery-001.json",
    "file_sha256": "e80b0428b1ec1ca89843e4b662cc2ca02ebdf6a8786e2eff71f0c1c3946eeb17",
    "original": "80ca2f12d1fb7b582505044371cadc805ac17c90a3979558f73f23ee183c80cf",
    "candidate": "ae40e5e17ced20a6336af43071890dc70f213e22a8d5b33b5ae5c1c29754faaf",
    "first_pass_file": "batch-006.json",
    "first_pass_file_sha256": "b4b0e67501ac878c203e9438610d9033c059fb57d9f1a644d8b92051e2740648",
    "first_pass_record_sha256": "f53c6b7ac17247571e1b7a4f186c0b8fb40c2be12523c213591f66ea97a802d6"
  },
  "chemistry-1988-6-e26a7c59d569": {
    "file": "recovery-001.json",
    "file_sha256": "e80b0428b1ec1ca89843e4b662cc2ca02ebdf6a8786e2eff71f0c1c3946eeb17",
    "original": "1c15b0d56035a35f5da857792a3b292edd9544a6286cdc6cd66580817fe648eb",
    "candidate": "9d336b4c8d732c8e254b7ad7c46eeeac48b2cb2c5141774f4b05ce6d0414162d",
    "first_pass_file": "batch-006.json",
    "first_pass_file_sha256": "b4b0e67501ac878c203e9438610d9033c059fb57d9f1a644d8b92051e2740648",
    "first_pass_record_sha256": "7508d8274fb1c7a6e4ed51fffbcff37c88d00058f70d75ffd0e12359990f8e59"
  },
  "chemistry-1988-32-3fa695964965": {
    "file": "recovery-001.json",
    "file_sha256": "e80b0428b1ec1ca89843e4b662cc2ca02ebdf6a8786e2eff71f0c1c3946eeb17",
    "original": "ae5e8144aed06b9552b0a6d72f232b4ea9cf7bb77c3e65846d15e572e58c8f8f",
    "candidate": "28a3d51a6e2752a1a6c0318883dcc1825753c3874658a00f3756f60b1457a777",
    "first_pass_file": "batch-006.json",
    "first_pass_file_sha256": "b4b0e67501ac878c203e9438610d9033c059fb57d9f1a644d8b92051e2740648",
    "first_pass_record_sha256": "94c06f2c28eb25db097521aea6c71cb6939a20bdbbf720e57bbfed9db6a6ad3a"
  },
  "chemistry-1989-2-811f9110fd65": {
    "file": "recovery-001.json",
    "file_sha256": "e80b0428b1ec1ca89843e4b662cc2ca02ebdf6a8786e2eff71f0c1c3946eeb17",
    "original": "ae4101cd6d5216f38ac8249b2c0fde7489462febd1b20bdc84defc8c13c63a7a",
    "candidate": "b343aa00effd32a53a4d6f52240d90150207820b047d9ff1b451fde32c236144",
    "first_pass_file": "batch-007.json",
    "first_pass_file_sha256": "6636726390f07e94abfd3ad82a07b91d700038568ee687f94e19c321ac86fd22",
    "first_pass_record_sha256": "1f99e4583fa05edbfabe5570ec5734b7cd0902704b081ed688a7128b32a23954"
  },
  "chemistry-1989-8-e3e72febe003": {
    "file": "recovery-001.json",
    "file_sha256": "e80b0428b1ec1ca89843e4b662cc2ca02ebdf6a8786e2eff71f0c1c3946eeb17",
    "original": "78016dedd03139eb8331f50b3ff31699f09662233c8d2fd482acbe3028097b83",
    "candidate": "652f7b4f055195ac87420791e55f96ec636f17781efe760b37fc4bcc1eb20792",
    "first_pass_file": "batch-007.json",
    "first_pass_file_sha256": "6636726390f07e94abfd3ad82a07b91d700038568ee687f94e19c321ac86fd22",
    "first_pass_record_sha256": "4dc647c08659c2bef58367a87f5a7467cae1858c05d7b22cb43d9c113bbbc359"
  },
  "chemistry-1989-29-11e9376472d8": {
    "file": "recovery-001.json",
    "file_sha256": "e80b0428b1ec1ca89843e4b662cc2ca02ebdf6a8786e2eff71f0c1c3946eeb17",
    "original": "75fd5a0e921e2ab41b9096b596b6c87f36d569d255d0b906b73f8612d20b115e",
    "candidate": "cdd9a884a2d4d1acbc0cbfe524b28375c2a2f3f5cab4eac2bd71cdabb8e2672b",
    "first_pass_file": "batch-007.json",
    "first_pass_file_sha256": "6636726390f07e94abfd3ad82a07b91d700038568ee687f94e19c321ac86fd22",
    "first_pass_record_sha256": "9ce32a464ad9edd00e918168a173e0dbea5d87060f72cbcb4eda0a2033598134"
  },
  "chemistry-1993-19-22d3507d8a5e": {
    "file": "recovery-001.json",
    "file_sha256": "e80b0428b1ec1ca89843e4b662cc2ca02ebdf6a8786e2eff71f0c1c3946eeb17",
    "original": "58a76a3cb4a959c2e5c5a8e81f691f106934d99b15b0f6994449cb34038c942e",
    "candidate": "c96241cf2521d930456865d026258c89afec50b91acfa51ad64fe9fdcb918661",
    "first_pass_file": "batch-011.json",
    "first_pass_file_sha256": "fb680c6cbb98539f62a5cf7c62bbfebb4eb8f441bcf147d521114e9e421e04f9",
    "first_pass_record_sha256": "a776b970a8b3044a7ac071f94199b299eae9f665da6b71ec03361aa524348fd2"
  },
  "chemistry-1983-19-6db7b926e93a": {
    "file": "recovery-002.json",
    "file_sha256": "5d29cd9a3293824b7cb0bbb8de1e0428fef60976e020fdec7d465303af6ce686",
    "original": "1659442a15811597d00d3219e5e5082dbf47d16705a54f6946118dd16e05f06e",
    "candidate": "c9d8d38b701b40ff7894d562161ef58261d98993650c96e6efe320cedb2e437f",
    "first_pass_file": "batch-001.json",
    "first_pass_file_sha256": "c8f82f6dd76d4b5f6ec34ca2f072a057bb739f9a2a7b268d57594c34408fa10a",
    "first_pass_record_sha256": "ad2681d79ea5e980cc1784656bb10672afe5e9b7472af5b8eec1f1b65433050c"
  },
  "chemistry-1983-42-902170fab371": {
    "file": "recovery-002.json",
    "file_sha256": "5d29cd9a3293824b7cb0bbb8de1e0428fef60976e020fdec7d465303af6ce686",
    "original": "6eeadbd4e84a7e6694a02fdee49fcbdb63257425a710da967e7850c5c9f9acd5",
    "candidate": "9e26bfe9740b1b86f03e2230c395609c0ea38d4810e6c27c26dd929982ce87ce",
    "first_pass_file": "batch-001.json",
    "first_pass_file_sha256": "c8f82f6dd76d4b5f6ec34ca2f072a057bb739f9a2a7b268d57594c34408fa10a",
    "first_pass_record_sha256": "cc080727212091824b59e167aa54aff15a1e173d8b7e61555bd7ec160891c310"
  },
  "chemistry-1984-15-6b596ad90e06": {
    "file": "recovery-002.json",
    "file_sha256": "5d29cd9a3293824b7cb0bbb8de1e0428fef60976e020fdec7d465303af6ce686",
    "original": "c23fc7de5e8f43ff264bc6859eb7c58006e2fbb08270936fae30aac328a105ed",
    "candidate": "1954d1f9a043c09485eb4a24cf9022c30052bdd67855812b3e38961f0cb98538",
    "first_pass_file": "batch-002.json",
    "first_pass_file_sha256": "797c1c003ac54e9c50ebd7ffcdfd8778d3b93fe69764952fc50a33809d1dda6d",
    "first_pass_record_sha256": "46724f2c31a2a6551cc3925acba94c6a16f629ee7db94c07592507ffbef1ff37"
  },
  "chemistry-1985-3-6c6ede9833fe": {
    "file": "recovery-002.json",
    "file_sha256": "5d29cd9a3293824b7cb0bbb8de1e0428fef60976e020fdec7d465303af6ce686",
    "original": "7d9edc9beebd4ea89d7cf4ca4dd0dcf8fe19fdde3fc4a1c748c17743dec8c531",
    "candidate": "8ae395c987c2ea1b033b9c726323c245a47cfd55d5f0e5e85d261e5c1ae05c52",
    "first_pass_file": "batch-003.json",
    "first_pass_file_sha256": "d00e91c2c5c0cd1816aaf11e49419aa7893278889ca1e3f938a05ac5e4c1a40b",
    "first_pass_record_sha256": "01d44dffac9b77eb8d91f8a8661a227953f7b279cda8cb9b8f6d3feb1eee2e8f"
  },
  "chemistry-1985-48-62e67b81750c": {
    "file": "recovery-002.json",
    "file_sha256": "5d29cd9a3293824b7cb0bbb8de1e0428fef60976e020fdec7d465303af6ce686",
    "original": "aeb48b54086abe8c86b51b75b7929f5fe682db6f18b7a5a4ef1afc486ff10d60",
    "candidate": "fb53997bbe643b0bf01fd2bcf3ab18e63ff0f5bb2424ebdf2351b55df81e3c3a",
    "first_pass_file": "batch-004.json",
    "first_pass_file_sha256": "7a6f3faaa5010a9066e253023ae55a4bd9d4dd85f2bd787959dfa1333a6db8b8",
    "first_pass_record_sha256": "b392d6935abf9ec00598e796ff9500e4167ea2e9136cb3533c00bfee1371934b"
  },
  "chemistry-1995-17-ae6ef0ede9c2": {
    "file": "recovery-002.json",
    "file_sha256": "5d29cd9a3293824b7cb0bbb8de1e0428fef60976e020fdec7d465303af6ce686",
    "original": "70c9666d2f0cf832b0658b5b96bb796b05ec97d1e29a4d85c1f08e6aa3418352",
    "candidate": "31976c8449bcf017ba64e98199a4084f9cc6f2ac6628a502db2c919ee9e3c953",
    "first_pass_file": "batch-013.json",
    "first_pass_file_sha256": "2e8b6ed27363b2f0422de107bbabb016a574c89e6fec4ba85f7213a39995b32e",
    "first_pass_record_sha256": "becb87b73389b7b90814cd3e82096346b613762df3c9119270bc3fa70ce61526"
  },
  "chemistry-1984-17-e857e728b8c9": {
    "file": "recovery-003.json",
    "file_sha256": "1f2b021f67c7630f45c7e87c89ce5472fd21eddf14266f67d1e3d0073ab02f5f",
    "original": "c9af359b11045898cad65dff0d5a9d70200c109dcf20c163e549d1588c5f2661",
    "candidate": "0e2bf8fff56fd71885d8204b1104745c121a57d42d03a88ddaf4b8ed0aaec2b7",
    "first_pass_file": "batch-002.json",
    "first_pass_file_sha256": "797c1c003ac54e9c50ebd7ffcdfd8778d3b93fe69764952fc50a33809d1dda6d",
    "first_pass_record_sha256": "f3e4c2e1cf8dcd955f2a826c88701b6d06b264820daa0328c3eb94a588d7946a"
  },
  "chemistry-1988-1-dac20753e284": {
    "file": "recovery-003.json",
    "file_sha256": "1f2b021f67c7630f45c7e87c89ce5472fd21eddf14266f67d1e3d0073ab02f5f",
    "original": "896983ea1e16f691cf901d729f151245e65ff87b2bee9cebfec306f3935caf90",
    "candidate": "a5017d2384f587dc04d6555c551ff0322721bd61f4ce6a1f3a5f22a3ddd3c4c1",
    "first_pass_file": "batch-006.json",
    "first_pass_file_sha256": "b4b0e67501ac878c203e9438610d9033c059fb57d9f1a644d8b92051e2740648",
    "first_pass_record_sha256": "f3ef2e207b8f894054d73b80d4bb30550459d90ddc9e63a2be52020078afad99"
  },
  "chemistry-1990-26-537dfb8f848b": {
    "file": "recovery-003.json",
    "file_sha256": "1f2b021f67c7630f45c7e87c89ce5472fd21eddf14266f67d1e3d0073ab02f5f",
    "original": "35664081566e9f6ba0912a09ea47c276f3b42cd41699ee52c00216bca1a5002b",
    "candidate": "f2142834463e1cf66c933bfc29620b675ef90699eb9a39df9de712c12012e617",
    "first_pass_file": "batch-008.json",
    "first_pass_file_sha256": "cab869f378d68685b262a8a30045d7008449eb4308db6c278f726c28a349d399",
    "first_pass_record_sha256": "85842463b510453fd9336e2f3648b387771f01be29e9e08e7f1697ea1196dd3a"
  },
  "chemistry-1988-35-627a1c1213ea": {
    "file": "recovery-004.json",
    "file_sha256": "3cef33d1b8823a3edbd085a7258f9728ba73f2ba83a1eebeda4a5cb6a1870882",
    "original": "3d0b553e2ef8e3ededdf2c2abd4d6f7f22886c5baff4355a3b0533a8c82c2dcd",
    "candidate": "d1063f84959dc6c01c44eab0d5163d838cae0f9219baa2fa94dd1cb3dcb03e72",
    "first_pass_file": "batch-006.json",
    "first_pass_file_sha256": "b4b0e67501ac878c203e9438610d9033c059fb57d9f1a644d8b92051e2740648",
    "first_pass_record_sha256": "313f8c424d86f9be9ddf54c523b3e3c544d5261fca0ed53f7b3021753cd4e63c"
  },
  "chemistry-1989-6-535ca7d67eb1": {
    "file": "recovery-004.json",
    "file_sha256": "3cef33d1b8823a3edbd085a7258f9728ba73f2ba83a1eebeda4a5cb6a1870882",
    "original": "dc8c21ef87a469e9797476e13698c4d4d32e6bc2a5ee15adc1ffc9c0e54368c6",
    "candidate": "2f40e0e9fb25cd63320f226d743f89ad13e3001315e3fdc55a81a545faee6257",
    "first_pass_file": "batch-007.json",
    "first_pass_file_sha256": "6636726390f07e94abfd3ad82a07b91d700038568ee687f94e19c321ac86fd22",
    "first_pass_record_sha256": "2fe9752612545d3a09727efedb2bc35db2d0e70e502d07d053cf1e009de0c839"
  },
  "chemistry-1989-10-852ec5fa3e6d": {
    "file": "recovery-004.json",
    "file_sha256": "3cef33d1b8823a3edbd085a7258f9728ba73f2ba83a1eebeda4a5cb6a1870882",
    "original": "8419d3c56b6f2fea24909bdca4d362b953903690075a2d5a2ca586c84c0ce841",
    "candidate": "386457465b48d184b23a0f6d96c7652e3dd38935f19d3d0b1e719d118036b24b",
    "first_pass_file": "batch-007.json",
    "first_pass_file_sha256": "6636726390f07e94abfd3ad82a07b91d700038568ee687f94e19c321ac86fd22",
    "first_pass_record_sha256": "e6c6cb0da2b211476e9e5dbd01f04065d80046424f9d9f4b1c476aa1c981a467"
  },
  "chemistry-1990-7-39772334f209": {
    "file": "recovery-004.json",
    "file_sha256": "3cef33d1b8823a3edbd085a7258f9728ba73f2ba83a1eebeda4a5cb6a1870882",
    "original": "e0221d2bb5242a4b16daec06291a399215d0bb4c7e59758b32f67d83d4ce3a70",
    "candidate": "a43a72122cf3501d1625d2bfdc49e919f07dbe9c3fb7365cbbf5b301db2b8771",
    "first_pass_file": "batch-008.json",
    "first_pass_file_sha256": "cab869f378d68685b262a8a30045d7008449eb4308db6c278f726c28a349d399",
    "first_pass_record_sha256": "b49aadd7bcc874bc148180c47159067c9ac127ce5bc5c115e2eddffc1bfc5471"
  },
  "chemistry-1998-37-b93f36da8f72": {
    "file": "recovery-004.json",
    "file_sha256": "3cef33d1b8823a3edbd085a7258f9728ba73f2ba83a1eebeda4a5cb6a1870882",
    "original": "4917ff1debb7c4436f18db660d98dcc6784a13fb8a78a23eb0953a69beb46664",
    "candidate": "19a22c47599883c7be4cb0a54f6c005247d473137341703cdab7f6cb276ffcc4",
    "first_pass_file": "batch-015.json",
    "first_pass_file_sha256": "2bf473ba675e6dee35a2220acf2c36b3ca8d980e6cf5f2c4c8db0922f52c4c61",
    "first_pass_record_sha256": "a2245b37ad2996d0abf28f1855a07f18dbd0446b7700535b4275dfec6e1d6838"
  },
  "chemistry-2002-23-227693af459a": {
    "file": "recovery-005.json",
    "file_sha256": "c6911f280519191a0e3033912ad6d5eec19d6d1550773b5ecef049a2a8c6d54b",
    "original": "e2777a343412eb34897606bdcd0929f3de36f6f43725f5b7692693c63efecb40",
    "candidate": "2373d759d991f598b1a12343e5b4643b594a9260bea84d17865042fc321f7ab4",
    "first_pass_file": "batch-019.json",
    "first_pass_file_sha256": "6f040bbe9a381fe172d5549e6a8816898106fa4cdb8443d5d02415c7d6b6bc2e",
    "first_pass_record_sha256": "820407019a8986ce08abb9a9969051d52593dd2f92c2ddaf0c6f37b2bf557759"
  },
  "chemistry-1998-35-a269c5c80043": {
    "file": "recovery-006.json",
    "file_sha256": "1d036428a2618835a6884ad6170ed7d85b6449ceb7c13d1e7234a4ae30106d5d",
    "original": "b6b96b1a16e590c3a7a94e5e8bde9c4bf8a0a1bbd670ec64bafbb0f6f4e53908",
    "candidate": "5aba25251aa8ffcc26f2c9bbda6e30b408655c0a9d710b4b7332c9097bf179b0",
    "first_pass_file": "batch-015.json",
    "first_pass_file_sha256": "2bf473ba675e6dee35a2220acf2c36b3ca8d980e6cf5f2c4c8db0922f52c4c61",
    "first_pass_record_sha256": "b727c97752cb11236163d6153dfadbffead7ce6824f356627d896d99ac6dc929"
  }
};
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
module.exports=function assertSourceRecord(actual,historical,expected){
 const current=questionFingerprint(actual),allowed=Array.isArray(expected)?expected:[expected];
 if(allowed.includes(current))return;
 assert(process.argv.includes('--integrated'),'Pre-intake source changed');
 const pin=pins[historical.id];assert(pin,'No exact reviewed recovery for '+historical.id);
 assert.equal(historical.publication_candidate,false);assert(allowed.includes(pin.original));
 assert.equal(questionFingerprint(historical.original_record),pin.original);
 assert.equal(questionFingerprint({...historical,first_pass_file:pin.first_pass_file}),pin.first_pass_record_sha256);
 assert.equal(hash(fs.readFileSync(path.join(__dirname,pin.first_pass_file))),pin.first_pass_file_sha256);
 const bytes=fs.readFileSync(path.join(__dirname,pin.file));assert.equal(hash(bytes),pin.file_sha256);
 const recovered=JSON.parse(bytes).records.find(r=>r.id===historical.id);
 assert.equal(recovered.original_content_sha256,pin.original);assert.equal(recovered.content_sha256,pin.candidate);
 assert.equal(questionFingerprint(recovered.candidate),pin.candidate);assert.equal(current,pin.candidate);
};
