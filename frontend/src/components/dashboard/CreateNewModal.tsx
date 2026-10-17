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
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { AuthNavTab } from "./Sidebar";

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
  const [viewMode, setViewMode] = useState<"menu" | "shorten">("menu");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Reset state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setViewMode("menu");
      setDestinationUrl("");
      setCustomSlug("");
      setExpiresInDays("");
      setCreatedResult(null);
      setCopied(false);
    }
  }, [isOpen]);

  // Global Hotkeys Listener for 'L' and 'Q'
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
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onSelectOption]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationUrl.trim()) return;

    setLoading(true);
    try {
      const payload: any = { original_url: destinationUrl.trim() };
      if (customSlug.trim()) payload.custom_slug = customSlug.trim();
      if (expiresInDays) payload.expires_in_days = parseInt(expiresInDays, 10);

      const activeTok =
        authToken ||
        (typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null);
      const headers: any = { "Content-Type": "application/json" };
      if (activeTok) {
        headers["Authorization"] = `Bearer ${activeTok}`;
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

        {/* VIEW 1: 3-Tile Selection Menu (Matching Screenshot 2) */}
        {viewMode === "menu" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
                  Build a landing page
                </span>
              </div>
            </button>
          </div>
        )}

        {/* VIEW 2: Direct Shorten Form Dialog */}
        {viewMode === "shorten" && (
          <div>
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
                    disabled={loading || !destinationUrl.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition disabled:opacity-40"
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
