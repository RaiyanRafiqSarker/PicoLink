"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

interface SettingsTabProps {
  currentUser: any;
  onLogout: () => void;
}

export default function SettingsTab({ currentUser, onLogout }: SettingsTabProps) {
  const [subSection, setSubSection] = useState<"profile" | "security" | "billing" | "api">("profile");
  const [displayName, setDisplayName] = useState(currentUser?.username || "Raiyan Rafiq Sarker");
  const [language, setLanguage] = useState("English");
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

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
    <div className="max-w-5xl mx-auto py-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Sub-Sidebar (matching Screenshot 9) */}
        <div className="space-y-6 md:border-r md:border-slate-800 md:pr-6">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Personal settings
            </h4>
            <div className="space-y-1">
              <button
                onClick={() => setSubSection("profile")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition ${
                  subSection === "profile"
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Account settings
            </h4>
            <div className="space-y-1 text-xs text-slate-400">
              <button
                onClick={() => setSubSection("billing")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition ${
                  subSection === "billing"
                    ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                    : "hover:text-white hover:bg-slate-800/60"
                }`}
              >
                Billing &amp; Invoices
              </button>
              <button
                onClick={() => setSubSection("security")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition ${
                  subSection === "security"
                    ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                    : "hover:text-white hover:bg-slate-800/60"
                }`}
              >
                Security &amp; 2FA
              </button>
              <button
                onClick={() => toast.info("Users & Permissions (Team feature)")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:text-white hover:bg-slate-800/60"
              >
                Users &amp; Groups
              </button>
              <button
                onClick={() => toast.info("Activity log")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:text-white hover:bg-slate-800/60"
              >
                Activity log
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Developer settings
            </h4>
            <button
              onClick={() => setSubSection("api")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition ${
                subSection === "api"
                  ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              API Keys &amp; Webhooks
            </button>
          </div>
        </div>

        {/* Right Main Form Area */}
        <div className="md:col-span-3 space-y-8">
          {subSection === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Profile Preferences</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update your display name and language preferences.
                </p>
              </div>

              {/* Display Name */}
              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                >
                  Update display name
                </button>
              </form>

              {/* Language selection */}
              <div className="pt-4 border-t border-slate-800/80 max-w-md space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Español</option>
                  <option value="French">Français</option>
                  <option value="German">Deutsch</option>
                </select>
                <button
                  onClick={() => toast.success("Language preference updated.")}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition"
                >
                  Update language
                </button>
              </div>

              {/* Email addresses table matching screenshot 9 */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Email addresses
                </label>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-white font-medium">
                      {currentUser?.email || "raiyanrafiqsarker@gmail.com"}
                    </span>
                    <span className="ml-3 inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase">
                    Primary
                  </span>
                </div>
              </div>
            </div>
          )}

          {subSection === "security" && (
            <div className="space-y-6 max-w-md">
              <div>
                <h2 className="text-xl font-extrabold text-white">Security &amp; Authentication</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage your credentials and session history.
                </p>
              </div>

              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Change Password
                </h3>
                <input
                  type="password"
                  placeholder="Current password"
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                >
                  Change password
                </button>
              </form>

              {/* 2FA */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  2-Factor Authentication (2FA)
                </h3>
                <input
                  type="tel"
                  placeholder="+880 1XXXXXXXXX"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => toast.info("Verification code sent to your phone.")}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition"
                >
                  Send verification code
                </button>
              </div>

              {/* Access History */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Access History
                  </h3>
                  <button
                    onClick={onLogout}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Log out of all sessions
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-300 font-mono text-[11px]">
                    <span>Current Active Session (Chrome on Windows)</span>
                    <span className="text-emerald-400">Online</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Dhaka, Bangladesh • IPv4 verified</p>
                </div>
              </div>
            </div>
          )}

          {subSection === "billing" && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-white">Billing &amp; Subscription</h2>
              <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-slate-300 space-y-2">
                <p className="font-bold text-white text-sm">
                  Current Plan: {currentUser?.is_pro ? "PicoLink Pro" : "Free Plan"}
                </p>
                <p className="text-slate-400">
                  {currentUser?.is_pro
                    ? "Unlimited link creation, vanity domains, and custom QR codes."
                    : "Limited to 10 links per day. Upgrade anytime for unlimited access."}
                </p>
              </div>
            </div>
          )}

          {subSection === "api" && (
            <div className="space-y-4 max-w-md">
              <h2 className="text-xl font-extrabold text-white">Developer API Keys</h2>
              <p className="text-xs text-slate-400">
                Use your JWT API token to automate link shortening via curl or scripts.
              </p>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-indigo-300 break-all select-all">
                {currentUser?.id ? `pk_live_${currentUser.id}_picolink_jwt_key` : "No key generated"}
              </div>
            </div>
          )}

          {/* Danger Zone: Delete Account */}
          <div className="pt-8 border-t border-rose-500/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Danger Zone
            </h4>
            <p className="text-xs text-slate-400">
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
    </div>
  );
}
