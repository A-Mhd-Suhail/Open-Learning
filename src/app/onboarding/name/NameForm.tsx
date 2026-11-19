"use client";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveName, type NameState } from "./actions";

export function NameForm({ suggested }: { suggested: string }) {
  const [state, action, pending] = useActionState<NameState, FormData>(saveName, {});
  return (
    <form action={action} noValidate>
      <h1 className="text-3xl">Welcome to Open Learning</h1>
      <p className="mt-2 text-muted-foreground">Before we begin, what should we call you?</p>
      <label htmlFor="name" className="mt-8 block text-sm font-semibold">Your name</label>
      <input
        id="name" name="name" autoComplete="name" autoFocus required maxLength={60}
        defaultValue={state.value ?? suggested}
        aria-invalid={state.error ? true : undefined} aria-describedby={state.error ? "name-error" : undefined}
        className="mt-2 h-12 w-full rounded-md border border-border bg-card px-4 text-base"
        placeholder="e.g. Aarav Sharma"
      />
      <p className="mt-2 text-xs text-muted-foreground">This is the name your friends will see. You can change it later in your profile.</p>
      {state.error && <p id="name-error" role="alert" className="mt-2 text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
        {pending ? "Saving…" : <>Continue <ArrowRight size={18} aria-hidden="true" /></>}
      </Button>
    </form>
  );
}
