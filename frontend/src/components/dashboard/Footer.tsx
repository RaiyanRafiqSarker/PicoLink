"use client";

import React from "react";

export default function Footer() {
  return (
    <footer
      suppressHydrationWarning
      className="w-full bg-white/95 dark:bg-[#080d1a]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/80 py-3.5 px-6 sm:px-8 select-none transition-colors shrink-0 z-20"
    >
      <div
        suppressHydrationWarning
        className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-tight text-slate-900 dark:text-white">
            PicoLink
          </span>
          <span className="text-slate-300 dark:text-slate-600 font-light">|</span>
          <span className="text-slate-600 dark:text-slate-400">
            Powered by{" "}
            <a
              href="https://raktch.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Raktch Technology &amp; Software.
            </a>
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span className="font-mono tracking-tight">Enterprise URL Shortener</span>
        </div>
      </div>
    </footer>
  );
}
