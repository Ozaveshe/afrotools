# AfroKitchen public recipe boundary

This is a corrective source stack within package nine, continuing the accepted
private submission child `26472a0b`. The accepted unit count remains 11. The
source composition records separately verified database policy history; it does
not apply or replay SQL, establish private-content exposure, integrate source or
deploy the application.

## Applied policy history

Public parents require `is_published IS TRUE AND is_verified IS TRUE`.
Ingredient, step and media reads require an explicit matching eligible parent.
`20261016132034_afrokitchen_publication_read_boundary.sql` records the actual
applied version `20261016132034`. Its SQL blob is unchanged from the old source
filename `20261016120000_afrokitchen_publication_read_boundary.sql`; the earlier
filename is removed rather than retained as a second migration. Only the
positive SQL test include and this documentation reference follow that rename.
The actual live transport added transaction-local 5s lock and 15s statement
bounds; the retained source body itself is unchanged.

That one-shot migration changes only four exact PUBLIC SELECT predicates from
the captured eight-policy prestate. It checks policy metadata, column types,
owner and RLS settings, retaining the four service ALL policies, grants, roles,
writes and rows. Replay after the old state changes fails closed. Root's
`r24-publication-policy-live-root-verified-receipt.json` records the configured
AfroTools project, applied history, exact four predicates and unchanged metadata
outside those predicates. Root accepted eleven local synthetic SQL cases before
that separate live operation. Actual anon/authenticated aggregate checks saw no
ineligible parent or child without an eligible parent; service bypass retained
its broader access. These are qualified database observations, not deployed
endpoint or static/CDN withdrawal proof.

`20261016144319_afrokitchen_review_publication_read_boundary.sql` records the
separately applied review-policy version `20261016144319`. It copies the exact
frozen BODY SHA256 `3c92d1636bf3b529d55a4ba10ab5b211294ec0a6091053a79a8a62e669beb63a`.
Its historical prepared-BODY/no-timestamp comments are retained for byte identity;
the filename and Root receipt establish the actual applied history. This changes
only `Public read reviews` USING to require a matching same-ID parent with both
eligibility flags true. The four earlier publication predicates, service and
submission policies, RLS flags, owner, roles, grants, columns and constraints
remain unchanged by this review migration. It has 5s lock and 15s statement
bounds, exact metadata preconditions and postconditions, and refuses replay.

Root's `r24-review-policy-17-local-sql-root-cumulative-acceptance.json` records
seventeen accepted local synthetic groups: the positive case, metadata drift,
replay, rollback after ALTER, statement timeout and lock timeout. Its retained
first-run evidence-cap failure was followed only by the two remaining groups;
it is a cumulative acceptance rather than a rewritten all-pass first run.
`r24-review-policy-live-root-verified-receipt.json` records actual configured-MCP
application and postchecks with only the one review predicate changed. Actual
review count was zero; no private review/submission content was read, and this
empty aggregate is not evidence about the contents of future review records.

`20261016145457_afrokitchen_ordinary_truncate_acl.sql` records the separately
applied ACL version `20261016145457`, copying exact frozen BODY SHA256
`0f6172be41151b68de39d40d979c29aa7df8c453584a961d05085f42e7ac33ad`.
Root's `r24-acl-11-local-sql-root-acceptance.json` accepts eleven actual local
synthetic groups, with earlier test failures retained. The subsequent
`r24-acl-live-root-verified-receipt.json` records configured-MCP application:
192 ACL entries became 180, removing only twelve TRUNCATE grants for anon and
authenticated across the six kitchen tables. Effective ordinary-role TRUNCATE
privilege was false for all six tables, including inherited privilege checks;
service privilege remained true. Other ACL, policy, role and column metadata
and actual role aggregate read counts were unchanged. No live TRUNCATE,
private-content read, recipe content, flag or media mutation was used as proof.
The ACL BODY's historical preparation comments are also preserved unchanged.

All three migrations are already applied in the recorded project. Do not replay them
against the current project, edit their guards to force a pass, or add the old
filename as another history entry. Future live changes require fresh configured
MCP project identity, exact metadata and a separate Root GO. SQL cannot establish
the project URL independently. Do not replay the obsolete bootstrap schema: it
lacks the live publication column. This source step executes no SQL or tests.

## Service-backed public callers

Costs and community functions check the parent before child or review reads,
BLOB listing, review insertion, image upload or BLOB metadata writes. The shared
lookup is fixed to the AfroTools project, checks the exact UUID and both flags,
and gives headers plus JSON decoding one eight-second deadline. It does not cache
approvals across requests or retry POSTs.

Local invalid input retains 400; confirmed absence or ineligibility gives generic
404; failed or malformed parent approval gives 503. Eligible empty results retain
their existing 200 response shape. Upstream messages, bodies and key-bearing URLs
are not returned or logged. Existing sanitization, country filters and WebP
upload limits remain. Wrong-project configuration fails before credentials leave.

The 503 contract covers the parent-approval dependency. It does not change every
downstream storage contract: the existing community BLOB-list error fallback
still returns an empty list with a generic log. This is not proof of storage
freshness. A parent check and subsequent service/BLOB access are separate
operations; concurrent withdrawal can race. No atomic revocation claim is made.
Service bypass still requires these application guards. Their private source has
not been established as deployed by the policy receipts.

The accepted submission child adds a separate fixed private pending ingestion
action before existing-parent dispatch. It opens no public submission policy.
Explicit send/photo consent, strict server validation, persistence-only
acknowledgement and draft recovery are documented in `AFROKITCHEN-SUBMISSION.md`.
The recorded 94 Node and 16 localhost browser cases use synthetic dependencies
or mocked function responses. Actual deployed function/provider persistence,
full build/security/dist checks, source integration and deployment remain pending.
This history composition leaves all eight submission-child paths unchanged.

## Retained test sources and evidence limits

`tests/afrokitchen-publication-boundary.test.js` exercises actual function and
helper source with transport, SDK, BLOB, timer and environment dependencies
mocked; the submission child extends only its dependency loader. The controls
cover parent absence, dependency errors, malformed approval, header/body deadline,
downstream suppression, genuine empty success, positive cost/review/upload
contracts, validation, sanitized errors and no automatic retry.

`tests/sql/afrokitchen-publication-fixture.sql` and the positive boundary test
remain local synthetic sources. Only the migration include follows the history
rename. Their original prepared-only header is not an updated execution receipt.
The fixture refuses a database outside its dedicated local name prefix and never
drops an existing table. Its minimal synthetic schema and test permissions are
not an actual-content copy or proof of every live schema detail. Root's separate
accepted local receipts, rather than these source comments, record prior runtime
results. This composition adds no string-mirroring tests and runs no SQL/parser,
cluster, browser, application runtime or full build.

## Remaining boundaries

Recipe author and submission text do not establish authenticated ownership. No
author, admin, JWT metadata or email-based bypass is introduced. Trusted service
import/review operations remain separate from ordinary public reads. Submission
RLS remains service-only; no public INSERT/SELECT reopening or view-increment
RPC is introduced here.

[PostgreSQL 17 row-security documentation](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)
explains that RLS does not govern TRUNCATE. The SELECT-policy migrations preserve
the captured table grants; the later ACL migration removes only the twelve
ordinary-role TRUNCATE grants. Row-level write denial is not proof that every SQL
privilege is denied. Service TRUNCATE access and all other reviewed grants remain;
no contributor ownership, global authorization audit or deployed endpoint proof
follows from this narrow ACL change. This source composition copies the applied
history and does not execute any of those migrations.

Static HTML, JSON, CDN caches and public assets need a publisher withdrawal
process; table policy cannot revoke old public bytes. Publication flags also do
not certify culinary safety or establish consent for every stored media field.
The typed API/engine/generator and Oleleh changes remain separately owned source;
this policy-history composition changes none of those files.

## Pending beverage methods in the later source composition

The exact Kunu Zaki (`8a2bb743-87d9-462e-bc09-335e78f9584a`,
`kunu-zaki-ng`) and Ikivuguto (`f2850789-0ffd-41b3-bbaf-e3229132c9e6`,
`ikivuguto-rw`) records have `method_review_status: pending-source-method`.
This is a preparation-method hold, separate from their existing publication
flags. It neither publishes a recipe nor withdraws a user's saved dish or plan.
Known IDs/slugs also hold older cached records lacking the status marker; a
known ID paired with the wrong slug is an error.

The 2026-10-18 primary-source check used
[9jafoodie's attributed Kunun Zaki variation](https://9jafoodie.com/how-to-make-nigerian-kunun-zaki/)
and [Inyange's milk-product information](https://inyangeindustries.com/media).
The former contradicts a generic forty-minute preparation/fermentation claim;
the latter establishes dairy identity. Neither supplies an adopted, reviewed
household method, yield, total duration or nutrition here. Remove only the
unsupported Ikivuguto dairy-free tag; do not infer lactose-free or safety claims.
The saved AI illustrations establish appearance only.

Informational public list/detail responses retain sanitized objects. Detail
stops before old ingredient, step, review or media queries. For these exact IDs,
costs and community requests first retain their existing validation and public
parent eligibility checks, then return HTTP 409 with
`{error:"Recipe method review pending",code:"METHOD_REVIEW_PENDING"}`.
Missing/ineligible parents retain 404 and unavailable dependencies retain 503.
The 409 path performs no ingredient/review/blob read or write. Recipe submission
consent, private pending persistence and account/authorization contracts remain
unchanged.

The engine, dynamic and cached-static clients, planner, static owner and schema
auditors hold method use: no cooking, scaling, timers, cost, community, AI method
context, method TXT/print export, Recipe/HowTo markup or fabricated nutrition.
Informational static pages are noindex and retain canonical identity, an
illustration disclosure and local saving. Existing saved/locked plans remain
saved and visibly blocked rather than being deleted or assigned invented yield.
These two records remain pending source-method work, not completed recipes.

`--refresh-cookbook` applies the same maintained curated projection as normal
generation and persists that manifest/index before rendering. It requires
explicit publication flags. A dated saved eligibility snapshot is local fixture
evidence only; refresh does not certify current database flags or endpoint
behavior. No migration is run by this source work. Provider persistence,
controlled pending-submission proof and production withdrawal/cache behavior
remain separate verification obligations.
