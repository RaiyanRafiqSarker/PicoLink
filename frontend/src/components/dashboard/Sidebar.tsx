"use client";

import React from "react";
import {
  Zap,
  Home as HomeIcon,
  Link as LinkIcon,
  QrCode,
  FileText,
  BarChart3,
  Layers,
  Globe,
  Grid,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  ShieldCheck,
} from "lucide-react";

export type AuthNavTab =
  | "home"
  | "links"
  | "qrcodes"
  | "pages"
  | "analytics"
  | "campaigns"
  | "custom_domains"
  | "team"
  | "integrations"
  | "settings"
  | "admin";

interface SidebarProps {
  activeTab: AuthNavTab;
  onTabChange: (tab: AuthNavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCreateNewClick: () => void;
  currentUser?: any;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  onCreateNewClick,
  currentUser,
}: SidebarProps) {
  const mainNavItems: { id: AuthNavTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Home", icon: <HomeIcon className="w-5 h-5 shrink-0" /> },
    { id: "links", label: "Links", icon: <LinkIcon className="w-5 h-5 shrink-0" /> },
    { id: "qrcodes", label: "QR Codes", icon: <QrCode className="w-5 h-5 shrink-0" /> },
    { id: "pages", label: "Pages", icon: <FileText className="w-5 h-5 shrink-0" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-5 h-5 shrink-0" /> },
    { id: "campaigns", label: "Campaigns", icon: <Layers className="w-5 h-5 shrink-0" /> },
    { id: "custom_domains", label: "Custom domains", icon: <Globe className="w-5 h-5 shrink-0" /> },
    { id: "team", label: "Team & Workspaces", icon: <Users className="w-5 h-5 shrink-0" /> },
  ];

  const bottomNavItems: { id: AuthNavTab; label: string; icon: React.ReactNode }[] = [
    ...(currentUser?.is_superuser || currentUser?.is_staff
      ? [
          {
            id: "admin" as AuthNavTab,
            label: "Admin Console",
            icon: <ShieldCheck className="w-5 h-5 shrink-0 text-amber-500" />,
          },
        ]
      : []),
    { id: "integrations", label: "Integrations", icon: <Grid className="w-5 h-5 shrink-0" /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon className="w-5 h-5 shrink-0" /> },
  ];

  return (
    <aside
      className={`relative z-30 flex flex-col justify-between h-screen shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#080d1a]/95 backdrop-blur-xl transition-all duration-300 ease-in-out select-none ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Header: Brand + Collapse Toggle */}
      <div>
        <div
          className={`relative flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          } px-3.5 py-4 border-b border-slate-200 dark:border-slate-800/80 overflow-hidden`}
        >
          <div className={`relative flex items-center ${collapsed ? "justify-center" : "gap-2.5 min-w-0 flex-1 overflow-hidden"}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/10 shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="relative min-w-0 flex-1 flex flex-col justify-center overflow-hidden">
                <span className="brand-title text-xl font-extrabold tracking-tight block leading-tight truncate">
                  PicoLink
                </span>
                <p
                  className="header-tagline text-[11px] font-medium tracking-tight mt-0.5 leading-tight truncate whitespace-nowrap"
                  title="Make Long Links Simple & Trackable"
                >
                  Make Long Links Simple &amp; Trackable
                </p>
              </div>
            )}
          </div>

          {/* Sidebar Collapse Toggle Button */}
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={
              collapsed
                ? "absolute -right-3 top-1/2 -translate-y-1/2 z-40 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-md transition hover:scale-110"
                : "p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition shrink-0 ml-1.5"
            }
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Primary Call to Action: "Create new" button */}
        <div className="p-3">
          <button
            onClick={onCreateNewClick}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-base tracking-wide transition shadow-lg ${
              collapsed
                ? "px-0 bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                : "px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 transform hover:-translate-y-0.5"
            }`}
            title="Create new (Press 'L' or 'Q')"
          >
            <Plus className="w-4.5 h-4.5" />
            {!collapsed && <span>Create new</span>}
          </button>
        </div>

        {/* Primary Navigation Menu */}
        <nav className="px-2 py-2 space-y-1">
          {mainNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold transition ${
                  collapsed ? "justify-center" : "justify-start"
                } ${
                  isActive
                    ? "bg-indigo-600/15 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
                title={collapsed ? item.label : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-indigo-500" />
                )}
                <span className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}>
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Navigation Section */}
      <div className="px-2 py-4 border-t border-slate-200 dark:border-slate-800/80 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold transition ${
                collapsed ? "justify-center" : "justify-start"
              } ${
                isActive
                  ? "bg-indigo-600/15 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-indigo-500" />
              )}
              <span className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}>
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
