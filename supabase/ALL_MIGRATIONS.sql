-- Open Learning core schema: profiles, Student IDs, courses, videos, import reports.
-- Apply with: supabase db push (or paste in the Supabase SQL editor).

create table public.student_id_counters (
  year int primary key,
  last_value int not null check (last_value > 0)
);
alter table public.student_id_counters enable row level security; -- no policies: only security-definer code touches it

-- Atomic, year-wise Student ID: the ON CONFLICT upsert row-locks the year counter,
-- so concurrent signups can never receive the same number.
create or replace function public.next_student_id() returns text
language plpgsql security definer set search_path = '' as $$
declare
  y int := extract(year from (now() at time zone 'utc'))::int;
  n int;
begin
  insert into public.student_id_counters as c (year, last_value) values (y, 1)
  on conflict (year) do update set last_value = c.last_value + 1
  returning c.last_value into n;
  return format('OL-%s-%s', y, lpad(n::text, 6, '0'));
end $$;
revoke all on function public.next_student_id() from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  student_id text not null unique check (student_id ~ '^OL-[0-9]{4}-[0-9]{6}$'),
  display_name text not null check (char_length(display_name) between 2 and 50),
  email text not null,
  avatar_url text,
  category text check (category in ('school', 'jee', 'neet')),
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
grant execute on function public.is_admin() to authenticated;

-- Create the profile when a Google user first signs in.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  raw_name text;
  final_name text;
begin
  raw_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'ol_display_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(new.email, 'student'), '@', 1));
  final_name := left(regexp_replace(raw_name, '\s+', ' ', 'g'), 50);
  if char_length(final_name) < 2 then final_name := 'Student'; end if;
  insert into public.profiles (id, student_id, display_name, email, avatar_url)
  values (new.id, public.next_student_id(), final_name, coalesce(new.email, ''),
          coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Students may never change id, student_id, email, role or created_at (defence in depth
-- on top of column grants and RLS). Service role / postgres (admin tooling) are exempt.
create or replace function public.guard_profile_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.id is distinct from old.id
       or new.student_id is distinct from old.student_id
       or new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.created_at is distinct from old.created_at then
      raise exception 'student_id, role, email and id cannot be changed' using errcode = '42501';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url, category) on public.profiles to authenticated;

-- Limited, non-sensitive view for friend search / chat names (no email, no role).
create view public.public_profiles as
  select id, student_id, display_name, avatar_url, category, created_at from public.profiles;
grant select on public.public_profiles to authenticated;

create table public.courses (
  slug text primary key,
  name text not null,
  description text not null default '',
  is_available boolean not null default false,
  sort_order int not null default 0
);
alter table public.courses enable row level security;
create policy courses_read on public.courses for select to authenticated using (true);
create policy courses_admin_write on public.courses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
insert into public.courses (slug, name, description, is_available, sort_order) values
  ('school', 'School', 'Classes 6–12 concepts, chapter by chapter.', true, 1),
  ('jee', 'JEE', 'Physics, Chemistry and Maths for engineering entrances.', true, 2),
  ('neet', 'NEET', 'Physics, Chemistry and Biology for medical entrances.', true, 3),
  ('languages', 'Languages', 'Speak, read and write with confidence.', false, 4),
  ('programming-ai', 'Programming & AI', 'Build real projects, from code to machine learning.', false, 5)
on conflict (slug) do nothing;

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  video_id text not null unique check (char_length(video_id) between 1 and 64),
  exam text not null check (exam in ('JEE', 'NEET', 'School')),
  class text,
  subject text not null,
  chapter text not null,
  topic text,
  year int check (year between 1990 and 2100),
  title text not null,
  youtube_url text not null check (youtube_url ~ '^https://(www\.|m\.)?(youtube\.com|youtu\.be)/'),
  thumbnail_url text,
  description text,
  language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index videos_exam_idx on public.videos (exam, subject, chapter);
create index videos_year_idx on public.videos (year);
alter table public.videos enable row level security;
create policy videos_read on public.videos for select to authenticated using (true);
create policy videos_admin_write on public.videos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table public.import_reports (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles (id) on delete set null,
  source text not null check (source in ('xlsx', 'google_sheet')),
  source_ref text,
  total_rows int not null,
  created_count int not null,
  updated_count int not null,
  skipped_count int not null,
  errors jsonb not null default '[]',
  created_at timestamptz not null default now()
);
alter table public.import_reports enable row level security;
create policy import_reports_admin on public.import_reports for select to authenticated
  using (public.is_admin());

-- Explicit grants (do not rely on Supabase default privileges). RLS decides who may write.
revoke all on public.courses, public.videos, public.import_reports, public.student_id_counters from anon, authenticated;
grant select on public.courses, public.videos, public.import_reports to authenticated;
grant insert, update, delete on public.courses, public.videos to authenticated; -- admin-only via RLS
-- Groups (discussion / chat / voice), membership, messages, friends, calls.
-- All writes go through security-definer RPCs; tables expose only SELECT (and leave) to students.

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('discussion', 'chat', 'voice')),
  category text not null check (category in ('school', 'jee', 'neet')),
  name text not null check (char_length(name) between 3 and 60),
  description text not null default '' check (char_length(description) <= 300),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  invite_code text not null unique default replace(gen_random_uuid()::text, '-', ''),
  is_general boolean not null default false,
  slug text unique,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (not is_general or (slug is not null and visibility = 'public' and created_by is null))
);
create index groups_scope_idx on public.groups (category, type);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'owner')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);

create or replace function public.is_group_member(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_members where group_id = gid and user_id = auth.uid());
$$;
create or replace function public.is_group_owner(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_members where group_id = gid and user_id = auth.uid() and role = 'owner');
$$;
grant execute on function public.is_group_member(uuid), public.is_group_owner(uuid) to authenticated;

create table public.messages (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_group_idx on public.messages (group_id, created_at desc);

create or replace function public.messages_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select type from public.groups where id = new.group_id) = 'voice' then
    raise exception 'voice rooms have no text messages';
  end if;
  new.body := btrim(new.body);
  return new;
end $$;
create trigger messages_guard_trg before insert on public.messages
  for each row execute function public.messages_guard();

create table public.voice_participants (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> receiver_id)
);
create unique index friend_requests_pending_pair on public.friend_requests
  (least(sender_id, receiver_id), greatest(sender_id, receiver_id)) where status = 'pending';

create table public.friendships (
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);
create index friendships_b_idx on public.friendships (user_b);

create or replace function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.friendships where user_a = least(a, b) and user_b = greatest(a, b));
$$;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

create table public.friend_calls (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null references public.profiles (id) on delete cascade,
  callee_id uuid not null references public.profiles (id) on delete cascade,
  room text not null unique default ('call-' || replace(gen_random_uuid()::text, '-', '')),
  status text not null default 'ringing' check (status in ('ringing', 'accepted', 'declined', 'ended', 'missed')),
  created_at timestamptz not null default now(),
  check (caller_id <> callee_id)
);

-- ===== RLS =====
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.messages enable row level security;
alter table public.voice_participants enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.friend_calls enable row level security;

revoke all on public.groups, public.group_members, public.messages, public.voice_participants,
  public.friend_requests, public.friendships, public.friend_calls from anon, authenticated;
grant select on public.groups, public.group_members, public.messages, public.voice_participants,
  public.friend_requests, public.friendships, public.friend_calls to authenticated;
grant insert on public.messages to authenticated;
grant delete on public.group_members to authenticated;

create policy groups_select on public.groups for select to authenticated
  using (visibility = 'public' or public.is_group_member(id) or public.is_admin());
create policy groups_admin_delete on public.groups for delete to authenticated using (public.is_admin());
grant delete on public.groups to authenticated;

create policy members_select on public.group_members for select to authenticated
  using (user_id = auth.uid() or public.is_group_member(group_id) or public.is_admin());
create policy members_leave_or_kick on public.group_members for delete to authenticated
  using (user_id = auth.uid() or public.is_group_owner(group_id));

-- Messages: only members can read or write, and only as themselves. No edits/deletes by students.
create policy messages_select on public.messages for select to authenticated
  using (public.is_group_member(group_id) or public.is_admin());
create policy messages_insert on public.messages for insert to authenticated
  with check (user_id = auth.uid() and public.is_group_member(group_id));
create policy messages_admin_delete on public.messages for delete to authenticated using (public.is_admin());
grant delete on public.messages to authenticated;

create policy voice_select on public.voice_participants for select to authenticated
  using (public.is_group_member(group_id));

create policy fr_select on public.friend_requests for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy friendships_select on public.friendships for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());
create policy calls_select on public.friend_calls for select to authenticated
  using (caller_id = auth.uid() or callee_id = auth.uid());

-- ===== RPCs (security definer, validated) =====
create or replace function public.create_group(p_type text, p_category text, p_name text, p_description text, p_visibility text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare gid uuid; owned int;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if p_type not in ('discussion','chat','voice') or p_category not in ('school','jee','neet')
     or p_visibility not in ('public','private') then raise exception 'invalid group settings'; end if;
  p_name := btrim(coalesce(p_name, ''));
  if char_length(p_name) not between 3 and 60 then raise exception 'group name must be 3-60 characters'; end if;
  select count(*) into owned from public.groups where created_by = auth.uid();
  if owned >= 25 then raise exception 'group limit reached'; end if;
  insert into public.groups (type, category, name, description, visibility, created_by)
  values (p_type, p_category, p_name, left(coalesce(p_description, ''), 300), p_visibility, auth.uid())
  returning id into gid;
  insert into public.group_members (group_id, user_id, role) values (gid, auth.uid(), 'owner');
  return gid;
end $$;

create or replace function public.join_group(p_group uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare g public.groups;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into g from public.groups where id = p_group;
  if not found or g.visibility <> 'public' then raise exception 'group not available' using errcode = '42501'; end if;
  insert into public.group_members (group_id, user_id) values (p_group, auth.uid()) on conflict do nothing;
end $$;

create or replace function public.join_group_by_invite(p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare g public.groups;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  select * into g from public.groups where invite_code = p_code;
  if not found then raise exception 'invalid invite' using errcode = 'P0002'; end if;
  insert into public.group_members (group_id, user_id) values (g.id, auth.uid()) on conflict do nothing;
  return g.id;
end $$;

create or replace function public.send_friend_request(p_target uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); rev uuid;
begin
  if me is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if me = p_target then raise exception 'cannot add yourself'; end if;
  if not exists (select 1 from public.profiles where id = p_target) then raise exception 'student not found'; end if;
  if public.are_friends(me, p_target) then raise exception 'already friends'; end if;
  select id into rev from public.friend_requests where sender_id = p_target and receiver_id = me and status = 'pending';
  if rev is not null then
    perform public.respond_friend_request(rev, true);
    return;
  end if;
  insert into public.friend_requests (sender_id, receiver_id) values (me, p_target);
exception when unique_violation then raise exception 'request already pending';
end $$;

create or replace function public.respond_friend_request(p_request uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.friend_requests;
begin
  select * into r from public.friend_requests where id = p_request and receiver_id = auth.uid() and status = 'pending' for update;
  if not found then raise exception 'request not found' using errcode = 'P0002'; end if;
  update public.friend_requests set status = case when p_accept then 'accepted' else 'rejected' end, responded_at = now() where id = r.id;
  if p_accept then
    insert into public.friendships (user_a, user_b) values (least(r.sender_id, r.receiver_id), greatest(r.sender_id, r.receiver_id)) on conflict do nothing;
  end if;
end $$;

create or replace function public.remove_friend(p_other uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.friendships where user_a = least(auth.uid(), p_other) and user_b = greatest(auth.uid(), p_other);
$$;

-- Voice presence (LiveKit is the audio source of truth; this powers lists and counts).
create or replace function public.voice_join(p_group uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_group_member(p_group) then raise exception 'not a member' using errcode = '42501'; end if;
  insert into public.voice_participants (group_id, user_id) values (p_group, auth.uid())
  on conflict (group_id, user_id) do update set last_seen = now();
end $$;
create or replace function public.voice_leave(p_group uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.voice_participants where group_id = p_group and user_id = auth.uid();
$$;

create or replace function public.start_friend_call(p_callee uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare cid uuid;
begin
  if not public.are_friends(auth.uid(), p_callee) then raise exception 'you can only call friends' using errcode = '42501'; end if;
  update public.friend_calls set status = 'missed' where caller_id = auth.uid() and status = 'ringing';
  insert into public.friend_calls (caller_id, callee_id) values (auth.uid(), p_callee) returning id into cid;
  return cid;
end $$;
create or replace function public.respond_friend_call(p_call uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('accepted', 'declined', 'ended') then raise exception 'invalid status'; end if;
  update public.friend_calls set status = p_status
  where id = p_call and (callee_id = auth.uid() or (caller_id = auth.uid() and p_status = 'ended'));
end $$;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.create_group, public.join_group, public.join_group_by_invite,
  public.send_friend_request, public.remove_friend, public.voice_join, public.voice_leave,
  public.start_friend_call, public.respond_friend_call, public.respond_friend_request to authenticated;
grant execute on function public.is_admin(), public.is_group_member(uuid), public.is_group_owner(uuid), public.are_friends(uuid, uuid) to authenticated;

-- ===== Seed: 3 general groups per type per category (27), idempotent via fixed slugs =====
insert into public.groups (type, category, name, description, visibility, is_general, slug)
select t.type, c.category,
       format('%s General %s %s', upper(c.category), initcap(t.type), lpad(n::text, 2, '0')),
       format('Open %s room for %s students.', t.type, upper(c.category)),
       'public', true,
       format('%s-%s-general-%s', c.category, t.type, lpad(n::text, 2, '0'))
from (values ('school'), ('jee'), ('neet')) as c(category)
cross join (values ('discussion'), ('chat'), ('voice')) as t(type)
cross join generate_series(1, 3) as n
on conflict (slug) do nothing;

-- Realtime for chat/discussion messages and call signalling (RLS applies to subscribers).
alter publication supabase_realtime add table public.messages, public.friend_calls, public.voice_participants;
-- Marks that the student has completed first-time onboarding (name step applied by the server).
alter table public.profiles add column onboarded_at timestamptz;
-- Not student-writable: only the service role (auth callback) sets it. Column grants already limit
-- student updates to display_name/avatar_url/category; the guard trigger also protects it.
create or replace function public.guard_profile_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.id is distinct from old.id
       or new.student_id is distinct from old.student_id
       or new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.created_at is distinct from old.created_at
       or new.onboarded_at is distinct from old.onboarded_at then
      raise exception 'student_id, role, email and id cannot be changed' using errcode = '42501';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create or replace view public.public_profiles as
  select id, student_id, display_name, avatar_url, category, created_at from public.profiles;
-- Owner adds an existing friend straight into one of their groups ("Study Together").
create or replace function public.invite_friend_to_group(p_group uuid, p_friend uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_group_owner(p_group) then raise exception 'only the group owner can add members' using errcode = '42501'; end if;
  if not public.are_friends(auth.uid(), p_friend) then raise exception 'you can only add friends' using errcode = '42501'; end if;
  insert into public.group_members (group_id, user_id) values (p_group, p_friend) on conflict do nothing;
end $$;
revoke execute on function public.invite_friend_to_group(uuid, uuid) from public, anon;
grant execute on function public.invite_friend_to_group(uuid, uuid) to authenticated;
-- Newer Supabase projects no longer auto-grant table privileges to service_role.
-- The server (auth callback, admin tooling) uses the service role, so grant explicitly. RLS is bypassed by that
-- role by design; the key is server-only.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;

-- ===== 0006_import_reports_insert =====
-- Admin imports run as the signed-in admin (RLS applies), but import_reports only had SELECT,
-- so the audit row was silently rejected. Allow admins to insert their own reports.
grant insert on public.import_reports to authenticated;
create policy import_reports_admin_insert on public.import_reports for insert to authenticated
  with check (public.is_admin() and admin_id = auth.uid());

-- ===== 0007_backfill_onboarded =====
update public.profiles set onboarded_at = created_at where onboarded_at is null;

-- ===== 0008_language_community =====
-- Language Learning community: preferences, language voice/chat rooms (reusing groups), posts, likes,
-- comments, stories and private image storage. All student writes that need validation go through RPCs.

-- ===== 1. "languages" becomes a learning category; rooms get a language + optional capacity =====
alter table public.profiles drop constraint if exists profiles_category_check;
alter table public.profiles add constraint profiles_category_check check (category in ('school', 'jee', 'neet', 'languages'));
alter table public.groups drop constraint if exists groups_category_check;
alter table public.groups add constraint groups_category_check check (category in ('school', 'jee', 'neet', 'languages'));
alter table public.groups add column if not exists language text check (language is null or char_length(language) between 2 and 40);
alter table public.groups add column if not exists max_participants int check (max_participants is null or max_participants between 2 and 50);
create index if not exists groups_language_idx on public.groups (category, type, language) where category = 'languages';

-- ===== 2. Language learning profile =====
create or replace function public.langs_ok(a text[]) returns boolean
language sql immutable set search_path = '' as $$
  select cardinality(a) <= 12 and not exists (select 1 from unnest(a) x where char_length(x) not between 2 and 40);
$$;

create table public.language_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  target_language text not null check (char_length(target_language) between 2 and 40),
  known_languages text[] not null default '{}' check (public.langs_ok(known_languages)),
  proficiency text not null default 'beginner' check (proficiency in ('beginner', 'elementary', 'intermediate', 'advanced')),
  discoverable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index language_profiles_target_idx on public.language_profiles (target_language) where discoverable;

create or replace function public.language_profiles_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (new.user_id is distinct from old.user_id or new.created_at is distinct from old.created_at) then
    raise exception 'user_id and created_at cannot be changed' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger language_profiles_guard_trg before update on public.language_profiles
  for each row execute function public.language_profiles_guard();

alter table public.language_profiles enable row level security;
revoke all on public.language_profiles from anon, authenticated;
grant select on public.language_profiles to authenticated;
grant insert (user_id, target_language, known_languages, proficiency, discoverable) on public.language_profiles to authenticated;
grant update (target_language, known_languages, proficiency, discoverable) on public.language_profiles to authenticated;
create policy lp_select on public.language_profiles for select to authenticated
  using (user_id = auth.uid() or discoverable or public.is_admin());
create policy lp_insert on public.language_profiles for insert to authenticated with check (user_id = auth.uid());
create policy lp_update on public.language_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== 3. Language rooms (reuse groups / group_members / messages / voice_participants) =====
create or replace function public.create_language_room(p_type text, p_name text, p_language text, p_description text, p_visibility text, p_max int default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare gid uuid; owned int;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  if p_type not in ('chat', 'voice') or p_visibility not in ('public', 'private') then raise exception 'invalid room settings'; end if;
  p_name := btrim(coalesce(p_name, '')); p_language := btrim(coalesce(p_language, ''));
  if char_length(p_name) not between 3 and 60 then raise exception 'room name must be 3-60 characters'; end if;
  if char_length(p_language) not between 2 and 40 then raise exception 'choose a language'; end if;
  if p_max is not null and (p_type <> 'voice' or p_max not between 2 and 50) then raise exception 'invalid participant limit'; end if;
  select count(*) into owned from public.groups where created_by = auth.uid();
  if owned >= 25 then raise exception 'group limit reached'; end if;
  insert into public.groups (type, category, name, description, visibility, created_by, language, max_participants)
  values (p_type, 'languages', p_name, left(btrim(coalesce(p_description, '')), 300), p_visibility, auth.uid(), p_language, p_max)
  returning id into gid;
  insert into public.group_members (group_id, user_id, role) values (gid, auth.uid(), 'owner');
  return gid;
end $$;

-- Room listing with counts a non-member is not allowed to read directly (public rooms, or rooms I belong to).
create or replace function public.language_rooms(p_type text, p_language text default null)
returns table (id uuid, type text, name text, language text, description text, visibility text, max_participants int,
               created_by uuid, creator_name text, creator_student_id text, member_count int, live_count int, is_member boolean, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select g.id, g.type, g.name, g.language, g.description, g.visibility, g.max_participants,
         g.created_by, p.display_name, p.student_id,
         (select count(*) from public.group_members m where m.group_id = g.id)::int,
         (select count(*) from public.voice_participants v where v.group_id = g.id and v.last_seen > now() - interval '90 seconds')::int,
         exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = auth.uid()),
         g.created_at
  from public.groups g left join public.profiles p on p.id = g.created_by
  where auth.uid() is not null and g.category = 'languages' and g.type = p_type
    and (g.visibility = 'public' or public.is_group_member(g.id))
    and (p_language is null or g.language = p_language)
  order by g.created_at desc limit 100;
$$;

-- Capacity-aware voice presence. last_seen is a heartbeat: callers re-run voice_join about every 30s;
-- a participant not seen for 90s no longer counts toward capacity. The token route calls this BEFORE minting a token.
create or replace function public.voice_join(p_group uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare g public.groups; live int;
begin
  if not public.is_group_member(p_group) then raise exception 'not a member' using errcode = '42501'; end if;
  select * into g from public.groups where id = p_group and type = 'voice';
  if not found then raise exception 'voice room not found'; end if;
  if g.max_participants is not null then
    perform pg_advisory_xact_lock(hashtextextended(p_group::text, 0));  -- serialise concurrent joins so capacity cannot be exceeded by a race
    select count(*) into live from public.voice_participants
     where group_id = p_group and user_id <> auth.uid() and last_seen > now() - interval '90 seconds';
    if live >= g.max_participants then raise exception 'room is full' using errcode = '53400'; end if;
  end if;
  insert into public.voice_participants (group_id, user_id) values (p_group, auth.uid())
  on conflict (group_id, user_id) do update set last_seen = now();
end $$;

-- ===== 4. Community posts =====
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 2000),
  visibility text not null default 'public' check (visibility in ('public', 'friends')),
  language text check (language is null or char_length(language) between 2 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_feed_idx on public.posts (created_at desc);
create index posts_author_idx on public.posts (author_id, created_at desc);
create index posts_language_idx on public.posts (language, created_at desc);

create table public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  path text not null unique,
  position smallint not null default 0 check (position between 0 and 5),
  created_at timestamptz not null default now()
);
create index post_images_post_idx on public.post_images (post_id, position);

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index post_likes_user_idx on public.post_likes (user_id);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index post_comments_post_idx on public.post_comments (post_id, created_at);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  image_path text not null unique,
  caption text not null default '' check (char_length(caption) <= 200),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  check (expires_at > created_at and expires_at <= created_at + interval '24 hours')
);
create index stories_active_idx on public.stories (expires_at, created_at desc);
create index stories_author_idx on public.stories (author_id, created_at desc);

create or replace function public.can_view_post(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.posts p where p.id = pid and (
    p.author_id = auth.uid() or p.visibility = 'public'
    or (p.visibility = 'friends' and public.are_friends(p.author_id, auth.uid())) or public.is_admin()));
$$;

create or replace function public.can_view_media(object_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.post_images i where i.path = object_path and public.can_view_post(i.post_id))
      or exists (select 1 from public.stories s where s.image_path = object_path and s.expires_at > now());
$$;

alter table public.posts enable row level security;
alter table public.post_images enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.stories enable row level security;
revoke all on public.posts, public.post_images, public.post_likes, public.post_comments, public.stories from anon, authenticated;
grant select on public.posts, public.post_images, public.post_likes, public.post_comments, public.stories to authenticated;
grant insert, delete on public.post_likes to authenticated;
grant insert, delete on public.post_comments to authenticated;
grant delete on public.posts, public.stories to authenticated;

create policy posts_select on public.posts for select to authenticated using (public.can_view_post(id));
create policy posts_delete on public.posts for delete to authenticated using (author_id = auth.uid() or public.is_admin());
create policy images_select on public.post_images for select to authenticated using (public.can_view_post(post_id));
create policy likes_select on public.post_likes for select to authenticated using (public.can_view_post(post_id));
create policy likes_insert on public.post_likes for insert to authenticated
  with check (user_id = auth.uid() and public.can_view_post(post_id));
create policy likes_delete on public.post_likes for delete to authenticated using (user_id = auth.uid());
create policy comments_select on public.post_comments for select to authenticated using (public.can_view_post(post_id));
create policy comments_insert on public.post_comments for insert to authenticated
  with check (author_id = auth.uid() and public.can_view_post(post_id));
create policy comments_delete on public.post_comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin()
         or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));
create policy stories_select on public.stories for select to authenticated using (expires_at > now() or public.is_admin());
create policy stories_delete on public.stories for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- Validated, atomic post creation. Image paths must be "<uid>/<file>" and already uploaded to the private bucket.
create or replace function public.create_post(p_body text, p_visibility text, p_language text, p_paths text[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare pid uuid; pth text; i int := 0; n int := coalesce(cardinality(p_paths), 0);
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  p_body := btrim(coalesce(p_body, ''));
  if p_visibility not in ('public', 'friends') then raise exception 'invalid visibility'; end if;
  if char_length(p_body) > 2000 then raise exception 'post is too long'; end if;
  if n > 6 then raise exception 'at most 6 images per post'; end if;
  if p_body = '' and n = 0 then raise exception 'write something or add an image'; end if;
  if p_language is not null and char_length(btrim(p_language)) not between 2 and 40 then raise exception 'invalid language'; end if;
  if n > 0 then
    foreach pth in array p_paths loop
      if pth !~ ('^' || auth.uid()::text || '/[A-Za-z0-9._-]{1,120}$')
         or not exists (select 1 from storage.objects o where o.bucket_id = 'community-media' and o.name = pth) then
        raise exception 'invalid image';
      end if;
    end loop;
  end if;
  insert into public.posts (author_id, body, visibility, language) values (auth.uid(), p_body, p_visibility, nullif(btrim(coalesce(p_language, '')), ''))
  returning id into pid;
  if n > 0 then
    foreach pth in array p_paths loop
      insert into public.post_images (post_id, path, position) values (pid, pth, i); i := i + 1;
    end loop;
  end if;
  return pid;
end $$;

create or replace function public.update_post(p_id uuid, p_body text, p_visibility text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  p_body := btrim(coalesce(p_body, ''));
  if p_visibility not in ('public', 'friends') or char_length(p_body) > 2000 then raise exception 'invalid post'; end if;
  if p_body = '' and not exists (select 1 from public.post_images where post_id = p_id) then raise exception 'write something or keep an image'; end if;
  update public.posts set body = p_body, visibility = p_visibility, updated_at = now() where id = p_id and author_id = auth.uid();
  if not found then raise exception 'post not found' using errcode = '42501'; end if;
end $$;

-- Feed: SECURITY INVOKER, so RLS decides which posts (and likes/images) the caller may see.
create or replace function public.community_feed(p_before timestamptz default null, p_limit int default 20, p_language text default null, p_author uuid default null)
returns table (id uuid, author_id uuid, body text, visibility text, language text, created_at timestamptz, updated_at timestamptz,
               like_count int, comment_count int, liked_by_me boolean, images text[])
language sql stable set search_path = '' as $$
  select p.id, p.author_id, p.body, p.visibility, p.language, p.created_at, p.updated_at,
         (select count(*)::int from public.post_likes l where l.post_id = p.id),
         (select count(*)::int from public.post_comments c where c.post_id = p.id),
         exists (select 1 from public.post_likes l where l.post_id = p.id and l.user_id = auth.uid()),
         coalesce((select array_agg(i.path order by i.position) from public.post_images i where i.post_id = p.id), '{}')
  from public.posts p
  where (p_before is null or p.created_at < p_before) and (p_language is null or p.language = p_language)
    and (p_author is null or p.author_id = p_author)
  order by p.created_at desc limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

create or replace function public.create_story(p_path text, p_caption text default '') returns uuid
language plpgsql security definer set search_path = '' as $$
declare sid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '42501'; end if;
  p_caption := left(btrim(coalesce(p_caption, '')), 200);
  if p_path !~ ('^' || auth.uid()::text || '/[A-Za-z0-9._-]{1,120}$')
     or not exists (select 1 from storage.objects o where o.bucket_id = 'community-media' and o.name = p_path) then
    raise exception 'invalid image';
  end if;
  if (select count(*) from public.stories where author_id = auth.uid() and expires_at > now()) >= 10 then
    raise exception 'story limit reached';
  end if;
  insert into public.stories (author_id, image_path, caption) values (auth.uid(), p_path, p_caption) returning id into sid;
  return sid;
end $$;

-- Expired stories are hidden by RLS the moment they expire. This removes the rows and returns the storage
-- paths so a scheduled job (service role) can delete the files. It is NOT automatic by itself.
create or replace function public.purge_expired_stories() returns setof text
language sql security definer set search_path = '' as $$
  delete from public.stories where expires_at <= now() returning image_path;
$$;

-- ===== 5. Private image bucket =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-media', 'community-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

create policy community_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy community_media_select on storage.objects for select to authenticated
  using (bucket_id = 'community-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.can_view_media(name)));
create policy community_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'community-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===== 6. Function privileges =====
revoke execute on function public.langs_ok(text[]), public.create_language_room(text, text, text, text, text, int),
  public.language_rooms(text, text), public.voice_join(uuid), public.can_view_post(uuid), public.can_view_media(text),
  public.create_post(text, text, text, text[]), public.update_post(uuid, text, text),
  public.community_feed(timestamptz, int, text, uuid), public.create_story(text, text), public.purge_expired_stories()
  from public, anon;
grant execute on function public.langs_ok(text[]), public.create_language_room(text, text, text, text, text, int),
  public.language_rooms(text, text), public.voice_join(uuid), public.can_view_post(uuid), public.can_view_media(text),
  public.create_post(text, text, text, text[]), public.update_post(uuid, text, text),
  public.community_feed(timestamptz, int, text, uuid), public.create_story(text, text) to authenticated;
-- Supabase auto-grants EXECUTE on new functions to anon/authenticated/service_role, so strip it explicitly.
revoke execute on function public.purge_expired_stories() from public, anon, authenticated;
grant execute on function public.purge_expired_stories() to service_role;
