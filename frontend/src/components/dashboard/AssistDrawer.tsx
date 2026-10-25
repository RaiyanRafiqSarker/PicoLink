"use client";

import React, { useState } from "react";
import { Sparkles, X, Plus, ArrowRight, Check, Crown, Bot } from "lucide-react";
import { toast } from "sonner";

interface AssistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onUpgradePro: () => void;
  onShortenUrl?: (url: string) => void;
}

export default function AssistDrawer({
  isOpen,
  onClose,
  currentUser,
  onUpgradePro,
  onShortenUrl,
}: AssistDrawerProps) {
  const [promptInput, setPromptInput] = useState("");
  const isPro = currentUser?.is_pro || currentUser?.subscription_tier === "pro";

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    const query = promptInput.trim();
    if (!query) return;

    if (query.startsWith("http://") || query.startsWith("https://")) {
      if (onShortenUrl) {
        onShortenUrl(query);
        toast.success("Shortening URL with PicoLink Assist...", {
          description: query,
        });
      }
      setPromptInput("");
      return;
    }

    toast.info("PicoLink Assist AI", {
      description: `Analyzing: "${query.slice(0, 45)}..."`,
    });
    setPromptInput("");
  };

  if (!isOpen) return null;

  return (
    <aside
      className="fixed top-0 right-0 z-40 w-full sm:w-96 h-screen bg-white/95 dark:bg-[#080d1a]/95 border-l border-slate-200 dark:border-slate-800 backdrop-blur-2xl shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out animate-slide-left select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 dark:border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-900 dark:text-white">PicoLink Assist</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Close Assist Drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: Value Proposition & AI Capabilities */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Visual Graphic Card */}
        <div className="relative p-6 rounded-2xl bg-slate-50 dark:bg-gradient-to-b dark:from-indigo-950/40 dark:to-slate-900 border border-slate-200 dark:border-indigo-500/20 text-center overflow-hidden shadow-sm dark:shadow-lg">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center !text-white shadow-xl shadow-indigo-500/30 mb-3">
            <Bot className="w-7 h-7 !text-white" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            {isPro ? "PicoLink Assist Active" : "Upgrade for PicoLink Assist"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Bring AI into your workflow with PicoLink Assist — from creating intelligent links to uncovering meaningful performance trends.
          </p>

          {!isPro && (
            <button
              onClick={onUpgradePro}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 !text-white text-sm font-semibold shadow-md shadow-teal-500/20 transition transform hover:-translate-y-0.5"
            >
              <Crown className="w-4 h-4 text-amber-200" />
              <span>View plans</span>
            </button>
          )}
        </div>

        {/* Feature Checklist */}
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            With PicoLink Assist, you can:
          </p>
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
            {[
              "Get instant analytics and performance insights",
              "Create and optimize links with AI assistance",
              "Generate QR Codes and branded vanity content",
              "Discover trends, peak times, and click patterns automatically",
            ].map((text, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Interactive Prompt Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80">
        <form onSubmit={handleSendPrompt} className="relative">
          <div className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-inner focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30 transition">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Paste URL to shorten, or ask about performance..."
              className="w-full px-2 py-1.5 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <button
                type="button"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Add context or file"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={!promptInput.trim()}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 !text-white disabled:opacity-30 disabled:hover:bg-indigo-600 transition"
                title="Submit prompt"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
        <p className="text-[10px] text-slate-500 text-center mt-2">
          PicoLink Assist can make mistakes. Always verify your links, codes, and data.
        </p>
      </div>
    </aside>
  );
}
