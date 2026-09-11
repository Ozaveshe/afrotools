-- AfroTools project: zpclagtgczsygrgztlts.
-- Preserve existing anonymous/authenticated submissions as unverified telemetry.
-- Only trusted backend writes may claim the reserved review_validation marker.
-- This adds no columns and does not rewrite or remove existing attempts.
create policy "JAMB client attempts cannot claim review validation"
on public.jamb_attempts
as restrictive
for insert
to anon, authenticated
with check (not (coalesce(metadata, '{}'::jsonb) ? 'review_validation'));
