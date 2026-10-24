"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ExternalLink,
  Globe,
  Share2,
  Check,
  Sparkles,
  Mail,
  Smartphone,
  ShieldCheck,
} from "lucide-react";

interface BioLink {
  id: number;
  title: string;
  url: string;
  icon_name?: string;
  badge?: string;
  click_count?: number;
  is_active: boolean;
}

interface BioPageData {
  id: number;
  slug: string;
  title: string;
  bio: string;
  avatar_url?: string;
  theme_config?: {
    theme?: string;
    shape?: string;
    avatar_gradient?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    email?: string;
  };
  links: BioLink[];
  public_url?: string;
}

const IconTwitter = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconGithub = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const IconLinkedin = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.39 9.74v-8.37H5.07v8.37h2.78z" />
  </svg>
);

const IconInstagram = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const IconYoutube = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const THEME_PRESETS: Record<
  string,
  {
    bg: string;
    card: string;
    textTitle: string;
    textBio: string;
    button: string;
    badge: string;
  }
> = {
  midnight: {
    bg: "from-[#080d1a] via-[#0f172a] to-[#1e1b4b]",
    card: "bg-slate-900/80 border-slate-800",
    textTitle: "text-white",
    textBio: "text-slate-300",
    button: "bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700/80 hover:border-indigo-500 shadow-md",
    badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  },
  neon: {
    bg: "from-black via-purple-950 to-slate-950",
    card: "bg-purple-950/40 border-purple-500/30",
    textTitle: "text-purple-100",
    textBio: "text-purple-300/80",
    button: "bg-purple-900/60 hover:bg-purple-800 text-purple-100 border-purple-500/40 hover:border-fuchsia-400 shadow-lg shadow-purple-950/50",
    badge: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
  },
  emerald: {
    bg: "from-slate-950 via-teal-950 to-emerald-950",
    card: "bg-emerald-950/40 border-emerald-500/30",
    textTitle: "text-emerald-100",
    textBio: "text-emerald-300/80",
    button: "bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-100 border-emerald-500/40 hover:border-teal-400 shadow-md",
    badge: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  },
  sunset: {
    bg: "from-slate-950 via-amber-950/70 to-rose-950",
    card: "bg-rose-950/40 border-rose-500/30",
    textTitle: "text-orange-100",
    textBio: "text-rose-200/80",
    button: "bg-rose-950/60 hover:bg-rose-900 text-orange-100 border-rose-500/40 hover:border-amber-400 shadow-md",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  minimal: {
    bg: "from-slate-950 via-slate-900 to-black",
    card: "bg-slate-900 border-slate-800",
    textTitle: "text-white",
    textBio: "text-slate-400",
    button: "bg-slate-900 hover:bg-slate-800 text-white border-slate-800 hover:border-slate-600 shadow-sm",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
  },
};

function BioPageContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [data, setData] = useState<BioPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchPage = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/v1/pages/public/${slug}/`);
        if (!res.ok) {
          throw new Error("Bio page not found or is currently private.");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Failed to load page.");
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug, API_BASE]);

  const handleLinkClick = async (linkId: number, targetUrl: string) => {
    try {
      fetch(`${API_BASE}/api/v1/pages/public/${slug}/click/${linkId}/`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Non-blocking telemetry
    }
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 animate-pulse text-center">
          <div className="w-24 h-24 rounded-full bg-slate-800 mx-auto" />
          <div className="h-6 w-48 bg-slate-800 rounded-lg mx-auto" />
          <div className="h-4 w-64 bg-slate-850 rounded-lg mx-auto" />
          <div className="space-y-3 pt-6">
            <div className="h-14 bg-slate-800/60 rounded-2xl" />
            <div className="h-14 bg-slate-800/60 rounded-2xl" />
            <div className="h-14 bg-slate-800/60 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <Smartphone className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold">Bio Page Not Found</h1>
          <p className="text-xs text-slate-400">
            {error || `The requested bio page @${slug} is either private or does not exist.`}
          </p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create your own with PicoLink</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const themeKey = data.theme_config?.theme || "midnight";
  const preset = THEME_PRESETS[themeKey] || THEME_PRESETS.midnight;
  const shapeClass = data.theme_config?.shape || "rounded-2xl";
  const avatarGrad = data.theme_config?.avatar_gradient || "from-indigo-500 to-purple-600";
  const initial = data.title ? data.title.charAt(0).toUpperCase() : "P";

  return (
    <div
      className={`bio-public-page min-h-screen bg-gradient-to-b ${preset.bg} flex flex-col justify-between py-10 px-4 sm:px-6 relative select-none`}
    >
      {/* Top Floating Share Button */}
      <div className="max-w-md w-full mx-auto flex justify-end mb-4">
        <button
          onClick={handleShare}
          className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/10 text-white shadow-lg transition flex items-center gap-1.5 text-xs font-medium"
          title="Share bio page"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-slate-200" />}
          <span>{copied ? "Copied" : "Share"}</span>
        </button>
      </div>

      {/* Main Profile & Links Container */}
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Profile Card Header */}
        <div className="text-center space-y-3">
          {data.avatar_url ? (
            <img
              src={data.avatar_url}
              alt={data.title}
              className="w-24 h-24 rounded-full mx-auto object-cover ring-4 ring-white/10 shadow-2xl"
            />
          ) : (
            <div
              className={`w-24 h-24 rounded-full bg-gradient-to-tr ${avatarGrad} text-white text-3xl font-black flex items-center justify-center mx-auto shadow-2xl ring-4 ring-white/10`}
            >
              {initial}
            </div>
          )}

          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${preset.textTitle}`}>
                {data.title}
              </h1>
              <ShieldCheck className="w-5 h-5 text-indigo-400 fill-indigo-400/20 shrink-0" />
            </div>
            <p className="text-xs font-mono text-indigo-400/90 mt-0.5">@{data.slug}</p>
          </div>

          {data.bio && (
            <p className={`text-xs max-w-sm mx-auto leading-relaxed ${preset.textBio}`}>
              {data.bio}
            </p>
          )}

          {/* Social Icons Bar */}
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            {data.theme_config?.twitter && (
              <a
                href={data.theme_config.twitter}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                title="Twitter"
              >
                <IconTwitter />
              </a>
            )}
            {data.theme_config?.github && (
              <a
                href={data.theme_config.github}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                title="GitHub"
              >
                <IconGithub />
              </a>
            )}
            {data.theme_config?.linkedin && (
              <a
                href={data.theme_config.linkedin}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                title="LinkedIn"
              >
                <IconLinkedin />
              </a>
            )}
            {data.theme_config?.instagram && (
              <a
                href={data.theme_config.instagram}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                title="Instagram"
              >
                <IconInstagram />
              </a>
            )}
            {data.theme_config?.youtube && (
              <a
                href={data.theme_config.youtube}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                title="YouTube"
              >
                <IconYoutube />
              </a>
            )}
            {data.theme_config?.email && (
              <a
                href={`mailto:${data.theme_config.email}`}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Dynamic Link Buttons List */}
        <div className="space-y-3 pt-2">
          {data.links && data.links.length > 0 ? (
            data.links
              .filter((l) => l.is_active)
              .map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id, link.url)}
                  className={`bio-link-btn w-full p-4 border flex items-center justify-between gap-3 text-left transition transform hover:-translate-y-0.5 active:translate-y-0 ${shapeClass} ${preset.button}`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Globe className="w-4 h-4 shrink-0 opacity-70" />
                    <span className="text-xs sm:text-sm font-semibold truncate">{link.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {link.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider border ${preset.badge}`}
                      >
                        {link.badge}
                      </span>
                    )}
                    <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 transition" />
                  </div>
                </button>
              ))
          ) : (
            <div className="p-6 rounded-2xl bg-black/20 border border-white/10 text-center text-xs text-white/60">
              No links published on this bio page yet.
            </div>
          )}
        </div>
      </div>

      {/* Powered by PicoLink Footer */}
      <footer className="max-w-md w-full mx-auto text-center pt-10">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/10 text-[11px] text-white/80 transition"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span>Powered by <strong>PicoLink</strong></span>
        </a>
      </footer>
    </div>
  );
}

export default function PublicBioPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#080d1a] flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4 animate-pulse text-center">
            <div className="w-24 h-24 rounded-full bg-slate-800 mx-auto" />
            <div className="h-6 w-48 bg-slate-800 rounded-lg mx-auto" />
            <div className="h-4 w-64 bg-slate-850 rounded-lg mx-auto" />
          </div>
        </div>
      }
    >
      <BioPageContent />
    </React.Suspense>
  );
}

