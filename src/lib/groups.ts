import { MessageCircle, MessagesSquare, Mic, type LucideIcon } from "lucide-react";
import { isLearningCategory, type LearningCategory } from "@/lib/categories";

export const KINDS = ["discussion", "chat", "voice"] as const;
export type Kind = (typeof KINDS)[number];

export const KIND_INFO: Record<Kind, { title: string; blurb: string; icon: LucideIcon }> = {
  discussion: { title: "Group Discussion", blurb: "Long-form topic threads to work through doubts together.", icon: MessagesSquare },
  chat: { title: "Group Chat", blurb: "Fast, casual chat with your study group.", icon: MessageCircle },
  voice: { title: "Group Voice", blurb: "Talk live in a voice room.", icon: Mic },
};

export function isKind(v: string): v is Kind {
  return (KINDS as readonly string[]).includes(v);
}
export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export type Group = {
  id: string; type: Kind; category: LearningCategory; language: string | null; max_participants: number | null; name: string; description: string;
  visibility: "public" | "private"; invite_code: string; is_general: boolean; created_by: string | null; created_at: string;
};
export type ChatMessage = { id: number; group_id: string; user_id: string; body: string; created_at: string };
export type PublicProfile = { id: string; student_id: string; display_name: string; avatar_url: string | null; category: string | null; created_at: string };

export const groupPath = (category: string, kind: Kind, id?: string) =>
  `/learn/${category}/friends/${kind}${id ? `/${id}` : ""}`;

export function parseScope(category: string, kind: string): { category: LearningCategory; kind: Kind } | null {
  return isLearningCategory(category) && isKind(kind) ? { category, kind } : null;
}
