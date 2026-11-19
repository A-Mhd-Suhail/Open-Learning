"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cloneElement, isValidElement } from "react";

/** Marks the call ended in the database when the student leaves, then returns to My Friends. */
export function CallEnder({ callId, category, children }: { callId: string; category: string; children: React.ReactElement<{ onLeave?: () => void }> }) {
  const router = useRouter();
  const onLeave = async () => {
    await createClient().rpc("respond_friend_call", { p_call: callId, p_status: "ended" });
    router.push(`/learn/${category}/friends/my-friends`);
  };
  return isValidElement(children) ? cloneElement(children, { onLeave }) : null;
}
