# Hausa and Yoruba WhatsApp workflow owner

`scripts/build-hausa-whatsapp-link.js` owns the bounded workflow region in both existing locale pages. Its historical default regenerates Hausa only; `--all` regenerates Hausa and Yoruba. The public page regions are generated output, so edit the scoped source module and stylesheet, then regenerate:

```sh
node scripts/build-hausa-whatsapp-link.js --all
node scripts/build-hausa-whatsapp-link.js --all --check
node --test tests/ha-yo-whatsapp-link.test.js
node tests/hausa-whatsapp-link-parity.test.js
```

The owner preserves existing route metadata, editorial content, Hausa launch state and Yoruba noindex/unavailable notice. Functional source qualification does not promote locale readiness or establish native-speaker acceptance.

`assets/js/pages/ha-yo-whatsapp-link.js` supplies static localized form markup and the browser controller. It reuses the unchanged `engines/src/whatsapp-link-engine.js` through its generated browser counterpart, plus the existing local QR vendor. Do not add remote QR or phone-validation services.

The English task is single links,26 country choices, optional encoded messages,5 business templates, explicit open/copy, local QR PNG, and bulk links with7 default-country choices and individual/all copy. The locale workflows also offer local TXT recovery. Country choice is explicit; language does not pick a jurisdiction. Bulk input is capped at500 non-empty lines and reports rejected line numbers.

Inputs, outputs and drafts stay in memory. Link/QR/TXT include the chosen phone and message; the interface says so before generation. Only an explicit open/share action leaves the tool. No personal content belongs in analytics, URL state for this page, storage or logs.

Qualify real single/bulk/template/error/reset/stale/export and keyboard paths at desktop and320/375px, including200percent text and reduced motion with real first-visit banners undismissed. Decode a downloaded QR PNG against the expected URL. Exercise missing/overflow QR recovery and truthful bulk line errors. Test native clipboard transport only when authorized; adapter tests are not clipboard acceptance.

The sole publisher owns cumulative generated-output, release/CI/security/dist and exact-SHA production proof, including composition with later shared notices. Keep source and generated files separate in producer receipts.
