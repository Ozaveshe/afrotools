# Public feature data-flow inventory

Last verified: 2026-07-11

## flow.static-calculator

Feature class: calculator

Browser processing: The page calculation engine processes inputs in the browser unless the tool explicitly labels a server-backed lookup or AI action.

Network destinations: None for this flow.

Storage: browser memory; localStorage only when a save/draft control is used

Retention: Unsaved values last for the page session; saved local values remain until the user clears them or browser storage.

Account association: None for guest calculation; a separate sync action can associate a supported saved item with an account.

Third-party processors: None for this flow.

Consent/disclosure: The calculator label identifies any separate network-backed action before it is used.

Deletion: Clear/reset removes the current values; saved local values can be removed from the relevant history or browser storage.

Export: Supported results can be copied or downloaded locally; export behavior is tool-specific.

## flow.optional-ai

Feature class: ai

Browser processing: The browser assembles a bounded request after the user accepts the AI disclosure.

Network destinations: AfroTools AI Netlify Function; configured Anthropic API endpoint when enabled

Storage: request memory; provider/service logs subject to deployed configuration

Retention: AfroTools does not promise zero retention; deployed service and provider policies control operational logs.

Account association: Only when the calling feature deliberately includes authenticated context; the consent disclosure must state this.

Third-party processors: Anthropic when the configured provider is available; Netlify for function execution

Consent/disclosure: Explicit point-of-use consent lists what is sent, why it is sent, and the local-only alternative.

Deletion: Local input can be cleared immediately; provider/service log deletion follows the applicable service process.

Export: AI output can be copied or exported only through the calling tool's labelled controls.

## flow.account-sync

Feature class: account-sync

Browser processing: The browser keeps a local copy and submits a supported item to the workspace API after sign-in.

Network destinations: /api/workspace; AfroTools Supabase project zpclagtgczsygrgztlts

Storage: localStorage; RLS-protected Supabase workspace tables

Retention: Local data remains until cleared; account data remains until the user deletes it or the account/service retention process applies.

Account association: Yes, for authenticated sync requests.

Third-party processors: Supabase; Netlify

Consent/disclosure: Sign-in and the sync/save control disclose that selected supported items are sent to the account workspace.

Deletion: Supported synced items can be deleted through the workspace API; local copies must be removed separately.

Export: Workspace data can be exported where the relevant history/tool exposes export; local JSON export remains workflow-specific.

## flow.payment-provider

Feature class: payment

Browser processing: AfroTools initializes checkout and records pending/status metadata; card or bank details are entered on the configured provider flow.

Network destinations: AfroTools billing function; Paystack or Stripe when configured

Storage: payment provider systems; AfroTools subscription/status records; limited pending checkout state in the browser

Retention: Provider and transaction-record retention follows the configured provider and applicable accounting requirements.

Account association: Yes, billing and entitlement status are associated with the purchasing account.

Third-party processors: Paystack or Stripe; Netlify; Supabase when subscription state is stored there

Consent/disclosure: Checkout identifies the provider and requires an explicit purchase action.

Deletion: Payment records may be retained for legal/accounting reasons; account and subscription controls handle eligible profile/status deletion.

Export: Provider receipts and account billing records are available according to the active provider integration.

## flow.analytics-consent

Feature class: analytics

Browser processing: Analytics scripts and product events must wait for analytics consent and exclude raw sensitive workflow content.

Network destinations: configured Google Analytics endpoint after consent; configured Microsoft Clarity endpoint after consent if enabled

Storage: consent state in the browser; configured analytics provider systems

Retention: Browser consent persists until changed; provider retention follows the configured analytics property.

Account association: Product analytics is not intended to include raw account or sensitive input content; provider identifiers/request metadata may still exist.

Third-party processors: Google Analytics when configured and consented; Microsoft Clarity when configured and consented

Consent/disclosure: The cookie/analytics control must precede analytics script loading and offer accept/reject choices.

Deletion: Users can withdraw consent for future collection; provider-held data follows provider deletion/configuration controls.

Export: No user-facing raw analytics export is promised by the product.

## flow.document-local

Feature class: document-local

Browser processing: Named local PDF/image operations read and transform the selected content in browser memory.

Network destinations: None for this flow.

Storage: browser memory; local browser drafts only when the user saves them

Retention: In-memory content ends with the page/session; saved local drafts remain until removed.

Account association: None unless the user separately chooses account sync or vault upload.

Third-party processors: None for this flow.

Consent/disclosure: The local operation is labelled local; network-backed document actions are separate controls.

Deletion: Closing/resetting clears in-memory content; saved local drafts can be removed by the user.

Export: Generated files are downloaded locally through the browser.

## flow.document-network

Feature class: document-network

Browser processing: The browser prepares the selected content after an explicit TTS, AI, email, sync, or delivery action.

Network destinations: the named AfroTools function; the configured downstream processor for that action

Storage: request memory; service/provider logs or delivery records as disclosed

Retention: Depends on the selected function and provider; no universal never-stored promise is made.

Account association: Only when the selected action requires an authenticated account or includes account context.

Third-party processors: Netlify; the provider named at the point of use

Consent/disclosure: The action must identify what content leaves the device and why before submission.

Deletion: Local content can be cleared immediately; remote deletion follows the named service/provider process.

Export: The selected service can return audio, document output, delivery status, or other labelled output.

## flow.cloud-vault

Feature class: vault

Browser processing: The browser validates the selected file and explicitly uploads it after the signed-in user chooses the vault action.

Network destinations: AfroTools Supabase storage/project zpclagtgczsygrgztlts when the canonical client is active

Storage: private Supabase storage bucket; RLS-protected vault metadata table

Retention: Uploaded files and metadata remain until deletion or the account/service retention process applies.

Account association: Yes, vault objects and metadata are associated with the signed-in user.

Third-party processors: Supabase

Consent/disclosure: Upload requires sign-in and an explicit vault upload action.

Deletion: The vault delete control removes the object and associated metadata when the service succeeds.

Export: Users can download their vault file where the vault control is available.

## flow.form-email

Feature class: form-email

Browser processing: The browser validates fields and submits them only after the user activates the form action.

Network destinations: AfroTools form/lead Netlify Function; configured email or lead-delivery service

Storage: function/provider delivery records; lead store when configured

Retention: Depends on the disclosed form purpose and configured delivery/store process.

Account association: Only when the form is part of an authenticated account flow or the user supplies an account email.

Third-party processors: Netlify; configured email/lead processor

Consent/disclosure: The form states the submission purpose and requires an explicit submit action.

Deletion: Unsubscribe and deletion requests are processed through the applicable email, account, or privacy workflow; immediate completion is not guaranteed.

Export: No automatic user-facing export is promised unless the specific form provides one.

## flow.server-backed-lookup

Feature class: server-lookup

Browser processing: The browser sends the bounded lookup request and renders source, observed timestamp, freshness state, and failure state from the response contract.

Network destinations: named AfroTools data function or endpoint; named upstream source when the service calls one

Storage: browser cache where implemented; service cache/logs where implemented

Retention: Depends on the named endpoint/cache; user-entered sensitive content must not be included unless separately disclosed.

Account association: Normally none; authenticated endpoints must state when account context is used.

Third-party processors: Netlify; the upstream data provider named by the feature

Consent/disclosure: The result surface shows the source, observation timestamp, freshness state, and an unavailable/stale fallback.

Deletion: Ephemeral lookup parameters are not exposed as user-stored records; provider/service logs follow the endpoint policy.

Export: Exports must preserve source and freshness context when the external data affects the result.
