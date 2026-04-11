import type { Metadata } from "next";
import localFont from "next/font/local";

import { Toaster } from "sonner";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-body"
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "Text to Speech",
  description:
    "Convert text into natural speech with a calm, public-facing text-to-speech interface."
};

const themeScript = `
  (function() {
    try {
      var savedTheme = window.localStorage.getItem("voiceforge-theme");
      var prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      var theme = savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : (prefersLight ? "light" : "dark");
      document.documentElement.dataset.theme = theme;
    } catch (error) {
      document.documentElement.dataset.theme = "dark";
    }
  })();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-theme="dark"
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-[color:var(--page-bg-start)] font-sans text-[color:var(--text-primary)] antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              "!border !border-[color:var(--border)] !bg-[color:var(--surface-strong)] !text-[color:var(--text-primary)] !shadow-[0_14px_50px_var(--shadow-soft)]"
          }}
        />
      </body>
    </html>
  );
}
