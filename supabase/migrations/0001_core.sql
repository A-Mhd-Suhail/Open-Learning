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
