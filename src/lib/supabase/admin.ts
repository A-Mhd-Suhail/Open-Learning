import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

/** Service-role client. Bypasses RLS: use ONLY after verifying the caller server-side. */
export function createAdminClient() {
  return createClient(serverEnv("NEXT_PUBLIC_SUPABASE_URL"), serverEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
