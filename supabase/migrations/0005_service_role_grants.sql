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
