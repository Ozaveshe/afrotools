-- Adds a structured detail payload for scholarship detail views.
-- The payload is source-backed: it is derived from existing verified fields,
-- raw snapshots, and official/source URLs, not invented application claims.

alter table public.scholarships
  add column if not exists details jsonb not null default '{}'::jsonb;

comment on column public.scholarships.details is
  'Structured scholarship detail payload for public detail views: overview, key facts, application guidance, source verification, and audit notes.';

create index if not exists idx_scholarships_details_gin
  on public.scholarships using gin (details);

update public.scholarships
set details = jsonb_strip_nulls(jsonb_build_object(
  'version', 1,
  'generated_at', now(),
  'overview', coalesce(
    nullif(summary, ''),
    nullif(raw_snapshot->>'description', ''),
    nullif(raw_snapshot->>'summary', ''),
    'Open the official provider page to confirm this scholarship cycle, eligibility, funding coverage, and application steps.'
  ),
  'key_facts', jsonb_build_object(
    'provider', provider,
    'study_levels', coalesce(study_levels, '{}'::text[]),
    'eligible_countries', coalesce(nullif(eligible_countries, '{}'::text[]), eligible_origins, '{}'::text[]),
    'destination_countries', coalesce(destination_countries, '{}'::text[]),
    'fields', coalesce(fields, '{}'::text[]),
    'funding_type', funding_type,
    'award_value_amount', coalesce(award_value_amount, award_value_max, award_value_min),
    'award_value_currency', award_value_currency,
    'award_value_usd', award_value_usd,
    'local_value_amount', local_value_amount,
    'local_value_currency', local_value_currency,
    'award_value_text', award_value_text,
    'award_components', award_components,
    'deadline_date', deadline_date,
    'deadline_text', deadline_text,
    'deadline_status', deadline_status,
    'status', status
  ),
  'sections', jsonb_build_array(
    jsonb_build_object(
      'heading', 'What this scholarship covers',
      'items', to_jsonb(array_remove(array[
        case
          when funding_type ilike '%full%' then 'Funding type: fully funded or full-cost support according to the stored provider/source record.'
          when funding_type ilike '%partial%' then 'Funding type: partial funding or tuition contribution according to the stored provider/source record.'
          when funding_type ilike '%var%' then 'Funding type: amount or coverage varies by programme, country, or provider cycle.'
          when funding_type is not null then 'Funding type: ' || funding_type || '.'
          else null
        end,
        case
          when award_value_text is not null and award_value_text <> '' then 'Source value note: ' || award_value_text
          when coalesce(award_value_amount, award_value_max, award_value_min) is not null and award_value_currency is not null
            then 'Listed award value: ' || award_value_currency || ' ' || coalesce(award_value_amount, award_value_max, award_value_min)::text || '.'
          else null
        end,
        case
          when jsonb_array_length(coalesce(award_components, '[]'::jsonb)) > 0
            then 'The stored source record includes component-level award details.'
          else null
        end
      ], null))
    ),
    jsonb_build_object(
      'heading', 'Eligibility snapshot',
      'items', to_jsonb(array_remove(array[
        case when array_length(coalesce(nullif(eligible_countries, '{}'::text[]), eligible_origins, '{}'::text[]), 1) > 0
          then 'Eligible countries/origins: ' || array_to_string(coalesce(nullif(eligible_countries, '{}'::text[]), eligible_origins, '{}'::text[]), ', ') || '.'
          else null
        end,
        case when array_length(coalesce(study_levels, '{}'::text[]), 1) > 0
          then 'Study level: ' || array_to_string(study_levels, ', ') || '.'
          else null
        end,
        case when array_length(coalesce(fields, '{}'::text[]), 1) > 0
          then 'Field area: ' || array_to_string(fields, ', ') || '.'
          else null
        end,
        case when min_gpa is not null then 'Minimum GPA signal in AfroTools profile matching: ' || min_gpa::text || ' on a 4.0-style scale.' else null end,
        case when min_ielts is not null then 'English-test signal in AfroTools profile matching: IELTS ' || min_ielts::text || ' or equivalent where the provider requires it.' else null end
      ], null))
    ),
    jsonb_build_object(
      'heading', 'Deadline and cycle',
      'items', to_jsonb(array_remove(array[
        case when deadline_date is not null then 'Published deadline: ' || deadline_date::text || '.' else null end,
        case when deadline_status in ('rolling', 'varies') then 'Deadline status: ' || deadline_status || '. Confirm the exact programme, country, or intake window on the official provider page.' else null end,
        case when deadline_text is not null and deadline_text <> '' then deadline_text else null end,
        case when raw_snapshot->>'deadline_notes' is not null then raw_snapshot->>'deadline_notes' else null end
      ], null))
    ),
    jsonb_build_object(
      'heading', 'Application checklist',
      'items', to_jsonb(array[
        'Open the official provider page and confirm the current cycle before starting.',
        'Check your country, study level, programme, field, GPA, language-test, and funding eligibility.',
        'Prepare transcripts, certificates, passport or national ID details, CV or resume, references, and personal statement or research proposal where requested.',
        'Submit only through the official provider, university, foundation, embassy, government, or approved application portal.'
      ])
    ),
    jsonb_build_object(
      'heading', 'Source verification',
      'items', to_jsonb(array_remove(array[
        case when official_url is not null and official_url <> '' then 'Official page: ' || official_url else null end,
        case when source_url is not null and source_url <> '' and source_url <> official_url then 'Source page: ' || source_url else null end,
        case when source_type is not null then 'Source type: ' || source_type || '.' else null end,
        case when source_confidence is not null then 'Source confidence: ' || source_confidence::text || '/100.' else null end,
        case when coalesce(verified_at, last_checked_at, last_verified_at) is not null
          then 'Last checked: ' || coalesce(verified_at, last_checked_at, last_verified_at)::date::text || '.'
          else null
        end
      ], null))
    )
  ),
  'source', jsonb_build_object(
    'official_url', official_url,
    'source_url', source_url,
    'source_type', source_type,
    'source_confidence', source_confidence,
    'freshness_score', freshness_score,
    'last_checked_at', coalesce(last_checked_at, verified_at, last_verified_at),
    'proof_level', proof_level
  ),
  'audit', jsonb_build_object(
    'detail_quality', 'structured_from_verified_fields',
    'review_status', review_status,
    'last_source_id', last_source_id,
    'note', 'Details are generated from the verified scholarship row and source snapshot. Students should always confirm the current cycle on the official provider page.'
  )
))
where coalesce(details, '{}'::jsonb) = '{}'::jsonb;
