# Election newsroom workflow

The Africa Election Tracker has two separate inputs: the reviewed election ledger
and a public election newsroom. The ledger is the source of tracked dates, status,
candidate evidence and official links. The newsroom publishes short, neutral
updates only after a dated electoral-authority source supports each claim.

## Publishing boundary

1. Check the electoral commission or other competent authority first. Record the
   source URL, publication date, affected ledger record and the exact administrative
   change. Do not infer a result, winner, turnout or final candidate roster from a
   scheduled date or a media headline.
2. Add an approved structured newsroom item with concise, factual copy. Keep
   reviewed translations separate from the English item. An absent translation is
   not a cue to auto-translate or publish a thin locale page.
3. Generate the static article pages and the election newsroom RSS feed from the
   approved items. The generator runs in the site build and must be idempotent;
   it never converts a watched external RSS entry directly into an article.
4. Validate the dataset, generated pages, feed, links and route metadata before
   handing a branch to the publisher. A build or local HTTP response is not
   evidence that production has deployed the new article.

Run `npm run elections:news:build` after editing approved items and
`npm run elections:news:check` to prove the committed pages and RSS still match
the source model. Also run `npm run elections:validate`,
`npm run elections:feeds:check` and `npm run check-links` when adding links or
routes. The site build invokes the newsroom generator before route and sitemap
generation, so publishing a reviewed item does not require hand-editing XML.

Configured third-party feeds are discovery and context only. Their failure or
staleness must remain visible in monitoring, not be covered with fabricated copy.
If the official source cannot be verified, leave the article unpublished and put
the item in manual review. Do not publish polling, odds, endorsements, ideology
scores, predictions, partisan framing or unsourced allegations.

## Reader experience

The English tracker is the canonical calendar. The newsroom is a crawlable
collection of source-linked articles with its own RSS feed. Hausa and Yoruba
edition fronts may explain the calendar in their own languages, but are not
automatically equivalent to every English article or feature. Add reciprocal
hreflang only for genuinely equivalent reviewed pages.
