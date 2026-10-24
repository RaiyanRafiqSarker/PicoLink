"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Users, Building2, CheckCircle2, AlertTriangle, ArrowRight, Shield, Crown, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface InviteInfo {
  valid: boolean;
  workspace_id: number;
  workspace_name: string;
  workspace_slug: string;
  email: string;
  role: string;
  invited_by: string;
  expires_at: string;
}

function WorkspaceJoinContent({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/workspaces/join/${token}/`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Invalid or expired invitation.");
        } else {
          setInvite(data);
        }
      } catch {
        setError("Network error validating invitation.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token, API_BASE]);

  const handleAccept = async () => {
    const userToken = typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null;
    if (!userToken) {
      toast.error("Please login or sign up first to accept this invitation.");
      router.push(`/?join_token=${token}`);
      return;
    }

    setAccepting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/workspaces/join/${token}/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to accept invitation.");
        setError(data.error);
        return;
      }

      setSuccess(true);
      toast.success(data.message || `Joined ${data.workspace?.name}!`);
      if (data.workspace?.id) {
        localStorage.setItem("picolink_active_workspace_id", String(data.workspace.id));
      }

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch {
      toast.error("Network error accepting invitation.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        {loading ? (
          <div className="py-12 space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Validating team invitation...</p>
          </div>
        ) : error ? (
          <div className="py-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Invitation Unavailable</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Back to Home
            </button>
          </div>
        ) : success ? (
          <div className="py-6 space-y-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Welcome to the Team!</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You are now a member of <span className="font-bold text-slate-800 dark:text-slate-200">{invite?.workspace_name}</span>. Redirecting to your dashboard...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/30">
              <Building2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                Team Workspace Invite
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight">
                Join {invite?.workspace_name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{invite?.invited_by}</span> invited you to collaborate as a{" "}
                <strong className="text-indigo-600 dark:text-indigo-400 capitalize">{invite?.role}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Workspace:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{invite?.workspace_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Invited for:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{invite?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Permissions:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">{invite?.role}</span>
              </div>
            </div>

            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/25 disabled:opacity-50"
            >
              <span>{accepting ? "Joining Workspace..." : "Accept Invitation & Join"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkspaceJoinPage(props: { params: Promise<{ token: string }> }) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#080d1a] flex items-center justify-center p-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        </div>
      }
    >
      <WorkspaceJoinContent {...props} />
    </React.Suspense>
  );
}

