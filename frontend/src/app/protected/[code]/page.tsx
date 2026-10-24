"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Lock, KeyRound, ArrowRight, ShieldCheck, Eye, EyeOff, AlertCircle } from "lucide-react";

function ProtectedLinkContent() {
  const params = useParams();
  const code = params?.code as string;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/shorten/${code}/verify-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        throw new Error(data.error || "Incorrect password. Access denied.");
      }

      // If token provided, redirect through backend with verified token
      if (data.token) {
        window.location.href = `${API_BASE}/${code}?auth_token=${encodeURIComponent(data.token)}`;
      } else if (data.target_url) {
        window.location.href = data.target_url;
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify password.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-white flex items-center justify-center p-4 relative select-none transition-colors">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Password-Protected Link
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              This link is encrypted and requires an access key to unlock.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-indigo-600 dark:text-indigo-300">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>picolink.dev/{code}</span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Access Password</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Case-sensitive</span>
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to unlock"
                required
                autoFocus
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={verifying || !password.trim()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-40 transform active:scale-98"
          >
            <span>{verifying ? "Verifying..." : "Unlock & Continue"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800/80">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Secured with end-to-end access validation by <strong className="text-slate-600 dark:text-slate-400">PicoLink</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedLinkPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#080d1a] flex items-center justify-center p-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        </div>
      }
    >
      <ProtectedLinkContent />
    </React.Suspense>
  );
}

