import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Manrope } from "next/font/google";
import "./globals.css";

const display = Bodoni_Moda({
  variable: "--font-display-face",
  subsets: ["latin"],
  display: "swap",
});
const body = Manrope({
  variable: "--font-body-face",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Open Learning", template: "%s · Open Learning" },
  description:
    "Open Learning connects students to learn, share knowledge and grow together: a free video library for School, JEE and NEET, study groups, friends, and voice and chat rooms.",
  openGraph: { title: "Open Learning", description: "Connecting Students. Empowering Every Learner.", type: "website", siteName: "Open Learning" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("ol_theme");if(!t&&matchMedia("(prefers-color-scheme: dark)").matches)t="dark";if(t==="dark")document.documentElement.dataset.theme="dark"}catch(e){}` }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
