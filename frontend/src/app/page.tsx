"use client";

import React, { useState, useEffect, useRef } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Pencil,
  Save,
  Monitor,
  Smartphone,
  TrendingUp,
  Download,
  QrCode,
  Zap,
  Activity,
  Copy,
  Check,
  ExternalLink,
  BarChart3,
  Globe,
  Clock,
  Sparkles,
  Lock,
  UserCheck,
  Power,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  User,
  LogIn,
  LogOut,
  Crown,
  ChevronDown,
  X,
  Mail,
  ShieldAlert,
  Link as LinkIcon,
  CheckCircle,
  HelpCircle
} from "lucide-react";

interface ShortenResult {
  short_code: string;
  short_url: string;
  formatted_short_url?: string;
  original_url: string;
  created_at: string;
  expires_at: string | null;
  quota?: QuotaState;
}

interface QuotaState {
  tier: "guest" | "free" | "pro";
  limit: number | null;
  used: number;
  remaining: number | null;
  is_exhausted: boolean;
  resets_at: string;
  is_authenticated: boolean;
}

interface DailyClicks {
  date: string;
  count: number;
}

interface BreakdownItem {
  name: string;
  count: number;
  percentage: number;
}

// "2026-10-13" -> "Oct 13" (parsed as UTC so the day never shifts)
const formatChartDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function BreakdownBars({ items, barClass, emptyText }: { items: BreakdownItem[]; barClass: string; emptyText: string }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-500 py-4 text-center">{emptyText}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.name} className="text-xs">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-slate-300 truncate">{item.name}</span>
            <span className="text-slate-400 shrink-0 tabular-nums">
              <span className="font-bold text-white">{item.percentage}%</span> · {item.count}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className={`h-full rounded-full ${barClass}`} style={{ width: `${item.percentage}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

interface StatsData {
  short_code: string;
  original_url: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  total_clicks: number;
  bot_clicks?: number;
  top_referrers: Array<{ referrer: string; count: number }>;
  country_breakdown: Array<{ country_code: string; count: number }>;
  clicks_over_time: Array<{ date: string; count: number }>;
  clicks_last_7_days?: DailyClicks[];
  clicks_last_30_days?: DailyClicks[];
  referrer_sources?: BreakdownItem[];
  device_breakdown?: BreakdownItem[];
  browser_breakdown?: BreakdownItem[];
  recent_clicks: Array<{
    clicked_at: string;
    referrer: string | null;
    country_code: string | null;
    user_agent: string | null;
  }>;
}

interface AdminUrlItem {
  id: number;
  short_code: string;
  original_url: string;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  total_clicks: number;
}

interface UserLinkItem {
  id: number;
  short_code: string;
  short_url: string;
  formatted_short_url?: string;
  original_url: string;
  is_active: boolean;
  is_expired?: boolean;
  created_at: string;
  expires_at: string | null;
  total_clicks: number;
}

type LinkStatus = "active" | "expired" | "inactive";

const getLinkStatus = (link: UserLinkItem): LinkStatus => {
  const expired = link.is_expired ?? (link.expires_at !== null && new Date(link.expires_at) < new Date());
  if (expired) return "expired";
  return link.is_active ? "active" : "inactive";
};

const LINK_STATUS_STYLES: Record<LinkStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-300",
  expired: "bg-amber-500/15 text-amber-300",
  inactive: "bg-slate-700/60 text-slate-300",
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  // Navigation tab states
  const [activeTab, setActiveTab] = useState<"shorten" | "analytics" | "admin">("shorten");

  // User Authentication State
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Daily Link Quota State
  const [quota, setQuota] = useState<QuotaState | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);

  // Quota Gatekeeper / Upgrade Modal
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotaModalTier, setQuotaModalTier] = useState<"guest" | "free">("guest");
  const [quotaModalMessage, setQuotaModalMessage] = useState("");
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // User Modals: My Links & Account
  const [myLinksModalOpen, setMyLinksModalOpen] = useState(false);
  const [userLinks, setUserLinks] = useState<UserLinkItem[]>([]);
  const [userLinksLoading, setUserLinksLoading] = useState(false);
  const [linksSearch, setLinksSearch] = useState("");
  const [linksStatusFilter, setLinksStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
  const [editUrlInput, setEditUrlInput] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const linksQuery = linksSearch.trim().toLowerCase();
  const visibleUserLinks = userLinks.filter(
    (link) =>
      (linksStatusFilter === "all" || getLinkStatus(link) === linksStatusFilter) &&
      (!linksQuery ||
        link.short_code.toLowerCase().includes(linksQuery) ||
        link.original_url.toLowerCase().includes(linksQuery))
  );
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  // Shorten Form state
  const [urlInput, setUrlInput] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [expiresInput, setExpiresInput] = useState("");
  const [shortenLoading, setShortenLoading] = useState(false);
  const [shortenError, setShortenError] = useState("");
  const [shortenResult, setShortenResult] = useState<ShortenResult | null>(null);
  const [copied, setCopied] = useState(false);
  const qrSvgRef = useRef<SVGSVGElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Analytics state
  const [lookupCode, setLookupCode] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [chartRange, setChartRange] = useState<7 | 30>(7);

  // Superuser Admin state
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loginUsername, setLoginUsername] = useState("admin");
  const [loginPassword, setLoginPassword] = useState("admin123456");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [adminUrls, setAdminUrls] = useState<AdminUrlItem[]>([]);
  const [adminUrlsLoading, setAdminUrlsLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");

  // Debounced (300ms) custom slug availability check
  useEffect(() => {
    const slug = slugInput.trim();
    if (!slug) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/shorten/check-slug/?slug=${encodeURIComponent(slug)}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (data.available) setSlugStatus("available");
        else setSlugStatus(data.reason === "invalid" ? "invalid" : "taken");
      } catch (err) {
        if ((err as Error).name !== "AbortError") setSlugStatus("idle");
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [slugInput]);

  // Initialize Auth & Quota on Mount
  useEffect(() => {
    const savedToken = localStorage.getItem("picolink_token");
    if (savedToken) {
      setAuthToken(savedToken);
      fetchCurrentUser(savedToken);
    } else {
      fetchQuota(null);
    }

    // Superuser legacy token check
    const savedAdmin = localStorage.getItem("picolink_admin_token");
    if (savedAdmin) {
      setAdminToken(savedAdmin);
      fetchAdminMe(savedAdmin);
    }
  }, []);

  // Fetch quota for guest or authenticated user
  const fetchQuota = async (token?: string | null) => {
    setQuotaLoading(true);
    try {
      const activeTok = token !== undefined ? token : authToken;
      const headers: any = { "Content-Type": "application/json" };
      if (activeTok) {
        headers["Authorization"] = `Bearer ${activeTok}`;
      }

      const res = await fetch(`${API_BASE}/api/v1/user/quota`, { headers });
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch (err) {
      console.error("Error fetching quota:", err);
    } finally {
      setQuotaLoading(false);
    }
  };

  // Fetch current authenticated user
  const fetchCurrentUser = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        if (user.quota) {
          setQuota(user.quota);
        } else {
          fetchQuota(token);
        }
      } else {
        // Token expired
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  };

  // Auth: Email/Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_or_email: authEmail,
          password: authPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Login failed.");
      }

      const token = data.tokens.access;
      setAuthToken(token);
      localStorage.setItem("picolink_token", token);
      if (data.tokens.refresh) {
        localStorage.setItem("picolink_refresh_token", data.tokens.refresh);
      }

      setCurrentUser(data.user);
      if (data.quota) setQuota(data.quota);
      else fetchQuota(token);

      setAuthModalOpen(false);
      setAuthPassword("");
    } catch (err: any) {
      setAuthError(err.message || "Failed to log in.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Email/Password Sign Up
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          username: authUsername || authEmail.split("@")[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Sign up failed.");
      }

      const token = data.tokens.access;
      setAuthToken(token);
      localStorage.setItem("picolink_token", token);
      if (data.tokens.refresh) {
        localStorage.setItem("picolink_refresh_token", data.tokens.refresh);
      }

      setCurrentUser(data.user);
      if (data.quota) setQuota(data.quota);
      else fetchQuota(token);

      setAuthModalOpen(false);
      setAuthPassword("");
    } catch (err: any) {
      setAuthError(err.message || "Failed to create account.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Continue with Google OAuth
  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError("");

    try {
      // In a full Google OAuth client environment, this integrates with Google Identity Services.
      // Here we process the Google OAuth exchange endpoint:
      const googleEmail = authEmail.trim() || "alex.rivera@gmail.com";
      const googleName = authUsername.trim() || "Alex Rivera";

      const res = await fetch(`${API_BASE}/api/v1/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleEmail,
          name: googleName,
          google_id: `g_oauth_${Date.now()}`,
          avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Google authentication failed.");
      }

      const token = data.tokens.access;
      setAuthToken(token);
      localStorage.setItem("picolink_token", token);
      if (data.tokens.refresh) {
        localStorage.setItem("picolink_refresh_token", data.tokens.refresh);
      }

      setCurrentUser(data.user);
      if (data.quota) setQuota(data.quota);
      else fetchQuota(token);

      setAuthModalOpen(false);
      setQuotaModalOpen(false);
    } catch (err: any) {
      setAuthError(err.message || "Google sign-in encountered an issue.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Log Out
  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    localStorage.removeItem("picolink_token");
    localStorage.removeItem("picolink_refresh_token");
    setUserDropdownOpen(false);
    fetchQuota(null);
  };

  // Upgrade user to Pro Tier
  const handleUpgradeToPro = async () => {
    if (!authToken) {
      setQuotaModalOpen(false);
      setAuthModalTab("signup");
      setAuthModalOpen(true);
      return;
    }

    setUpgradeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/user/upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        setQuota(data.quota);
        setQuotaModalOpen(false);
        toast.success("You're now on PicoLink Pro", { description: "Enjoy unlimited daily links." });
      }
    } catch (err) {
      console.error("Upgrade error:", err);
    } finally {
      setUpgradeLoading(false);
    }
  };

  // Fetch Links created by User
  const fetchUserLinks = async () => {
    if (!authToken) return;
    setUserLinksLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/user/links`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserLinks(data.results || []);
      }
    } catch (err) {
      console.error("Error fetching user links:", err);
    } finally {
      setUserLinksLoading(false);
    }
  };

  // Shorten Action with Quota Enforcement
  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setShortenLoading(true);
    setShortenError("");
    setShortenResult(null);

    try {
      const payload: any = { original_url: urlInput.trim() };
      if (slugInput.trim()) payload.custom_slug = slugInput.trim();
      if (expiresInput) payload.expires_in_days = parseInt(expiresInput, 10);

      const headers: any = { "Content-Type": "application/json" };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${API_BASE}/api/v1/shorten`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // Handle Quota Exceeded (HTTP 429)
      if (res.status === 429) {
        const isGuest = data.tier === "guest" || !currentUser;
        setQuotaModalTier(isGuest ? "guest" : "free");
        setQuotaModalMessage(
          data.message ||
          (isGuest
            ? "You've reached your daily limit of 3 free links. Create a free account or Continue with Google to shorten up to 10 links per day."
            : "You've reached your free daily limit of 10 links. Upgrade to Pro for unlimited daily shortening, custom aliases, and advanced analytics.")
        );
        if (data.details) setQuota(data.details);
        setQuotaModalOpen(true);
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to shorten link.");
      }

      setShortenResult(data);
      toast.success("Short link created", { description: data.short_url });
      if (data.quota) setQuota(data.quota);
      else fetchQuota(authToken);

      setUrlInput("");
      setSlugInput("");
      setSlugStatus("idle");
      setExpiresInput("");
    } catch (err: any) {
      setShortenError(err.message || "An unexpected error occurred.");
    } finally {
      setShortenLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard", { description: text });
    } catch {
      toast.error("Couldn't copy the link", { description: "Your browser blocked clipboard access." });
    }
  };

  const startEditingLink = (link: UserLinkItem) => {
    setEditingLinkId(link.id);
    setEditUrlInput(link.original_url);
  };

  const handleUpdateDestination = async (link: UserLinkItem) => {
    const newUrl = editUrlInput.trim();
    if (!authToken || !newUrl) return;
    if (newUrl === link.original_url) {
      setEditingLinkId(null);
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/user/links/${link.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ original_url: newUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Couldn't update destination", { description: data.message || "Please try again." });
        return;
      }
      setUserLinks((links) => links.map((l) => (l.id === link.id ? { ...l, ...data } : l)));
      setEditingLinkId(null);
      toast.success(`/${link.short_code} now points to the new destination`, { description: data.original_url });
    } catch {
      toast.error("Couldn't update destination", { description: "Network error. Is the backend running?" });
    } finally {
      setEditSaving(false);
    }
  };

  const triggerDownload = (href: string, filename: string) => {
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadQrPng = (code: string) => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    triggerDownload(canvas.toDataURL("image/png"), `picolink-${code}.png`);
  };

  const downloadQrSvg = (code: string) => {
    const svg = qrSvgRef.current;
    if (!svg) return;
    const markup = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
    triggerDownload(url, `picolink-${code}.svg`);
    URL.revokeObjectURL(url);
  };

  const handleFetchStats = async (codeToQuery?: string) => {
    const code = (codeToQuery || lookupCode).trim();
    if (!code) return;

    setStatsLoading(true);
    setStatsError("");
    setStatsData(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/stats/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Could not fetch stats.");
      }
      setStatsData(data);
    } catch (err: any) {
      setStatsError(err.message || "Error fetching analytics.");
    } finally {
      setStatsLoading(false);
    }
  };

  // Superuser Admin logic
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Invalid credentials.");
      }

      setAdminToken(data.access);
      localStorage.setItem("picolink_admin_token", data.access);
      await fetchAdminMe(data.access);
      await fetchAdminUrls(data.access);
    } catch (err: any) {
      setLoginError(err.message || "Failed to authenticate.");
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchAdminMe = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const u = await res.json();
        setAdminUser(u);
      }
    } catch {
      handleAdminLogout();
    }
  };

  const fetchAdminUrls = async (token: string, search = "") => {
    setAdminUrlsLoading(true);
    try {
      const url = `${API_BASE}/api/v1/admin/urls${search ? `?q=${encodeURIComponent(search)}` : ""}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUrls(data.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminUrlsLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem("picolink_admin_token");
  };

  const handleToggleUrlActive = async (id: number) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/urls/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        fetchAdminUrls(adminToken, adminSearch);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUrl = async (id: number) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/urls/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        fetchAdminUrls(adminToken, adminSearch);
        toast.success("Short link deleted");
      } else {
        toast.error("Couldn't delete the link");
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't delete the link", { description: "Network error. Is the backend running?" });
    }
  };

  const handleDeleteUrl = (id: number) => {
    if (!adminToken) return;
    toast.warning("Delete this shortened URL?", {
      description: "This can't be undone.",
      duration: 10000,
      action: { label: "Delete", onClick: () => deleteUrl(id) },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Ambient background decorative glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px]"></div>
      </div>

      {/* ========================================================= */}
      {/* 1. TOP HEADER & NAVBAR REDESIGN                          */}
      {/* ========================================================= */}
      <header className="relative z-30 w-full bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/90 shadow-lg shadow-black/30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/10 shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent block leading-tight">
                PicoLink
              </span>
              <p className="text-xs text-slate-400 mt-0.5">Make Long Links Simple & Trackable</p>
            </div>
          </div>

          {/* Right Section: Quota Counter & Auth Controls */}
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {/* Subtle Daily Link Counter Badge */}
            {quota && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition shadow-sm ${quota.tier === "pro"
                    ? "bg-purple-950/40 border-purple-500/30 text-purple-300 font-semibold"
                    : quota.tier === "free"
                      ? "bg-indigo-950/40 border-indigo-500/30 text-indigo-300"
                      : "bg-slate-950/70 border-slate-700/80 text-slate-300"
                  }`}
                title={`Resets daily at 00:00 UTC. Used: ${quota.used} links.`}
              >
                {quota.tier === "pro" ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>PRO • Unlimited Links</span>
                  </>
                ) : (
                  <>
                    <span
                      className={`w-2 h-2 rounded-full ${quota.remaining && quota.remaining > 0 ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                    ></span>
                    <span>
                      Links left today:{" "}
                      <strong className="text-white font-bold">
                        {quota.remaining !== null ? quota.remaining : 0}/{quota.limit}
                      </strong>
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Authenticated State: User Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-white transition shadow-sm"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white shadow-inner">
                    {currentUser.username ? currentUser.username.substring(0, 1).toUpperCase() : "U"}
                  </div>
                  <span className="max-w-[120px] truncate">{currentUser.username || currentUser.email}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-2xl">
                    <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${currentUser.is_pro || currentUser.subscription_tier === "pro"
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                              : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                            }`}
                        >
                          {currentUser.is_pro || currentUser.subscription_tier === "pro" ? "Pro Plan" : "Free Tier"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        fetchUserLinks();
                        setMyLinksModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                      My Links
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setAccountModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Account & Plan
                    </button>

                    <div className="my-1 border-t border-slate-800/80"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Unauthenticated State: Sleek Login / Sign Up Button */
              <button
                onClick={() => {
                  setAuthError("");
                  setAuthModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login / Sign Up</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN APPLICATION CONTENT                              */}
      {/* ========================================================= */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full flex-1">
        {/* Navigation Switcher Tabs */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex p-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl shadow-lg">
            <button
              onClick={() => setActiveTab("shorten")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === "shorten"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <Sparkles className="w-4 h-4" />
              Link Studio
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === "analytics"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics Inspector
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === "admin"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <Lock className="w-4 h-4" />
              Superuser Console
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* TAB 1: LINK CREATION STUDIO               */}
        {/* ========================================== */}
        {activeTab === "shorten" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Create Short Link</h2>
                <p className="text-xs text-slate-400 mt-1">
                  High-speed Base62 sequential key generation with Redis cache-aside &amp; SSRF firewall.
                </p>
              </div>

              <form onSubmit={handleShorten} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Target Long URL <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/very/long/destination/url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Custom Vanity Slug <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-500 text-sm font-mono">/</span>
                      <input
                        type="text"
                        placeholder="my-custom-slug"
                        value={slugInput}
                        onChange={(e) => {
                          setSlugInput(e.target.value);
                          setSlugStatus(e.target.value.trim() ? "checking" : "idle");
                        }}
                        aria-describedby="slug-status"
                        className={`w-full pl-8 pr-4 py-3 bg-slate-950/70 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm font-mono ${slugStatus === "available"
                          ? "border-emerald-500/70"
                          : slugStatus === "taken" || slugStatus === "invalid"
                            ? "border-rose-500/70"
                            : "border-slate-700/80"
                          }`}
                      />
                    </div>
                    <p id="slug-status" aria-live="polite" className="mt-1.5 min-h-[1rem] text-xs font-medium">
                      {slugStatus === "checking" && <span className="text-slate-400">Checking availability…</span>}
                      {slugStatus === "available" && <span className="text-emerald-400">✓ Slug available</span>}
                      {slugStatus === "taken" && <span className="text-rose-400">✕ Slug already taken or reserved</span>}
                      {slugStatus === "invalid" && (
                        <span className="text-rose-400">✕ Use 3–50 letters, numbers, hyphens or underscores</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Expiration <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={expiresInput}
                      onChange={(e) => setExpiresInput(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    >
                      <option value="">Never Expire</option>
                      <option value="1">1 Day</option>
                      <option value="7">7 Days</option>
                      <option value="30">30 Days</option>
                      <option value="90">90 Days</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={shortenLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 text-sm mt-2"
                >
                  {shortenLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Shortening Link...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Short URL
                    </>
                  )}
                </button>
              </form>

              {shortenError && (
                <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                  <span>{shortenError}</span>
                </div>
              )}

              {/* Shorten Result Card */}
              {shortenResult && (
                <div className="mt-6 p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Ready to share!
                    </span>
                    <span className="text-xs font-mono text-slate-400">/{shortenResult.short_code}</span>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      readOnly
                      value={shortenResult.short_url}
                      className="bg-transparent text-sm font-mono text-indigo-200 w-full focus:outline-none px-2 select-all"
                    />
                    <button
                      onClick={() =>
                        copyToClipboard(shortenResult.short_url)
                      }
                      className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <a
                      href={shortenResult.short_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Test redirection"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* QR Code */}
                  <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="p-3 bg-white rounded-xl shrink-0">
                      <QRCodeSVG
                        ref={qrSvgRef}
                        value={shortenResult.short_url}
                        size={144}
                        level="M"
                        marginSize={2}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        title={`QR code for ${shortenResult.short_url}`}
                        className="block w-36 h-36"
                      />
                    </div>
                    {/* High-resolution copy used only for the PNG download */}
                    <QRCodeCanvas
                      ref={qrCanvasRef}
                      value={shortenResult.short_url}
                      size={1024}
                      level="M"
                      marginSize={2}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                      className="hidden"
                      aria-hidden="true"
                    />
                    <div className="w-full text-center sm:text-left">
                      <p className="text-sm font-semibold text-white flex items-center justify-center sm:justify-start gap-1.5">
                        <QrCode className="w-4 h-4 text-indigo-400" />
                        Scan to open
                      </p>
                      <p className="mt-1 text-xs text-slate-400 break-all">{shortenResult.short_url}</p>
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => downloadQrPng(shortenResult.short_code)}
                          className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download QR Code (PNG)
                        </button>
                        <button
                          onClick={() => downloadQrSvg(shortenResult.short_code)}
                          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          SVG
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[280px]">Target: {shortenResult.original_url}</span>
                    <button
                      onClick={() => {
                        setLookupCode(shortenResult.short_code);
                        setActiveTab("analytics");
                        handleFetchStats(shortenResult.short_code);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                    >
                      View Live Stats &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: ANALYTICS INSPECTOR                 */}
        {/* ========================================== */}
        {activeTab === "analytics" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Inspect Short Link Analytics
              </h2>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Enter short code or vanity slug (e.g. 6LAze or fastapi-docs)"
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFetchStats()}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  />
                </div>
                <button
                  onClick={() => handleFetchStats()}
                  disabled={statsLoading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition flex items-center gap-2 disabled:opacity-50 text-sm"
                >
                  {statsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Lookup"}
                </button>
              </div>

              {statsError && (
                <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
                  {statsError}
                </div>
              )}
            </div>

            {statsData && (
              <div className="space-y-6 animate-fade-in">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Clicks</span>
                    <div className="text-3xl font-black text-white mt-1">{statsData.total_clicks}</div>
                    <span className="text-xs text-emerald-400 mt-1 inline-block">Real visitors only</span>
                    {!!statsData.bot_clicks && (
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        {statsData.bot_clicks} bot {statsData.bot_clicks === 1 ? "visit" : "visits"} excluded
                      </span>
                    )}
                  </div>

                  <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Status</span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`w-3 h-3 rounded-full ${statsData.is_active ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                      <span className="text-lg font-bold text-white">
                        {statsData.is_active ? "Active" : "Deactivated"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Short Code</span>
                    <div className="text-lg font-mono font-bold text-indigo-300 mt-1 truncate">
                      {statsData.short_code}
                    </div>
                    <span className="text-xs text-slate-500 truncate block mt-0.5">
                      Created: {new Date(statsData.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Target URL banner */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                  <div className="truncate text-xs">
                    <span className="text-slate-400 font-medium">Destination: </span>
                    <span className="text-indigo-300 font-mono">{statsData.original_url}</span>
                  </div>
                  <a
                    href={`${API_BASE}/${statsData.short_code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg transition shrink-0 flex items-center gap-1"
                  >
                    Test Link
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Clicks Over Time */}
                <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      Clicks Over Time
                    </h3>
                    <div className="flex p-0.5 bg-slate-950 border border-slate-800 rounded-lg" role="group" aria-label="Chart range">
                      {([7, 30] as const).map((days) => (
                        <button
                          key={days}
                          onClick={() => setChartRange(days)}
                          aria-pressed={chartRange === days}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition ${chartRange === days ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                        >
                          {days} days
                        </button>
                      ))}
                    </div>
                  </div>
                  {(() => {
                    const series = (chartRange === 7 ? statsData.clicks_last_7_days : statsData.clicks_last_30_days) ?? [];
                    const rangeTotal = series.reduce((sum, d) => sum + d.count, 0);
                    return (
                      <>
                        <p className="text-xs text-slate-400 mb-3">
                          <span className="font-bold text-white">{rangeTotal}</span> clicks in the last {chartRange} days
                        </p>
                        <div className="h-60 -ml-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={series} margin={{ top: 5, right: 12, bottom: 0, left: 0 }}>
                              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                              <XAxis
                                dataKey="date"
                                tickFormatter={formatChartDate}
                                tick={{ fill: "#94a3b8", fontSize: 11 }}
                                axisLine={{ stroke: "#334155" }}
                                tickLine={false}
                                interval="preserveStartEnd"
                                minTickGap={24}
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={{ fill: "#94a3b8", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                width={36}
                              />
                              <Tooltip
                                labelFormatter={(label) => formatChartDate(String(label))}
                                formatter={(value) => [value, "Clicks"]}
                                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                                labelStyle={{ color: "#e2e8f0" }}
                                itemStyle={{ color: "#a5b4fc" }}
                              />
                              <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#818cf8"
                                strokeWidth={2}
                                dot={chartRange === 7 ? { r: 3, fill: "#818cf8" } : false}
                                activeDot={{ r: 5 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Breakdown Grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Referrers */}
                  <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      Top Referrers
                    </h3>
                    <BreakdownBars
                      items={statsData.referrer_sources ?? []}
                      barClass="bg-indigo-500"
                      emptyText="No referrers logged yet."
                    />
                  </div>

                  {/* Countries */}
                  <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4 text-purple-400" />
                      Country Breakdown
                    </h3>
                    {statsData.country_breakdown.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No geolocation data yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {statsData.country_breakdown.map((c, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
                            <span className="text-slate-300 font-mono">{c.country_code}</span>
                            <span className="font-bold text-purple-400">{c.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Devices */}
                  <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      Devices
                    </h3>
                    <BreakdownBars
                      items={statsData.device_breakdown ?? []}
                      barClass="bg-emerald-500"
                      emptyText="No device data yet."
                    />
                  </div>

                  {/* Browsers */}
                  <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <Monitor className="w-4 h-4 text-amber-400" />
                      Browsers
                    </h3>
                    <BreakdownBars
                      items={statsData.browser_breakdown ?? []}
                      barClass="bg-amber-500"
                      emptyText="No browser data yet."
                    />
                  </div>
                </div>

                {/* Recent Click Log */}
                <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Recent Click Stream
                  </h3>
                  {statsData.recent_clicks.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No clicks recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-800">
                            <th className="py-2">Timestamp</th>
                            <th className="py-2">Referrer</th>
                            <th className="py-2">User Agent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {statsData.recent_clicks.map((rc, i) => (
                            <tr key={i} className="text-slate-300">
                              <td className="py-2 font-mono">{new Date(rc.clicked_at).toLocaleTimeString()}</td>
                              <td className="py-2 font-mono truncate max-w-[180px]">{rc.referrer || "Direct"}</td>
                              <td className="py-2 text-slate-400 truncate max-w-[260px]">{rc.user_agent || "Unknown"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: SUPERUSER CONSOLE                   */}
        {/* ========================================== */}
        {activeTab === "admin" && (
          <div className="max-w-5xl mx-auto space-y-6">
            {!adminToken ? (
              <div className="max-w-md mx-auto bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Superuser Login</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Authenticate via Django REST Framework SimpleJWT
                  </p>
                </div>

                {loginError && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Sign in as Superuser"}
                  </button>
                </form>

                <div className="mt-4 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-400 text-center">
                  Default credentials seeded: <span className="text-indigo-300 font-mono">admin / admin123456</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Admin Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{adminUser?.username || "Superuser"}</span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Superuser Verified
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">Manage all URLs, system killswitches &amp; Redis cache</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={`${API_BASE}/admin/`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Open Full Django Admin (/admin)
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={handleAdminLogout}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* URL Management Table */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <h3 className="font-bold text-white text-base">URL Repository ({adminUrls.length})</h3>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Search URLs..."
                        value={adminSearch}
                        onChange={(e) => {
                          setAdminSearch(e.target.value);
                          fetchAdminUrls(adminToken, e.target.value);
                        }}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        onClick={() => fetchAdminUrls(adminToken, adminSearch)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title="Refresh"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {adminUrlsLoading ? (
                    <div className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                      Loading repository...
                    </div>
                  ) : adminUrls.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No shortened URLs in database.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-800">
                            <th className="py-3 px-3">Code</th>
                            <th className="py-3 px-3">Original Destination</th>
                            <th className="py-3 px-3">Clicks</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {adminUrls.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-800/30 transition">
                              <td className="py-3 px-3 font-mono font-bold text-indigo-300">
                                {u.short_code}
                              </td>
                              <td className="py-3 px-3 truncate max-w-[280px] text-slate-300">
                                {u.original_url}
                              </td>
                              <td className="py-3 px-3 font-bold text-white">
                                {u.total_clicks}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.is_active
                                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                      : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                                    }`}
                                >
                                  {u.is_active ? "ACTIVE" : "DISABLED"}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleToggleUrlActive(u.id)}
                                    className={`p-1.5 rounded-md border text-xs transition ${u.is_active
                                        ? "bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20"
                                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20"
                                      }`}
                                    title={u.is_active ? "Disable link" : "Enable link"}
                                  >
                                    <Power className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUrl(u.id)}
                                    className="p-1.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-xs transition"
                                    title="Delete URL"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 3. MODAL: AUTHENTICATION (LOG IN / SIGN UP / GOOGLE)     */}
      {/* ========================================================= */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/25">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {authModalTab === "login" ? "Welcome back to PicoLink" : "Create your PicoLink account"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {authModalTab === "login"
                  ? "Log in to track your links and access your daily quota."
                  : "Sign up free to get up to 10 daily links, custom slugs & analytics."}
              </p>
            </div>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleAuth}
              disabled={authLoading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl text-xs transition shadow flex items-center justify-center gap-3 mb-5 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-slate-900 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                or with email
              </span>
            </div>

            {/* Tab switch: Log In vs Sign Up */}
            <div className="flex p-1 bg-slate-950 rounded-xl mb-4 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab("login");
                  setAuthError("");
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${authModalTab === "login" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab("signup");
                  setAuthError("");
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${authModalTab === "signup" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
              >
                Sign Up
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={authModalTab === "login" ? handleLogin : handleRegister} className="space-y-3.5">
              {authModalTab === "signup" && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">Username (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. dev_sarah"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : authModalTab === "login" ? (
                  "Sign In"
                ) : (
                  "Create Free Account"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MODAL: QUOTA GATEKEEPER / UPGRADE TRIGGER (HTTP 429)  */}
      {/* ========================================================= */}
      {quotaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            <button
              onClick={() => setQuotaModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {quotaModalTier === "guest" ? (
              /* Tier 1 UX: GUEST LIMIT REACHED (3 LINKS) */
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Daily Guest Limit Reached</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto mb-6">
                  {quotaModalMessage ||
                    "You've reached your daily limit of 3 free links. Create a free account or Continue with Google to shorten up to 10 links per day."}
                </p>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left mb-6 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-rose-400 font-bold">✕</span> Guest Tier: 3 links/day (Exhausted)
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <span>✓</span> Free Account: <strong>10 links/day</strong> + Dashboard &amp; Analytics
                  </div>
                  <div className="flex items-center gap-2 text-purple-400 font-medium">
                    <span>✓</span> Pro Subscriber: <strong>Unlimited links</strong> + Custom slugs
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleGoogleAuth}
                    disabled={authLoading}
                    className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl text-xs transition shadow flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google &amp; Get 10 Links</span>
                  </button>

                  <button
                    onClick={() => {
                      setQuotaModalOpen(false);
                      setAuthModalTab("signup");
                      setAuthModalOpen(true);
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-indigo-600/30"
                  >
                    Create Free Account (Email &amp; Password)
                  </button>
                </div>
              </div>
            ) : (
              /* Tier 2 UX: FREE REGISTERED USER LIMIT REACHED (10 LINKS) */
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Free Daily Limit Reached</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto mb-6">
                  {quotaModalMessage ||
                    "You've reached your free daily limit of 10 links. Upgrade to Pro for unlimited daily shortening, custom aliases, and advanced analytics."}
                </p>

                <div className="p-4 bg-slate-950 rounded-2xl border border-purple-500/30 text-left mb-6 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-rose-400 font-bold">✕</span> 10/10 Free links used today (Resets at 00:00 UTC)
                  </div>
                  <div className="flex items-center gap-2 text-purple-300 font-semibold">
                    <Crown className="w-3.5 h-3.5 text-amber-400" /> Pro Tier: <strong>Unlimited Daily Shortening</strong>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-300">
                    <span>✓</span> Branded Custom Slugs &amp; Zero Expiration Caps
                  </div>
                  <div className="flex items-center gap-2 text-indigo-300">
                    <span>✓</span> Real-Time Click Logs &amp; Geolocation Map
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleUpgradeToPro}
                    disabled={upgradeLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {upgradeLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Crown className="w-4 h-4 text-amber-300" />
                        <span>Upgrade to Pro (Unlimited Links)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setQuotaModalOpen(false)}
                    className="w-full py-2.5 text-slate-400 hover:text-white text-xs transition"
                  >
                    Maybe Tomorrow
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: "MY LINKS" REPOSITORY                           */}
      {/* ========================================================= */}
      {myLinksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <button
              onClick={() => setMyLinksModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">My Shortened Links</h3>
                <p className="text-xs text-slate-400">Search, filter and edit links created from your account</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="search"
                  value={linksSearch}
                  onChange={(e) => setLinksSearch(e.target.value)}
                  placeholder="Search by short code or destination…"
                  aria-label="Search links"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={linksStatusFilter}
                onChange={(e) => setLinksStatusFilter(e.target.value as "all" | "active" | "expired")}
                aria-label="Filter by status"
                className="sm:w-36 px-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto">
              {userLinksLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                  Loading your links...
                </div>
              ) : userLinks.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No links created under this account yet. Shorten your first link above!
                </div>
              ) : visibleUserLinks.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No links match your search or filter.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {visibleUserLinks.map((item) => {
                    const linkStatus = getLinkStatus(item);
                    const isEditing = editingLinkId === item.id;
                    return (
                    <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-indigo-300 text-xs">
                            /{item.short_code}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${LINK_STATUS_STYLES[linkStatus]}`}>
                            {linkStatus}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-semibold">
                            {item.total_clicks} clicks
                          </span>
                        </div>
                        {isEditing ? (
                          <form
                            className="mt-2 flex flex-col sm:flex-row gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleUpdateDestination(item);
                            }}
                          >
                            <input
                              type="url"
                              required
                              autoFocus
                              value={editUrlInput}
                              onChange={(e) => setEditUrlInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Escape" && setEditingLinkId(null)}
                              aria-label={`New destination URL for /${item.short_code}`}
                              className="flex-1 min-w-0 px-3 py-1.5 bg-slate-950/70 border border-indigo-500/60 rounded-lg text-[11px] font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={editSaving}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1 transition"
                              >
                                {editSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingLinkId(null)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                            {item.original_url}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {linkStatus === "active" && !isEditing && (
                          <button
                            onClick={() => startEditingLink(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition"
                            title="Edit destination URL"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() =>
                            copyToClipboard(item.short_url)
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition"
                          title="Copy link"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                        <a
                          href={item.short_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                          title="Visit link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: "ACCOUNT & PLAN"                                */}
      {/* ========================================================= */}
      {accountModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            <button
              onClick={() => setAccountModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white mx-auto mb-3 shadow-lg shadow-indigo-500/25">
                {currentUser.username ? currentUser.username.substring(0, 1).toUpperCase() : "U"}
              </div>
              <h3 className="text-lg font-bold text-white">{currentUser.username}</h3>
              <p className="text-xs text-slate-400">{currentUser.email}</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 mb-6 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Subscription Tier</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${currentUser.is_pro || currentUser.subscription_tier === "pro"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                    }`}
                >
                  {currentUser.is_pro || currentUser.subscription_tier === "pro" ? "Pro (Unlimited)" : "Free (10/day)"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Today's Remaining</span>
                <span className="font-bold text-white">
                  {quota?.tier === "pro" ? "Unlimited" : `${quota?.remaining ?? 0} / ${quota?.limit ?? 10}`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Daily Reset Time</span>
                <span className="font-mono text-slate-300 text-[11px]">00:00 UTC</span>
              </div>
            </div>

            {!currentUser.is_pro && currentUser.subscription_tier !== "pro" ? (
              <button
                onClick={handleUpgradeToPro}
                disabled={upgradeLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {upgradeLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Crown className="w-4 h-4 text-amber-300" />
                    <span>Upgrade to Pro Plan (Instant)</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-center text-xs text-purple-300 flex items-center justify-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>You have active Pro status with unlimited shortening.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. DISTINCT BOTTOM FOOTER BAR                            */}
      {/* ========================================================= */}
      <footer className="relative z-20 w-full bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 py-5 mt-12 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold tracking-wide">PicoLink</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">
              Powered by <span className="text-indigo-400 font-semibold">Raktch Technology &amp; Software.</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500/80"></span>
            <span>Enterprise URL Shortener</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
