-- CareBridge Supabase schema (PostgreSQL)
-- Run once in a NEW Supabase project: SQL Editor > New query > Run.
-- Separate Auth users for seniors and family members; no public health data.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.care_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  elder_name text not null default 'My Profile' check (char_length(elder_name) between 1 and 35),
  family_name text not null default 'Family' check (char_length(family_name) between 1 and 35),
  checkin_hour smallint not null default 20 check (checkin_hour between 7 and 22),
  created_at timestamptz not null default now()
);

create table if not exists public.caregiver_links (
  elder_id uuid not null references public.care_profiles(user_id) on delete cascade,
  caregiver_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (elder_id,caregiver_id),
  check (elder_id <> caregiver_id)
);
create index if not exists caregiver_links_caregiver_id_idx on public.caregiver_links(caregiver_id);

create table if not exists public.check_ins (
  elder_id uuid not null references public.care_profiles(user_id) on delete cascade,
  day date not null,
  status text not null check (status in ('okay','help')),
  checked_at timestamptz not null default now(),
  mood text check (mood is null or mood in ('great','okay','low')),
  reason text check (reason is null or char_length(reason) <= 140),
  primary key(elder_id,day)
);
create index if not exists check_ins_latest_idx on public.check_ins(elder_id,day desc);

create table if not exists public.daily_notes (
  elder_id uuid not null references public.care_profiles(user_id) on delete cascade,
  day date not null,
  note text not null default '' check (char_length(note) <= 280),
  updated_at timestamptz not null default now(),
  primary key(elder_id,day)
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references public.care_profiles(user_id) on delete cascade,
  title text not null check (char_length(title) between 1 and 55),
  subtitle text not null default 'Your personal reminder',
  icon text not null default '🔔',
  done_dates date[] not null default '{}'::date[],
  created_at timestamptz not null default now()
);
create index if not exists reminders_elder_id_idx on public.reminders(elder_id);

create table if not exists public.followups (
  elder_id uuid not null,
  day date not null,
  caregiver_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (elder_id,day),
  foreign key(elder_id,day) references public.check_ins(elder_id,day) on delete cascade
);

-- A one-time, 20-minute invitation code. This table has NO direct client grants.
create table if not exists public.pairing_codes (
  code text primary key,
  elder_id uuid not null references public.care_profiles(user_id) on delete cascade,
  expires_at timestamptz not null
);
create index if not exists pairing_codes_elder_idx on public.pairing_codes(elder_id);

-- Enable RLS on every exposed table.
alter table public.care_profiles enable row level security;
alter table public.caregiver_links enable row level security;
alter table public.check_ins enable row level security;
alter table public.daily_notes enable row level security;
alter table public.reminders enable row level security;
alter table public.followups enable row level security;
alter table public.pairing_codes enable row level security;

-- Remove default broad grants: RLS and table grants are both required.
revoke all on table public.care_profiles,public.caregiver_links,public.check_ins,public.daily_notes,
  public.reminders,public.followups,public.pairing_codes from anon,authenticated;
grant select,insert,update on public.care_profiles to authenticated;
grant select,delete on public.caregiver_links to authenticated;
grant select,insert,update on public.check_ins to authenticated;
grant select,insert,update on public.daily_notes to authenticated;
grant select,insert,update,delete on public.reminders to authenticated;
grant select,insert,delete on public.followups to authenticated;

-- caregiver_links policies intentionally do NOT query care_profiles (avoids policy recursion).
create policy "links read only by participants" on public.caregiver_links
  for select to authenticated
  using (elder_id=(select auth.uid()) or caregiver_id=(select auth.uid()));
create policy "links participants can leave" on public.caregiver_links
  for delete to authenticated
  using (elder_id=(select auth.uid()) or caregiver_id=(select auth.uid()));

create policy "care profiles visible to elder and linked caregivers" on public.care_profiles
  for select to authenticated using (
    user_id=(select auth.uid()) or exists (
      select 1 from public.caregiver_links l where l.elder_id=care_profiles.user_id and l.caregiver_id=(select auth.uid())
    )
  );
create policy "elder creates own profile" on public.care_profiles
  for insert to authenticated with check (user_id=(select auth.uid()));
create policy "elder edits own profile" on public.care_profiles
  for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

create policy "check-ins visible to elder and linked caregivers" on public.check_ins
  for select to authenticated using (
    elder_id=(select auth.uid()) or exists(
      select 1 from public.caregiver_links l where l.elder_id=check_ins.elder_id and l.caregiver_id=(select auth.uid())
    )
  );
create policy "elder adds check-ins" on public.check_ins
  for insert to authenticated with check(elder_id=(select auth.uid()));
create policy "elder edits check-ins" on public.check_ins
  for update to authenticated using(elder_id=(select auth.uid())) with check(elder_id=(select auth.uid()));

create policy "notes visible to elder and linked caregivers" on public.daily_notes
  for select to authenticated using (
    elder_id=(select auth.uid()) or exists(
      select 1 from public.caregiver_links l where l.elder_id=daily_notes.elder_id and l.caregiver_id=(select auth.uid())
    )
  );
create policy "elder adds notes" on public.daily_notes
  for insert to authenticated with check(elder_id=(select auth.uid()));
create policy "elder edits notes" on public.daily_notes
  for update to authenticated using(elder_id=(select auth.uid())) with check(elder_id=(select auth.uid()));

create policy "reminders visible to elder and linked caregivers" on public.reminders
  for select to authenticated using (
    elder_id=(select auth.uid()) or exists(
      select 1 from public.caregiver_links l where l.elder_id=reminders.elder_id and l.caregiver_id=(select auth.uid())
    )
  );
create policy "elder creates reminders" on public.reminders
  for insert to authenticated with check(elder_id=(select auth.uid()));
create policy "elder updates reminders" on public.reminders
  for update to authenticated using(elder_id=(select auth.uid())) with check(elder_id=(select auth.uid()));
create policy "elder deletes reminders" on public.reminders
  for delete to authenticated using(elder_id=(select auth.uid()));

create policy "followups visible to elder and linked caregivers" on public.followups
  for select to authenticated using (
    elder_id=(select auth.uid()) or exists(
      select 1 from public.caregiver_links l where l.elder_id=followups.elder_id and l.caregiver_id=(select auth.uid())
    )
  );
create policy "caregiver records response only to actual help request" on public.followups
  for insert to authenticated with check (
    caregiver_id=(select auth.uid()) and exists(
      select 1 from public.caregiver_links l where l.elder_id=followups.elder_id and l.caregiver_id=(select auth.uid())
    ) and exists(
      select 1 from public.check_ins c where c.elder_id=followups.elder_id and c.day=followups.day and c.status='help'
    )
  );
create policy "caregiver clears own response or elder clears" on public.followups
  for delete to authenticated using (caregiver_id=(select auth.uid()) or elder_id=(select auth.uid()));

-- Private pairing_codes table: NO SELECT, INSERT, UPDATE or DELETE policies or grants.
-- SECURITY DEFINER functions enforce ownership/authentication and one-use expiration.
create or replace function public.create_pairing_code()
returns text language plpgsql security definer set search_path = '' as $$
declare secret text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.care_profiles where user_id=auth.uid()
  ) then raise exception 'Only an older adult with a profile can invite caregivers'; end if;
  delete from public.pairing_codes where elder_id=auth.uid();
  secret:=upper(encode(extensions.gen_random_bytes(12),'hex'));
  insert into public.pairing_codes(code,elder_id,expires_at)
  values(secret,auth.uid(),now()+interval '20 minutes');
  return secret;
end $$;

create or replace function public.redeem_pairing_code(invite_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare matched_elder uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  -- DELETE ... RETURNING consumes each code atomically (prevents reuse).
  delete from public.pairing_codes
  where code=upper(trim(invite_code)) and expires_at>now()
  returning elder_id into matched_elder;
  if matched_elder is null then raise exception 'Invalid, expired or already-used invitation'; end if;
  if matched_elder=auth.uid() then raise exception 'Use a different account for a caregiver'; end if;
  insert into public.caregiver_links(elder_id,caregiver_id) values(matched_elder,auth.uid())
  on conflict do nothing;
  return matched_elder;
end $$;

revoke all on function public.create_pairing_code() from public, anon;
revoke all on function public.redeem_pairing_code(text) from public, anon;
grant execute on function public.create_pairing_code() to authenticated;
grant execute on function public.redeem_pairing_code(text) to authenticated;

-- Note: This project does NOT automatically email/text family members or dispatch emergency services.
-- Production rollout should add RLS unit tests, rate limits, abuse monitoring, audit/retention policies,
-- accessible account recovery and server-side reminder/notification jobs.