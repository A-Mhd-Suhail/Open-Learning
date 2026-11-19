/** Which external services are configured. Safe to import anywhere (reads presence only, never values). */
const has = (v: string | undefined) => !!v && v.trim().length > 0;

export const supabaseConfigured = () =>
  has(process.env.NEXT_PUBLIC_SUPABASE_URL) && has(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const serviceRoleConfigured = () => has(process.env.SUPABASE_SERVICE_ROLE_KEY);
export const livekitConfigured = () =>
  has(process.env.LIVEKIT_URL) && has(process.env.LIVEKIT_API_KEY) && has(process.env.LIVEKIT_API_SECRET);
export const sheetsConfigured = () =>
  has(process.env.GOOGLE_SHEETS_API_KEY) ||
  (has(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) && has(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY));
