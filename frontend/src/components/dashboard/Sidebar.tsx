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
} from "lucide-react";

export type AuthNavTab =
  | "home"
  | "links"
  | "qrcodes"
  | "pages"
  | "analytics"
  | "campaigns"
  | "custom_domains"
  | "integrations"
  | "settings";

interface SidebarProps {
  activeTab: AuthNavTab;
  onTabChange: (tab: AuthNavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCreateNewClick: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  onCreateNewClick,
}: SidebarProps) {
  const mainNavItems: { id: AuthNavTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Home", icon: <HomeIcon className="w-4 h-4 shrink-0" /> },
    { id: "links", label: "Links", icon: <LinkIcon className="w-4 h-4 shrink-0" /> },
    { id: "qrcodes", label: "QR Codes", icon: <QrCode className="w-4 h-4 shrink-0" /> },
    { id: "pages", label: "Pages", icon: <FileText className="w-4 h-4 shrink-0" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
    { id: "campaigns", label: "Campaigns", icon: <Layers className="w-4 h-4 shrink-0" /> },
    { id: "custom_domains", label: "Custom domains", icon: <Globe className="w-4 h-4 shrink-0" /> },
  ];

  const bottomNavItems: { id: AuthNavTab; label: string; icon: React.ReactNode }[] = [
    { id: "integrations", label: "Integrations", icon: <Grid className="w-4 h-4 shrink-0" /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <aside
      className={`relative z-30 flex flex-col justify-between h-screen shrink-0 border-r border-slate-800 bg-[#080d1a]/95 backdrop-blur-xl transition-all duration-300 ease-in-out select-none ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Header: Brand + Collapse Toggle */}
      <div>
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/10 shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <span className="brand-title text-xl font-extrabold tracking-tight block leading-tight">
                  PicoLink
                </span>
                <p className="header-tagline text-xs mt-0.5 whitespace-nowrap truncate">
                  Make Long Links Simple &amp; Trackable
                </p>
              </div>
            )}
          </div>

          {/* Sidebar Collapse Toggle Button */}
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Primary Call to Action: "Create new" button */}
        <div className="p-3">
          <button
            onClick={onCreateNewClick}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition shadow-lg ${
              collapsed
                ? "px-0 bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                : "px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 transform hover:-translate-y-0.5"
            }`}
            title="Create new (Press 'L' or 'Q')"
          >
            <Plus className="w-4 h-4" />
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
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  collapsed ? "justify-center" : "justify-start"
                } ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
                title={collapsed ? item.label : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-indigo-500" />
                )}
                <span className={isActive ? "text-indigo-400" : "text-slate-400"}>
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Navigation Section */}
      <div className="px-2 py-4 border-t border-slate-800/80 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                collapsed ? "justify-center" : "justify-start"
              } ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-indigo-500" />
              )}
              <span className={isActive ? "text-indigo-400" : "text-slate-400"}>
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
