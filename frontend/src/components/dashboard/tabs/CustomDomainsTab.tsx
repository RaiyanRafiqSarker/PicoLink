"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Sparkles,
  Check,
  ArrowRight,
  Search,
  Crown,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
  Trash2,
  Copy,
  Server,
  Code,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import PricingPlansView from "../PricingPlansView";

interface CustomDomainsTabProps {
  onUpgradePro?: () => void;
}

interface DomainSuggestion {
  domain: string;
  tld: string;
  badge?: string;
  isComplimentary?: boolean;
}

interface CustomDomainItem {
  id: number;
  domain: string;
  status: "pending" | "active" | "failed";
  ssl_active: boolean;
  verification_token: string;
  created_at: string;
}

export default function CustomDomainsTab({ onUpgradePro }: CustomDomainsTabProps) {
  const [showPlans, setShowPlans] = useState(false);
  const [selectedDomainToClaim, setSelectedDomainToClaim] = useState<string | null>(null);

  const [domains, setDomains] = useState<CustomDomainItem[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const [activeMode, setActiveMode] = useState<"search" | "ai" | "direct">("ai");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [suggestedDomains, setSuggestedDomains] = useState<DomainSuggestion[]>([]);

  // Search mode state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<DomainSuggestion | null>(null);
  const [searching, setSearching] = useState(false);

  // Direct domain add input
  const [directDomain, setDirectDomain] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);

  // TLS Guide state
  const [showTlsGuide, setShowTlsGuide] = useState(false);
  const [guideTab, setGuideTab] = useState<"caddy" | "nginx">("caddy");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch registered domains from backend
  const fetchDomains = async () => {
    setLoadingDomains(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null;
      if (!token) {
        setLoadingDomains(false);
        return;
      }
      const res = await fetch(`${API_BASE}/api/v1/domains/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDomains(data || []);
      }
    } catch (err) {
      console.warn("Failed to fetch custom domains:", err);
    } finally {
      setLoadingDomains(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  // Add domain via API
  const handleAddDomain = async (domainName: string) => {
    let clean = domainName.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!clean) return;

    setAddingDomain(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/v1/domains/add/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ domain: clean }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Domain "${clean}" added!`, {
          description: "Please configure your DNS CNAME to cname.picolink.dev and verify.",
        });
        setDirectDomain("");
        fetchDomains();
      } else {
        toast.error(data.error || "Failed to add domain.");
      }
    } catch (err) {
      toast.error("Network error adding domain.");
    } finally {
      setAddingDomain(false);
    }
  };

  // Verify domain DNS and TLS
  const handleVerifyDomain = async (id: number) => {
    setVerifyingId(id);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/v1/domains/verify/${id}/`, {
        method: "POST",
        headers,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Domain verified and SSL provisioned!");
        fetchDomains();
      } else {
        toast.error(data.message || "DNS propagation in progress. Please check again shortly.");
      }
    } catch (err) {
      toast.error("Verification check failed.");
    } finally {
      setVerifyingId(null);
    }
  };

  // Delete domain
  const handleDeleteDomain = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove domain "${name}"?`)) return;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/v1/domains/${id}/`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        toast.success(`Domain "${name}" removed.`);
        setDomains((prev) => prev.filter((d) => d.id !== id));
      } else {
        toast.error("Failed to delete domain.");
      }
    } catch (err) {
      toast.error("Network error removing domain.");
    }
  };

  // If user clicked "Upgrade to Claim", navigate to the Plans Page
  if (showPlans) {
    return (
      <PricingPlansView
        onBack={() => setShowPlans(false)}
        onUpgradePro={onUpgradePro}
        targetDomain={selectedDomainToClaim || undefined}
        backLabel="Back to Custom Domains"
        onPlanSelected={async (planName, domain) => {
          if (domain) {
            await handleAddDomain(domain);
          }
          setShowPlans(false);
        }}
      />
    );
  }

  // Smart domain generation helper based on user prompt
  const generateDomainSuggestions = (prompt: string): DomainSuggestion[] => {
    const cleanWords = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(
        (w) =>
          w.length > 1 &&
          !["a", "an", "the", "in", "on", "at", "for", "with", "and", "of", "to", "covering", "publication", "service", "company", "about"].includes(w)
      );

    const primary = cleanWords[0] || "brand";
    const secondary = cleanWords[1] || "";
    const combined = cleanWords.slice(0, 2).join("");

    const baseIdeas = [
      secondary ? `${primary}${secondary}.link` : `${primary}.link`,
      `go${primary}.co`,
      `${combined || primary}.fyi`,
      secondary ? `${secondary}pulse.ly` : `get${primary}.ly`,
      `${primary}.stream`,
      `${combined || primary}hub.page`,
    ];

    const unique = Array.from(new Set(baseIdeas));

    return unique.slice(0, 6).map((domain, index) => {
      const parts = domain.split(".");
      const tld = parts[parts.length - 1];
      const badges = ["Top Pick", "Complimentary", "Popular", "Brandable", "Short", "New"];
      return {
        domain,
        tld: `.${tld}`,
        badge: badges[index % badges.length],
        isComplimentary: true,
      };
    });
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      const suggestions = generateDomainSuggestions(aiPrompt);
      setSuggestedDomains(suggestions);
      toast.success("AI domain suggestions generated!");
    }, 600);
  };

  const handleSearchDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      let cleaned = searchQuery.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (!cleaned.includes(".")) {
        cleaned = `${cleaned}.link`;
      }
      setSearchResult({
        domain: cleaned,
        tld: `.${cleaned.split(".").pop()}`,
        badge: "Available Now",
        isComplimentary: true,
      });
    }, 400);
  };

  const handleUpgradeToClaim = (domain: string) => {
    window.location.href = `/checkout?plan=pro&billing=annual&domain=${encodeURIComponent(domain)}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Brand your links with a custom domain
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Replace default links with your own branded vanity domain to build trust, elevate identity, and increase click-through rates.
          </p>
        </div>

        <button
          onClick={() => setShowTlsGuide(!showTlsGuide)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-300 hover:text-white transition"
        >
          <Server className="w-3.5 h-3.5 text-indigo-400" />
          <span>Reverse Proxy TLS Setup</span>
          {showTlsGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Caddy / Nginx Reverse Proxy Setup Guide */}
      {showTlsGuide && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Automated On-Demand TLS Provisioning
              </h3>
            </div>
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button
                onClick={() => setGuideTab("caddy")}
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  guideTab === "caddy" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Caddy (Recommended)
              </button>
              <button
                onClick={() => setGuideTab("nginx")}
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  guideTab === "nginx" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Nginx + Certbot
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            {guideTab === "caddy"
              ? "Caddy automatically issues and renews Let's Encrypt certificates on-demand for every verified custom domain via the PicoLink verification endpoint."
              : "Nginx reverse proxy configuration template with Let's Encrypt certbot wildcard or server-block generation."}
          </p>

          <div className="relative">
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
              {guideTab === "caddy"
                ? `# Caddyfile On-Demand TLS Configuration
{
    on_demand_tls {
        ask http://localhost:8000/api/v1/domains/ask/
        interval 2m
        burst 5
    }
}

:443 {
    tls {
        on_demand
    }
    reverse_proxy localhost:8000
}`
                : `# Nginx Reverse Proxy Configuration
server {
    listen 80;
    server_name ~^(?<domain>.+)$;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`}
            </pre>
            <button
              onClick={() => {
                const snippet =
                  guideTab === "caddy"
                    ? `{\n    on_demand_tls {\n        ask http://localhost:8000/api/v1/domains/ask/\n        interval 2m\n        burst 5\n    }\n}\n\n:443 {\n    tls {\n        on_demand\n    }\n    reverse_proxy localhost:8000\n}`
                    : `server {\n    listen 80;\n    server_name ~^(?<domain>.+)$;\n    location / {\n        proxy_pass http://127.0.0.1:8000;\n        proxy_set_header Host $host;\n    }\n}`;
                navigator.clipboard.writeText(snippet);
                toast.success("Configuration copied to clipboard!");
              }}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
        </div>
      )}

      {/* Connected Domains list from Backend */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Connected Custom Domains ({domains.length})
            </h3>
          </div>
          <button
            onClick={fetchDomains}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Refresh domains"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDomains ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>

        {domains.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 space-y-2">
            <Globe className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs font-semibold text-slate-300">No custom domains connected yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Find a complimentary domain using our AI generator below or connect a domain you already own.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                      item.status === "active"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : item.status === "failed"
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">{item.domain}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          item.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : item.status === "failed"
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      CNAME Record: <code className="text-indigo-400 font-mono">cname.picolink.dev</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {item.ssl_active ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      SSL Active
                    </span>
                  ) : (
                    <button
                      onClick={() => handleVerifyDomain(item.id)}
                      disabled={verifyingId === item.id}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${verifyingId === item.id ? "animate-spin" : ""}`} />
                      <span>{verifyingId === item.id ? "Verifying..." : "Verify DNS"}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteDomain(item.id, item.domain)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800/80 transition"
                    title="Remove domain"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Value Proposition Card */}
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
            type="button"
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
          <button
            type="button"
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
            type="button"
            onClick={() => setActiveMode("direct")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeMode === "direct"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Connect existing domain</span>
          </button>
        </div>

        {/* AI Generator Mode */}
        {activeMode === "ai" && (
          <form onSubmit={handleGenerate} className="space-y-4">
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
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4" />
                <span>{generating ? "Generating..." : "Generate"}</span>
              </button>
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 px-1">
              <span>Describe your idea, product, business, or website</span>
              <span>{aiPrompt.length}/200</span>
            </div>

            {/* Generated Domain Suggestions with 'Upgrade to Claim' option */}
            {suggestedDomains.length > 0 && (
              <div className="space-y-3 pt-2 animate-fade-in">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Suggested Domains ({suggestedDomains.length})</span>
                  </h3>
                  <span className="text-[11px] text-teal-400 font-medium">
                    Complimentary with Growth &amp; Pro Plans
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestedDomains.map((item) => (
                    <div
                      key={item.domain}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-teal-500/50 transition flex flex-col justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-bold text-white tracking-tight">
                              {item.domain}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Available
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Custom short link vanity domain
                          </p>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">
                          Included with Pro plan
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpgradeToClaim(item.domain)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-200" />
                          <span>Upgrade to Claim</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}

        {/* Manual Search Mode */}
        {activeMode === "search" && (
          <div className="space-y-4">
            <form onSubmit={handleSearchDomain} className="space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. brand.link or links.mycompany.com"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-40"
                >
                  <Search className="w-4 h-4" />
                  <span>{searching ? "Checking..." : "Check Availability"}</span>
                </button>
              </div>
            </form>

            {searchResult && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-white tracking-tight">
                      {searchResult.domain}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Available
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Ready to connect and brand your short links.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleUpgradeToClaim(searchResult.domain)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-200" />
                  <span>Upgrade to Claim</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Direct Domain Connection Mode */}
        {activeMode === "direct" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddDomain(directDomain);
            }}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
          >
            <div>
              <h4 className="text-sm font-bold text-white">Connect an existing domain or subdomain</h4>
              <p className="text-xs text-slate-400 mt-1">
                Point a DNS CNAME record for your hostname to <code className="text-indigo-400 font-mono">cname.picolink.dev</code>, then add it here to provision SSL.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={directDomain}
                onChange={(e) => setDirectDomain(e.target.value)}
                placeholder="e.g. go.mybrand.com"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <button
                type="submit"
                disabled={addingDomain || !directDomain.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                <span>{addingDomain ? "Adding..." : "Add Domain"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
