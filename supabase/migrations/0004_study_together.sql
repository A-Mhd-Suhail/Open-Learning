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
