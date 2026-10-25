"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Link2,
  QrCode,
  Smartphone,
  BarChart3,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Globe,
  Sparkles,
  ShieldCheck,
  Sun,
  Moon,
  X,
  RefreshCw,
  LogIn,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Footer from "../../components/dashboard/Footer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function UrlShortenerPage() {
  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // URL Shortening state
  const [urlInput, setUrlInput] = useState("");
  const [shortenLoading, setShortenLoading] = useState(false);
  const [shortenResult, setShortenResult] = useState<{
    short_url: string;
    short_code: string;
    original_url: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Auth & modal states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [apiDocsModalOpen, setApiDocsModalOpen] = useState(false);
  const [trustCenterModalOpen, setTrustCenterModalOpen] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem("picolink_theme") as "dark" | "light") || "dark";
      setTheme(savedTheme);
      applyTheme(savedTheme);

      const savedToken = localStorage.getItem("picolink_token");
      const savedUser = localStorage.getItem("picolink_user");
      if (savedToken && savedUser) {
        setAuthToken(savedToken);
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch {
      // ignore storage access issues
    }
  }, []);

  const applyTheme = (nextTheme: "dark" | "light") => {
    if (nextTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("picolink_theme", next);
    } catch {}
    applyTheme(next);
    toast.success(`Switched to ${next === "dark" ? "Dark" : "Light"} mode`);
  };

  // URL Shortening handler
  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    let targetUrl = urlInput.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    setShortenLoading(true);
    setShortenResult(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${API_BASE}/api/shorten/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ original_url: targetUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to shorten URL");
      }

      setShortenResult(data);
      toast.success("Short link generated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create short link");
    } finally {
      setShortenLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Auth handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const endpoint = authModalTab === "login" ? "/api/auth/login/" : "/api/auth/register/";
      const body =
        authModalTab === "login"
          ? { email: authEmail, password: authPassword }
          : { username: authUsername, email: authEmail, password: authPassword };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      localStorage.setItem("picolink_token", data.token);
      localStorage.setItem("picolink_user", JSON.stringify(data.user));
      setAuthToken(data.token);
      setCurrentUser(data.user);
      setAuthModalOpen(false);
      toast.success(authModalTab === "login" ? "Logged in successfully!" : "Account created!");
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070e1e] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white theme-root relative overflow-x-hidden">
      {/* Ambient background decorative glow and sparkle stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px]"></div>

        {/* Subtle star sparkles */}
        <div className="absolute top-48 left-[15%] text-slate-500/40 text-xl select-none">✦</div>
        <div className="absolute top-72 right-[18%] text-slate-500/30 text-lg select-none">✧</div>
        <div className="absolute top-96 left-[22%] text-slate-500/25 text-sm select-none">✦</div>
        <div className="absolute top-64 right-[25%] text-slate-500/35 text-xs select-none">✦</div>
      </div>

      {/* ========================================================= */}
      {/* 1. TOP HEADER & NAVBAR                                   */}
      <header
        suppressHydrationWarning
        className="relative z-30 w-full min-h-[4.25rem] bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/90 shadow-lg shadow-black/30"
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3.5 flex flex-row items-center justify-between gap-4">
          {/* Brand & Tagline */}
          <Link href="/" className="relative flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/10 shrink-0 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="relative flex flex-col justify-center min-w-0">
              <span className="brand-title text-xl font-extrabold tracking-tight block leading-tight text-white">
                PicoLink
              </span>
              <p className="header-tagline text-xs mt-0.5 leading-snug text-slate-400 whitespace-nowrap">
                Make Long Links Simple &amp; Trackable
              </p>
            </div>
          </Link>

          {/* Center Navigation Links: Platform, Pricing, About Us */}
          <nav className="hidden md:flex items-center gap-7 text-base font-semibold text-slate-300">
            {/* 1. Platform (with mega-menu dropdown) */}
            <div className="relative group cursor-pointer flex items-center gap-1.5 hover:text-white transition py-2">
              <span className="text-orange-400 font-bold">Platform</span>
              <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100 transition transform group-hover:rotate-180 duration-200" />

              {/* Mega-Menu Dropdown */}
              <div className="absolute top-full -left-4 sm:left-0 mt-2 w-[720px] max-w-[94vw] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl shadow-black/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto text-left">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                  {/* Left Column: PRODUCTS */}
                  <div className="md:col-span-7 flex flex-col justify-between pr-0 md:pr-1">
                    <div>
                      <h4 className="text-[12px] font-black uppercase tracking-wider text-[#602515] dark:text-amber-400 mb-3 select-none">
                        Products
                      </h4>
                      <div className="space-y-1">
                        {/* URL Shortener */}
                        <Link
                          href="/url-shortener"
                          className="flex items-start gap-3.5 p-2.5 rounded-2xl bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 transition group/item"
                        >
                          <div className="w-11 h-11 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                            <Link2 className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                              URL SHORTENER
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              Customize, share and track links
                            </p>
                          </div>
                        </Link>

                        {/* QR Code Generator */}
                        <Link
                          href="/qr-code-generator"
                          className="flex items-start gap-3.5 p-2.5 rounded-2xl hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition group/item"
                        >
                          <div className="w-11 h-11 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                            <QrCode className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide group-hover/item:text-orange-600 dark:group-hover/item:text-orange-400 transition-colors">
                              QR CODE GENERATOR
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              Dynamic solutions to fit every business needs
                            </p>
                          </div>
                        </Link>

                        {/* Pages */}
                        <Link
                          href="/pages"
                          className="flex items-start gap-3.5 p-2.5 rounded-2xl hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition group/item"
                        >
                          <div className="w-11 h-11 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                            <Smartphone className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide group-hover/item:text-orange-600 dark:group-hover/item:text-orange-400 transition-colors">
                              PAGES
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              Curate and track links and content for social media profiles
                            </p>
                          </div>
                        </Link>

                        {/* Analytics */}
                        <Link
                          href="/"
                          className="flex items-start gap-3.5 p-2.5 rounded-2xl hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition group/item"
                        >
                          <div className="w-11 h-11 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                            <BarChart3 className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide group-hover/item:text-orange-600 dark:group-hover/item:text-orange-400 transition-colors">
                              ANALYTICS
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              A central place to track and analyse performance of all short links and QR Codes
                            </p>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: INTEGRATIONS & DISCOVER MORE */}
                  <div className="md:col-span-5 bg-[#faeedd] dark:bg-slate-800/70 border border-[#f5dfc3] dark:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[12px] font-black uppercase tracking-wider text-[#602515] dark:text-amber-300 mb-2.5 select-none">
                        Integrations
                      </h4>

                      {/* 3 App Cards */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* Shopify */}
                        <div
                          onClick={() => window.open("https://apps.shopify.com/", "_blank", "noopener,noreferrer")}
                          className="bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group/card"
                        >
                          <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-1.5 p-2 shadow-inner">
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                              <path d="M19.4 4.5c-.1-.3-.4-.5-.7-.6-.3 0-5.7-.2-5.7-.2s-3.7-3.6-4.1-4c-.4-.4-1.2-.6-1.8-.6h-.4c-.4 0-5.1.4-5.1.4s-1.8-1.4-2.7-1.4c-.9 0-1.7.5-2.1 1.3-.4.9-1.3 3.3-1.3 3.3s-4.1 1.3-4.3 1.4c-1.2.5-1.3.6-1.4 1.8-.1.8-4.5 34.6-4.5 34.6l26 7.7 22.2-6.8S19.8 5 19.4 4.5z" fill="#95BF47"/>
                              <path d="M13.5 10.3c-.6 0-1.1.1-1.6.3-2.4.8-2.5 2.7-2.5 3.3 0 2.7 5.2 3.9 5.3 7.9.1 3-1.7 4.9-4.5 5.1-3.5.2-5.8-1.7-5.8-1.7l.8-3.4s2.2 1.6 4 1.6c1.2 0 1.9-.7 1.9-1.6 0-2.9-4.7-3.7-4.8-7.8-.1-3.5 2.4-6 6.2-6.1 2.3-.1 3.9.7 3.9.7l-1 3.4c-.1 0-1.1-.8-1.9-.8z" fill="#FFFFFF"/>
                            </svg>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 group-hover/card:text-emerald-600 dark:group-hover/card:text-emerald-400 transition-colors">
                            Shopify
                          </span>
                        </div>

                        {/* Canva */}
                        <div
                          onClick={() => window.open("https://www.canva.com/apps/", "_blank", "noopener,noreferrer")}
                          className="bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group/card"
                        >
                          <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-1.5 p-1 shadow-inner">
                            <div className="w-11 h-7 rounded-lg bg-gradient-to-r from-[#00C4CC] via-[#5B30E5] to-[#7D2AE8] flex items-center justify-center shadow-xs">
                              <span className="text-white font-black italic tracking-tighter text-[10px] select-none">Canva</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 group-hover/card:text-teal-600 dark:group-hover/card:text-teal-400 transition-colors">
                            Canva
                          </span>
                        </div>

                        {/* Zapier Connector */}
                        <div
                          onClick={() => window.open("https://zapier.com/apps", "_blank", "noopener,noreferrer")}
                          className="bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group/card"
                        >
                          <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-1.5 p-2 shadow-inner">
                            <div className="w-8 h-8 rounded-lg bg-[#FF4F00] flex items-center justify-center shadow-sm">
                              <span className="text-white font-black text-2xl leading-none select-none pb-0.5">*</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 group-hover/card:text-orange-600 dark:group-hover/card:text-orange-400 transition-colors leading-tight">
                            Zapier Connector
                          </span>
                        </div>
                      </div>

                      {/* See more integrations */}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalOpen(true);
                          toast.info("Log in or create a free account to connect all 6+ native integrations!");
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#602515] dark:text-amber-400 hover:text-orange-600 dark:hover:text-amber-300 transition cursor-pointer"
                      >
                        <span>See more integrations</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* DISCOVER MORE */}
                    <div className="mt-4 pt-3 border-t border-amber-900/15 dark:border-slate-700/60">
                      <h4 className="text-[12px] font-black uppercase tracking-wider text-[#602515] dark:text-amber-300 mb-2 select-none">
                        Discover More
                      </h4>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setApiDocsModalOpen(true)}
                          className="block w-full text-left font-black text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200 hover:text-orange-600 dark:hover:text-amber-400 transition py-1 cursor-pointer"
                        >
                          API &amp; DOCUMENTATION
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrustCenterModalOpen(true)}
                          className="block w-full text-left font-black text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200 hover:text-orange-600 dark:hover:text-amber-400 transition py-1 cursor-pointer"
                        >
                          TRUST CENTER
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <Link href="/pricing" className="hover:text-white transition">
              Pricing
            </Link>

            {/* About Us */}
            <a
              href="https://raktch.com/about/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              About Us
            </a>
          </nav>

          {/* Right Section: Theme Toggle & Auth Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {currentUser ? (
              <Link
                href="/"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/30 flex items-center gap-2"
              >
                <span>Dashboard ({currentUser.username})</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthModalTab("login");
                    setAuthModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    setAuthModalTab("signup");
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition shadow-lg shadow-orange-500/25"
                >
                  Sign up Free
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. HERO SECTION MATCHING USER REFERENCE                   */}
      {/* ========================================================= */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start pt-14 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        {/* Top Category Badge */}
        <div className="flex flex-col items-center justify-center gap-2 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-lg shadow-orange-500/15">
            <Link2 className="w-6 h-6 text-[#f97316]" />
          </div>
          <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#f97316]">
            PICOLINK LINKS
          </span>
        </div>

        {/* The Bold Line (Exact prompt requirement) */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white text-center max-w-4xl tracking-tight leading-[1.12] mb-4">
          Generate links that can be tracked using our robust URL shortening tool
        </h1>

        {/* The Second Line (Exact prompt requirement) */}
        <p className="url-shortener-subtitle hero-subtitle text-base sm:text-lg text-slate-600 dark:text-slate-300 text-center max-w-3xl leading-relaxed mb-9 font-normal">
          Create immediate connections with your audience through shortened, reliable links that you can monitor, all integrated within PicoLink.
        </p>

        {/* Interactive URL Shortener Input Bar (Matching screenshot style) */}
        <div className="w-full max-w-2xl mx-auto mb-8">
          <form
            onSubmit={handleShorten}
            className="w-full p-1.5 pl-6 bg-white dark:bg-[#0c1a33]/90 border border-slate-300 dark:border-slate-700/80 rounded-full flex items-center justify-between gap-3 shadow-xl dark:shadow-2xl backdrop-blur-md focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all"
          >
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Place your long URL here..."
              required
              className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none"
            />
            <button
              type="submit"
              disabled={shortenLoading}
              className="px-6 sm:px-8 py-3 rounded-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs sm:text-sm shrink-0 transition shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {shortenLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white dark:text-slate-900" />
                  <span>Shortening...</span>
                </>
              ) : (
                <span>Shorten link</span>
              )}
            </button>
          </form>

          {/* Shortened Result Card */}
          {shortenResult && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-orange-500/40 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl animate-fade-in">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                  Your Short Link
                </span>
                <p className="font-mono text-base font-bold text-white truncate mt-0.5">
                  {shortenResult.short_url}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                  Destination: {shortenResult.original_url}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopy(shortenResult.short_url)}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-md shadow-orange-500/25"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <a
                  href={shortenResult.short_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  title="Open Link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 3. BROWSER PREVIEW FRAME WITH USER'S REFERENCE IMAGE      */}
        {/* ========================================================= */}
        <div className="w-full max-w-5xl mx-auto mt-2">
          {/* Outer golden/amber frame border matching reference */}
          <div className="relative rounded-3xl p-3 sm:p-4 bg-gradient-to-b from-[#c06e18]/40 via-amber-950/20 to-transparent border-2 border-[#d97706]/40 shadow-2xl shadow-black/80 backdrop-blur-sm">
            {/* Inner Dashboard Frame */}
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900 group relative">
              <img
                src="/picolink-links-dashboard.png"
                alt="PicoLink Links Dashboard preview with URL shortener, Facebook and Google campaigns"
                className="w-full h-auto object-cover object-top block"
              />
            </div>
          </div>
        </div>

        {/* Key Features Value Grid */}
        <div className="w-full max-w-5xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center mb-4">
              <Link2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Custom Vanity Slugs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Replace cryptic codes with recognizable branded links that inspire user confidence and boost click-through rates.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Full Click Telemetry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monitor real-time engagement, referrer sources, mobile vs. desktop devices, and geographic location analytics.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Instant QR Generator</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every short link automatically produces a high-resolution, downloadable dynamic QR code for print and digital materials.
            </p>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 4. MODALS: AUTH, API DOCS & TRUST CENTER                  */}
      {/* ========================================================= */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-3 text-white shadow-lg shadow-orange-500/25">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {authModalTab === "login" ? "Welcome Back to PicoLink" : "Create your PicoLink Account"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {authModalTab === "login"
                  ? "Log in to access your shortened links and campaigns."
                  : "Start shortening, sharing, and tracking links today."}
              </p>
            </div>

            {authError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
              {authModalTab === "signup" && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="john_doe"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-orange-500/25 disabled:opacity-50 mt-2"
              >
                {authLoading ? "Processing..." : authModalTab === "login" ? "Sign In" : "Get Started Free"}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-400">
              {authModalTab === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => {
                      setAuthModalTab("signup");
                      setAuthError("");
                    }}
                    className="text-orange-400 hover:underline font-bold"
                  >
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    onClick={() => {
                      setAuthModalTab("login");
                      setAuthError("");
                    }}
                    className="text-orange-400 hover:underline font-bold"
                  >
                    Log in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API Docs Modal */}
      {apiDocsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setApiDocsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                <Link2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">PicoLink Developer API</h3>
                <p className="text-xs text-slate-400">Programmatic URL shortening and click telemetry.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Create Short Link</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                    POST /api/shorten/
                  </span>
                </div>
                <div className="bg-slate-900 rounded-xl p-3 font-mono text-[11px] text-slate-300 border border-slate-800/80 overflow-x-auto">
                  {`curl -X POST ${API_BASE}/api/shorten/ \\
  -H "Content-Type: application/json" \\
  -d '{"original_url": "https://example.com/product/123"}'`}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setApiDocsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
              >
                Close Documentation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trust Center Modal */}
      {trustCenterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setTrustCenterModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">PicoLink Trust Center</h3>
                <p className="text-xs text-slate-400">Security, compliance, and infrastructure reliability standards.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">99.99% Guaranteed Redirection Uptime</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">High-speed Base62 lookups powered by Redis caching and globally distributed edge proxies.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">TLS 1.3 Transport Encryption</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">All customer traffic and short link resolution are protected with modern cipher suites.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setTrustCenterModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
              >
                Close Trust Center
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. FREE PLAN VALUE BANNER (MATCHING USER REFERENCE IMAGE) */}
      {/* ========================================================= */}
      <div className="w-full bg-[#07132b] dark:bg-[#07132b] border-t border-slate-800/80 dark:border-slate-800/80 py-3.5 px-4 sm:px-8 z-20 transition-colors free-plan-banner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-3 md:gap-7 text-xs sm:text-sm">
          <div className="font-bold text-white dark:text-white free-plan-banner-title text-center md:text-left">
            <button
              type="button"
              onClick={() => {
                setAuthModalTab("signup");
                setAuthModalOpen(true);
              }}
              className="underline hover:text-orange-400 dark:hover:text-orange-400 cursor-pointer transition"
            >
              Sign up for free.
            </button>{" "}
            <span>Your free plan includes:</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-slate-200 dark:text-slate-200 free-plan-banner-item">
              <svg className="w-4 h-4 text-orange-500 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="8" />
                <path d="M6 10l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-medium">10 short links/month</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200 dark:text-slate-200 free-plan-banner-item">
              <svg className="w-4 h-4 text-orange-500 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="8" />
                <path d="M6 10l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-medium">Custom/Unlimited link clicks</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. FOOTER (Matching landing page)                        */}
      {/* ========================================================= */}
      <Footer />
    </div>
  );
}
