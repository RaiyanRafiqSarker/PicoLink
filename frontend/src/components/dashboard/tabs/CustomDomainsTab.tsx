"use client";

import React, { useState } from "react";
import { Globe, Sparkles, Check, ArrowRight, Search } from "lucide-react";
import { toast } from "sonner";

export default function CustomDomainsTab() {
  const [activeMode, setActiveMode] = useState<"search" | "ai">("ai");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [suggestedDomains, setSuggestedDomains] = useState<string[]>([]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setSuggestedDomains([
        "pico.ly",
        "gobrand.link",
        "quick.stream",
        "reach.fyi",
      ]);
      toast.success("AI domain suggestions generated!");
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Brand your links with a custom domain
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Replace default links with your own unique domain to build trust and increase click-through rates.
        </p>
      </div>

      {/* Visual Value Proposition Card matching Screenshot 8 */}
      <div className="p-6 sm:p-7 rounded-3xl bg-teal-950/25 border border-teal-500/30 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left Transformation Graphic */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
            <span>picolink.dev/2BN6kd</span>
          </div>
          <div className="flex justify-center text-teal-400">
            <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-teal-950/50 border border-teal-500/40 text-xs font-mono text-teal-200">
            <span>yourbrand.co/link</span>
            <Check className="w-3.5 h-3.5 text-teal-400" />
          </div>
        </div>

        {/* Right Bullet Points */}
        <ul className="space-y-3 text-xs text-slate-200">
          <li className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span>Replace generic short links with your own custom branded domain</span>
          </li>
          <li className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span>Help people recognize, verify, and trust your shared links</span>
          </li>
          <li className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span>Build brand awareness and gain up to 2.3x higher click engagement</span>
          </li>
        </ul>
      </div>

      {/* Domain Discovery Tabs */}
      <div className="space-y-4">
        <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveMode("search")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeMode === "search"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search for a domain</span>
          </button>
          <button
            onClick={() => setActiveMode("ai")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeMode === "ai"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Find a domain with AI</span>
          </button>
        </div>

        {/* AI Generator Input */}
        {activeMode === "ai" ? (
          <form onSubmit={handleGenerate} className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                maxLength={200}
                placeholder="e.g. A New York tech publication covering artificial intelligence"
                className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-indigo-500/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <button
                type="submit"
                disabled={generating || !aiPrompt.trim()}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4" />
                <span>{generating ? "Thinking..." : "Generate"}</span>
              </button>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 px-1">
              <span>Describe your idea, product or company service</span>
              <span>{aiPrompt.length}/200</span>
            </div>

            {/* Generated Domain Suggestions */}
            {suggestedDomains.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 animate-fade-in">
                {suggestedDomains.map((domain) => (
                  <div
                    key={domain}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center hover:border-indigo-500 transition cursor-pointer"
                    onClick={() => toast.success(`Selected custom domain: ${domain}`)}
                  >
                    <p className="text-xs font-mono font-bold text-indigo-300">{domain}</p>
                    <span className="text-[10px] text-emerald-400">Available</span>
                  </div>
                ))}
              </div>
            )}
          </form>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <Globe className="w-8 h-8 mx-auto text-slate-500" />
            <h4 className="text-xs font-semibold text-white">Direct DNS Domain Connection</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Point your domain&apos;s CNAME record to <code className="text-indigo-400">cname.picolink.dev</code> to activate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
