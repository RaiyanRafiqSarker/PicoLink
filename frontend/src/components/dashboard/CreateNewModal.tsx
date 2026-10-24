"use client";

import React, { useState, useEffect } from "react";
import {
  Link as LinkIcon,
  QrCode,
  FileText,
  X,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Upload,
  Target,
  Lock,
  Flame,
  Smartphone,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  AlertCircle,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { AuthNavTab } from "./Sidebar";
import { useWorkspace } from "../../context/WorkspaceContext";

interface CreateNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (tab: AuthNavTab) => void;
  authToken: string | null;
  apiBase: string;
  onLinkCreated?: () => void;
}

export default function CreateNewModal({
  isOpen,
  onClose,
  onSelectOption,
  authToken,
  apiBase,
  onLinkCreated,
}: CreateNewModalProps) {
  const { activeWorkspace, isViewer } = useWorkspace();
  const [viewMode, setViewMode] = useState<"menu" | "shorten">("menu");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // UTM Parameters State
  const [showUtm, setShowUtm] = useState(false);
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");

  // Advanced Security & Mobile Deep Link State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [password, setPassword] = useState("");
  const [maxClicks, setMaxClicks] = useState("");
  const [iosUrl, setIosUrl] = useState("");
  const [androidUrl, setAndroidUrl] = useState("");

  const updateUtm = (
    key: "source" | "medium" | "campaign" | "term" | "content",
    val: string
  ) => {
    let s = utmSource;
    let m = utmMedium;
    let c = utmCampaign;
    let t = utmTerm;
    let cont = utmContent;

    if (key === "source") { s = val; setUtmSource(val); }
    if (key === "medium") { m = val; setUtmMedium(val); }
    if (key === "campaign") { c = val; setUtmCampaign(val); }
    if (key === "term") { t = val; setUtmTerm(val); }
    if (key === "content") { cont = val; setUtmContent(val); }

    if (!destinationUrl.trim()) return;
    try {
      const base = destinationUrl.split("?")[0];
      const params = new URLSearchParams();
      if (s) params.set("utm_source", s);
      if (m) params.set("utm_medium", m);
      if (c) params.set("utm_campaign", c);
      if (t) params.set("utm_term", t);
      if (cont) params.set("utm_content", cont);
      const qs = params.toString();
      setDestinationUrl(qs ? `${base}?${qs}` : base);
    } catch {
      // ignore
    }
  };

  // Reset state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setViewMode("menu");
      setDestinationUrl("");
      setCustomSlug("");
      setExpiresInDays("");
      setShowUtm(false);
      setUtmSource("");
      setUtmMedium("");
      setUtmCampaign("");
      setUtmTerm("");
      setUtmContent("");
      setShowAdvanced(false);
      setPassword("");
      setMaxClicks("");
      setIosUrl("");
      setAndroidUrl("");
      setCreatedResult(null);
      setCopied(false);
    }
  }, [isOpen]);

  // Global Hotkeys Listener for 'L', 'Q', and 'B'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        setViewMode("shorten");
      } else if (e.key === "q" || e.key === "Q") {
        e.preventDefault();
        onSelectOption("qrcodes");
        onClose();
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        onSelectOption("links");
        onClose();
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onSelectOption]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      toast.error("View-only access in this workspace. Creating links is restricted.");
      return;
    }
    if (!destinationUrl.trim()) return;

    setLoading(true);
    try {
      const payload: any = { original_url: destinationUrl.trim() };
      if (customSlug.trim()) payload.custom_slug = customSlug.trim();
      if (expiresInDays) payload.expires_in_days = parseInt(expiresInDays, 10);
      if (utmCampaign.trim()) payload.campaign_name = utmCampaign.trim();
      if (password.trim()) payload.password = password.trim();
      if (maxClicks.trim()) payload.max_clicks = parseInt(maxClicks, 10);
      if (iosUrl.trim()) payload.ios_primary_url = iosUrl.trim();
      if (androidUrl.trim()) payload.android_primary_url = androidUrl.trim();
      if (activeWorkspace) payload.workspace_id = activeWorkspace.id;

      const activeTok =
        authToken ||
        (typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null);
      const headers: any = { "Content-Type": "application/json" };
      if (activeTok) {
        headers["Authorization"] = `Bearer ${activeTok}`;
      }
      if (activeWorkspace) {
        headers["X-Workspace-Id"] = String(activeWorkspace.id);
      }

      const res = await fetch(`${apiBase}/api/v1/shorten`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to create short link.");
      }

      setCreatedResult(data);
      toast.success("Short link created successfully!");
      if (onLinkCreated) onLinkCreated();
    } catch (err: any) {
      toast.error(err.message || "Could not create short link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="create-modal-card relative z-10 w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden animate-scale-up">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {viewMode === "shorten" && (
              <button
                onClick={() => setViewMode("menu")}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition mr-1"
                title="Back to options"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-xl font-bold text-white tracking-tight">
              {viewMode === "menu" ? "What do you want to create?" : "Create a Short Link"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VIEW 1: 4-Tile Selection Menu */}
        {viewMode === "menu" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Option 1: Shorten a link */}
            <button
              onClick={() => setViewMode("shorten")}
              className="create-modal-tile group relative flex flex-col justify-between p-4.5 min-h-[115px] rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 text-left hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <LinkIcon className="w-4 h-4" />
              </div>
              <div className="flex items-end justify-between w-full mt-3">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Shorten a link
                </span>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400 group-hover:text-indigo-300">
                  L
                </kbd>
              </div>
            </button>

            {/* Option 2: Create a QR Code */}
            <button
              onClick={() => {
                onSelectOption("qrcodes");
                onClose();
              }}
              className="create-modal-tile group relative flex flex-col justify-between p-4.5 min-h-[115px] rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 transition-all duration-200 text-left hover:shadow-lg hover:shadow-amber-500/10"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="flex items-end justify-between w-full mt-3">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Create a QR Code
                </span>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400 group-hover:text-amber-300">
                  Q
                </kbd>
              </div>
            </button>

            {/* Option 3: Build a landing page */}
            <button
              onClick={() => {
                onSelectOption("pages");
                onClose();
              }}
              className="create-modal-tile group relative flex flex-col justify-between p-4.5 min-h-[115px] rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 transition-all duration-200 text-left hover:shadow-lg hover:shadow-purple-500/10"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex items-end justify-between w-full mt-3">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Build a page
                </span>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400 group-hover:text-purple-300">
                  P
                </kbd>
              </div>
            </button>

            {/* Option 4: Bulk CSV Shorten */}
            <button
              onClick={() => {
                onSelectOption("links");
                onClose();
              }}
              className="create-modal-tile group relative flex flex-col justify-between p-4.5 min-h-[115px] rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 text-left hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <div className="flex items-end justify-between w-full mt-3">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Bulk CSV
                </span>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400 group-hover:text-emerald-300">
                  B
                </kbd>
              </div>
            </button>
          </div>
        )}

        {/* VIEW 2: Direct Shorten Form Dialog */}
        {viewMode === "shorten" && (
          <div>
            {isViewer && (
              <div className="mb-4 flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>View-only access in <strong>{activeWorkspace?.name || "this workspace"}</strong>. Creating links is restricted.</span>
              </div>
            )}
            {!createdResult ? (
              <form onSubmit={handleCreateLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Destination URL <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    autoFocus
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://example.com/my-long-url-destination"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Custom Alias (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono text-slate-500">
                        /
                      </span>
                      <input
                        type="text"
                        value={customSlug}
                        onChange={(e) => setCustomSlug(e.target.value)}
                        placeholder="vanity-slug"
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Expires in Days (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Option Toggles */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUtm(!showUtm);
                      if (showAdvanced) setShowAdvanced(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      showUtm
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800"
                    }`}
                  >
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span>UTM Parameters</span>
                    {showUtm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAdvanced(!showAdvanced);
                      if (showUtm) setShowUtm(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      showAdvanced
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800"
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Password &amp; Limits</span>
                    {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Collapsible UTM Campaign Builder */}
                {showUtm && (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-3 animate-fade-in text-left">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-indigo-400" />
                        Campaign Parameters
                      </span>
                      <span className="text-[10px] text-indigo-300 font-mono">Auto-syncs to URL</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          utm_source
                        </label>
                        <input
                          type="text"
                          value={utmSource}
                          onChange={(e) => updateUtm("source", e.target.value)}
                          placeholder="e.g. google, twitter"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          utm_medium
                        </label>
                        <input
                          type="text"
                          value={utmMedium}
                          onChange={(e) => updateUtm("medium", e.target.value)}
                          placeholder="e.g. cpc, email"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          utm_campaign
                        </label>
                        <input
                          type="text"
                          value={utmCampaign}
                          onChange={(e) => updateUtm("campaign", e.target.value)}
                          placeholder="e.g. spring_sale"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          utm_term
                        </label>
                        <input
                          type="text"
                          value={utmTerm}
                          onChange={(e) => updateUtm("term", e.target.value)}
                          placeholder="e.g. shoes+sale"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          utm_content
                        </label>
                        <input
                          type="text"
                          value={utmContent}
                          onChange={(e) => updateUtm("content", e.target.value)}
                          placeholder="e.g. banner_top"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Collapsible Advanced Security & Deep Links */}
                {showAdvanced && (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 animate-fade-in text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>Password Protection</span>
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Required to access link"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-rose-400" />
                          <span>Max Clicks (Burn Link)</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={maxClicks}
                          onChange={(e) => setMaxClicks(e.target.value)}
                          placeholder="e.g. 1 for single-use"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-cyan-400" />
                          <span>iOS Scheme</span>
                        </label>
                        <input
                          type="text"
                          value={iosUrl}
                          onChange={(e) => setIosUrl(e.target.value)}
                          placeholder="myapp://..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-emerald-400" />
                          <span>Android Scheme</span>
                        </label>
                        <input
                          type="text"
                          value={androidUrl}
                          onChange={(e) => setAndroidUrl(e.target.value)}
                          placeholder="intent://..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("menu")}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !destinationUrl.trim() || isViewer}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-semibold text-xs transition ${
                      isViewer
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 shadow-none"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/30 disabled:opacity-40"
                    }`}
                    title={isViewer ? "View-only access in this workspace" : "Create link"}
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    <span>Create link</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Success Result Card */
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-4">
                  <div className="overflow-hidden">
                    <span className="text-[11px] font-semibold text-indigo-300 block">
                      Short Link Created!
                    </span>
                    <a
                      href={createdResult.short_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-bold text-white hover:underline truncate block mt-0.5 font-mono"
                    >
                      {createdResult.short_url}
                    </a>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                      ↳ {createdResult.original_url}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopy(createdResult.short_url)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Instant QR Code preview */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl">
                      <QRCodeCanvas value={createdResult.short_url} size={50} level="M" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">QR Code Ready</p>
                      <p className="text-[10px] text-slate-400">Scan or download anytime</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSelectOption("links");
                      onClose();
                    }}
                    className="text-xs text-indigo-400 hover:underline font-semibold"
                  >
                    View in Links &rarr;
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
