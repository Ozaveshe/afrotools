-- AfroStream profile link audit corrections
-- Verified on 2026-05-01 from public creator sources and platform statistics pages.
-- Keep slugs conservative except where the row represented the wrong creator.

update public.as_creators
set
  instagram_url = 'https://instagram.com/angeliquekidjo',
  updated_at = now()
where slug = 'angelique-kidjo'
  and instagram_url = 'https://instagram.com/angelikidjoo';

update public.as_creators
set
  youtube_url = 'https://youtube.com/@BurnaBoy',
  tiktok_url = 'https://tiktok.com/@burnaboyofficial',
  twitter_url = 'https://x.com/burnaboy',
  updated_at = now()
where slug = 'burna-boy';

update public.as_creators
set
  instagram_url = 'https://instagram.com/halasamirofficial',
  updated_at = now()
where slug = 'dr-hala-samir'
  and instagram_url = 'https://instagram.com/drhalnasmir';

update public.as_creators
set
  name = 'Alex Mathenge',
  slug = 'alex-mathenge',
  bio = 'Kenyan comedian and actor known for Makarao TV and traffic-cop comedy characters.',
  youtube_url = 'https://youtube.com/@AlexMathenge',
  tiktok_url = null,
  updated_at = now()
where slug = 'eddy-kenzo-ke'
  and youtube_url = 'https://youtube.com/@AlexMathenge';

update public.as_creators
set
  twitter_url = 'https://x.com/fallyipupa01',
  updated_at = now()
where slug = 'fally-ipupa'
  and twitter_url = 'https://x.com/falnlyipupaofficiel';

update public.as_creators
set
  youtube_url = 'https://youtube.com/@hamodatrends',
  twitch_url = null,
  kick_url = 'https://kick.com/7amo0da-gaming',
  updated_at = now()
where slug = 'hamoda-gaming';

update public.as_creators
set
  tiktok_url = 'https://tiktok.com/@chiraz.activities',
  instagram_url = 'https://instagram.com/chirazactivities',
  updated_at = now()
where slug = 'chiraz-english';

update public.as_creators
set
  instagram_url = 'https://instagram.com/l7or75',
  updated_at = now()
where slug = 'l7or'
  and instagram_url = 'https://instagram.com/l7r';

update public.as_creators
set
  instagram_url = 'https://instagram.com/mbosso_',
  updated_at = now()
where slug = 'mbosso'
  and instagram_url = 'https://instagram.com/mosso';

update public.as_creators
set
  name = 'Mthandeni Mahlaba',
  slug = 'mthandeni-mahlaba',
  youtube_url = 'https://youtube.com/@MDMSketchComedy',
  instagram_url = 'https://instagram.com/mdmsketchcomedy',
  updated_at = now()
where slug = 'mthandeni-dlamini';

update public.as_creators
set
  instagram_url = 'https://instagram.com/psquareworld',
  updated_at = now()
where slug = 'p-square'
  and instagram_url = 'https://instagram.com/pquareworld';

update public.as_creators
set
  youtube_url = 'https://youtube.com/@realpeller',
  twitch_url = null,
  tiktok_url = 'https://tiktok.com/@realpeller',
  kick_url = 'https://kick.com/Peller',
  updated_at = now()
where slug = 'peller';

update public.as_creators
set
  instagram_url = 'https://instagram.com/mrfunny1_',
  updated_at = now()
where slug = 'sabinus'
  and instagram_url = 'https://instagram.com/sababorin';

update public.as_creators
set
  name = 'Ibn Hattuta Travels',
  slug = 'ibn-hattuta-travels',
  country = 'JO',
  bio = 'Arabic-language travel creator documenting global destinations and culture.',
  youtube_url = 'https://youtube.com/@ibnhattuta',
  instagram_url = 'https://instagram.com/ibnhattuta',
  subscribers = 3500000,
  total_views = 492000000,
  tags = 'travel, arabic, jordanian, vlogging, culture',
  updated_at = now()
where slug = 'sinach'
  and youtube_url = 'https://youtube.com/@ibnhattuta';

update public.as_creators
set
  instagram_url = 'https://instagram.com/spice_diana',
  updated_at = now()
where slug = 'spice-diana'
  and instagram_url = 'https://instagram.com/spaboraug';

update public.as_creators
set
  instagram_url = 'https://instagram.com/titicacantora',
  updated_at = now()
where slug = 'titica'
  and instagram_url = 'https://instagram.com/tiaboratina';

update public.as_creators
set
  tiktok_url = 'https://tiktok.com/@officialzuchu',
  updated_at = now()
where slug = 'zuchu'
  and tiktok_url = 'https://tiktok.com/@zuaborang';

update public.as_creators
set
  twitch_url = null,
  kick_url = 'https://kick.com/zain_zex',
  updated_at = now()
where slug = 'zain-asaad';
