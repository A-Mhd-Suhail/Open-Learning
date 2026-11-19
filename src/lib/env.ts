import "server-only";

export function serverEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return v;
}

export function serverEnvOptional(name: string): string | undefined {
  return process.env[name] || undefined;
}
