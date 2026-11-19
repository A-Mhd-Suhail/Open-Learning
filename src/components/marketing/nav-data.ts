import { BookOpen, Languages, MessageSquare, Mic, Newspaper, Route, UserPlus, Users, Workflow, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; description: string; icon: LucideIcon };
export type NavGroup = { id: string; label: string; blurb: string; note?: string; items: NavItem[] };

/** Every destination is a real route. Pages inside the app ask signed-out visitors to sign in first. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "learn",
    label: "Learn",
    blurb: "A free video library and a place to practise languages.",
    note: "Opens after you sign in.",
    items: [
      { href: "/learn/school/self-learning/videos", label: "Video library", description: "School, JEE and NEET lessons by class, subject and chapter.", icon: BookOpen },
      { href: "/learn/languages", label: "Language Learning", description: "Practise speaking, chat in rooms and join the community.", icon: Languages },
    ],
  },
  {
    id: "community",
    label: "Community",
    blurb: "Study with other students instead of alone.",
    note: "Opens after you sign in.",
    items: [
      { href: "/learn/school/friends", label: "Study groups", description: "Discussion, chat and voice for each path, with invite links.", icon: Users },
      { href: "/learn/school/friends/my-friends", label: "Friends", description: "Find classmates by Student ID, add them and call.", icon: UserPlus },
      { href: "/learn/languages/voice", label: "Voice and chat rooms", description: "Live rooms for language practice.", icon: Mic },
      { href: "/learn/languages/community", label: "Community feed and stories", description: "Posts, likes, comments and stories.", icon: Newspaper },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    blurb: "What Open Learning is and how to start.",
    items: [
      { href: "/#features", label: "What you can do", description: "Everything that is live today.", icon: MessageSquare },
      { href: "/#how-it-works", label: "How it works", description: "Sign in with Google and get your Student ID.", icon: Workflow },
      { href: "/#paths", label: "Learning paths", description: "School, JEE, NEET and Language Learning.", icon: Route },
    ],
  },
];
