"use client";
import { useActionState, useId, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALL_LANGUAGES, LANGUAGES, MAX_KNOWN, OTHER_LANGUAGES, PROFICIENCY, PROFICIENCY_LABEL, isLanguageLabel, type Proficiency } from "@/lib/language/languages";
import { saveLanguageProfileAction, type ProfileFormState } from "@/app/(app)/learn/[category]/setup/actions";

type Initial = { target_language: string; known_languages: string[]; proficiency: Proficiency; discoverable: boolean };
const BLANK: Initial = { target_language: "", known_languages: [], proficiency: "beginner", discoverable: true };
const OTHER = "__other__";
const LEVEL_HINT: Record<Proficiency, string> = {
  beginner: "Just starting out", elementary: "Simple everyday phrases", intermediate: "Hold a basic conversation", advanced: "Comfortable and fluent",
};
const STEPS = ["Target language", "What you know", "Review"] as const;

const chip = "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3.5 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none hover:bg-muted has-[:checked]:border-foreground has-[:checked]:bg-primary has-[:checked]:text-on-primary has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring";
const input = "h-11 w-full rounded-md border border-border bg-background px-3 text-base sm:text-sm";

export function ProfileForm({ category, mode, initial }: { category: string; mode: "setup" | "edit"; initial?: Initial }) {
  const start = initial ?? BLANK;
  const inList = (LANGUAGES as readonly string[]).includes(start.target_language);
  const [choice, setChoice] = useState<string>(!start.target_language ? "" : inList ? start.target_language : OTHER);
  const [other, setOther] = useState(inList ? "" : start.target_language);
  const [known, setKnown] = useState<string[]>(start.known_languages);
  const [custom, setCustom] = useState("");
  const [level, setLevel] = useState<Proficiency>(start.proficiency);
  const [discoverable, setDiscoverable] = useState(start.discoverable);
  const [step, setStep] = useState(0);
  const [localError, setLocalError] = useState("");
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveLanguageProfileAction, {});
  const uid = useId();

  const target = (choice === OTHER ? other : choice).trim();
  const wizard = mode === "setup";
  const show = (n: number) => !wizard || step === n;
  const knownOptions = [...ALL_LANGUAGES.filter((l) => l.toLowerCase() !== target.toLowerCase()), ...known.filter((k) => !ALL_LANGUAGES.includes(k))];
  const error = localError || state.error;

  function validTarget() {
    if (!target) return "Choose the language you want to learn.";
    if (!isLanguageLabel(target)) return "Enter a language name (2-40 characters).";
    return "";
  }
  function next() {
    const e = step === 0 ? validTarget() : "";
    setLocalError(e);
    if (!e) setStep((s) => Math.min(2, s + 1));
  }
  function toggleKnown(l: string, on: boolean) {
    setLocalError("");
    if (on && known.length >= MAX_KNOWN) { setLocalError(`You can pick up to ${MAX_KNOWN} known languages.`); return; }
    setKnown((k) => (on ? [...k, l] : k.filter((x) => x !== l)));
  }
  function addCustom() {
    const v = custom.trim();
    if (!v) return;
    if (!isLanguageLabel(v)) { setLocalError("Enter a language name (2-40 characters)."); return; }
    if (v.toLowerCase() === target.toLowerCase()) { setLocalError("That is your target language."); return; }
    if (!known.some((k) => k.toLowerCase() === v.toLowerCase())) toggleKnown(v, true);
    setCustom("");
  }
  const cleanKnown = known.filter((k) => k.toLowerCase() !== target.toLowerCase());

  return (
    <form action={action} onSubmit={(e) => { const v = validTarget(); if (v) { e.preventDefault(); setLocalError(v); if (wizard) setStep(0); } }}
      onKeyDown={(e) => { if (wizard && e.key === "Enter" && step < 2 && (e.target as HTMLElement).tagName === "INPUT") { e.preventDefault(); if (e.target instanceof HTMLInputElement && e.target.name === "custom_known") addCustom(); else next(); } }}
      className="space-y-8" noValidate>
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="target_language" value={target} />
      {cleanKnown.map((k) => <input key={k} type="hidden" name="known_languages" value={k} />)}
      <input type="hidden" name="proficiency" value={level} />
      {discoverable && <input type="hidden" name="discoverable" value="on" />}

      {wizard && (
        <nav aria-label="Progress">
          <ol className="flex gap-2">
            {STEPS.map((s, i) => (
              <li key={s} className="flex-1" aria-current={i === step ? "step" : undefined}>
                <div className={`h-1 rounded-full ${i <= step ? "bg-accent" : "bg-border"}`} />
                <p className={`mt-2 text-xs sm:text-sm ${i === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}><span className="sr-only">Step </span>{i + 1}. {s}</p>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {show(0) && (
        <fieldset className="space-y-3">
          <legend className="font-display text-xl font-semibold">Which language do you want to learn?</legend>
          <p className="text-sm text-muted-foreground">We use this to suggest rooms, posts and learners for you.</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <label key={l} className={chip}><input type="radio" className="sr-only" name={`${uid}-t`} checked={choice === l} onChange={() => { setChoice(l); setLocalError(""); }} />{l}</label>
            ))}
            <label className={chip}><input type="radio" className="sr-only" name={`${uid}-t`} checked={choice === OTHER} onChange={() => { setChoice(OTHER); setLocalError(""); }} />Other</label>
          </div>
          {choice === OTHER && (
            <div>
              <label htmlFor={`${uid}-other`} className="mb-1.5 block text-sm font-medium">Language name</label>
              <input id={`${uid}-other`} list={`${uid}-dl`} value={other} onChange={(e) => setOther(e.target.value)} maxLength={40} autoComplete="off" placeholder="e.g. Korean" className={`${input} max-w-sm`} />
              <datalist id={`${uid}-dl`}>{OTHER_LANGUAGES.map((l) => <option key={l} value={l} />)}</datalist>
            </div>
          )}
        </fieldset>
      )}

      {show(1) && (
        <>
          <fieldset className="space-y-3">
            <legend className="font-display text-xl font-semibold">Your level in {target || "your target language"}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PROFICIENCY.map((p) => (
                <label key={p} className={`${chip} flex-col !items-start justify-center py-2`}>
                  <input type="radio" className="sr-only" name={`${uid}-p`} checked={level === p} onChange={() => setLevel(p)} />
                  <span>{PROFICIENCY_LABEL[p]}</span>
                  <span className="text-xs font-normal opacity-80">{LEVEL_HINT[p]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="font-display text-xl font-semibold">Languages you already know <span className="text-sm font-normal text-muted-foreground">(optional)</span></legend>
            <div className="flex flex-wrap gap-2">
              {knownOptions.map((l) => (
                <label key={l} className={chip}><input type="checkbox" className="sr-only" checked={known.includes(l)} onChange={(e) => toggleKnown(l, e.target.checked)} />{l}</label>
              ))}
            </div>
            <div className="flex max-w-sm gap-2">
              <label htmlFor={`${uid}-ck`} className="sr-only">Add another language</label>
              <input id={`${uid}-ck`} name="custom_known" value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={40} placeholder="Add another language" className={input} />
              <Button type="button" variant="secondary" onClick={addCustom}>Add</Button>
            </div>
            <p className="text-xs text-muted-foreground">{cleanKnown.length} of {MAX_KNOWN} selected</p>
          </fieldset>
        </>
      )}

      {show(2) && (
        <div className="space-y-5">
          {wizard && (
            <>
              <h2 className="font-display text-xl font-semibold">Review your profile</h2>
              <dl className="divide-y divide-border rounded-lg border border-border bg-card text-sm">
                {[["Learning", target || "-"], ["Level", PROFICIENCY_LABEL[level]], ["Already know", cleanKnown.length ? cleanKnown.join(", ") : "None added"]].map(([k, v]) => (
                  <div key={k} className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-4 py-3"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
              </dl>
            </>
          )}
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" checked={discoverable} onChange={(e) => setDiscoverable(e.target.checked)} className="mt-0.5 size-5 accent-primary" />
            <span><span className="font-medium">Let other learners discover me</span><br /><span className="text-muted-foreground">Your name and languages can appear in Discover learners. You can change this any time.</span></span>
          </label>
        </div>
      )}

      {error && <p role="alert" className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        {wizard && step > 0 && <Button type="button" variant="secondary" onClick={() => { setLocalError(""); setStep(step - 1); }}><ArrowLeft size={16} aria-hidden="true" />Back</Button>}
        {wizard && step < 2 ? (
          <Button key="continue" type="button" onClick={next}>Continue<ArrowRight size={16} aria-hidden="true" /></Button>
        ) : (
          <Button key="submit" type="submit" disabled={pending}>{pending ? <Loader2 size={16} className="ol-spinner" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}{wizard ? "Create my profile" : "Save changes"}</Button>
        )}
      </div>
    </form>
  );
}
