"use client";

import React from "react";
import { Layers, Crown, Sparkles, ArrowRight, Share2, Target, BarChart2 } from "lucide-react";
import { toast } from "sonner";

interface CampaignsTabProps {
  onUpgradePro: () => void;
}

export default function CampaignsTab({ onUpgradePro }: CampaignsTabProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 text-center">
      {/* Visual illustration of laptop with campaign breakdown matching screenshot 7 */}
      <div className="relative max-w-md mx-auto p-6 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-left">
          <div>
            <h4 className="text-xs font-bold text-white">Fall Promo 2026</h4>
            <p className="text-[10px] text-slate-400">4 Channels | 40 Short Links</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
            Live
          </span>
        </div>

        <div className="space-y-1.5 text-left text-xs">
          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-300">TikTok Campaign</span>
            <span className="text-indigo-400 font-mono text-[11px]">1,420 clicks</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-300">Direct Mail QR Codes</span>
            <span className="text-indigo-400 font-mono text-[11px]">890 scans</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-300">YouTube Video Descriptions</span>
            <span className="text-indigo-400 font-mono text-[11px]">2,105 clicks</span>
          </div>
        </div>
      </div>

      {/* Copywriting matching Screenshot 7 */}
      <div className="space-y-3 max-w-lg mx-auto">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Some links belong together
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Organize your links into PicoLink Campaigns and compare performance across social media, emails, and print channels. Available on the Pro plan.
        </p>

        <div className="pt-2 flex flex-col items-center gap-2">
          <button
            onClick={onUpgradePro}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span>View our plans</span>
          </button>
          <a
            href="https://picolink.dev"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-400 hover:underline"
          >
            Learn more
          </a>
        </div>
      </div>
    </div>
  );
}
