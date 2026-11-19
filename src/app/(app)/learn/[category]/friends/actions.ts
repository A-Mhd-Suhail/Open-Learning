"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { groupPath, isUuid, parseScope } from "@/lib/groups";

export type ActionState = { error?: string; ok?: string };
const friendly = (m: string) => (/limit/.test(m) ? "You have reached the group limit." : /3-60/.test(m) ? "Group name must be 3–60 characters." : "Something went wrong. Please try again.");

export async function createGroupAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const scope = parseScope(String(fd.get("category")), String(fd.get("kind")));
  if (!scope) return { error: "Invalid request." };
  const name = String(fd.get("name") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const visibility = fd.get("visibility") === "private" ? "private" : "public";
  if (name.length < 3 || name.length > 60) return { error: "Group name must be 3–60 characters." };
  if (description.length > 300) return { error: "Description must be at most 300 characters." };
  const { supabase } = await requireSession();
  const { data, error } = await supabase.rpc("create_group", { p_type: scope.kind, p_category: scope.category, p_name: name, p_description: description, p_visibility: visibility });
  if (error || !data) return { error: friendly(error?.message ?? "") };
  redirect(groupPath(scope.category, scope.kind, data as string));
}

export async function joinGroupAction(fd: FormData) {
  const scope = parseScope(String(fd.get("category")), String(fd.get("kind")));
  const id = String(fd.get("id"));
  if (!scope || !isUuid(id)) return;
  const { supabase } = await requireSession();
  await supabase.rpc("join_group", { p_group: id });
  redirect(groupPath(scope.category, scope.kind, id));
}

export async function leaveGroupAction(fd: FormData) {
  const scope = parseScope(String(fd.get("category")), String(fd.get("kind")));
  const id = String(fd.get("id"));
  if (!scope || !isUuid(id)) return;
  const { supabase, user } = await requireSession();
  await supabase.from("group_members").delete().eq("group_id", id).eq("user_id", user.id);
  revalidatePath("/learn", "layout");
  // Language rooms are listed under /voice and /chat; exam categories keep the existing "mine" list.
  if (scope.category === "languages" && scope.kind !== "discussion") redirect(`/learn/languages/${scope.kind}`);
  redirect(`${groupPath(scope.category, scope.kind)}/mine`);
}

export async function sendFriendRequestAction(fd: FormData) {
  const target = String(fd.get("id"));
  if (!isUuid(target)) return;
  const { supabase } = await requireSession();
  await supabase.rpc("send_friend_request", { p_target: target });
  revalidatePath("/learn", "layout");
}
export async function respondFriendRequestAction(fd: FormData) {
  const id = String(fd.get("id"));
  if (!isUuid(id)) return;
  const { supabase } = await requireSession();
  await supabase.rpc("respond_friend_request", { p_request: id, p_accept: fd.get("accept") === "1" });
  revalidatePath("/learn", "layout");
}
export async function removeFriendAction(fd: FormData) {
  const id = String(fd.get("id"));
  if (!isUuid(id)) return;
  const { supabase } = await requireSession();
  await supabase.rpc("remove_friend", { p_other: id });
  revalidatePath("/learn", "layout");
}
export async function inviteFriendAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const group = String(fd.get("group")), friend = String(fd.get("friend"));
  if (!isUuid(group) || !isUuid(friend)) return { error: "Choose a group first." };
  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("invite_friend_to_group", { p_group: group, p_friend: friend });
  return error ? { error: "Could not add this friend to that group." } : { ok: "Friend added to the group." };
}
export async function startCallAction(fd: FormData) {
  const scope = parseScope(String(fd.get("category")), "chat");
  const friend = String(fd.get("id"));
  if (!scope || !isUuid(friend)) return;
  const { supabase } = await requireSession();
  const { data, error } = await supabase.rpc("start_friend_call", { p_callee: friend });
  if (error || !data) return;
  redirect(`/learn/${scope.category}/friends/call/${data as string}`);
}
