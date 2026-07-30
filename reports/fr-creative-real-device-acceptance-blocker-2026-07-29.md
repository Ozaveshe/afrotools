# French Creative Economy physical-device release carry

Foundation: `8ce5cac175e42201968b1f7540752d6acf92d4ca`

## Automated routes accepted

- `creator-clip`
- `creator-record`
- `creator-voice`

## Accepted automated boundary

The coordinator authorized Chromium virtual camera/microphone fixtures plus
reopened WebM/audio codec proof as the automated gate. All three routes passed
that gate in English and French. The shared English controllers were extracted
without changing their frozen workspace structure, and the French workspaces
reuse those controllers.

No physical camera or microphone was activated. Tests used synthetic media,
proved permission handling and real UI state mutation, downloaded the resulting
files, and reopened their codec/container signatures.

## Manual release carry

Before a high-confidence production release, a user may still perform one
supervised physical-device smoke per media type using a deliberately
non-sensitive scene. This is a manual release carry, not an automated
acceptance blocker. The result should be discarded immediately after reopening.
