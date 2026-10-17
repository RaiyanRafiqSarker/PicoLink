"use client";

import React, { useState } from "react";
import {
  Link as LinkIcon,
  QrCode,
  ArrowRight,
  Crown,
  Sparkles,
  Globe,
  Share2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  ShoppingBag,
  Palette,
  ChevronLeft,
  ChevronRight,
  Zap,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface HomeTabProps {
  urlInput: string;
  setUrlInput: (val: string) => void;
  slugInput: string;
  setSlugInput: (val: string) => void;
  slugStatus: "idle" | "checking" | "available" | "taken" | "invalid";
  expiresInput: string;
  setExpiresInput: (val: string) => void;
  shortenLoading: boolean;
  handleShorten: (e: React.FormEvent) => void;
  shortenResult: any;
  copied: boolean;
  setCopied: (v: boolean) => void;
  quota: any;
  onUpgradePro: () => void;
  onNavigateToLinks: () => void;
  onNavigateToQr: () => void;
  userLinksCount: number;
}

export default function HomeTab({
  urlInput,
  setUrlInput,
  slugInput,
  setSlugInput,
  slugStatus,
  expiresInput,
  setExpiresInput,
  shortenLoading,
  handleShorten,
  shortenResult,
  copied,
  setCopied,
  quota,
  onUpgradePro,
  onNavigateToLinks,
  onNavigateToQr,
  userLinksCount,
}: HomeTabProps) {
  const [createMode, setCreateMode] = useState<"short" | "qr">("short");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [integrationPage, setIntegrationPage] = useState(0);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Short link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const integrationsList = [
    [
      {
        name: "Chrome Extension",
        desc: "Instant links and QR Codes from anywhere",
        icon: <Globe className="w-4 h-4 text-amber-400" />,
        btnText: "Install",
        badgeBg: "bg-amber-500/15",
        onClick: () => toast.info("PicoLink Chrome Extension is launching soon!"),
      },
      {
        name: "Canva",
        desc: "Popular pick in productivity and design",
        icon: <Palette className="w-4 h-4 text-teal-400" />,
        btnText: "Connect",
        badgeBg: "bg-teal-500/15",
        onClick: () => toast.info("Canva Integration connected!"),
      },
      {
        name: "Shopify",
        desc: "Connect marketing activity to revenue",
        icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />,
        btnText: "Connect",
        badgeBg: "bg-emerald-500/15",
        isNew: true,
        onClick: () => toast.info("Shopify Integration connected!"),
      },
    ],
    [
      {
        name: "Zapier",
        desc: "Automate short links with 5,000+ apps",
        icon: <Zap className="w-4 h-4 text-orange-400" />,
        btnText: "Connect",
        badgeBg: "bg-orange-500/15",
        onClick: () => toast.info("Zapier Integration connected!"),
      },
      {
        name: "Slack",
        desc: "Share and preview links directly in channels",
        icon: <Globe className="w-4 h-4 text-purple-400" />,
        btnText: "Connect",
        badgeBg: "bg-purple-500/15",
        onClick: () => toast.info("Slack Bot connected!"),
      },
      {
        name: "WordPress",
        desc: "Automatically shorten blog post links",
        icon: <Globe className="w-4 h-4 text-blue-400" />,
        btnText: "Connect",
        badgeBg: "bg-blue-500/15",
        onClick: () => toast.info("WordPress Plugin installed!"),
      },
    ],
  ];

  const currentIntegrations = integrationsList[integrationPage] || integrationsList[0];

  return (
    <div className="max-w-4xl mx-auto space-y-7 py-3">
      {/* 1. Central Hero Section: "What do you want to create?" (Matching Screenshot 1) */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          What do you want to create?
        </h1>

        {/* Segmented Mode Switcher (Short link vs QR Code) */}
        <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
          <button
            onClick={() => setCreateMode("short")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              createMode === "short"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Short link</span>
          </button>
          <button
            onClick={() => {
              setCreateMode("qr");
              onNavigateToQr();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              createMode === "qr"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </button>
        </div>

        {/* Main URL Shortener Input Box (Matching Screenshot 1) */}
        <form onSubmit={handleShorten} className="max-w-2xl mx-auto mt-2">
          <div className="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-2xl focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition">
            <div className="pl-3 pr-2 text-slate-500">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              type="url"
              required
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste a long URL to shorten it..."
              className="flex-1 bg-transparent py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={shortenLoading || !urlInput.trim()}
              className="p-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition disabled:opacity-40 flex items-center gap-1.5"
              title="Shorten URL"
            >
              {shortenLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Complimentary Domain Banner below input (Matching Screenshot 1) */}
          <div className="promo-banner mt-3 p-3 rounded-xl bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-500/30 text-xs flex items-center justify-between gap-3 text-left transition-colors">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
              <span className="promo-text font-medium text-slate-900 dark:text-teal-100">
                Get custom links and a complimentary domain.
              </span>
            </div>
            <button
              type="button"
              onClick={onUpgradePro}
              className="promo-btn font-bold underline text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-white shrink-0"
            >
              Upgrade now
            </button>
          </div>

          {/* Usage Quota Counter Indicator (Matching Screenshot 1) */}
          <div className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <span>
              You can create{" "}
              <strong className="text-slate-900 dark:text-white font-bold">
                {quota?.tier === "pro" ? "unlimited" : quota?.remaining ?? 49}
              </strong>{" "}
              more short links {quota?.tier === "pro" ? "" : "today"}.
            </span>
            <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </div>

          {/* Collapsible Advanced vanity slug inputs */}
          {showAdvanced && (
            <div className="mt-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left animate-fade-in">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Custom Slug (Vanity)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-mono text-xs">/</span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value)}
                    placeholder="custom-vanity"
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Expires in (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={expiresInput}
                  onChange={(e) => setExpiresInput(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </form>

        {/* Shorten Success Result Card (if generated) */}
        {shortenResult && (
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-left flex flex-col sm:flex-row items-center justify-between gap-4 animate-scale-up">
            <div className="overflow-hidden">
              <span className="text-xs text-indigo-300 font-semibold block">
                Link Shortened Successfully!
              </span>
              <a
                href={shortenResult.short_url}
                target="_blank"
                rel="noreferrer"
                className="text-white font-mono text-sm font-bold hover:underline truncate block mt-0.5"
              >
                {shortenResult.short_url}
              </a>
              <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                ↳ {shortenResult.original_url}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopy(shortenResult.short_url)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Smart Workflow Banner (Matching Screenshot 1) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">
              Simplify your workflow{" "}
              <span className="text-slate-400 font-normal">
                Explore smarter ways to create links.
              </span>
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-[11px] text-slate-300 hover:text-white border border-slate-700/60 transition"
          >
            🔗 Personalize a short link
          </button>
          <button
            onClick={() => toast.info("UTM campaign builder ready!")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-[11px] text-slate-300 hover:text-white border border-slate-700/60 transition"
          >
            ⭐ Make a unique link for every post
          </button>
          <button
            onClick={onUpgradePro}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-[11px] font-semibold transition shadow-sm"
          >
            <Crown className="w-3 h-3 text-amber-200" />
            <span>Upgrade to Create with AI</span>
          </button>
        </div>
      </div>

      {/* 3. Bottom Two-Column Section (Matching Screenshot 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: "Connect your account" (Ecosystem & Integrations) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Connect your account</h3>
              <span
                onClick={() => toast.info("Exploring 50+ integrations...")}
                className="text-xs text-indigo-400 hover:underline cursor-pointer"
              >
                Explore Integrations &rarr;
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Recommended for you</p>

            {/* Integrations List */}
            <div className="mt-4 space-y-3">
              {currentIntegrations.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg ${item.badgeBg} flex items-center justify-center`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-semibold text-white">{item.name}</h4>
                        {item.isNew && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={item.onClick}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition"
                  >
                    {item.btnText}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Pagination Dots & Arrows (Matching Screenshot 1) */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIntegrationPage((p) => Math.max(0, p - 1))}
              disabled={integrationPage === 0}
              className="text-slate-500 hover:text-white disabled:opacity-30 transition"
              title="Previous"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1.5">
              {[0, 1].map((dot) => (
                <span
                  key={dot}
                  onClick={() => setIntegrationPage(dot)}
                  className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all ${
                    integrationPage === dot ? "w-3 bg-indigo-500" : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setIntegrationPage((p) => Math.min(1, p + 1))}
              disabled={integrationPage === 1}
              className="text-slate-500 hover:text-white disabled:opacity-30 transition"
              title="Next"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Card: "Get started with PicoLink" (Onboarding & Milestones Checklist) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Get started with PicoLink</h3>
              {/* Circular Gauge / Percentage Indicator (Matching Screenshot 1) */}
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-400">
                <span>{userLinksCount > 0 ? "66%" : "33%"}</span>
                <span className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin inline-block" />
              </div>
            </div>

            {/* Checklist items matching Screenshot 1 */}
            <div className="mt-4 space-y-3">
              {/* Step 1: Link shortened (Checked) */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Link shortened</span>
              </div>

              {/* Step 2: Collect 10 clicks or scans (Active card with progress bar) */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-200">Collect 10 clicks or scans</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {Math.min(10, userLinksCount)}/10 clicks to goal
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(12, userLinksCount * 10))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      if (shortenResult?.short_url) {
                        handleCopy(shortenResult.short_url);
                      } else {
                        toast.info("Share your shortened links with your audience!");
                      }
                    }}
                    className="btn-solid-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <Share2 className="w-3.5 h-3.5 text-white" />
                    <span className="text-white font-semibold">Share first link</span>
                  </button>
                  <button
                    onClick={onNavigateToLinks}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>View links</span>
                  </button>
                </div>
              </div>

              {/* Step 3: Preview Analytics unlock */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Preview the Analytics you could unlock.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
