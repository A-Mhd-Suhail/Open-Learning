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
