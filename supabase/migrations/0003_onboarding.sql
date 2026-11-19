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
