-- Source-backed AfroStream supporter evidence.
-- This records a public aggregate gift total only where the source identifies
-- the creator, amount, donor group, and event.

INSERT INTO public.as_creator_supporters (
  creator_id,
  supporter_name,
  platform,
  amount,
  currency,
  source_label,
  source_url,
  event_date,
  is_verified,
  is_published
)
SELECT
  c.id,
  'Friends and fans birthday fundraiser',
  'Instagram',
  200000000,
  'NGN',
  'Channels Television, N250m Donation: Davido Gives All To Orphanage Homes',
  'https://www.channelstv.com/2021/11/20/n250m-donation-davido-gives-all-to-orphanage-homes/',
  DATE '2021-11-20',
  true,
  true
FROM public.as_creators c
WHERE c.slug = 'davido'
  AND NOT EXISTS (
    SELECT 1
    FROM public.as_creator_supporters s
    WHERE s.creator_id = c.id
      AND s.source_url = 'https://www.channelstv.com/2021/11/20/n250m-donation-davido-gives-all-to-orphanage-homes/'
      AND s.amount = 200000000
      AND s.currency = 'NGN'
      AND s.event_date = DATE '2021-11-20'
  );
