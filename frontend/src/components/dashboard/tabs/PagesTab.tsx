"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Sparkles,
  Smartphone,
  Share2,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Palette,
  Eye,
  EyeOff,
  Globe,
  Link as LinkIcon,
  QrCode,
  Mail,
  MoveUp,
  MoveDown,
  Layers,
  Undo,
  Download,
} from "lucide-react";

const IconGithub = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const IconTwitter = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconLinkedin = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.39 9.74v-8.37H5.07v8.37h2.78z" />
  </svg>
);
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

export interface BioLinkItem {
  id: string;
  title: string;
  url: string;
  badge?: string;
  isActive: boolean;
  clicks: number;
}

export type BioTheme = "midnight" | "neon" | "emerald" | "sunset" | "minimal";

interface PagesTabProps {
  userLinks?: Array<{
    id: number;
    short_code: string;
    short_url: string;
    original_url: string;
    total_clicks?: number;
  }>;
  currentUser?: {
    username?: string;
    email?: string;
    is_pro?: boolean;
    subscription_tier?: string;
  } | null;
}

const THEME_STYLES: Record<
  BioTheme,
  {
    name: string;
    cardBg: string;
    bgStyle: string;
    textPrimary: string;
    textSecondary: string;
    btnClass: string;
    badgeClass: string;
  }
> = {
  midnight: {
    name: "Midnight Eclipse",
    cardBg: "bg-[#090d16]",
    bgStyle: "from-[#080d1a] via-[#0f172a] to-[#1e1b4b]",
    textPrimary: "text-white",
    textSecondary: "text-slate-400",
    btnClass:
      "bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700/80 shadow-md hover:border-indigo-500",
    badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  },
  neon: {
    name: "Violet Neon",
    cardBg: "bg-[#180828]",
    bgStyle: "from-[#1a052e] via-[#2e0854] to-[#4c0519]",
    textPrimary: "text-white",
    textSecondary: "text-purple-300",
    btnClass:
      "bg-purple-950/70 hover:bg-purple-900/80 text-white border border-purple-500/40 shadow-lg shadow-purple-950/50 hover:border-purple-400",
    badgeClass: "bg-fuchsia-500/25 text-fuchsia-300 border-fuchsia-500/40",
  },
  emerald: {
    name: "Emerald Oasis",
    cardBg: "bg-[#041a16]",
    bgStyle: "from-[#022c22] via-[#064e3b] to-[#041f1a]",
    textPrimary: "text-white",
    textSecondary: "text-emerald-300",
    btnClass:
      "bg-emerald-950/80 hover:bg-emerald-900/80 text-white border border-emerald-500/40 shadow-md hover:border-emerald-400",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  sunset: {
    name: "Sunset Glow",
    cardBg: "bg-[#1f1013]",
    bgStyle: "from-[#3b0764] via-[#831843] to-[#7c2d12]",
    textPrimary: "text-white",
    textSecondary: "text-rose-200",
    btnClass:
      "bg-rose-950/70 hover:bg-rose-900/80 text-white border border-rose-500/40 shadow-md hover:border-amber-400",
    badgeClass: "bg-amber-500/25 text-amber-300 border-amber-500/40",
  },
  minimal: {
    name: "Clean Minimal",
    cardBg: "bg-slate-950",
    bgStyle: "from-slate-950 via-slate-900 to-black",
    textPrimary: "text-white",
    textSecondary: "text-slate-400",
    btnClass:
      "bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 hover:border-slate-600 shadow-sm",
    badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
  },
};

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-purple-600",
  "from-pink-500 to-rose-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
];

export default function PagesTab({ userLinks = [], currentUser }: PagesTabProps) {
  // Page Configuration State
  const [handle, setHandle] = useState<string>(currentUser?.username || "creator");
  const [title, setTitle] = useState<string>(
    currentUser?.username ? `${currentUser.username}` : "My Bio Hub"
  );
  const [bio, setBio] = useState<string>(
    "Welcome to my link-in-bio! Discover my latest projects, articles, and short links."
  );
  const [avatarGradient, setAvatarGradient] = useState<string>(AVATAR_GRADIENTS[0]);
  const [theme, setTheme] = useState<BioTheme>("midnight");
  const [buttonShape, setButtonShape] = useState<"rounded-xl" | "rounded-full" | "rounded-lg">(
    "rounded-xl"
  );

  // Social Links
  const [socialTwitter, setSocialTwitter] = useState("https://x.com");
  const [socialGithub, setSocialGithub] = useState("https://github.com");
  const [socialLinkedin, setSocialLinkedin] = useState("");
  const [socialEmail, setSocialEmail] = useState("");

  // Links List
  const [links, setLinks] = useState<BioLinkItem[]>([
    {
      id: "link-1",
      title: "🚀 Latest Product Launch",
      url: "https://picolink.dev",
      badge: "Featured",
      isActive: true,
      clicks: 42,
    },
    {
      id: "link-2",
      title: "📖 Read My Engineering Blog",
      url: "https://medium.com",
      badge: "New",
      isActive: true,
      clicks: 29,
    },
    {
      id: "link-3",
      title: "💬 Book a 1:1 Strategy Call",
      url: "https://cal.com",
      badge: "Popular",
      isActive: true,
      clicks: 18,
    },
  ]);

  // Form Inputs for Adding a New Link
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newBadge, setNewBadge] = useState("");
  const [selectedUserLink, setSelectedUserLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<"links" | "profile" | "theme">("links");

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load from LocalStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("picolink_bio_page");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.handle) setHandle(parsed.handle);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.bio) setBio(parsed.bio);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.buttonShape) setButtonShape(parsed.buttonShape);
        if (parsed.avatarGradient) setAvatarGradient(parsed.avatarGradient);
        if (Array.isArray(parsed.links) && parsed.links.length > 0) setLinks(parsed.links);
        if (parsed.socials) {
          setSocialTwitter(parsed.socials.twitter || "");
          setSocialGithub(parsed.socials.github || "");
          setSocialLinkedin(parsed.socials.linkedin || "");
          setSocialEmail(parsed.socials.email || "");
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to LocalStorage
  const handleSavePage = () => {
    try {
      const data = {
        handle,
        title,
        bio,
        theme,
        buttonShape,
        avatarGradient,
        links,
        socials: {
          twitter: socialTwitter,
          github: socialGithub,
          linkedin: socialLinkedin,
          email: socialEmail,
        },
      };
      localStorage.setItem("picolink_bio_page", JSON.stringify(data));
      toast.success("Link-in-Bio page saved and published successfully!");
    } catch {
      toast.error("Could not save page configuration.");
    }
  };

  // Add Link
  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      toast.error("Please provide both a link title and URL.");
      return;
    }

    let urlToUse = newUrl.trim();
    if (!/^https?:\/\//i.test(urlToUse)) {
      urlToUse = `https://${urlToUse}`;
    }

    const item: BioLinkItem = {
      id: `link-${Date.now()}`,
      title: newTitle.trim(),
      url: urlToUse,
      badge: newBadge.trim() || undefined,
      isActive: true,
      clicks: 0,
    };

    setLinks([item, ...links]);
    setNewTitle("");
    setNewUrl("");
    setNewBadge("");
    setSelectedUserLink("");
    toast.success("Link added to bio!");
  };

  // Quick Import from Shortened Links
  const handleImportShortLink = (shortUrl: string, originalUrl: string) => {
    setSelectedUserLink(shortUrl);
    setNewUrl(shortUrl);
    if (!newTitle) {
      try {
        const domain = new URL(originalUrl).hostname.replace(/^www\./, "");
        setNewTitle(`Link to ${domain}`);
      } catch {
        setNewTitle("Shortened Link");
      }
    }
    toast.info("Imported short link destination.");
  };

  // Reorder Link
  const moveLink = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= links.length) return;
    const updated = [...links];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setLinks(updated);
  };

  // Toggle Link Visibility
  const toggleLinkActive = (id: string) => {
    setLinks(
      links.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l))
    );
  };

  // Delete Link
  const deleteLink = (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
    toast.info("Link removed.");
  };

  // Simulated Link Click from Mobile Preview
  const handlePreviewLinkClick = (id: string, url: string) => {
    setLinks(
      links.map((l) => (l.id === id ? { ...l, clicks: l.clicks + 1 } : l))
    );
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Copy Public Bio Link
  const fullShareUrl = `https://picolink.dev/@${handle.replace(/^@/, "")}`;
  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(fullShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success("Bio link copied to clipboard!");
  };

  // Download QR Code
  const downloadPageQr = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `picolink_bio_${handle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Bio page QR code downloaded!");
  };

  const currentTheme = THEME_STYLES[theme];

  return (
    <div className="max-w-7xl mx-auto py-2 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Interactive Link-in-Bio Studio</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Live Preview
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize your bio page, add shortened links, pick themes, and share with your audience.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Shareable Link Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[140px] sm:max-w-[200px]">
              picolink.dev/@{handle}
            </span>
          </div>

          <button
            onClick={handleCopyShareUrl}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700 transition"
            title="Copy shareable link"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            onClick={handleSavePage}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Publish Page</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left Studio Controls, Right Mobile Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Controls & Builder (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Studio Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveEditorTab("links")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                activeEditorTab === "links"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Links &amp; Content ({links.length})</span>
            </button>
            <button
              onClick={() => setActiveEditorTab("profile")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                activeEditorTab === "profile"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Bio &amp; Socials</span>
            </button>
            <button
              onClick={() => setActiveEditorTab("theme")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                activeEditorTab === "theme"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span>Theme &amp; Style</span>
            </button>
          </div>

          {/* TAB 1: LINKS MANAGEMENT */}
          {activeEditorTab === "links" && (
            <div className="space-y-4 animate-fade-in">
              {/* Quick Add Form */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-500" />
                    <span>Add New Link to Bio</span>
                  </h3>

                  {/* Quick Import from Shortened Links Dropdown */}
                  {userLinks.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        Import link:
                      </span>
                      <select
                        value={selectedUserLink}
                        onChange={(e) => {
                          const val = e.target.value;
                          const found = userLinks.find((l) => l.short_url === val);
                          if (found) {
                            handleImportShortLink(found.short_url, found.original_url);
                          }
                        }}
                        className="text-xs py-1 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">Choose shortened link...</option>
                        {userLinks.map((ul) => (
                          <option key={ul.id} value={ul.short_url}>
                            /{ul.short_code} ({ul.original_url.substring(0, 28)}...)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddLink} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Link Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. My Portfolio &amp; Resume"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Destination URL *
                      </label>
                      <input
                        type="text"
                        required
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <div className="w-full sm:w-1/2">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Optional Highlight Badge
                      </label>
                      <input
                        type="text"
                        value={newBadge}
                        onChange={(e) => setNewBadge(e.target.value)}
                        placeholder="e.g. New, Featured, Free, 50% Off"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2 mt-4 sm:mt-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Bio</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Links List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                  Active Bio Links ({links.filter((l) => l.isActive).length} visible)
                </h4>

                {links.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <LinkIcon className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500">
                      No links added yet. Add your first link above to see it appear on your phone preview!
                    </p>
                  </div>
                ) : (
                  links.map((link, idx) => (
                    <div
                      key={link.id}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                        link.isActive
                          ? "bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-900 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Drag / Reorder Controls */}
                        <div className="flex items-center gap-1 text-slate-400">
                          <button
                            type="button"
                            onClick={() => moveLink(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 transition"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveLink(idx, "down")}
                            disabled={idx === links.length - 1}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 transition"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title and URL */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {link.title}
                            </h5>
                            {link.badge && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 shrink-0">
                                {link.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate font-mono mt-0.5">
                            {link.url}
                          </p>
                        </div>

                        {/* Clicks badge and actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-semibold"
                            title="Simulated click count"
                          >
                            {link.clicks} clicks
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleLinkActive(link.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title={link.isActive ? "Hide from bio" : "Show on bio"}
                          >
                            {link.isActive ? (
                              <Eye className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteLink(link.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Delete link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE & SOCIALS */}
          {activeEditorTab === "profile" && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Bio Identity &amp; Branding</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Handle / Username *
                    </label>
                    <div className="flex items-center px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white">
                      <span className="text-slate-400 mr-0.5">picolink.dev/@</span>
                      <input
                        type="text"
                        value={handle}
                        onChange={(e) =>
                          setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                        }
                        className="bg-transparent focus:outline-none flex-1 font-semibold text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Display Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Your Name or Company"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Bio Description
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={160}
                    placeholder="Short bio explaining what you do..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <div className="text-[10px] text-right text-slate-400">{bio.length}/160</div>
                </div>

                {/* Avatar Gradient Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    Avatar Accent Gradient
                  </label>
                  <div className="flex items-center gap-3">
                    {AVATAR_GRADIENTS.map((grad, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAvatarGradient(grad)}
                        className={`w-9 h-9 rounded-full bg-gradient-to-tr ${grad} transition-all transform hover:scale-105 flex items-center justify-center text-white ${
                          avatarGradient === grad
                            ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-105"
                            : "opacity-80"
                        }`}
                      >
                        {avatarGradient === grad && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Socials Connection */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                  Social Channels (Header Strip)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <IconTwitter className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <input
                      type="text"
                      value={socialTwitter}
                      onChange={(e) => setSocialTwitter(e.target.value)}
                      placeholder="Twitter/X profile URL"
                      className="bg-transparent w-full text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <IconGithub className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={socialGithub}
                      onChange={(e) => setSocialGithub(e.target.value)}
                      placeholder="GitHub profile URL"
                      className="bg-transparent w-full text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <IconLinkedin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <input
                      type="text"
                      value={socialLinkedin}
                      onChange={(e) => setSocialLinkedin(e.target.value)}
                      placeholder="LinkedIn URL (optional)"
                      className="bg-transparent w-full text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <input
                      type="email"
                      value={socialEmail}
                      onChange={(e) => setSocialEmail(e.target.value)}
                      placeholder="Contact email (optional)"
                      className="bg-transparent w-full text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THEME & STYLES */}
          {activeEditorTab === "theme" && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-amber-500" />
                  <span>Theme Presets</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(Object.keys(THEME_STYLES) as BioTheme[]).map((thm) => {
                    const cfg = THEME_STYLES[thm];
                    const isSelected = theme === thm;
                    return (
                      <button
                        key={thm}
                        type="button"
                        onClick={() => setTheme(thm)}
                        className={`p-3 rounded-xl border text-left transition relative overflow-hidden group ${
                          isSelected
                            ? "border-indigo-500 ring-2 ring-indigo-500/30"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
                        }`}
                      >
                        <div
                          className={`w-full h-10 rounded-lg bg-gradient-to-tr ${cfg.bgStyle} mb-2 shadow-inner`}
                        />
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {cfg.name}
                        </p>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Button Shape Selection */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Button Corner Style
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { id: "rounded-lg", label: "Soft Box" },
                      { id: "rounded-xl", label: "Curved" },
                      { id: "rounded-full", label: "Full Pill" },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => setButtonShape(btn.id as any)}
                        className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                          buttonShape === btn.id
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* QR Code generator for page */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Page QR Code
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Download direct QR code pointing to your live bio page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadPageQr}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR</span>
                  </button>
                </div>

                <div className="hidden">
                  <QRCodeCanvas
                    ref={qrCanvasRef}
                    value={fullShareUrl}
                    size={240}
                    fgColor="#1e1b4b"
                    bgColor="#ffffff"
                    level="H"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Realistic Smartphone Frame (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-6 w-full max-w-[340px]">
            {/* Phone Shell with realistic bezel, speaker notch & shadow */}
            <div className="relative mx-auto w-full rounded-[42px] p-3 bg-slate-950 shadow-2xl ring-1 ring-slate-800 border-4 border-slate-900">
              {/* Dynamic Island / Camera Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900/80 mr-2" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-950" />
              </div>

              {/* Status Bar */}
              <div className="relative z-20 flex justify-between items-center px-6 pt-3 text-[10px] text-white/70 font-semibold select-none">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span>5G</span>
                  <div className="w-4 h-2 border border-white/60 rounded-sm p-0.5">
                    <div className="w-full h-full bg-emerald-400 rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* Phone Screen Canvas */}
              <div
                className={`w-full min-h-[560px] max-h-[600px] overflow-y-auto rounded-[34px] p-5 pt-8 bg-gradient-to-b ${currentTheme.bgStyle} flex flex-col justify-between scrollbar-none transition-all duration-300`}
              >
                {/* Profile Header */}
                <div className="text-center space-y-3">
                  {/* Avatar */}
                  <div className="relative mx-auto w-16 h-16">
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white text-xl font-bold shadow-xl ring-2 ring-white/20`}
                    >
                      {title ? title.substring(0, 2).toUpperCase() : "PL"}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-slate-900 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-base font-extrabold ${currentTheme.textPrimary} tracking-tight`}>
                      {title || "Your Name"}
                    </h3>
                    <p className="text-[11px] font-mono text-indigo-400 mt-0.5">
                      @{handle || "handle"}
                    </p>
                    <p className={`text-xs ${currentTheme.textSecondary} mt-1.5 leading-relaxed max-w-[240px] mx-auto`}>
                      {bio || "Add a quick bio description to engage your visitors."}
                    </p>
                  </div>

                  {/* Social Channels Icons Strip */}
                  {(socialTwitter || socialGithub || socialLinkedin || socialEmail) && (
                    <div className="flex items-center justify-center gap-3 pt-1">
                      {socialTwitter && (
                        <a
                          href={socialTwitter}
                          target="_blank"
                          rel="noreferrer"
                          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                        >
                          <IconTwitter className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {socialGithub && (
                        <a
                          href={socialGithub}
                          target="_blank"
                          rel="noreferrer"
                          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                        >
                          <IconGithub className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {socialLinkedin && (
                        <a
                          href={socialLinkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                        >
                          <IconLinkedin className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {socialEmail && (
                        <a
                          href={`mailto:${socialEmail}`}
                          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Interactive Dynamic Link Buttons */}
                <div className="space-y-2.5 my-6">
                  {links.filter((l) => l.isActive).length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-white/20 text-center text-xs text-white/50">
                      No active links yet.
                    </div>
                  ) : (
                    links
                      .filter((l) => l.isActive)
                      .map((link) => (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => handlePreviewLinkClick(link.id, link.url)}
                          className={`w-full group p-3 text-xs font-semibold flex items-center justify-between gap-2 transition-all transform active:scale-95 ${buttonShape} ${currentTheme.btnClass}`}
                        >
                          <span className="truncate text-left">{link.title}</span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {link.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${currentTheme.badgeClass}`}
                              >
                                {link.badge}
                              </span>
                            )}
                            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                          </div>
                        </button>
                      ))
                  )}
                </div>

                {/* Footer Badge inside Phone */}
                <div className="pt-4 pb-2 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>Powered by PicoLink</span>
                  </div>
                </div>
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="w-28 h-1 bg-white/40 rounded-full mx-auto mt-2" />
            </div>

            {/* Helper Hint */}
            <p className="text-[11px] text-slate-400 text-center mt-3">
              💡 Click any button on the phone to test redirects &amp; record live simulated clicks!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
