"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, RotateCw, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, PublicProfile } from "@/lib/groups";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type Names = Record<string, Pick<PublicProfile, "display_name" | "student_id" | "avatar_url">>;
type Pending = { key: string; body: string; created_at: string; status: "sending" | "failed" };
const PAGE = 50;

const timeFmt = new Intl.DateTimeFormat("en-IN", { timeStyle: "short", timeZone: "Asia/Kolkata" });
const dayFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
const fmtTime = (iso: string) => timeFmt.format(new Date(iso));
const fmtFull = (iso: string) => `${dayFmt.format(new Date(iso))}, ${timeFmt.format(new Date(iso))}`;

export function ChatRoom({ groupId, userId, variant, initialMessages, initialNames, hasMoreInitial }: {
  groupId: string; userId: string; variant: "chat" | "discussion"; initialMessages: ChatMessage[]; initialNames: Names; hasMoreInitial: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [pending, setPending] = useState<Pending[]>([]);
  const [names, setNames] = useState<Names>(initialNames);
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [live, setLive] = useState<"connecting" | "live" | "offline">("connecting");
  const scroller = useRef<HTMLDivElement>(null);
  const namesRef = useRef(names);
  const lastIdRef = useRef(initialMessages.at(-1)?.id ?? 0);
  const stick = useRef(true);
  const restore = useRef<number | null>(null);
  useEffect(() => { namesRef.current = names; }, [names]);

  const loadNames = useCallback(async (ids: string[]) => {
    const missing = [...new Set(ids)].filter((i) => !namesRef.current[i]);
    if (!missing.length) return;
    const { data } = await createClient().from("public_profiles").select("id, display_name, student_id, avatar_url").in("id", missing);
    if (data) setNames((n) => ({ ...n, ...Object.fromEntries(data.map((p) => [p.id, p])) }));
  }, []);

  /** De-duplicates by id, so the realtime echo and the insert response can both arrive safely. */
  const add = useCallback((m: ChatMessage) => {
    if (m.id > lastIdRef.current) lastIdRef.current = m.id;
    setMessages((l) => (l.some((x) => x.id === m.id) ? l : [...l, m].sort((a, b) => a.id - b.id)));
    void loadNames([m.user_id]);
  }, [loadNames]);

  useEffect(() => {
    const supabase = createClient();
    let ch: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    let wasOffline = false;
    (async () => {
      // Hand the user's JWT to Realtime BEFORE subscribing; otherwise RLS is evaluated as anon and events arrive as 401.
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) await supabase.realtime.setAuth(session.access_token);
      if (cancelled) return;
      ch = supabase.channel(`room:${groupId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` }, (p) => {
          const row = p.new as ChatMessage;
          if (row?.id) add(row);
        })
        .subscribe(async (s) => {
          if (cancelled) return;
          if (s === "SUBSCRIBED") {
            setLive("live");
            if (wasOffline) { // fill any gap while disconnected
              const { data } = await supabase.from("messages").select("*").eq("group_id", groupId).gt("id", lastIdRef.current).order("id").limit(200);
              (data as ChatMessage[] | null)?.forEach(add);
              wasOffline = false;
            }
          } else if (s === "CLOSED" || s === "CHANNEL_ERROR" || s === "TIMED_OUT") { wasOffline = true; setLive("offline"); }
          else setLive("connecting");
        });
    })();
    return () => { cancelled = true; if (ch) void supabase.removeChannel(ch); };
  }, [groupId, add]);

  // Keep the view pinned to the newest message, or keep position after loading earlier ones.
  useLayoutEffect(() => {
    const el = scroller.current; if (!el) return;
    if (restore.current !== null) { el.scrollTop = el.scrollHeight - restore.current; restore.current = null; }
    else if (stick.current) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  async function post(key: string, body: string) {
    const { data, error } = await createClient().from("messages").insert({ group_id: groupId, user_id: userId, body }).select().single();
    if (error || !data) {
      setPending((l) => l.map((p) => (p.key === key ? { ...p, status: "failed" } : p)));
      return;
    }
    add(data as ChatMessage);
    setPending((l) => l.filter((p) => p.key !== key));
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    const key = crypto.randomUUID();
    stick.current = true; setText("");
    setPending((l) => [...l, { key, body, created_at: new Date().toISOString(), status: "sending" }]);
    void post(key, body);
  }
  function retry(p: Pending) {
    setPending((l) => l.map((x) => (x.key === p.key ? { ...x, status: "sending" } : x)));
    void post(p.key, p.body);
  }
  const discard = (key: string) => setPending((l) => l.filter((p) => p.key !== key));

  async function loadEarlier() {
    const oldest = messages[0]; if (!oldest || loadingMore) return;
    setLoadingMore(true); setLoadError(null);
    const { data, error } = await createClient().from("messages").select("*").eq("group_id", groupId).lt("id", oldest.id).order("id", { ascending: false }).limit(PAGE);
    setLoadingMore(false);
    if (error) return setLoadError("Could not load earlier messages. Try again.");
    const rows = ((data ?? []) as ChatMessage[]).reverse();
    stick.current = false;
    restore.current = scroller.current?.scrollHeight ?? null;
    setHasMore((data ?? []).length === PAGE);
    setMessages((l) => [...rows, ...l.filter((x) => !rows.some((r) => r.id === x.id))]);
    void loadNames(rows.map((r) => r.user_id));
  }

  const dot = live === "live" ? "bg-success" : live === "offline" ? "bg-destructive" : "bg-accent";
  const label = live === "live" ? "Live" : live === "offline" ? "Reconnecting… messages still send" : "Connecting…";
  const empty = messages.length === 0 && pending.length === 0;

  const dayOf = (iso: string) => dayFmt.format(new Date(iso));
  const rows = messages.map((m, i) => ({ m, newDay: i === 0 || dayOf(messages[i - 1].created_at) !== dayOf(m.created_at) }));

  return (
    <section className="flex h-[calc(100dvh-13rem)] min-h-[360px] flex-col rounded-lg border border-border bg-card sm:h-[70dvh] sm:min-h-[420px]" aria-label="Conversation">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2" role="status"><span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />{label}</span>
      </div>
      <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4" role="log" aria-live="polite" aria-relevant="additions" aria-label="Messages"
        onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}>
        {hasMore && (
          <div className="mb-4 text-center">
            <Button variant="secondary" onClick={loadEarlier} disabled={loadingMore}>
              {loadingMore ? <><Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />Loading…</> : "Load earlier messages"}
            </Button>
            {loadError && <p role="alert" className="mt-2 text-sm text-destructive">{loadError}</p>}
          </div>
        )}
        {empty && <p className="py-16 text-center text-muted-foreground">No messages yet. Start the conversation.</p>}
        <ul className={variant === "discussion" ? "space-y-4" : "space-y-3"}>
          {rows.map(({ m, newDay }) => {
            const who = names[m.user_id]; const mine = m.user_id === userId; const nm = who?.display_name ?? "Student";
            return (
              <li key={m.id}>
                {newDay && <p className="mb-3 mt-1 text-center text-xs font-medium text-muted-foreground"><time dateTime={m.created_at}>{dayOf(m.created_at)}</time></p>}
                {variant === "discussion" ? (
                  <div className="flex gap-3 rounded-md border border-border bg-background p-4">
                    <Avatar name={nm} src={who?.avatar_url} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm"><strong>{nm}</strong> <span className="font-mono text-xs text-muted-foreground">{who?.student_id}</span> <time dateTime={m.created_at} className="ml-2 text-xs text-muted-foreground">{fmtFull(m.created_at)}</time></p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm">{m.body}</p>
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                    {!mine && <Avatar name={nm} src={who?.avatar_url} size="sm" />}
                    <div className={`max-w-[80%] rounded-lg px-3.5 py-2 text-sm ${mine ? "bg-primary text-on-primary" : "bg-muted"}`}>
                      {!mine && <p className="text-xs font-bold">{nm}</p>}
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <time dateTime={m.created_at} title={fmtFull(m.created_at)} className={`mt-1 block text-xs ${mine ? "opacity-90" : "text-muted-foreground"}`}>{fmtTime(m.created_at)}</time>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
          {pending.map((p) => (
            <li key={p.key} className={variant === "discussion" ? "" : "flex justify-end"}>
              <div className={`max-w-[80%] rounded-lg px-3.5 py-2 text-sm ${variant === "discussion" ? "max-w-full border border-border bg-background" : "bg-primary text-on-primary"} ${p.status === "sending" ? "opacity-70" : ""}`}>
                <p className="whitespace-pre-wrap break-words">{p.body}</p>
                {p.status === "sending" ? (
                  <p className="mt-1 text-xs opacity-90">Sending…</p>
                ) : (
                  <p role="alert" className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold"><AlertCircle size={12} aria-hidden="true" />Not sent</span>
                    <button type="button" onClick={() => retry(p)} className="inline-flex min-h-6 cursor-pointer items-center gap-1 underline"><RotateCw size={11} aria-hidden="true" />Retry</button>
                    <button type="button" onClick={() => discard(p.key)} className="min-h-6 cursor-pointer underline">Discard</button>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={send} className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <label htmlFor="msg" className="sr-only">Message</label>
          <textarea id="msg" value={text} onChange={(e) => setText(e.target.value)} rows={variant === "discussion" ? 3 : 1} maxLength={2000} placeholder={variant === "discussion" ? "Share a question or idea…" : "Type a message…"}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && variant === "chat") { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
            className="min-h-11 min-w-0 flex-1 resize-none rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm" />
          <Button type="submit" disabled={!text.trim()} aria-label="Send message"><Send size={16} aria-hidden="true" /><span className="hidden sm:inline">Send</span></Button>
        </div>
      </form>
    </section>
  );
}
