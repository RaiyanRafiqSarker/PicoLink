"use client";

import React, { useState } from "react";
import {
  Palette,
  ShoppingBag,
  Zap,
  Globe,
  MessageSquare,
  Search,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface IntegrationItem {
  id: string;
  name: string;
  category: "Design" | "E-Commerce" | "Automation" | "Communication" | "Browser" | "Marketing";
  desc: string;
  badgeBg: string;
  icon: React.ReactNode;
  url: string;
  btnText: string;
  isPopular?: boolean;
  isNew?: boolean;
}

export default function IntegrationsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const integrations: IntegrationItem[] = [
    {
      id: "canva",
      name: "Canva",
      category: "Design",
      desc: "Create branded designs, brochures, and visual graphics with dynamic PicoLink tracking shortlinks & QR codes embedded directly.",
      badgeBg: "bg-teal-500/15 text-teal-400 border-teal-500/30",
      icon: <Palette className="w-5 h-5 text-teal-400" />,
      url: "https://www.canva.com/apps/",
      btnText: "Connect Canva",
      isPopular: true,
    },
    {
      id: "shopify",
      name: "Shopify",
      category: "E-Commerce",
      desc: "Connect your Shopify online store to automatically generate branded product shortlinks, track UTM campaigns, and calculate order ROI.",
      badgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      icon: <ShoppingBag className="w-5 h-5 text-emerald-400" />,
      url: "https://apps.shopify.com/",
      btnText: "Connect Shopify",
      isPopular: true,
      isNew: true,
    },
    {
      id: "chrome",
      name: "Google Chrome Extension",
      category: "Browser",
      desc: "Generate shortlinks, customize aliases, and create scannable QR codes instantly for any browser tab with one click.",
      badgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      icon: <Globe className="w-5 h-5 text-amber-400" />,
      url: "https://chromewebstore.google.com/",
      btnText: "Install Extension",
      isPopular: true,
    },
    {
      id: "zapier",
      name: "Zapier",
      category: "Automation",
      desc: "Trigger automatic short link generation and sync click telemetry across 5,000+ web applications without writing code.",
      badgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      icon: <Zap className="w-5 h-5 text-orange-400" />,
      url: "https://zapier.com/apps",
      btnText: "Connect Zapier",
    },
    {
      id: "slack",
      name: "Slack",
      category: "Communication",
      desc: "Receive real-time click peak notifications, shortened URL previews, and daily engagement summaries right in your team channels.",
      badgeBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      icon: <MessageSquare className="w-5 h-5 text-purple-400" />,
      url: "https://slack.com/apps",
      btnText: "Connect Slack",
    },
    {
      id: "wordpress",
      name: "WordPress",
      category: "Marketing",
      desc: "Automatically convert blog post links into branded tracking shortlinks whenever new articles or updates are published.",
      badgeBg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      icon: <Globe className="w-5 h-5 text-blue-400" />,
      url: "https://wordpress.org/plugins/",
      btnText: "Connect WordPress",
    },
    {
      id: "hubspot",
      name: "HubSpot",
      category: "Marketing",
      desc: "Sync click events into contact timelines, attribute CRM deals to campaigns, and trigger automated lead nurture workflows.",
      badgeBg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      icon: <ArrowUpRight className="w-5 h-5 text-rose-400" />,
      url: "https://ecosystem.hubspot.com/marketplace/apps",
      btnText: "Connect HubSpot",
    },
  ];

  const categories = ["All", "Design", "E-Commerce", "Browser", "Automation", "Communication", "Marketing"];

  const filteredIntegrations = integrations.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleConnect = (item: IntegrationItem) => {
    toast.success(`Connecting to ${item.name}...`, {
      description: `Opening ${item.name} portal in a new tab.`,
    });
    window.open(item.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-8 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PicoLink App Ecosystem</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Connect Your Favorite Tools
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Integrate PicoLink with world-class platforms like Canva and Shopify to streamline design workflows, synchronize e-commerce campaigns, and capture deep customer engagement data.
          </p>
        </div>

        {/* Ambient Gradient glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredIntegrations.map((item) => (
          <div
            key={item.id}
            className="relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/5 transition group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 rounded-xl ${item.badgeBg} flex items-center justify-center border shadow-sm group-hover:scale-105 transition-transform`}
                >
                  {item.icon}
                </div>
                <div className="flex items-center gap-1.5">
                  {item.isPopular && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Popular
                    </span>
                  )}
                  {item.isNew && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      New
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                    {item.name}
                  </h3>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => handleConnect(item)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-xs font-semibold text-white transition duration-200 group-hover:bg-indigo-600"
              >
                <span>{item.btnText}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <p className="text-sm font-semibold text-white">No integrations found</p>
          <p className="text-xs text-slate-400">Try searching with a different keyword or category.</p>
        </div>
      )}
    </div>
  );
}
