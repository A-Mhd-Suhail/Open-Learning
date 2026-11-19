"use client";
import { RouteError } from "@/components/app/RouteError";

export default function AdminError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="Admin page could not load" backHref="/dashboard" backLabel="Back to dashboard" />;
}
