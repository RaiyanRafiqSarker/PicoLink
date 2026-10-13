import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "PicoLink — High-Performance URL Shortener & Admin Studio",
  description: "Enterprise URL Shortener powered by Django REST Framework, PostgreSQL, Redis Cache-Aside, and Next.js.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full bg-[#080d1a] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
