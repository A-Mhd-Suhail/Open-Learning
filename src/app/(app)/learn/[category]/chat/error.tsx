"use client";
import { RouteError } from "@/components/app/RouteError";

export default function ChatRoomsError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="Chat rooms could not load" backHref="/learn/languages" backLabel="Back to Language Learning" />;
}
