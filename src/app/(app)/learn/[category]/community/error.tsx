"use client";
import { useParams } from "next/navigation";
import { RouteError } from "@/components/app/RouteError";

export default function CommunityError(props: { error: Error & { digest?: string }; reset: () => void }) {
  const { category } = useParams<{ category: string }>();
  return <RouteError {...props} title="Community could not load" backHref={`/learn/${category}`} backLabel="Back to Language Learning" />;
}
