"use client";

import React from "react";
import {
  Search,
  Sparkles,
  Crown,
  Sun,
  Moon,
  ChevronDown,
  User,
  LogOut,
  Link as LinkIcon,
  HelpCircle,
} from "lucide-react";

interface TopHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  quota: any;
  currentUser: any;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  userDropdownOpen: boolean;
  onToggleUserDropdown: () => void;
  onLogout: () => void;
  onOpenAccountModal: () => void;
  onOpenLinksTab: () => void;
  onUpgradePro: () => void;
  assistDrawerOpen: boolean;
  onToggleAssistDrawer: () => void;
}

export default function TopHeader({
  searchQuery,
  onSearchChange,
  quota,
  currentUser,
  theme,
  onToggleTheme,
  userDropdownOpen,
  onToggleUserDropdown,
  onLogout,
  onOpenAccountModal,
  onOpenLinksTab,
  onUpgradePro,
  assistDrawerOpen,
  onToggleAssistDrawer,
}: TopHeaderProps) {
  const initial = currentUser?.username
    ? currentUser.username.charAt(0).toUpperCase()
    : currentUser?.email
    ? currentUser.email.charAt(0).toUpperCase()
    : "U";

  const isPro = currentUser?.is_pro || currentUser?.subscription_tier === "pro";

  return (
    <header className="sticky top-0 z-20 w-full h-16 border-b border-slate-800 bg-[#080d1a]/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
      {/* Left: Global Search Input matching Bitly screenshot */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search links, tags, campaigns..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
          />
        </div>
      </div>

      {/* Right: Actions, Assist, Quota & Profile */}
      <div className="flex items-center gap-3">
        {/* Support / Help Icon */}
        <button
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition hidden sm:flex"
          title="Help & Documentation"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* AI Assist Drawer Toggle Button */}
        <button
          onClick={onToggleAssistDrawer}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
            assistDrawerOpen
              ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
              : "bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white"
          }`}
          title="Toggle PicoLink Assist AI"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Assist</span>
        </button>

        {/* Upgrade / Quota Badge */}
        {!isPro ? (
          <button
            onClick={onUpgradePro}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-semibold shadow-md shadow-teal-500/20 transition transform hover:-translate-y-0.5"
            title="Upgrade to Pro Plan"
          >
            <Crown className="w-3.5 h-3.5 text-amber-200" />
            <span>Upgrade</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[11px] font-semibold">
            <Crown className="w-3 h-3 text-amber-400" />
            <span>PRO</span>
          </div>
        )}

        {/* Daily Quota Counter (Free / Guest) */}
        {quota && !isPro && (
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400"
            title={`Used: ${quota.used}/${quota.limit}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                quota.remaining && quota.remaining > 0 ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            <span>
              <strong className="text-white font-semibold">{quota.remaining ?? 0}</strong> left
            </span>
          </div>
        )}

        {/* Light / Dark Mode Switcher */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={onToggleUserDropdown}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/80 transition border border-transparent hover:border-slate-700/80"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
              {initial}
            </div>
            <span className="hidden sm:inline text-xs font-medium text-slate-200 max-w-[100px] truncate">
              {currentUser?.username || currentUser?.email?.split("@")[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-2xl">
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                <p className="text-xs font-semibold text-white truncate">
                  {currentUser?.username || "PicoLink User"}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser?.email}</p>
                <div className="mt-1.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isPro
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                        : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                    }`}
                  >
                    {isPro ? "Pro Member" : "Free Plan"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onToggleUserDropdown();
                  onOpenLinksTab();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
              >
                <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>My Links</span>
              </button>

              <button
                onClick={() => {
                  onToggleUserDropdown();
                  onOpenAccountModal();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Account & Plan</span>
              </button>

              <div className="my-1 border-t border-slate-800/80" />

              <button
                onClick={() => {
                  onToggleUserDropdown();
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
