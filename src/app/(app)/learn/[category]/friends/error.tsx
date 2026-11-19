"use client";
import { useParams } from "next/navigation";
import { RouteError } from "@/components/app/RouteError";

export default function FriendsError(props: { error: Error & { digest?: string }; reset: () => void }) {
  const { category } = useParams<{ category: string }>();
  return <RouteError {...props} title="Study groups could not load" backHref={`/learn/${category}`} backLabel="Back to learning path" />;
}
