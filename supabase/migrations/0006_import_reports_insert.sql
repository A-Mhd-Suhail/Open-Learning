-- Admin imports run as the signed-in admin (RLS applies), but import_reports only had SELECT,
-- so the audit row was silently rejected. Allow admins to insert their own reports.
grant insert on public.import_reports to authenticated;
create policy import_reports_admin_insert on public.import_reports for insert to authenticated
  with check (public.is_admin() and admin_id = auth.uid());
