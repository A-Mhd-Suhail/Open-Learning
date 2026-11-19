"use server";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { isLanguageCategory } from "@/lib/categories";
import { groupPath, isUuid } from "@/lib/groups";
import { parseRoomForm, roomErrorMessage } from "@/lib/language/room-schema";

export type RoomActionState = { error?: string };
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

export async function createLanguageRoomAction(_p: RoomActionState, fd: FormData): Promise<RoomActionState> {
  if (!isLanguageCategory(str(fd, "category"))) return { error: "Invalid request." };
  const parsed = parseRoomForm({
    kind: str(fd, "kind"), name: str(fd, "name"), language: str(fd, "language"),
    description: str(fd, "description"), visibility: str(fd, "visibility") || "public", max: str(fd, "max"),
  });
  if (!parsed.ok) return { error: parsed.error };
  const v = parsed.value;
  const { supabase } = await requireSession();
  const { data, error } = await supabase.rpc("create_language_room", {
    p_type: v.kind, p_name: v.name, p_language: v.language, p_description: v.description, p_visibility: v.visibility, p_max: v.max,
  });
  if (error || !data) return { error: roomErrorMessage(error?.message ?? "") };
  redirect(groupPath("languages", v.kind, data as string));
}

export async function joinLanguageRoomAction(fd: FormData): Promise<void> {
  const kind = str(fd, "kind"), id = str(fd, "id");
  if (!isLanguageCategory(str(fd, "category")) || (kind !== "chat" && kind !== "voice") || !isUuid(id)) return;
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("join_group", { p_group: id });
  if (error) redirect(`/learn/languages/${kind}?error=join`);
  redirect(groupPath("languages", kind, id));
}
