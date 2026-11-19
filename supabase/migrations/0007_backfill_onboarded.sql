-- Google-first onboarding: a profile is "complete" when onboarded_at is set (only the service role can set it).
-- Every profile that exists before this flow ships is an existing student: mark it complete so nobody is
-- asked for their name again. Student IDs are untouched. Safe to re-run (only touches rows still NULL).
-- Runs as the migration owner, so the guard trigger (which only restricts authenticated/anon) does not interfere.
update public.profiles set onboarded_at = created_at where onboarded_at is null;
