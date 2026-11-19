"use client";
import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Link2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type Issue = { row: number; video_id: string; problems: string[] };
type Preview = { totalRows: number; headerErrors: string[]; issues: Issue[]; issueCount: number; willCreate: number; willUpdate: number; rows: { row: number; video_id: string; title: string; exam: string; subject: string; chapter: string; action: string }[] };
type Report = { totalRows: number; created: number; updated: number; skipped: number; issues: Issue[] };

export function VideoImporter() {
  const [mode, setMode] = useState<"xlsx" | "sheet">("sheet");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<null | "preview" | "import">(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const ready = mode === "xlsx" ? !!file : url.trim().length > 0;
  const form = () => { const f = new FormData(); if (mode === "xlsx" && file) f.set("file", file); else f.set("sheetUrl", url.trim()); return f; };

  async function run(kind: "preview" | "import") {
    setBusy(kind); setError(null); if (kind === "preview") { setPreview(null); setReport(null); }
    try {
      const res = await fetch(`/api/admin/videos/${kind}`, { method: "POST", body: form() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      if (kind === "preview") setPreview(data); else { setReport(data); setPreview(null); }
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setBusy(null); }
  }

  const tab = (m: "xlsx" | "sheet", label: string, Icon: typeof Link2) => (
    <button type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setPreview(null); setReport(null); setError(null); }}
      className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-semibold ${mode === m ? "bg-primary text-on-primary" : "text-muted-foreground hover:bg-muted"}`}><Icon size={16} aria-hidden="true" />{label}</button>
  );

  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-6" aria-labelledby="imp">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="imp" className="text-lg font-bold">Import videos</h2>
        <a href="/api/admin/videos/template" className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted"><Download size={16} aria-hidden="true" />Download Excel template</a>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Existing Video IDs are updated; new ones are created. Invalid rows are skipped and reported.</p>
      <div role="tablist" aria-label="Import source" className="mt-4 flex gap-2">{tab("sheet", "Google Sheet", Link2)}{tab("xlsx", "Excel file", FileSpreadsheet)}</div>
      <div className="mt-4">
        {mode === "sheet" ? (
          <>
            <label htmlFor="sheet-url" className="block text-sm font-semibold">Google Sheets link</label>
            <input id="sheet-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" className="mt-2 h-12 w-full rounded-md border border-border bg-background px-4 text-sm" />
            <p className="mt-1 text-xs text-muted-foreground">The first worksheet is read on the server. The sheet must be shared with the platform&apos;s Google service account (Viewer) or be link-viewable.</p>
          </>
        ) : (
          <>
            <label htmlFor="xlsx" className="block text-sm font-semibold">Excel file (.xlsx, max 4 MB)</label>
            <input ref={fileRef} id="xlsx" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full cursor-pointer rounded-md border border-border bg-background p-3 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:font-semibold" />
          </>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="secondary" disabled={!ready || busy !== null} onClick={() => run("preview")}>{busy === "preview" ? "Validating…" : "Preview & validate"}</Button>
        <Button disabled={!ready || busy !== null || !preview || preview.headerErrors.length > 0 || preview.willCreate + preview.willUpdate === 0} onClick={() => run("import")}>
          <Upload size={16} aria-hidden="true" />{busy === "import" ? "Importing…" : "Import valid rows"}</Button>
      </div>
      {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-md border border-destructive/40 p-3 text-sm text-destructive"><AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</p>}

      {preview && (
        <div className="mt-6" aria-live="polite">
          {preview.headerErrors.length > 0 ? (
            <ul className="space-y-1 text-sm text-destructive">{preview.headerErrors.map((h) => <li key={h}>{h}</li>)}</ul>
          ) : (
            <>
              <p className="text-sm"><strong>{preview.totalRows}</strong> rows · <span className="text-success font-semibold">{preview.willCreate} new</span> · <span className="font-semibold">{preview.willUpdate} updates</span> · <span className="text-destructive font-semibold">{preview.issueCount} invalid</span></p>
              {preview.issues.length > 0 && <IssueList issues={preview.issues} />}
              {preview.rows.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-md border border-border">
                  <table className="w-full min-w-[560px] text-left text-sm"><caption className="sr-only">Rows that will be imported</caption>
                    <thead className="border-b border-border text-muted-foreground"><tr>{["Row", "Video ID", "Title", "Exam", "Subject", "Chapter", "Action"].map((h) => <th key={h} scope="col" className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
                    <tbody>{preview.rows.map((r) => <tr key={r.row} className="border-b border-border last:border-0"><td className="px-3 py-2">{r.row}</td><td className="px-3 py-2 font-mono">{r.video_id}</td><td className="px-3 py-2">{r.title}</td><td className="px-3 py-2">{r.exam}</td><td className="px-3 py-2">{r.subject}</td><td className="px-3 py-2">{r.chapter}</td><td className="px-3 py-2 capitalize">{r.action}</td></tr>)}</tbody>
                  </table>
                  {preview.willCreate + preview.willUpdate > preview.rows.length && <p className="p-3 text-xs text-muted-foreground">Showing first {preview.rows.length} valid rows.</p>}
                </div>
              )}
            </>
          )}
        </div>
      )}
      {report && (
        <div className="mt-6 rounded-md border border-border p-4" role="status">
          <p className="flex items-center gap-2 font-semibold"><CheckCircle2 size={18} className="text-success" aria-hidden="true" />Import complete</p>
          <p className="mt-1 text-sm">{report.totalRows} rows · {report.created} created · {report.updated} updated · {report.skipped} skipped</p>
          {report.issues.length > 0 && <IssueList issues={report.issues} />}
        </div>
      )}
    </section>
  );
}

function IssueList({ issues }: { issues: Issue[] }) {
  return (
    <details className="mt-3 rounded-md border border-border p-3 text-sm">
      <summary className="cursor-pointer font-semibold text-destructive">{issues.length} rows with problems</summary>
      <ul className="mt-2 max-h-64 space-y-1 overflow-auto">{issues.map((i) => <li key={i.row}><span className="font-mono">Row {i.row}{i.video_id ? ` (${i.video_id})` : ""}</span>: {i.problems.join("; ")}</li>)}</ul>
    </details>
  );
}
