import { GraduationCap, LayoutDashboard, Languages, MessagesSquare, Shield, User, UserRound, Video, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; /** Short label for the mobile tab bar. */ short?: string };

export type PathCategory = "school" | "jee" | "neet";

/** Primary destinations. Only features that exist. Admin is appended for admins. */
export function primaryNav(isAdmin: boolean): NavItem[] {
  return [
    { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
    { href: "/learn", label: "Learn", icon: GraduationCap },
    { href: "/learn/languages", label: "Language Learning", short: "Language", icon: Languages },
    { href: "/profile", label: "Profile", icon: User },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];
}

/** Shortcuts for the student's current learning path. */
export function jumpTo(category: PathCategory): NavItem[] {
  return [
    { href: `/learn/${category}/self-learning/videos`, label: "Video library", icon: Video },
    { href: `/learn/${category}/friends`, label: "Study groups", icon: UserRound },
    { href: "/learn/languages/community", label: "Community", icon: MessagesSquare },
  ];
}

/** Exact-or-descendant match; "Learn" does not claim the Language Learning subtree. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/learn") {
    return (pathname === "/learn" || pathname.startsWith("/learn/")) && pathname !== "/learn/languages" && !pathname.startsWith("/learn/languages/");
  }
  return pathname === href || pathname.startsWith(href + "/");
}
