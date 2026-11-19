import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { VideoForm } from "../VideoForm";

export const metadata: Metadata = { title: "Add video · Admin" };

export default async function NewVideo() {
  await requireAdmin();
  return (<><PageHeader title="Add video" crumbs={[{ label: "Admin", href: "/admin" }, { label: "Videos", href: "/admin/videos" }, { label: "Add" }]} backHref="/admin/videos" /><VideoForm /></>);
}
