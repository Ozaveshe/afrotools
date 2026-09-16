# CV mobile toolbar and consent-aware import

The shared toolbar owner now supplies native French and Swahili labels for the five mobile commands and the More/Export sheet title and accessible name. Command identities and saved CV content are unchanged. French runtime was regenerated with `node scripts/build-french-cv-runtime.js`.

The DOCX import regression starts with empty browser storage, uses the normal explicit Reject control when available or the older close-to-decline control, verifies declined storage and removal of the banner, then performs the real mobile import review/apply flow. It does not force-click or hide consent. The source checkout has the older cookie owner; the combined release must independently verify the newer consent owner.

Validation: six DOCX node contracts passed. Browser proof is recorded in the candidate handoff; it covers 320px EN/FR/SW import, native More labels, local parser loading, review-before-mutation, malformed-file preservation and retry. This is not an audit of every toolbar/menu translation.
