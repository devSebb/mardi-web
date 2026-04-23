import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://project-mardi.com";
const TITLE = "MARDI — a second brain that lives in the corner of your screen.";
const DESCRIPTION =
  "Local-first memory for your Mac. Save URLs, snippets, commands, and notes into a markdown vault you control.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "MARDI",
  authors: [{ name: "devSebb", url: "https://github.com/devSebb" }],
  creator: "devSebb",
  keywords: [
    "MARDI", "project mardi", "second brain", "macOS",
    "Obsidian", "knowledge capture", "hot corner",
    "semantic search", "local-first", "markdown vault",
  ],
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/`,
    siteName: "MARDI",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@devSebb",
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: "#08070b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full relative bg-ink text-bone font-mono antialiased selection:bg-pink selection:text-ink">
        {children}
      </body>
    </html>
  );
}
