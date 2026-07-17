# Prompt 15: Referral Program

## Context

Read these files first:
- `assets/js/afro-auth.js` (user management)
- `supabase/migrations/006-extend-profiles.sql` (profile schema)
- `pricing/index.html` (subscription tiers)
- `netlify/functions/create-subscription.js` (subscription creation)
- `dashboard/index.html` (user dashboard)

Users share calculation results but get nothing for bringing others to the platform. A referral program creates viral growth: "Refer a colleague, get 1 month pro free."

## Objective

Build a referral system where existing users earn pro credits by inviting others who sign up.

### Referral Mechanics

- Each user gets a unique referral code: `afro_[first6chars_of_userid]`
- Referral link: `https://afrotools.com/?ref=afro_abc123`
- When a new user signs up via referral link:
  - Referrer gets 7 days of pro access added to their account
  - Referee gets 7 days of pro access as welcome bonus
  - Both get email notification
- Cap: max 12 referrals per user per year (84 days free = ~3 months free max)
- Referral dashboard: track who you've referred, your earned credits, share link

### Database Changes

```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN referral_credits_days INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN referral_count INTEGER DEFAULT 0;

-- Referral log
CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id),
  referee_id UUID REFERENCES auth.users(id),
  referee_email TEXT,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'completed' | 'expired'
  credit_days INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Constraints

- Referral code generated on first login/signup, stored in profile
- `?ref=` param captured on any page via client-side JS, stored in `localStorage` with 30-day expiry
- Referral credit applied during signup flow (server-side in `auth.js`)
- Self-referral prevention: referee email !== referrer email
- Duplicate prevention: same referee can only credit one referrer
- RLS: users can only read their own referrals
- Follow design system for referral dashboard UI
- Share referral link via: copy link, WhatsApp, Twitter, email
- Email notifications via Resend API
- Pro credits are additive: if user has 10 days remaining + 7 referral credit = 17 days

## Implementation Steps

1. Create migration: `supabase/migrations/0XX-referrals.sql`
2. Update `netlify/functions/auth.js` signup flow:
   - Generate referral code on signup
   - Check for `referred_by` in request body
   - If valid referral: credit both users, create referral log entry
   - Send notification emails to both
3. Create `assets/js/lib/referral-capture.js`:
   - On any page load, check URL for `?ref=` param
   - Store in `localStorage` key `afro_referral` with 30-day TTL
   - Clean `?ref=` from URL via `history.replaceState`
   - On signup, include stored referral code in signup request
4. Create `netlify/functions/api-referrals.js`:
   - GET: Return user's referral stats (code, count, credits, referral list)
   - POST: Generate referral code if not exists
5. Add referral section to `/dashboard/index.html`:
   - "Your Referral Link" with copy button
   - Share buttons (WhatsApp, Twitter, Email)
   - Stats: X referrals, Y days earned, Z days remaining
   - List of referrals with status
6. Add referral CTA to share result flow:
   - After sharing a calculation result, show: "Know someone who could use this? Share your referral link and earn Pro access!"
7. Add redirect: `/api/referrals /.netlify/functions/api-referrals 200`
8. Run `npm run minify`

## Verification

- Sign up new user → profile should have `referral_code` generated
- Copy referral link → open in incognito → sign up
- Check both accounts: referrer should have +7 days credit, referee should have 7 days pro
- Try self-referral (same email) → should be rejected
- Dashboard should show referral stats and list
- Share referral via WhatsApp → link should work and track properly
- After 12 referrals → cap should prevent further credit accumulation
