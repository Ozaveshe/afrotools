# WAEC planning-result readiness

`waec_result_ready` records a current numerical planning output on
`/tools/waec-calculator/`. It uses the existing consent-aware
`AfroTools.analytics.track()` path. It does not describe an exam pass, admission,
eligibility, officially checked results, or personally entered grades. Sample
grades and a valid saved worksheet can also produce a ready planning output.

The real engine's `result.complete === true` is the readiness predicate:
Nigeria needs five scored subjects; Ghana needs the selected three core subjects
and three electives. Credit and official-requirement checks may fail while a
planning output is still ready. Those failures must not suppress this event.

The payload contains only `tool_id: waec-calculator`, `system`,
`planning_only: true`, and `counted_subject_count` (five or six). Subject names,
grades, scores, aggregate values, check details, and the private deduplication
signature are never sent in this event.

A page-local signature compares only the derived planning output: system,
effective Ghana pathway, aggregate, counted-subject count, credit count, and
ordered check booleans. It is never persisted or sent. Repeated renders,
unrelated name edits, and UI navigation do not count the same output again.
A changed current output can count again, including A to B to A. Any incomplete
result clears the marker, so clearing or invalidating a worksheet and then
restoring a valid output starts a new readiness interval.

The marker is consumed only when the shared helper returns `true`. Missing
helpers or denied consent do not consume it, and there is no direct `gtag` or
`dataLayer` fallback. Accepting consent or a storage notification alone never
emits readiness retrospectively. The next genuine calculator interaction/render
may measure the then-current output. Withdrawal and reacceptance do not recount
an already accepted unchanged output.

A helper return of `true` means accepted for sending or queueing, not confirmed
GA4 delivery. If consent withdrawal discards a queued event, this page-local
at-most-once marker does not promise retransmission.

The existing `calculation_completed` event is retained unchanged. It remains
recalculation/render telemetry with an explicit `complete` boolean, including
empty and incomplete renders. Its direct transport and cohort differ from the
new accepted-consent event. Do not merge the names, compare their raw counts as
equivalent, infer a universal conversion rate, or use all visitors as the
denominator for this consented cohort. No GA4 key event or property setting is
changed by this source addition.
