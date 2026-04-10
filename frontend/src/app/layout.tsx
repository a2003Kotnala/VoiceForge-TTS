import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";

import { Toaster } from "sonner";

import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "VoiceForge",
  description:
    "VoiceForge is a production-ready text-to-speech workspace with voice controls, history, playback, and deployable frontend/backend infrastructure."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${bodyFont.variable} ${displayFont.variable}`} lang="en">
      <body className="min-h-screen bg-[var(--page-bg)] font-sans text-slate-950 antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
