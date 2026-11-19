import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display-face",
  subsets: ["latin"],
  display: "swap",
});
const body = Public_Sans({
  variable: "--font-body-face",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Open Learning", template: "%s · Open Learning" },
  description:
    "Learn anything. Learn together. Videos, study groups and friends for School, JEE and NEET.",
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
