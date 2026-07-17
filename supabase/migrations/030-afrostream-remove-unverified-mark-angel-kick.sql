-- Remove unverified synthetic Kick link from Mark Angel Comedy.

update public.as_creators
set
  kick_url = null,
  updated_at = now()
where slug = 'mark-angel-comedy'
  and kick_url = 'https://kick.com/markangel';
