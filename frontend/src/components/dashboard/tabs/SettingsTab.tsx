"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  Key,
  Smartphone,
  History,
  Trash2,
  CheckCircle2,
  Lock,
  Globe,
  Mail,
  RefreshCw,
  LogOut,
  Webhook,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Code,
  Check,
  AlertCircle,
  X,
  Send,
  Zap,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import TeamTab from "./TeamTab";

interface SettingsTabProps {
  currentUser: any;
  onLogout: () => void;
}

interface WebhookItem {
  id: number;
  target_url: string;
  secret_key: string;
  is_active: boolean;
  created_at: string;
}

export default function SettingsTab({ currentUser, onLogout }: SettingsTabProps) {
  const [subSection, setSubSection] = useState<"profile" | "security" | "billing" | "api" | "webhooks" | "team">("profile");
  const [displayName, setDisplayName] = useState(currentUser?.username || "Raiyan Rafiq Sarker");
  const [language, setLanguage] = useState("English");
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [testingWebhookId, setTestingWebhookId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [addingWebhook, setAddingWebhook] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<number, boolean>>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchWebhooks = async () => {
    setLoadingWebhooks(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null;
      if (!token) {
        setLoadingWebhooks(false);
        return;
      }
      const res = await fetch(`${API_BASE}/api/v1/webhooks/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data || []);
      }
    } catch (err) {
      console.warn("Failed to fetch webhooks:", err);
    } finally {
      setLoadingWebhooks(false);
    }
  };

  useEffect(() => {
    if (subSection === "webhooks" || subSection === "api") {
      fetchWebhooks();
    }
  }, [subSection]);

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;

    setAddingWebhook(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/v1/webhooks/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ target_url: newWebhookUrl.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Click webhook registered successfully!");
        setNewWebhookUrl("");
        setShowAddModal(false);
        fetchWebhooks();
      } else {
        toast.error(data.error || "Failed to register webhook.");
      }
    } catch (err) {
      toast.error("Network error adding webhook.");
    } finally {
      setAddingWebhook(false);
    }
  };

  const handleTestWebhook = async (id: number) => {
    setTestingWebhookId(id);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/v1/webhooks/${id}/test/`, {
        method: "POST",
        headers,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Test ping delivered! (HTTP ${data.status_code || 200})`);
      } else {
        toast.error(data.message || "Test ping failed to deliver.");
      }
    } catch (err) {
      toast.error("Network error triggering test ping.");
    } finally {
      setTestingWebhookId(null);
    }
  };

  const handleDeleteWebhook = async (id: number) => {
    if (!confirm("Are you sure you want to delete this click webhook?")) return;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/v1/webhooks/${id}/`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        toast.success("Webhook endpoint removed.");
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
      } else {
        toast.error("Failed to delete webhook.");
      }
    } catch (err) {
      toast.error("Network error deleting webhook.");
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile preferences updated!");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    toast.success("Password changed successfully. Please log in again.");
    setCurrPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="max-w-5xl mx-auto py-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Sub-Sidebar */}
        <div className="space-y-6 md:border-r md:border-slate-200 dark:md:border-slate-800 md:pr-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Personal settings
            </h4>
            <div className="space-y-1">
              <button
                onClick={() => setSubSection("profile")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-left transition ${
                  subSection === "profile"
                    ? "bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Account settings
            </h4>
            <div className="space-y-1 text-sm">
              <button
                onClick={() => setSubSection("billing")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition ${
                  subSection === "billing"
                    ? "bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
                }`}
              >
                Billing &amp; Invoices
              </button>
              <button
                onClick={() => setSubSection("security")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition ${
                  subSection === "security"
                    ? "bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
                }`}
              >
                Security &amp; 2FA
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Workspace &amp; Team
            </h4>
            <div className="space-y-1">
              <button
                onClick={() => setSubSection("team")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition ${
                  subSection === "team"
                    ? "bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Team &amp; Workspaces</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Developer settings
            </h4>
            <div className="space-y-1">
              <button
                onClick={() => setSubSection("webhooks")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition ${
                  subSection === "webhooks"
                    ? "bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
                }`}
              >
                <Webhook className="w-4 h-4" />
                <span>Click Webhooks</span>
              </button>
              <button
                onClick={() => setSubSection("api")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition ${
                  subSection === "api"
                    ? "bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
                }`}
              >
                <Key className="w-4 h-4" />
                <span>API Keys</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Main Form Area */}
        <div className="md:col-span-3 space-y-8">
          {/* Profile Section */}
          {subSection === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Profile Preferences</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Update your display name and language preferences.
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Español</option>
                    <option value="French">Français</option>
                    <option value="German">Deutsch</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
                >
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* Webhooks Section (Phase 5.2) */}
          {subSection === "webhooks" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Webhook className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                    <span>Developer Click Webhooks</span>
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Stream real-time link click events and telemetry directly to your servers with HMAC verification.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Webhook</span>
                </button>
              </div>

              {/* Webhooks List */}
              <div className="space-y-3">
                {webhooks.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50/70 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                    <Webhook className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No webhooks configured</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Register an HTTP endpoint to receive real-time POST events whenever a user clicks your links.
                    </p>
                  </div>
                ) : (
                  webhooks.map((wh) => (
                    <div
                      key={wh.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm dark:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                            {wh.target_url}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleTestWebhook(wh.id)}
                            disabled={testingWebhookId === wh.id}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition disabled:opacity-50 border border-slate-200 dark:border-transparent"
                          >
                            <Send className={`w-3 h-3 ${testingWebhookId === wh.id ? "animate-spin" : ""}`} />
                            <span>{testingWebhookId === wh.id ? "Testing..." : "Test Ping"}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteWebhook(wh.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Delete Webhook"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Secret Key Display */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">
                            Secret:
                          </span>
                          <span className="font-mono text-indigo-600 dark:text-indigo-300 text-[11px] truncate">
                            {revealedSecrets[wh.id] ? wh.secret_key : "•".repeat(32)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() =>
                              setRevealedSecrets((prev) => ({ ...prev, [wh.id]: !prev[wh.id] }))
                            }
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
                            title={revealedSecrets[wh.id] ? "Hide Secret" : "Show Secret"}
                          >
                            {revealedSecrets[wh.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(wh.secret_key);
                              toast.success("Webhook secret copied!");
                            }}
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
                            title="Copy Secret"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* HMAC Signature Documentation */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 space-y-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Payload Signature Verification
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Every outgoing webhook request includes an <code className="text-indigo-600 dark:text-indigo-300 font-mono">X-PicoLink-Signature</code> header containing an HMAC-SHA256 signature calculated using your secret key.
                </p>
                <pre className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-300 overflow-x-auto leading-relaxed">
{`// Node.js Express verification example
const crypto = require('crypto');

function verifyPicoLinkWebhook(req, res, next) {
  const signature = req.headers['x-picolink-signature'];
  const hmac = crypto.createHmac('sha256', process.env.PICOLINK_WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  if (signature !== digest) {
    return res.status(401).send('Invalid signature');
  }
  next();
}`}
                </pre>
              </div>
            </div>
          )}

          {/* API Keys Section */}
          {subSection === "api" && (
            <div className="space-y-4 max-w-md">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Developer API Keys</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Use your JWT API token to automate link shortening via curl or scripts.
              </p>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-indigo-600 dark:text-indigo-300 break-all select-all">
                {currentUser?.id ? `pk_live_${currentUser.id}_picolink_jwt_key` : "No key generated"}
              </div>
            </div>
          )}

          {/* Billing Section */}
          {subSection === "billing" && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Billing &amp; Subscription</h2>
              <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/30 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  Current Plan: {currentUser?.is_pro ? "PicoLink Pro" : "Free Plan"}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  {currentUser?.is_pro
                    ? "Unlimited link creation, vanity domains, and custom QR codes."
                    : "Limited to 10 links per day. Upgrade anytime for unlimited access."}
                </p>
              </div>
            </div>
          )}

          {/* Security Section */}
          {subSection === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Security &amp; 2FA</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Protect your account with robust credentials and multi-factor authentication.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
                >
                  Update Password
                </button>
              </form>
            </div>
          )}

          {/* Team & Workspaces Section */}
          {subSection === "team" && (
            <div className="space-y-6">
              <TeamTab />
            </div>
          )}

          {/* Danger Zone: Delete Account */}
          <div className="pt-8 border-t border-rose-200 dark:border-rose-500/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Danger Zone
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Permanently delete your PicoLink account and all shortened vanity links.
            </p>
            <button
              onClick={() => toast.error("Account deletion requires confirmation via email.")}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
            >
              Delete account
            </button>
          </div>
        </div>
      </div>

      {/* Add Webhook Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                <Webhook className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Click Webhook</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Receive HTTP POST payloads for every click.</p>
              </div>
            </div>

            <form onSubmit={handleAddWebhook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Endpoint URL
                </label>
                <input
                  type="url"
                  required
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://api.mycompany.com/webhooks/picolink"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>Real-time Event Payload</span>
                </p>
                <p>
                  Events contain <code className="text-indigo-600 dark:text-indigo-300">url_id</code>, <code className="text-indigo-600 dark:text-indigo-300">short_code</code>, <code className="text-indigo-600 dark:text-indigo-300">country_code</code>, <code className="text-indigo-600 dark:text-indigo-300">referrer</code>, and timestamp.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingWebhook || !newWebhookUrl.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 disabled:opacity-40"
                >
                  {addingWebhook ? "Registering..." : "Add Webhook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
