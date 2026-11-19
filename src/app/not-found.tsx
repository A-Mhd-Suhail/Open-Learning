import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Logo className="mb-10" />
      <h1 className="text-3xl">Page not found</h1>
      <p className="mt-3 text-muted-foreground">The page you are looking for does not exist, or you do not have access to it.</p>
      <ButtonLink href="/" className="mt-6 self-start">Back to home</ButtonLink>
    </main>
  );
}
