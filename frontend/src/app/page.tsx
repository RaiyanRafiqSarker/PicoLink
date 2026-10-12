"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  Shield,
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
  ArrowRight
} from "lucide-react";

interface ShortenResult {
  short_code: string;
  short_url: string;
  original_url: string;
  created_at: string;
  expires_at: string | null;
}

interface StatsData {
  short_code: string;
  original_url: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  total_clicks: number;
  top_referrers: Array<{ referrer: string; count: number }>;
  country_breakdown: Array<{ country_code: string; count: number }>;
  clicks_over_time: Array<{ date: string; count: number }>;
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  // Tab states
  const [activeTab, setActiveTab] = useState<"shorten" | "analytics" | "admin">("shorten");

  // Shorten Form state
  const [urlInput, setUrlInput] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [expiresInput, setExpiresInput] = useState("");
  const [shortenLoading, setShortenLoading] = useState(false);
  const [shortenError, setShortenError] = useState("");
  const [shortenResult, setShortenResult] = useState<ShortenResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Analytics state
  const [lookupCode, setLookupCode] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [statsData, setStatsData] = useState<StatsData | null>(null);

  // Health state
  const [healthStatus, setHealthStatus] = useState<any>(null);

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

  // Check health on mount
  useEffect(() => {
    fetchHealth();
    // Check saved token
    const saved = localStorage.getItem("picolink_admin_token");
    if (saved) {
      setAdminToken(saved);
      fetchAdminMe(saved);
    }
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/healthz`);
      if (res.ok) {
        const data = await res.json();
        setHealthStatus(data);
      }
    } catch {
      setHealthStatus({ status: "offline", services: { postgres: "unknown", redis: "unknown" } });
    }
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setShortenLoading(true);
    setShortenError("");
    setShortenResult(null);

    try {
      const payload: any = { original_url: urlInput };
      if (slugInput.trim()) payload.custom_slug = slugInput.trim();
      if (expiresInput) payload.expires_in_days = parseInt(expiresInput, 10);

      const res = await fetch(`${API_BASE}/api/v1/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to shorten link.");
      }

      setShortenResult(data);
      setUrlInput("");
      setSlugInput("");
      setExpiresInput("");
    } catch (err: any) {
      setShortenError(err.message || "An unexpected error occurred.");
    } finally {
      setShortenLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      setLoginError(err.message || "Login failed.");
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
        const data = await res.json();
        setAdminUser(data);
      } else {
        handleAdminLogout();
      }
    } catch {
      handleAdminLogout();
    }
  };

  const fetchAdminUrls = async (token?: string, query: string = "") => {
    const authToken = token || adminToken;
    if (!authToken) return;

    setAdminUrlsLoading(true);
    try {
      const url = `${API_BASE}/api/v1/admin/urls${query ? `?q=${encodeURIComponent(query)}` : ""}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUrls(data.results || []);
      }
    } catch (err) {
      console.error("Failed to load URLs", err);
    } finally {
      setAdminUrlsLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem("picolink_admin_token");
    setAdminUrls([]);
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

  const handleDeleteUrl = async (id: number) => {
    if (!adminToken || !confirm("Are you sure you want to permanently delete this shortened link?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/urls/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        fetchAdminUrls(adminToken, adminSearch);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                  PicoLink
                </span>
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Django + Next.js
                </span>
              </div>
              <p className="text-xs text-slate-400">PostgreSQL • Redis Cache-Aside • Base62 • Django Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Health pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${healthStatus?.status === "ok" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
              <span className="text-slate-300">
                {healthStatus?.status === "ok" ? "Django API Online" : "Connecting..."}
              </span>
            </div>

            {/* Django Admin Direct Link */}
            <a
              href={`${API_BASE}/admin/`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition"
            >
              <Shield className="w-3.5 h-3.5" />
              Django /admin
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex p-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl shadow-lg">
            <button
              onClick={() => setActiveTab("shorten")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "shorten"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Link Studio
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "analytics"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics Inspector
            </button>
            <button
              onClick={() => {
                setActiveTab("admin");
                if (adminToken) fetchAdminUrls(adminToken);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "admin"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield className="w-4 h-4" />
              Superuser Console
              {adminUser?.is_superuser && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
          </div>
        </div>

        {/* TAB 1: SHORTEN STUDIO */}
        {activeTab === "shorten" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-400" />
                  Shorten a URL
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  High-speed Base62 sequential key generation with Redis cache-aside & SSRF firewall.
                </p>
              </div>

              {shortenError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{shortenError}</span>
                </div>
              )}

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
                        onChange={(e) => setSlugInput(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm font-mono"
                      />
                    </div>
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
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
                >
                  {shortenLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Generate Short Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Result display */}
              {shortenResult && (
                <div className="mt-8 p-5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase font-bold tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Shortened Successfully
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Code: {shortenResult.short_code}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg p-2 px-3">
                    <input
                      type="text"
                      readOnly
                      value={shortenResult.short_url}
                      className="bg-transparent border-none text-white text-sm font-mono focus:outline-none flex-1 truncate"
                    />
                    <button
                      onClick={() => copyToClipboard(shortenResult.short_url)}
                      className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <a
                      href={shortenResult.short_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-white transition"
                      title="Open Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
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

        {/* TAB 2: ANALYTICS INSPECTOR */}
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
                    <span className="text-xs text-emerald-400 mt-1 inline-block">Real-time aggregate</span>
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

                {/* Breakdown Grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Referrers */}
                  <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      Top Referrers
                    </h3>
                    {statsData.top_referrers.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No referrers logged yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {statsData.top_referrers.map((r, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
                            <span className="text-slate-300 font-mono truncate max-w-[220px]">{r.referrer}</span>
                            <span className="font-bold text-indigo-400">{r.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
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

        {/* TAB 3: SUPERUSER CONSOLE */}
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
                      <span className="text-xs text-slate-400">Manage all URLs, system killswitches & Redis cache</span>
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
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    u.is_active
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
                                    className={`p-1.5 rounded-md border text-xs transition ${
                                      u.is_active
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
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        PicoLink Engine • Built with Django 6, Django REST Framework, SimpleJWT, Next.js 15, and Tailwind CSS.
      </footer>
    </div>
  );
}
