"use client";

import React, { useState } from "react";
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
  Building,
  Plus,
  Users,
  Check,
  X,
  Mail,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export interface WorkspaceItem {
  id: number;
  name: string;
  slug: string;
  owner?: any;
  is_personal?: boolean;
  user_role?: string;
  created_at?: string;
  members_count?: number;
}

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
  onOpenAdminTab?: () => void;
  workspaces?: WorkspaceItem[];
  currentWorkspace?: WorkspaceItem | null;
  onSelectWorkspace?: (ws: WorkspaceItem | null) => void;
  onWorkspaceCreated?: () => void;
  apiBase?: string;
  authToken?: string | null;
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
  onOpenAdminTab,
  workspaces = [],
  currentWorkspace = null,
  onSelectWorkspace,
  onWorkspaceCreated,
  apiBase = "http://localhost:8000",
  authToken,
}: TopHeaderProps) {
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [createWsModalOpen, setCreateWsModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Create Workspace form state
  const [wsName, setWsName] = useState("");
  const [wsSlug, setWsSlug] = useState("");
  const [wsLoading, setWsLoading] = useState(false);

  // Invite Member form state
  const [inviteTarget, setInviteTarget] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);

  const initial = currentUser?.username
    ? currentUser.username.charAt(0).toUpperCase()
    : currentUser?.email
    ? currentUser.email.charAt(0).toUpperCase()
    : "U";

  const isPro = currentUser?.is_pro || currentUser?.subscription_tier === "pro";

  // Handle Workspace creation
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;

    setWsLoading(true);
    try {
      const token = authToken || (typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiBase}/api/v1/workspaces/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: wsName.trim(), slug: wsSlug.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Workspace "${data.name}" created!`);
        setWsName("");
        setWsSlug("");
        setCreateWsModalOpen(false);
        if (onWorkspaceCreated) onWorkspaceCreated();
        if (onSelectWorkspace) onSelectWorkspace(data);
      } else {
        toast.error(data.error || "Failed to create workspace.");
      }
    } catch (err) {
      toast.error("Network error creating workspace.");
    } finally {
      setWsLoading(false);
    }
  };

  // Handle Member invitation
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteTarget.trim() || !currentWorkspace) return;

    setInviteLoading(true);
    try {
      const token = authToken || (typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiBase}/api/v1/workspaces/${currentWorkspace.id}/invites/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: inviteTarget.trim(),
          role: inviteRole,
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        toast.success(data.message || `Invitation created for ${inviteTarget.trim()}!`, {
          description: data.join_url ? "Direct link ready to share or copy" : undefined,
        });
        setInviteTarget("");
        setInviteModalOpen(false);
      } else {
        toast.error(
          (data && (data.error || data.detail || data.message)) ||
          `Server returned status ${res.status}. Please check details and try again.`
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Network error sending invitation.");
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 w-full h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#080d1a]/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
      {/* Left: Workspace Selector & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Workspace Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="header-workspace-btn flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-sm font-semibold text-slate-800 dark:text-white transition shrink-0 shadow-sm"
            title="Switch Workspace"
          >
            {currentWorkspace ? (
              <>
                <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="max-w-[110px] truncate">{currentWorkspace.name}</span>
                {currentWorkspace.user_role && (
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                    {currentWorkspace.user_role}
                  </span>
                )}
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Personal</span>
                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                  Owner
                </span>
              </>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Workspace Dropdown Panel */}
          {workspaceDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-fade-in backdrop-blur-2xl">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Workspaces
              </div>

              {/* Personal Workspace */}
              <button
                onClick={() => {
                  if (onSelectWorkspace) onSelectWorkspace(null);
                  setWorkspaceDropdownOpen(false);
                  toast.info("Switched to Personal Workspace");
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                  !currentWorkspace || currentWorkspace.is_personal
                    ? "bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs"
                    : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 font-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>Personal Workspace</span>
                </div>
                {(!currentWorkspace || currentWorkspace.is_personal) && (
                  <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                )}
              </button>

              {/* Team Workspaces */}
              {workspaces.filter((w) => !w.is_personal).length > 0 && (
                <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-800 space-y-0.5">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Team Workspaces
                  </div>
                  {workspaces
                    .filter((w) => !w.is_personal)
                    .map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => {
                          if (onSelectWorkspace) onSelectWorkspace(ws);
                          setWorkspaceDropdownOpen(false);
                          toast.info(`Switched to workspace "${ws.name}"`);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                          currentWorkspace?.id === ws.id
                            ? "bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs"
                            : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="truncate">{ws.name}</span>
                        </div>
                        {currentWorkspace?.id === ws.id && (
                          <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        )}
                      </button>
                    ))}
                </div>
              )}

              {/* Actions: Invite or Create */}
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                {currentWorkspace && (
                  <button
                    onClick={() => {
                      setWorkspaceDropdownOpen(false);
                      setInviteModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition font-semibold"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Invite Team Member</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setWorkspaceDropdownOpen(false);
                    setCreateWsModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-teal-400" />
                  <span>Create Team Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search links, tags, campaigns..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>
      </div>

      {/* Right: Actions, Assist, Quota & Profile */}
      <div className="flex items-center gap-3">
        {/* Support / Help Icon */}
        <button
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition hidden sm:flex"
          title="Help & Documentation"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* AI Assist Drawer Toggle Button */}
        <button
          onClick={onToggleAssistDrawer}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition ${
            assistDrawerOpen
              ? "bg-indigo-50 dark:bg-indigo-600/20 border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-300"
              : "bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
          }`}
          title="Toggle PicoLink Assist AI"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="hidden md:inline">Assist</span>
        </button>

        {/* Upgrade / Quota Badge */}
        {!isPro ? (
          <button
            onClick={onUpgradePro}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:from-emerald-500 text-white text-sm font-semibold shadow-md shadow-teal-500/20 transition transform hover:-translate-y-0.5"
            title="Upgrade to Pro Plan"
          >
            <Crown className="w-3.5 h-3.5 text-amber-200" />
            <span>Upgrade</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Crown className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            <span>PRO</span>
          </div>
        )}

        {/* Daily Quota Counter (Free / Guest) */}
        {quota && !isPro && (
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400"
            title={`Used: ${quota.used}/${quota.limit}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                quota.remaining && quota.remaining > 0 ? "bg-emerald-500 dark:bg-emerald-400" : "bg-rose-500 dark:bg-rose-400"
              }`}
            />
            <span>
              <strong className="text-slate-900 dark:text-white font-semibold">{quota.remaining ?? 0}</strong> left
            </span>
          </div>
        )}

        {/* Light / Dark Mode Switcher */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={onToggleUserDropdown}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700/80"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
              {initial}
            </div>
            <span className="hidden sm:inline text-sm font-medium text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
              {currentUser?.username || currentUser?.email?.split("@")[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-2xl">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {currentUser?.username || "PicoLink User"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{currentUser?.email}</p>
                <div className="mt-1.5">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isPro
                        ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
                        : "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
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
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition"
              >
                <LinkIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>My Links</span>
              </button>

              <button
                onClick={() => {
                  onToggleUserDropdown();
                  onOpenAccountModal();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition"
              >
                <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Account & Plan</span>
              </button>

              {(currentUser?.is_superuser || currentUser?.is_staff) && (
                <button
                  onClick={() => {
                    onToggleUserDropdown();
                    onOpenAdminTab?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Superuser Console</span>
                </button>
              )}

              <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

              <button
                onClick={() => {
                  onToggleUserDropdown();
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Create Workspace Modal (Rendered outside <header> so it's never clipped by header height or backdrop-filter) */}
    {createWsModalOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl transition-colors">
          <button
            onClick={() => setCreateWsModalOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Team Workspace</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Collaborate on links, bio pages, and analytics.</p>
            </div>
          </div>

          <form onSubmit={handleCreateWorkspace} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                required
                value={wsName}
                onChange={(e) => {
                  setWsName(e.target.value);
                  if (!wsSlug) {
                    setWsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                  }
                }}
                placeholder="e.g. Acme Marketing Team"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Workspace Slug (URL key)
              </label>
              <input
                type="text"
                value={wsSlug}
                onChange={(e) => setWsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="e.g. acme-marketing"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-xs font-mono text-indigo-600 dark:text-indigo-300 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateWsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={wsLoading || !wsName.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 !text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 disabled:opacity-40"
              >
                {wsLoading ? "Creating..." : "Create Workspace"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Invite Member Modal (Rendered outside <header>) */}
    {inviteModalOpen && currentWorkspace && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl transition-colors">
          <button
            onClick={() => setInviteModalOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Invite to {currentWorkspace.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add team members with role-based access.</p>
            </div>
          </div>

          <form onSubmit={handleInviteMember} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={inviteTarget}
                  onChange={(e) => setInviteTarget(e.target.value)}
                  placeholder="teammate@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Role &amp; Permissions
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
              >
                <option value="admin">Admin (Can edit links, pages &amp; invite others)</option>
                <option value="member">Member (Can create and edit links)</option>
                <option value="viewer">Viewer (Can view links and analytics only)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviteLoading || !inviteTarget.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 !text-white text-xs font-bold transition shadow-md shadow-teal-500/20 disabled:opacity-40"
              >
                {inviteLoading ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
);
}
