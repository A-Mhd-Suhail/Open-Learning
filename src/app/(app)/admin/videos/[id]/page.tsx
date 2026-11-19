import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { VideoForm } from "../VideoForm";
import type { Video } from "@/lib/videos/types";

export const metadata: Metadata = { title: "Edit video · Admin" };

export default async function EditVideo({ params }: PageProps<"/admin/videos/[id]">) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data } = await supabase.from("videos").select("*").eq("id", id).single<Video>();
  if (!data) notFound();
  return (<><PageHeader title="Edit video" crumbs={[{ label: "Admin", href: "/admin" }, { label: "Videos", href: "/admin/videos" }, { label: data.video_id }]} /><VideoForm video={data} /></>);
}
