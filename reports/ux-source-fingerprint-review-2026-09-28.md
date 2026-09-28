# UX source fingerprint review — 28 September 2026

Reviewed against current production/main 25c50cd49d013489bb7626e5278ea0c28f136ae0. This records UI-only changes in the original amount source 07e8d5361a141e6e3c7ce813ce288a06aca02415 and Uganda source a834de5bf53739a88304bf7f82bb34c7cb54fe0e.

Ghana/Naira copy feedback now follows the current request, preserves moved focus, and supports current-value print/PDF fallback. All twelve wording, case, document-line and quality/review functions listed below are byte-identical to baseline. The shared decimal parser and French routes are unchanged. Native oracle inputs, mutations, invalid inputs, assertions and output expectations are unchanged. Only the two normalized English source fingerprints and review references are recaptured.

## naira-to-words

Previous 67d9d33b1d136892a1883e9401a429f5389932d41f4947503dca3d49d5008ff9; current 67e447e17624b0bf5904341e9cfa924813992ce05fc734fb4da859edb92057a1.

- numToWords: 367d6af1225dd6b2ad6f725803a7f5f484435111082db4eda06a6d5cecc389df
- chunkToWords: a37a72db14a47d8036bcf1670fba0ffaecab1b1b7cc2cdd515741f260c7d7560
- amountToWords: bfbfda3c8c2681908bd55b3f5643c9df715de8b61e6bf1d00eba3498072d4748
- applyCaseMode: d0cbf1a5cc21ae9071a2c92c25c1b0dea728ff8c11c342c0d273102a191e9f34
- buildDocumentLine: 282c2191f62f7d9557073ccf969e0705bd79188ad16fd5ad4658790515b3dc7a
- renderQuality: 45b6c17050ede509a0cc57db212623ba0dfd9b6e7656ec44840a540acb4de8cd

## amount-words-gh

Previous 2ef96b6234a106ff0ef731e9809f1a6fdb025a00c1321e9e8dd5974b5b0eb004; current b3ee7d1058a8bc8fbb37de84d121e562f38786ec1b1b394eee7b3171246e6d8e.

- numWords: 51f58f2e6ee2b93a9dea937b8bc6fb2eb6aa87f04ed8f6d12bf30b90878f6b19
- amountToWords: 92b5a932c30ed010288057bbffb675cc5d1719077823551380546590bec04ac3
- escapeHtml: 25d0f5e5b90631ecf9e7f62f2eb3f598744e23675258c414ce47785ceca69827
- applyCaseMode: 91d1bf049e95033d81a1c433ea9b5c8b1ba9dc8b0dfff0e6d519bcb8d1922366
- buildDocumentLine: 9ace5d79be8b4d38fe8b154c1433f415586968bd4b959fa8c4c02ee401cba073
- renderReview: b3461290e2385d35e37732caaaf910513631a4e80bb4741b7a988bca14a7dd60

## Uganda current-source overlay

Previous reviewed controller hash 00d77b6e9547dba2a3e5fbc9dd34cd97256c84c6b72ccb6a92cd0c0f7c2acd9c; current c3d8ec4c6cf9fd78b50e4c2ecf4e6788193be9c893852369a0f6b1ecdb9df785. The historical hash 02b2f751b9f1a7bf629445becb802be659b943e9029b420bee3036f784fac6e4 stays frozen. Only the current ug-paye English overlay and its review reference change. No Swahili page, tax calculation expectation, statutory data, fixture value or acceptance history changes.

The independently compared engine delegation, calculation mapping, result rows, WhatsApp payload and PDF arguments are recorded in data/calculation-quality/reviews/2026-09-28-uganda-export-recovery.json. This review does not assert a new tax-law/source-date verification.
