-- Run against a scratch DB after the migrations. Raises on first failed assertion.
\set ON_ERROR_STOP on
create or replace function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then return; end;
  raise exception 'EXPECTED FAILURE BUT SUCCEEDED: %', label;
end $$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'a@x.com', '{"ol_display_name":"Alice A","full_name":"Google Alice"}'),
  ('00000000-0000-0000-0000-00000000000b', 'b@x.com', '{"full_name":"Bob B"}'),
  ('00000000-0000-0000-0000-00000000000c', 'c@x.com', '{}');
do $$ begin
  assert (select display_name from profiles where email='a@x.com') = 'Alice A', 'onboarding name wins';
  assert (select display_name from profiles where email='b@x.com') = 'Bob B', 'google name fallback';
  assert (select count(distinct student_id) from profiles) = 3, 'unique ids';
  assert (select student_id from profiles where email='a@x.com') ~ '^OL-[0-9]{4}-000001$', 'first id';
  assert (select role from profiles where email='a@x.com') = 'student', 'default role';
end $$;
update profiles set role='admin' where email='a@x.com';  -- as postgres (service tooling): allowed

-- ===== Student cannot touch role / student_id / email =====
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.expect_fail($q$update profiles set role='admin' where id=auth.uid()$q$, 'self-promote');
select pg_temp.expect_fail($q$update profiles set student_id='OL-2026-999999' where id=auth.uid()$q$, 'change student id');
select pg_temp.expect_fail($q$update profiles set email='z@x.com' where id=auth.uid()$q$, 'change email');
update profiles set display_name='Bobby', category='jee' where id=auth.uid();
do $$ begin
  assert (select count(*) from profiles) = 1, 'students only see own profile row';
  assert (select count(*) from public_profiles) = 3, 'public view lists students';
end $$;
select pg_temp.expect_fail($q$insert into videos(video_id,exam,subject,chapter,title,youtube_url) values('v1','JEE','Physics','Mech','t','https://youtu.be/x')$q$, 'student writes video');
select pg_temp.expect_fail($q$select next_student_id()$q$, 'student calls id generator');
select pg_temp.expect_fail($q$update profiles set role='admin' where id='00000000-0000-0000-0000-00000000000c'$q$, 'update other profile');
reset role;

-- ===== Admin can write videos; students read =====
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into videos(video_id,exam,subject,chapter,title,youtube_url) values('v1','JEE','Physics','Mech','t','https://youtu.be/x');
select pg_temp.expect_fail($q$insert into videos(video_id,exam,subject,chapter,title,youtube_url) values('v1','JEE','Physics','Mech','dup','https://youtu.be/y')$q$, 'duplicate video id');
select pg_temp.expect_fail($q$insert into videos(video_id,exam,subject,chapter,title,youtube_url) values('v2','JEE','Physics','Mech','bad','https://evil.com/x')$q$, 'non-youtube url');
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin assert (select count(*) from videos) = 1, 'student reads videos'; end $$;

-- ===== Groups, membership, messages =====
do $$ declare g uuid; pg uuid; begin
  g := create_group('chat','jee','Study Squad','desc','private');
  pg := (select id from groups where slug='jee-chat-general-01');
  perform join_group(pg);
  perform join_group(pg);  -- idempotent
  assert (select count(*) from group_members where group_id=pg) = 1, 'no duplicate membership';
  insert into messages(group_id,user_id,body) values (g, auth.uid(), 'hello');
  begin insert into messages(group_id,user_id,body) values (g, '00000000-0000-0000-0000-00000000000c', 'spoof'); assert false, 'spoof'; exception when insufficient_privilege or check_violation then null; end;
end $$;
reset role;

set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ declare g uuid; begin
  g := (select id from groups where name='Study Squad');
  assert g is null, 'private group invisible to non-member';
  assert (select count(*) from messages) = 0, 'non-member reads no messages';
end $$;
select pg_temp.expect_fail($q$select join_group((select id from groups where created_by is not null limit 1))$q$, 'join private without invite');
do $$ begin
  begin insert into messages(group_id,user_id,body) select id, auth.uid(), 'sneak' from public.groups where slug='jee-chat-general-02'; assert false, 'non-member insert'; exception when insufficient_privilege then null; end;
end $$;
select pg_temp.expect_fail($q$insert into group_members(group_id,user_id) select id, auth.uid() from groups limit 1$q$, 'direct membership insert');
select pg_temp.expect_fail($q$update messages set body='x'$q$, 'edit messages');
-- join with invite works
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ declare code text; begin code := (select invite_code from groups where name='Study Squad'); perform set_config('ol.code', code, false); end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ begin
  perform join_group_by_invite(current_setting('ol.code'));
  assert (select count(*) from messages) = 1, 'member sees history after invite join';
  begin perform join_group_by_invite('nope'); assert false; exception when no_data_found or sqlstate 'P0002' then null; end;
end $$;
reset role;

-- voice rooms: no text messages, presence requires membership
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.expect_fail($q$select voice_join((select id from groups where slug='jee-voice-general-01'))$q$, 'voice join without membership');
select join_group((select id from groups where slug='jee-voice-general-01'));
select voice_join((select id from groups where slug='jee-voice-general-01'));
select pg_temp.expect_fail($q$insert into messages(group_id,user_id,body) select id, auth.uid(), 'x' from groups where slug='jee-voice-general-01'$q$, 'text in voice room');
reset role;

-- ===== Friends =====
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select send_friend_request('00000000-0000-0000-0000-00000000000c');
select pg_temp.expect_fail($q$select send_friend_request('00000000-0000-0000-0000-00000000000c')$q$, 'duplicate request');
select pg_temp.expect_fail($q$select start_friend_call('00000000-0000-0000-0000-00000000000c')$q$, 'call non-friend');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ declare r uuid; begin
  r := (select id from friend_requests where status='pending' limit 1);
  perform respond_friend_request(r, true);
  assert (select count(*) from friendships) = 1, 'friendship created';
end $$;
select start_friend_call('00000000-0000-0000-0000-00000000000b');
select remove_friend('00000000-0000-0000-0000-00000000000b');
do $$ begin assert (select count(*) from friendships) = 0, 'removed'; end $$;
reset role;

-- ===== Study together: owner can add friend; non-friend / non-owner cannot =====
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select send_friend_request('00000000-0000-0000-0000-00000000000c');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select respond_friend_request((select id from friend_requests where status='pending' limit 1), true);
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ declare g uuid; begin
  g := create_group('chat','neet','Friends Only','','private');
  perform invite_friend_to_group(g, '00000000-0000-0000-0000-00000000000c');
  assert (select count(*) from group_members where group_id=g) = 2, 'friend added';
  begin perform invite_friend_to_group(g, '00000000-0000-0000-0000-00000000000a'); assert false, 'non-friend'; exception when insufficient_privilege then null; end;
  perform set_config('ol.g', g::text, false);
end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.expect_fail($q$select invite_friend_to_group(current_setting('ol.g')::uuid, '00000000-0000-0000-0000-00000000000a')$q$, 'non-owner adds member');
reset role;

-- ===== Seed idempotency =====
do $$ declare before int; begin
  select count(*) into before from groups where is_general;
  assert before = 27, '27 general groups';
end $$;
-- ===== import_reports: admins may insert their own report; students and spoofed admin_id may not =====
update profiles set role='admin' where id='00000000-0000-0000-0000-00000000000a';
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into import_reports (admin_id, source, total_rows, created_count, updated_count, skipped_count) values (auth.uid(), 'google_sheet', 1, 1, 0, 0);
select pg_temp.expect_fail($q$insert into import_reports (admin_id, source, total_rows, created_count, updated_count, skipped_count) values ('00000000-0000-0000-0000-00000000000b', 'xlsx', 1, 1, 0, 0)$q$, 'admin spoofs admin_id');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.expect_fail($q$insert into import_reports (admin_id, source, total_rows, created_count, updated_count, skipped_count) values (auth.uid(), 'xlsx', 1, 1, 0, 0)$q$, 'student inserts report');
reset role;
-- ===== Google-first onboarding: new profile starts incomplete, students cannot self-complete, ID is stable =====
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', 'new@x.com', '{"full_name":"Google Name"}');
do $$ begin
  assert (select onboarded_at from profiles where email='new@x.com') is null, 'new profile starts incomplete';
  assert (select student_id from profiles where email='new@x.com') ~ '^OL-[0-9]{4}-[0-9]{6}$', 'student id assigned by trigger';
  assert (select display_name from profiles where email='new@x.com') = 'Google Name', 'prefill source is Google name';
end $$;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
select pg_temp.expect_fail($q$update profiles set onboarded_at = now() where id = auth.uid()$q$, 'student self-completes onboarding');
reset role;
-- service role / owner completes it with the name; the student id must not change
select student_id as sid_before from profiles where email='new@x.com' \gset
update profiles set display_name = 'Chosen Name', onboarded_at = now() where email='new@x.com' and onboarded_at is null;
select 1/(case when student_id = :'sid_before' and onboarded_at is not null then 1 else 0 end) as onboarding_keeps_student_id from profiles where email='new@x.com';
-- replayed completion is a no-op (matches the server action's `is null` guard)
update profiles set display_name = 'Hijack' where email='new@x.com' and onboarded_at is null;
do $$ begin assert (select display_name from profiles where email='new@x.com') = 'Chosen Name', 'replay cannot rename'; end $$;
-- 0007 backfill: pre-existing profiles become complete and keep their student ids
update profiles set onboarded_at = null where email='a@x.com';
select student_id as sid_a from profiles where email='a@x.com' \gset
\i :ROOT/supabase/migrations/0007_backfill_onboarded.sql
select 1/(case when student_id = :'sid_a' and onboarded_at is not null then 1 else 0 end) as backfill_ok from profiles where email='a@x.com';

-- =====================================================================================================
-- ===== LANGUAGE COMMUNITY (migration 0008) ===========================================================
-- =====================================================================================================
create or replace function pg_temp.expect_state(sql text, st text, label text) returns void language plpgsql as $$
declare s text;
begin
  begin execute sql;
  exception when others then
    get stacked diagnostics s = returned_sqlstate;
    if s = st then return; end if;
    raise exception 'WRONG SQLSTATE % (wanted %) for: %', s, st, label;
  end;
  raise exception 'EXPECTED FAILURE BUT SUCCEEDED: %', label;
end $$;
create or replace function pg_temp.dml_rows(sql text) returns int language plpgsql as $$
declare n int; begin execute sql; get diagnostics n = row_count; return n; end $$;

-- users: b, c are friends (set up earlier); e1/f1/h1/g1 are strangers to everyone
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000e1', 'e1@x.com'), ('00000000-0000-0000-0000-0000000000f1', 'f1@x.com'),
  ('00000000-0000-0000-0000-0000000000b1', 'h1@x.com'), ('00000000-0000-0000-0000-0000000000a1', 'g1@x.com');
-- (b1 = "h", a1 = "g" below)
do $$ begin
  assert public.are_friends('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000c'), 'precondition: b and c are friends';
  assert not public.are_friends('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000e1'), 'precondition: e1 is a stranger';
end $$;

-- ---------- language_profiles ----------
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
insert into language_profiles (user_id, target_language, known_languages, proficiency) values (auth.uid(), 'Tamil', '{English,Hindi}', 'beginner');
select pg_temp.expect_fail($q$insert into language_profiles (user_id, target_language) values ('00000000-0000-0000-0000-0000000000f1', 'French')$q$, 'insert profile for another user');
select pg_temp.expect_fail($q$insert into language_profiles (user_id, target_language) values (auth.uid(), 'French')$q$, 'duplicate profile');
update language_profiles set proficiency = 'advanced', target_language = 'Japanese' where user_id = auth.uid();
do $$ begin assert (select proficiency from language_profiles where user_id = auth.uid()) = 'advanced', 'own update works'; end $$;
select pg_temp.expect_fail($q$update language_profiles set user_id = '00000000-0000-0000-0000-0000000000f1' where user_id = auth.uid()$q$, 'change user_id');
select pg_temp.expect_fail($q$update language_profiles set created_at = now() - interval '5 years' where user_id = auth.uid()$q$, 'change created_at');
select pg_temp.expect_fail($q$update language_profiles set proficiency = 'expert' where user_id = auth.uid()$q$, 'invalid proficiency');
select pg_temp.expect_fail($q$update language_profiles set known_languages = array_fill('Hindi'::text, array[13]) where user_id = auth.uid()$q$, 'oversized known list (13)');
select pg_temp.expect_fail($q$update language_profiles set known_languages = '{x}' where user_id = auth.uid()$q$, 'known entry too short');
select pg_temp.expect_fail($q$update language_profiles set known_languages = array[repeat('x', 41)] where user_id = auth.uid()$q$, 'known entry too long');
select pg_temp.expect_fail($q$update language_profiles set target_language = 'x' where user_id = auth.uid()$q$, 'target too short');
update language_profiles set known_languages = array_fill('Hindi'::text, array[12]) where user_id = auth.uid();  -- exactly 12 is fine
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
insert into language_profiles (user_id, target_language, discoverable) values (auth.uid(), 'French', false);
do $$ begin
  assert (select count(*) from language_profiles where user_id = '00000000-0000-0000-0000-0000000000e1') = 1, 'discoverable profile visible to others';
  assert (select count(*) from language_profiles) = 2, 'f1 sees own (hidden) + discoverable';
  assert pg_temp.dml_rows($q$update language_profiles set target_language = 'Hacked' where user_id = '00000000-0000-0000-0000-0000000000e1'$q$) = 0, 'cannot update another profile';
end $$;
select pg_temp.expect_fail($q$delete from language_profiles where user_id = auth.uid()$q$, 'delete needs grant (no delete privilege)');
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
do $$ begin
  assert (select count(*) from language_profiles where user_id = '00000000-0000-0000-0000-0000000000f1') = 0, 'non-discoverable profile hidden from others';
  assert (select target_language from language_profiles where user_id = auth.uid()) = 'Japanese', 'e1 profile untouched by f1';
end $$;
update language_profiles set discoverable = false where user_id = auth.uid();
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
do $$ begin assert (select count(*) from language_profiles where user_id = '00000000-0000-0000-0000-0000000000e1') = 0, 'hiding takes effect immediately'; end $$;
reset role;
do $$ begin assert (select updated_at > created_at from language_profiles where user_id = '00000000-0000-0000-0000-0000000000e1'), 'updated_at maintained by trigger'; end $$;
-- admin can read non-discoverable profiles
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$ begin assert (select count(*) from language_profiles) = 2, 'admin reads all language profiles'; end $$;
reset role;

-- ---------- create_language_room validation ----------
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
select pg_temp.expect_fail($q$select create_language_room('discussion','Good Name','Tamil','','public')$q$, 'type discussion not allowed');
select pg_temp.expect_fail($q$select create_language_room('chat','ab','Tamil','','public')$q$, 'name too short');
select pg_temp.expect_fail($q$select create_language_room('chat',repeat('n',61),'Tamil','','public')$q$, 'name too long');
select pg_temp.expect_fail($q$select create_language_room('chat','Good Name','','','public')$q$, 'empty language');
select pg_temp.expect_fail($q$select create_language_room('chat','Good Name','T','','public')$q$, 'language too short');
select pg_temp.expect_fail($q$select create_language_room('chat','Good Name','Tamil','','secret')$q$, 'bad visibility');
select pg_temp.expect_fail($q$select create_language_room('chat','Good Name','Tamil','','public',5)$q$, 'max only for voice');
select pg_temp.expect_fail($q$select create_language_room('voice','Good Name','Tamil','','public',1)$q$, 'max below 2');
select pg_temp.expect_fail($q$select create_language_room('voice','Good Name','Tamil','','public',51)$q$, 'max above 50');
do $$ declare v uuid; c_pub uuid; c_priv uuid; begin
  v := create_language_room('voice', '  Tamil Talk  ', 'Tamil', 'practise', 'public', 2);
  c_pub := create_language_room('chat', 'Hindi Chat', 'Hindi', repeat('d', 400), 'public');
  c_priv := create_language_room('chat', 'Secret Chat', 'Tamil', '', 'private');
  assert (select name from groups where id = v) = 'Tamil Talk', 'name trimmed';
  assert (select category from groups where id = v) = 'languages' and (select max_participants from groups where id = v) = 2, 'category + max stored';
  assert char_length((select description from groups where id = c_pub)) = 300, 'description truncated to 300';
  assert (select role from group_members where group_id = v and user_id = auth.uid()) = 'owner', 'creator is owner';
  perform set_config('ol.vr', v::text, false); perform set_config('ol.cpub', c_pub::text, false); perform set_config('ol.cpriv', c_priv::text, false);
end $$;
reset role;
-- 25-room limit (counts all groups created by the user, enforced inside the RPC)
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
do $$ begin
  for i in 1..25 loop perform create_language_room('chat', 'Room number ' || i, 'Tamil', '', 'public'); end loop;
  begin perform create_language_room('chat', 'One too many', 'Tamil', '', 'public'); assert false, 'limit not enforced';
  exception when others then if sqlerrm <> 'group limit reached' then raise; end if; end;
  begin perform create_language_room('voice', 'Voice too many', 'Tamil', '', 'public', 4); assert false, 'limit not enforced (voice)';
  exception when others then if sqlerrm <> 'group limit reached' then raise; end if; end;
end $$;
reset role;

-- ---------- language_rooms listing / visibility / joining ----------
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
do $$ begin
  assert (select count(*) from language_rooms('voice') where id = current_setting('ol.vr')::uuid) = 1, 'public voice room listed to non-member';
  assert (select member_count from language_rooms('voice') where id = current_setting('ol.vr')::uuid) = 1, 'member_count visible to non-member';
  assert (select live_count from language_rooms('voice') where id = current_setting('ol.vr')::uuid) = 0, 'live_count starts at 0';
  assert not (select is_member from language_rooms('voice') where id = current_setting('ol.vr')::uuid), 'is_member false';
  assert (select creator_name from language_rooms('voice') where id = current_setting('ol.vr')::uuid) is not null, 'creator name returned';
  assert (select count(*) from language_rooms('chat') where id = current_setting('ol.cpub')::uuid) = 1, 'public chat listed';
  assert (select count(*) from language_rooms('chat') where id = current_setting('ol.cpriv')::uuid) = 0, 'private room hidden from non-member';
  assert (select count(*) from language_rooms('chat', 'Hindi')) >= 1 and (select count(*) from language_rooms('chat', 'Hindi') where language <> 'Hindi') = 0, 'language filter';
  assert (select count(*) from language_rooms('chat') where type <> 'chat') = 0, 'type filter';
  assert (select count(*) from groups where id = current_setting('ol.cpriv')::uuid) = 0, 'private room not readable directly';
end $$;
reset role;
-- join / messages in language rooms
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
select pg_temp.expect_fail($q$select join_group(current_setting('ol.cpriv')::uuid)$q$, 'join_group on a private language room');
select pg_temp.expect_fail($q$insert into messages (group_id, user_id, body) values (current_setting('ol.cpub')::uuid, auth.uid(), 'hi')$q$, 'message before joining');
select join_group(current_setting('ol.cpub')::uuid);
insert into messages (group_id, user_id, body) values (current_setting('ol.cpub')::uuid, auth.uid(), 'hi');
select pg_temp.expect_fail($q$insert into messages (group_id, user_id, body) values (current_setting('ol.cpub')::uuid, '00000000-0000-0000-0000-0000000000e1', 'spoof')$q$, 'spoofed sender');
select pg_temp.expect_fail($q$insert into messages (group_id, user_id, body) values (current_setting('ol.cpriv')::uuid, auth.uid(), 'sneak')$q$, 'message in private room as non-member');
select pg_temp.expect_fail($q$insert into messages (group_id, user_id, body) values (current_setting('ol.vr')::uuid, auth.uid(), 'x')$q$, 'text in language voice room');
do $$ begin assert (select is_member from language_rooms('chat') where id = current_setting('ol.cpub')::uuid), 'is_member true after join'; end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
do $$ begin assert (select count(*) from messages where group_id = current_setting('ol.cpub')::uuid) = 0, 'non-member (g1) reads no messages'; end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
do $$ begin
  assert (select count(*) from language_rooms('chat') where id = current_setting('ol.cpriv')::uuid) = 1, 'private room visible to its member';
  assert (select member_count from language_rooms('chat') where id = current_setting('ol.cpub')::uuid) = 2, 'member_count updated';
end $$;
reset role;

-- ---------- voice_join capacity ----------
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
select voice_join(current_setting('ol.vr')::uuid);
select voice_join(current_setting('ol.vr')::uuid);  -- heartbeat by an existing participant
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
select pg_temp.expect_state($q$select voice_join(current_setting('ol.vr')::uuid)$q$, '42501', 'non-member voice_join');
select join_group(current_setting('ol.vr')::uuid);
select voice_join(current_setting('ol.vr')::uuid);                -- 2nd live participant (max 2)
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
select join_group(current_setting('ol.vr')::uuid);
select pg_temp.expect_state($q$select voice_join(current_setting('ol.vr')::uuid)$q$, '53400', 'third live participant is rejected');
do $$ begin
  assert (select live_count from language_rooms('voice') where id = current_setting('ol.vr')::uuid) = 2, 'live_count = 2';
  assert (select count(*) from voice_participants where user_id = auth.uid()) = 0, 'rejected user not recorded';
end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
select voice_join(current_setting('ol.vr')::uuid);  -- an existing participant can still heartbeat when full
reset role;
-- f1 goes stale (>90s): no longer counts, so b1 fits; f1 coming back is then rejected
update voice_participants set last_seen = now() - interval '100 seconds' where user_id = '00000000-0000-0000-0000-0000000000f1' and group_id = current_setting('ol.vr')::uuid;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
select voice_join(current_setting('ol.vr')::uuid);
do $$ begin assert (select live_count from language_rooms('voice') where id = current_setting('ol.vr')::uuid) = 2, 'stale participant excluded from live_count'; end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
select pg_temp.expect_state($q$select voice_join(current_setting('ol.vr')::uuid)$q$, '53400', 'stale user is rejected when room refilled');
select voice_leave(current_setting('ol.vr')::uuid);
-- a chat room is not a voice room
select pg_temp.expect_fail($q$select voice_join(current_setting('ol.cpub')::uuid)$q$, 'voice_join on a chat room');
reset role;
-- unlimited voice rooms (no max) accept more than 2
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
select set_config('ol.open_vr', (create_language_room('voice', 'Open Voice', 'Tamil', '', 'public'))::text, false);

select voice_join(current_setting('ol.open_vr')::uuid);
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1'; select join_group(current_setting('ol.open_vr')::uuid); select voice_join(current_setting('ol.open_vr')::uuid);
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1'; select join_group(current_setting('ol.open_vr')::uuid); select voice_join(current_setting('ol.open_vr')::uuid);
reset role;

-- ---------- posts: visibility, update/delete, create_post validation ----------
-- b (author) posts text; c is b's friend; e1 is a stranger
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select set_config('ol.p_pub', (create_post('hello world', 'public', 'Tamil', null))::text, false);

select set_config('ol.p_fr', (create_post('friends only', 'friends', null, '{}'))::text, false);

select pg_temp.expect_fail($q$select create_post('x', 'private', null, null)$q$, 'invalid visibility');
select pg_temp.expect_fail($q$select create_post('', 'public', null, null)$q$, 'empty post');
select pg_temp.expect_fail($q$select create_post('   ', 'public', null, '{}')$q$, 'whitespace-only post');
select pg_temp.expect_fail($q$select create_post(repeat('a', 2001), 'public', null, null)$q$, 'post too long');
select pg_temp.expect_fail($q$select create_post('x', 'public', 'T', null)$q$, 'invalid language');
select pg_temp.expect_fail($q$insert into posts (author_id, body) values (auth.uid(), 'direct')$q$, 'direct insert into posts');
select pg_temp.expect_fail($q$update posts set body = 'direct' where author_id = auth.uid()$q$, 'direct update on posts');
-- images: wrong folder / missing object / too many
select pg_temp.expect_fail($q$insert into storage.objects (bucket_id, name) values ('community-media', '00000000-0000-0000-0000-00000000000c/steal.png')$q$, 'upload into another user folder');
select pg_temp.expect_fail($q$insert into storage.objects (bucket_id, name) values ('community-media', 'loose.png')$q$, 'upload outside any user folder');
insert into storage.objects (bucket_id, name) values
  ('community-media', '00000000-0000-0000-0000-00000000000b/img1.png'), ('community-media', '00000000-0000-0000-0000-00000000000b/img2.png'),
  ('community-media', '00000000-0000-0000-0000-00000000000b/img3.png'), ('community-media', '00000000-0000-0000-0000-00000000000b/img4.png'),
  ('community-media', '00000000-0000-0000-0000-00000000000b/img5.png'), ('community-media', '00000000-0000-0000-0000-00000000000b/img6.png'),
  ('community-media', '00000000-0000-0000-0000-00000000000b/img7.png');
select pg_temp.expect_state($q$select create_post('x', 'public', null, array['00000000-0000-0000-0000-00000000000b/missing.png'])$q$, 'P0001', 'non-existent object');
select pg_temp.expect_state($q$select create_post('x', 'public', null, array['../00000000-0000-0000-0000-00000000000b/img1.png'])$q$, 'P0001', 'path traversal');
select pg_temp.expect_state($q$select create_post('x', 'public', null, array['00000000-0000-0000-0000-00000000000b/a/img1.png'])$q$, 'P0001', 'nested path');
select pg_temp.expect_state($q$select create_post('x', 'public', null, array[null])$q$, 'P0001', 'null path');
select pg_temp.expect_fail($q$select create_post('x', 'public', null, array['00000000-0000-0000-0000-00000000000b/img1.png','00000000-0000-0000-0000-00000000000b/img2.png','00000000-0000-0000-0000-00000000000b/img3.png','00000000-0000-0000-0000-00000000000b/img4.png','00000000-0000-0000-0000-00000000000b/img5.png','00000000-0000-0000-0000-00000000000b/img6.png','00000000-0000-0000-0000-00000000000b/img7.png'])$q$, '7 images');
select pg_temp.expect_fail($q$select create_post('x', 'public', null, array['00000000-0000-0000-0000-00000000000b/img1.png','00000000-0000-0000-0000-00000000000b/img1.png'])$q$, 'same image twice');
reset role;
-- an object that exists in someone else's folder cannot be attached by b
insert into storage.objects (bucket_id, name) values ('community-media', '00000000-0000-0000-0000-00000000000c/cimg.png');
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.expect_state($q$select create_post('x', 'public', null, array['00000000-0000-0000-0000-00000000000c/cimg.png'])$q$, 'P0001', 'existing object in another folder');
-- valid: image-only post (public) and a friends post with 6 images
select set_config('ol.p_img', (create_post('', 'public', null, array['00000000-0000-0000-0000-00000000000b/img1.png']))::text, false);

select set_config('ol.p_six', (create_post('six', 'friends', null, array['00000000-0000-0000-0000-00000000000b/img2.png','00000000-0000-0000-0000-00000000000b/img3.png','00000000-0000-0000-0000-00000000000b/img4.png','00000000-0000-0000-0000-00000000000b/img5.png','00000000-0000-0000-0000-00000000000b/img6.png','00000000-0000-0000-0000-00000000000b/img7.png']))::text, false);

do $$ begin
  assert (select count(*) from post_images where post_id = current_setting('ol.p_six')::uuid) = 6, 'six images stored';
  assert (select array_agg(position order by position) from post_images where post_id = current_setting('ol.p_six')::uuid) = '{0,1,2,3,4,5}', 'positions in order';
end $$;
-- the same image cannot be attached to a second post
select pg_temp.expect_fail(format($f$select create_post('again', 'public', null, array['00000000-0000-0000-0000-00000000000b/img1.png'])$f$), 'image reused on second post');
reset role;
-- visibility
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ begin
  assert (select count(*) from posts where id in (current_setting('ol.p_pub')::uuid, current_setting('ol.p_fr')::uuid, current_setting('ol.p_img')::uuid, current_setting('ol.p_six')::uuid)) = 4, 'friend sees public + friends posts';
  assert (select count(*) from community_feed(null, 50, null, null) where author_id = '00000000-0000-0000-0000-00000000000b') = 4, 'friend feed';
end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
do $$ begin
  assert (select count(*) from posts where id in (current_setting('ol.p_pub')::uuid, current_setting('ol.p_img')::uuid)) = 2, 'stranger sees public posts';
  assert (select count(*) from posts where id in (current_setting('ol.p_fr')::uuid, current_setting('ol.p_six')::uuid)) = 0, 'stranger does not see friends-only posts';
  assert (select count(*) from post_images where post_id = current_setting('ol.p_six')::uuid) = 0, 'stranger cannot read images rows of friends post';
  assert (select count(*) from community_feed(null, 50, null, null) where id = current_setting('ol.p_fr')::uuid) = 0, 'feed hides friends-only from stranger';
  assert (select count(*) from community_feed(null, 50, 'Tamil', null) where id = current_setting('ol.p_pub')::uuid) = 1, 'feed language filter';
  assert (select count(*) from community_feed(null, 50, 'Hindi', null)) = 0, 'feed language filter excludes';
  assert (select count(*) from community_feed(null, 1, null, null)) = 1, 'feed limit';
  assert (select count(*) from community_feed(null, 50, null, '00000000-0000-0000-0000-00000000000b')) = 2, 'feed author filter';
  assert (select images from community_feed(null, 50, null, null) where id = current_setting('ol.p_img')::uuid) = array['00000000-0000-0000-0000-00000000000b/img1.png'], 'feed returns image paths';
end $$;
-- update/delete: only the author
select pg_temp.expect_state(format($f$select update_post(%L, 'hijack', 'public')$f$, current_setting('ol.p_pub')), '42501', 'stranger update_post');
select pg_temp.expect_fail(format($f$select update_post(%L, 'x', 'bogus')$f$, current_setting('ol.p_pub')), 'update_post bad visibility');
do $$ begin
  assert pg_temp.dml_rows(format($f$delete from posts where id = %L$f$, current_setting('ol.p_pub'))) = 0, 'stranger cannot delete post';
end $$;
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select update_post(current_setting('ol.p_pub')::uuid, 'edited', 'friends');
select pg_temp.expect_fail(format($f$select update_post(%L, '', 'public')$f$, current_setting('ol.p_pub')), 'update to empty body without images');
select update_post(current_setting('ol.p_img')::uuid, '', 'public');  -- image keeps it valid
do $$ begin assert (select body || visibility from posts where id = current_setting('ol.p_pub')::uuid) = 'editedfriends', 'author update works'; end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
do $$ begin assert (select count(*) from posts where id = current_setting('ol.p_pub')::uuid) = 0, 'post switched to friends disappears for stranger'; end $$;
reset role;

-- ---------- storage.objects policies ----------
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ begin
  assert (select count(*) from storage.objects where name like '%/img_.png') = 7, 'friend can read all of b images (public + friends posts)';
  assert pg_temp.dml_rows($q$delete from storage.objects where name like '00000000-0000-0000-0000-00000000000b/%'$q$) = 0, 'cannot delete another user object';
end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
do $$ begin
  assert (select count(*) from storage.objects where name = '00000000-0000-0000-0000-00000000000b/img1.png') = 1, 'stranger reads image of PUBLIC post';
  assert (select count(*) from storage.objects where name = '00000000-0000-0000-0000-00000000000b/img3.png') = 0, 'stranger cannot read image of FRIENDS post';
  assert (select count(*) from storage.objects where name = '00000000-0000-0000-0000-00000000000c/cimg.png') = 0, 'unattached object invisible to others';
  assert pg_temp.dml_rows($q$delete from storage.objects where name = '00000000-0000-0000-0000-00000000000b/img1.png'$q$) = 0, 'stranger cannot delete';
end $$;
select pg_temp.expect_fail($q$insert into storage.objects (bucket_id, name) values ('community-media', '00000000-0000-0000-0000-00000000000b/planted.png')$q$, 'plant file in someone else folder');
select pg_temp.expect_fail($q$insert into storage.objects (bucket_id, name) values ('other-bucket', '00000000-0000-0000-0000-0000000000e1/x.png')$q$, 'other bucket');
insert into storage.objects (bucket_id, name) values ('community-media', '00000000-0000-0000-0000-0000000000e1/mine.png');
do $$ begin assert (select count(*) from storage.objects where name = '00000000-0000-0000-0000-0000000000e1/mine.png') = 1, 'owner reads own unattached upload'; end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  assert pg_temp.dml_rows($q$delete from storage.objects where name = '00000000-0000-0000-0000-00000000000b/img7.png'$q$) = 1, 'owner deletes own object';
  assert pg_temp.dml_rows($q$delete from storage.objects where name = '00000000-0000-0000-0000-0000000000e1/mine.png'$q$) = 0, 'owner cannot delete others';
end $$;
reset role;
do $$ begin
  assert (select public from storage.buckets where id = 'community-media') = false, 'bucket is private';
  assert (select file_size_limit from storage.buckets where id = 'community-media') = 5242880, 'bucket 5 MB limit';
  assert (select allowed_mime_types from storage.buckets where id = 'community-media') = array['image/jpeg','image/png','image/webp','image/gif'], 'bucket mime allow-list';
end $$;

-- ---------- likes ----------
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
insert into post_likes (post_id, user_id) values (current_setting('ol.p_img')::uuid, auth.uid());
select pg_temp.expect_state(format($f$insert into post_likes (post_id, user_id) values (%L, auth.uid())$f$, current_setting('ol.p_img')), '23505', 'duplicate like');
select pg_temp.expect_fail(format($f$insert into post_likes (post_id, user_id) values (%L, '00000000-0000-0000-0000-0000000000e1')$f$, current_setting('ol.p_img')), 'like as someone else');
insert into post_likes (post_id, user_id) values (current_setting('ol.p_fr')::uuid, auth.uid());  -- friend may like a friends-only post
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
select pg_temp.expect_fail(format($f$insert into post_likes (post_id, user_id) values (%L, auth.uid())$f$, current_setting('ol.p_fr')), 'like a post I cannot see');
insert into post_likes (post_id, user_id) values (current_setting('ol.p_img')::uuid, auth.uid());
do $$ begin
  assert (select like_count from community_feed(null, 50, null, null) where id = current_setting('ol.p_img')::uuid) = 2, 'like_count';
  assert (select liked_by_me from community_feed(null, 50, null, null) where id = current_setting('ol.p_img')::uuid), 'liked_by_me';
  assert pg_temp.dml_rows($q$delete from post_likes where user_id = '00000000-0000-0000-0000-00000000000c'$q$) = 0, 'cannot remove others likes';
  assert pg_temp.dml_rows(format($f$delete from post_likes where post_id = %L and user_id = auth.uid()$f$, current_setting('ol.p_img'))) = 1, 'unlike own';
end $$;
select pg_temp.expect_fail($q$update post_likes set user_id = auth.uid()$q$, 'likes are not updatable');
reset role;

-- ---------- comments ----------
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
insert into post_comments (post_id, author_id, body) values (current_setting('ol.p_fr')::uuid, auth.uid(), 'nice one');
insert into post_comments (post_id, author_id, body) values (current_setting('ol.p_fr')::uuid, auth.uid(), 'second');
select pg_temp.expect_fail(format($f$insert into post_comments (post_id, author_id, body) values (%L, '00000000-0000-0000-0000-00000000000b', 'impersonate')$f$, current_setting('ol.p_fr')), 'impersonated comment');
select pg_temp.expect_fail(format($f$insert into post_comments (post_id, author_id, body) values (%L, auth.uid(), '   ')$f$, current_setting('ol.p_fr')), 'blank comment');
select pg_temp.expect_fail(format($f$insert into post_comments (post_id, author_id, body) values (%L, auth.uid(), repeat('c', 1001))$f$, current_setting('ol.p_fr')), 'comment too long');
select pg_temp.expect_fail(format($f$update post_comments set body = 'edit' where post_id = %L$f$, current_setting('ol.p_fr')), 'comments are not updatable');
insert into post_comments (post_id, author_id, body) values (current_setting('ol.p_img')::uuid, auth.uid(), 'on a public post');
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
select pg_temp.expect_fail(format($f$insert into post_comments (post_id, author_id, body) values (%L, auth.uid(), 'sneaky')$f$, current_setting('ol.p_fr')), 'comment on invisible post');
do $$ begin
  assert (select count(*) from post_comments where post_id = current_setting('ol.p_fr')::uuid) = 0, 'stranger cannot read comments of friends post';
  assert pg_temp.dml_rows(format($f$delete from post_comments where post_id = %L$f$, current_setting('ol.p_img'))) = 0, 'stranger cannot delete a comment on a public post';
  assert (select comment_count from community_feed(null, 50, null, null) where id = current_setting('ol.p_img')::uuid) = 1, 'comment_count';
end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin assert pg_temp.dml_rows(format($f$delete from post_comments where post_id = %L and body = 'second'$f$, current_setting('ol.p_fr'))) = 1, 'post owner deletes a comment on own post'; end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ begin
  assert pg_temp.dml_rows(format($f$delete from post_comments where post_id = %L$f$, current_setting('ol.p_fr'))) = 1, 'author deletes own comment';
  assert (select count(*) from post_comments) = 1, 'remaining comment is the public-post one';
end $$;
reset role;
-- deleting a post cascades to images/likes/comments; only the author may delete
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  assert pg_temp.dml_rows(format($f$delete from posts where id = %L$f$, current_setting('ol.p_img'))) = 1, 'author deletes own post';
end $$;
reset role;
do $$ begin
  assert (select count(*) from post_comments where post_id = current_setting('ol.p_img')::uuid) = 0 and (select count(*) from post_likes where post_id = current_setting('ol.p_img')::uuid) = 0
     and (select count(*) from post_images where post_id = current_setting('ol.p_img')::uuid) = 0, 'cascade on post delete';
end $$;

-- ---------- stories ----------
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
select set_config('ol.s1', (create_story('00000000-0000-0000-0000-0000000000e1/mine.png', 'my day'))::text, false);

select pg_temp.expect_state($q$select create_story('00000000-0000-0000-0000-00000000000b/img1.png', '')$q$, 'P0001', 'story with another folder path');
select pg_temp.expect_state($q$select create_story('00000000-0000-0000-0000-0000000000e1/nope.png', '')$q$, 'P0001', 'story with missing object');
select pg_temp.expect_state($q$select create_story('00000000-0000-0000-0000-0000000000e1/mine.png', '')$q$, '23505', 'same image used twice');
select pg_temp.expect_fail($q$insert into stories (author_id, image_path) values (auth.uid(), 'x/y.png')$q$, 'direct story insert');
select pg_temp.expect_fail($q$update stories set expires_at = now() + interval '30 days'$q$, 'story update');
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
do $$ begin
  assert (select count(*) from stories) = 1, 'everyone signed in sees active stories';
  assert (select count(*) from storage.objects where name = '00000000-0000-0000-0000-0000000000e1/mine.png') = 1, 'active story image readable';
  assert pg_temp.dml_rows($q$delete from stories$q$) = 0, 'cannot delete someone elses story';
end $$;
reset role;
-- constraints (as table owner): <= 24h and > created_at
select pg_temp.expect_fail($q$insert into stories (author_id, image_path, expires_at) values ('00000000-0000-0000-0000-0000000000e1', 'p/long.png', now() + interval '25 hours')$q$, 'story > 24h');
select pg_temp.expect_fail($q$insert into stories (author_id, image_path, created_at, expires_at) values ('00000000-0000-0000-0000-0000000000e1', 'p/neg.png', now(), now() - interval '1 hour')$q$, 'expires before created');
select pg_temp.expect_fail($q$insert into stories (author_id, image_path, caption) values ('00000000-0000-0000-0000-0000000000e1', 'p/cap.png', repeat('c', 201))$q$, 'caption > 200');
-- expired story: hidden by RLS immediately, and its image is no longer viewable by others
insert into storage.objects (bucket_id, name) values ('community-media', '00000000-0000-0000-0000-0000000000e1/old.png');
insert into stories (author_id, image_path, created_at, expires_at) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e1/old.png', now() - interval '30 hours', now() - interval '6 hours');
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
do $$ begin
  assert (select count(*) from stories) = 1, 'expired story hidden by RLS';
  assert (select count(*) from storage.objects where name = '00000000-0000-0000-0000-0000000000e1/old.png') = 0, 'expired story image hidden from others';
end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
do $$ begin assert (select count(*) from stories) = 1, 'author also does not see an expired story'; end $$;
-- purge: not callable by students or anon
select pg_temp.expect_fail($q$select purge_expired_stories()$q$, 'authenticated calls purge_expired_stories');
reset role;
set role anon;
select pg_temp.expect_fail($q$select purge_expired_stories()$q$, 'anon calls purge_expired_stories');
reset role;
set role service_role;
do $$ declare n int; begin
  select count(*) into n from purge_expired_stories() as t(path) where path = '00000000-0000-0000-0000-0000000000e1/old.png';
  assert n = 1, 'service_role purge returns the expired storage path';
  assert (select count(*) from purge_expired_stories()) = 0, 'purge is idempotent';
end $$;
reset role;
do $$ begin assert (select count(*) from stories) = 1, 'active story survives purge'; end $$;
-- 10 active stories per user
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
do $$ declare i int; begin
  for i in 1..11 loop insert into storage.objects (bucket_id, name) values ('community-media', '00000000-0000-0000-0000-0000000000b1/s' || i || '.png'); end loop;
  for i in 1..10 loop perform create_story('00000000-0000-0000-0000-0000000000b1/s' || i || '.png', ''); end loop;
  begin perform create_story('00000000-0000-0000-0000-0000000000b1/s11.png', ''); assert false, 'story limit not enforced';
  exception when others then if sqlerrm <> 'story limit reached' then raise; end if; end;
end $$;
reset role;
-- expired stories do not count towards the limit
update stories set created_at = now() - interval '30 hours', expires_at = now() - interval '7 hours' where image_path = '00000000-0000-0000-0000-0000000000b1/s1.png';
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
select create_story('00000000-0000-0000-0000-0000000000b1/s11.png', 'fits again');
reset role;

-- ---------- anon has no access to any new table / function ----------
set role anon;
select pg_temp.expect_fail($q$select * from language_profiles$q$, 'anon language_profiles');
select pg_temp.expect_fail($q$select * from posts$q$, 'anon posts');
select pg_temp.expect_fail($q$select * from post_images$q$, 'anon post_images');
select pg_temp.expect_fail($q$select * from post_likes$q$, 'anon post_likes');
select pg_temp.expect_fail($q$select * from post_comments$q$, 'anon post_comments');
select pg_temp.expect_fail($q$select * from stories$q$, 'anon stories');
select pg_temp.expect_fail($q$insert into language_profiles (user_id, target_language) values (gen_random_uuid(), 'Tamil')$q$, 'anon insert language_profiles');
select pg_temp.expect_fail($q$select * from storage.objects$q$, 'anon storage.objects');
select pg_temp.expect_fail($q$select create_language_room('chat', 'Anon Room', 'Tamil', '', 'public')$q$, 'anon create_language_room');
select pg_temp.expect_fail($q$select * from language_rooms('chat')$q$, 'anon language_rooms');
select pg_temp.expect_fail($q$select voice_join(gen_random_uuid())$q$, 'anon voice_join');
select pg_temp.expect_fail($q$select create_post('x', 'public', null, null)$q$, 'anon create_post');
select pg_temp.expect_fail($q$select update_post(gen_random_uuid(), 'x', 'public')$q$, 'anon update_post');
select pg_temp.expect_fail($q$select * from community_feed()$q$, 'anon community_feed');
select pg_temp.expect_fail($q$select create_story('a/b.png', '')$q$, 'anon create_story');
select pg_temp.expect_fail($q$select can_view_post(gen_random_uuid())$q$, 'anon can_view_post');
select pg_temp.expect_fail($q$select can_view_media('a/b.png')$q$, 'anon can_view_media');
reset role;
-- authenticated users cannot touch tables they have no grant on
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
select pg_temp.expect_fail($q$insert into post_images (post_id, path) values (gen_random_uuid(), 'x')$q$, 'direct post_images insert');
select pg_temp.expect_fail($q$update groups set max_participants = 50$q$, 'direct groups update');
select pg_temp.expect_fail($q$insert into groups (type, category, name) values ('chat', 'languages', 'Direct Insert')$q$, 'direct groups insert');
reset role;

\echo ALL_SQL_TESTS_PASSED
