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
