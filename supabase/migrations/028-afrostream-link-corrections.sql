-- AfroStream creator link corrections
-- Keep profile links conservative: remove streaming links that point to a different person
-- and replace only when an external source confirms the creator identity.

update public.as_creators
set
  kick_url = null,
  updated_at = now()
where slug = 'noor-stars'
  and kick_url = 'https://kick.com/noorgamer';

update public.as_creators
set
  kick_url = 'https://kick.com/zain_zex',
  updated_at = now()
where slug = 'zain-asaad'
  and (kick_url is null or kick_url <> 'https://kick.com/zain_zex');
