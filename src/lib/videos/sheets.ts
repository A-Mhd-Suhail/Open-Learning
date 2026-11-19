import "server-only";
import { createSign } from "node:crypto";
import { serverEnvOptional } from "@/lib/env";
import { ImportInputError, MAX_ROWS } from "./xlsx";
import { mapHeaders, type RawRow } from "./validate";
import { deriveFields, examFromTab } from "./derive";

/** Strict allow-list: only https://docs.google.com/spreadsheets/d/<id>/… . Anything else is rejected. */
const SHEET_URL = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([A-Za-z0-9_-]{20,100})(?:[/?#].*)?$/;

export function parseSheetUrl(input: string): string {
  const m = input.trim().match(SHEET_URL);
  if (!m || input.length > 500) throw new ImportInputError("That is not a Google Sheets link (expected https://docs.google.com/spreadsheets/d/…).");
  return m[1];
}

async function serviceAccountToken(): Promise<string | null> {
  const email = serverEnvOptional("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const key = serverEnvOptional("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  if (!email || !key) return null;
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: email, scope: "https://www.googleapis.com/auth/spreadsheets.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3000 })}`;
  const sig = createSign("RSA-SHA256").update(unsigned).sign(key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new ImportInputError("Google service account authentication failed.");
  return ((await res.json()) as { access_token: string }).access_token;
}

/** Server-side read of the first worksheet via the Sheets API (fixed host; only the validated id is interpolated). */
export async function fetchSheetRows(sheetId: string): Promise<{ rows: RawRow[]; headerErrors: string[] }> {
  const apiKey = serverEnvOptional("GOOGLE_SHEETS_API_KEY");
  const token = await serviceAccountToken();
  if (!token && !apiKey) throw new ImportInputError("Google Sheets access is not configured on the server (set GOOGLE_SERVICE_ACCOUNT_* or GOOGLE_SHEETS_API_KEY).");
  const meta = await sheetsGet(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title`, token, apiKey);
  const title = (meta as { sheets?: { properties: { title: string } }[] }).sheets?.[0]?.properties.title;
  if (!title) throw new ImportInputError("The spreadsheet has no sheets.");
  const range = encodeURIComponent(`${title}!A1:Z${MAX_ROWS + 1}`);
  const data = (await sheetsGet(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`, token, apiKey)) as { values?: string[][] };
  const values = data.values ?? [];
  if (values.length === 0) throw new ImportInputError("The sheet is empty.");
  const { map, errors } = mapHeaders(values[0], { derive: true });
  const rows: RawRow[] = values.slice(1).map((r) => {
    const rec: RawRow = {};
    map.forEach((col, i) => { const t = (r[i] ?? "").toString().trim(); if (t) rec[col] = t; });
    return rec;
  });
  while (rows.length && Object.keys(rows[rows.length - 1]).length === 0) rows.pop();
  const exam = examFromTab(title);
  rows.forEach((r) => deriveFields(r, exam));
  return { rows, headerErrors: errors };
}

export { deriveFields, examFromTab } from "./derive";

async function sheetsGet(url: string, token: string | null, apiKey: string | undefined): Promise<unknown> {
  const u = new URL(url);
  if (!token && apiKey) u.searchParams.set("key", apiKey);
  const res = await fetch(u, { headers: token ? { authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(10_000), redirect: "error" });
  if (res.status === 403 || res.status === 404) throw new ImportInputError("Cannot read the sheet. Share it with the service account (Viewer) or set it to 'Anyone with the link can view'.");
  if (!res.ok) throw new ImportInputError("Google Sheets returned an error. Try again.");
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > 10 * 1024 * 1024) throw new ImportInputError("Sheet response is too large.");
  return res.json();
}
