"use client";

import React from "react";
import {
  BarChart3,
  Search,
  RefreshCw,
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  Clock,
  ExternalLink,
  Sparkles,
  Crown,
  Calendar,
  Lock,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsTabProps {
  lookupCode: string;
  setLookupCode: (code: string) => void;
  statsLoading: boolean;
  statsError: string;
  statsData: any;
  chartRange: 7 | 30;
  setChartRange: (r: 7 | 30) => void;
  onFetchStats: (code?: string) => void;
  onOpenAssist: () => void;
  onUpgradePro: () => void;
  formatChartDate: (iso: string) => string;
  BreakdownBars: React.ComponentType<{
    items: any[];
    barClass: string;
    emptyText: string;
  }>;
  apiBase: string;
}

export default function AnalyticsTab({
  lookupCode,
  setLookupCode,
  statsLoading,
  statsError,
  statsData,
  chartRange,
  setChartRange,
  onFetchStats,
  onOpenAssist,
  onUpgradePro,
  formatChartDate,
  BreakdownBars,
  apiBase,
}: AnalyticsTabProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      {/* Header matching Screenshot 6 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time click tracking, device analytics, and performance insights.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAssist}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Analyze with AI</span>
          </button>
        </div>
      </div>

      {/* Upgrade Banner matching Screenshot 6 */}
      <div className="promo-banner p-3.5 rounded-xl bg-teal-50/90 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-500/30 text-xs flex items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
          <span className="promo-text font-medium text-slate-900 dark:text-teal-100">
            Upgrade to view real-time performance data, uncover traffic trends, and get actionable insights.
          </span>
        </div>
        <button
          onClick={onUpgradePro}
          className="promo-btn font-bold underline text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-white shrink-0"
        >
          View plans
        </button>
      </div>

      {/* Dashboards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <h3 className="font-bold uppercase tracking-wider text-slate-400">Dashboards</h3>
          <span className="text-indigo-400 hover:underline cursor-pointer">View all &gt;</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={onUpgradePro}
            className="p-4 rounded-xl border border-dashed border-slate-850 hover:border-indigo-500/50 bg-slate-900/40 text-left transition text-xs flex items-center gap-3 text-slate-300 hover:text-white"
          >
            <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
              +
            </span>
            <span>Create custom dashboard</span>
          </button>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-left text-xs flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Default Link Performance</p>
              <p className="text-[10px] text-slate-500">Auto-generated overview</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Insights Highlights matching Screenshot 6 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <h3 className="font-bold uppercase tracking-wider text-slate-400">
            Last week&apos;s Insights
          </h3>
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Calendar className="w-3 h-3 text-slate-500" />
            Oct 5 – Oct 17, 2026
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
              📊 Channel
            </span>
            <p className="text-xs text-slate-300 leading-snug">
              Direct &amp; Social traffic surged by <strong className="text-white">28%</strong> this week.
            </p>
            <div className="pt-2">
              <button
                onClick={onUpgradePro}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <span>⭐ Unlock deep channel insights</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400">
              📍 Top Link
            </span>
            <p className="text-xs text-slate-300 leading-snug">
              Top link traffic grew <strong className="text-white">+42%</strong> compared to last week.
            </p>
            <div className="pt-2">
              <button
                onClick={onUpgradePro}
                className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
              >
                <span>⭐ Unlock link movers</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
              📈 Peak Engagement
            </span>
            <p className="text-xs text-slate-300 leading-snug">
              Peak clicks observed on <strong className="text-white">Thursday 14:00 UTC</strong>.
            </p>
            <div className="pt-2">
              <button
                onClick={onUpgradePro}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <span>⭐ Unlock peak timestamps</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Code Inspector Search Box */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-indigo-400" />
          <span>Lookup Short Code Analytics</span>
        </h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Enter short code or vanity slug (e.g. 6LAze)"
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onFetchStats()}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
            />
          </div>
          <button
            onClick={() => onFetchStats()}
            disabled={statsLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 text-xs"
          >
            {statsLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "Lookup"
            )}
          </button>
        </div>

        {statsError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {statsError}
          </div>
        )}
      </div>

      {/* Results Section */}
      {statsData ? (
        <div className="space-y-6 animate-fade-in">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Total Clicks
              </span>
              <div className="text-3xl font-black text-white mt-1">
                {statsData.total_clicks}
              </div>
              <span className="text-xs text-emerald-400 mt-1 inline-block">Real visitors</span>
              {!!statsData.bot_clicks && (
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  {statsData.bot_clicks} bot visits excluded
                </span>
              )}
            </div>

            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Status
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    statsData.is_active ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                />
                <span className="text-lg font-bold text-white">
                  {statsData.is_active ? "Active" : "Deactivated"}
                </span>
              </div>
            </div>

            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Short Code
              </span>
              <div className="text-lg font-mono font-bold text-indigo-300 mt-1 truncate">
                {statsData.short_code}
              </div>
              <span className="text-xs text-slate-500 truncate block mt-0.5">
                Created: {new Date(statsData.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Destination banner */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
            <div className="truncate text-xs">
              <span className="text-slate-400 font-medium">Destination: </span>
              <span className="text-indigo-300 font-mono">{statsData.original_url}</span>
            </div>
            <a
              href={`${apiBase}/${statsData.short_code}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl transition shrink-0 flex items-center gap-1"
            >
              Test Link
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Clicks Over Time Line Chart */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Clicks Over Time
              </h3>
              <div
                className="flex p-0.5 bg-slate-950 border border-slate-800 rounded-lg"
                role="group"
                aria-label="Chart range"
              >
                {([7, 30] as const).map((days) => (
                  <button
                    key={days}
                    onClick={() => setChartRange(days)}
                    aria-pressed={chartRange === days}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                      chartRange === days
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const series =
                (chartRange === 7
                  ? statsData.clicks_last_7_days
                  : statsData.clicks_last_30_days) ?? [];
              const rangeTotal = series.reduce((sum: number, d: any) => sum + d.count, 0);

              return (
                <>
                  <p className="text-xs text-slate-400 mb-3">
                    <span className="font-bold text-white">{rangeTotal}</span> clicks in the last{" "}
                    {chartRange} days
                  </p>
                  <div className="h-60 -ml-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={series}
                        margin={{ top: 5, right: 12, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid
                          stroke="#1e293b"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatChartDate}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          axisLine={{ stroke: "#334155" }}
                          tickLine={false}
                          interval="preserveStartEnd"
                          minTickGap={24}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={36}
                        />
                        <Tooltip
                          labelFormatter={(label) => formatChartDate(String(label))}
                          formatter={(value) => [value, "Clicks"]}
                          contentStyle={{
                            background: "#0f172a",
                            border: "1px solid #334155",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          labelStyle={{ color: "#e2e8f0" }}
                          itemStyle={{ color: "#a5b4fc" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#818cf8"
                          strokeWidth={2}
                          dot={chartRange === 7 ? { r: 3, fill: "#818cf8" } : false}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-indigo-400" />
                Top Referrers
              </h3>
              <BreakdownBars
                items={statsData.referrer_breakdown ?? []}
                barClass="bg-indigo-500"
                emptyText="No referrer data yet."
              />
            </div>

            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Devices
              </h3>
              <BreakdownBars
                items={statsData.device_breakdown ?? []}
                barClass="bg-emerald-500"
                emptyText="No device data yet."
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500 space-y-2">
          <BarChart3 className="w-8 h-8 mx-auto text-slate-600" />
          <p>Search a short code above or click on any link in your library to inspect analytics.</p>
        </div>
      )}
    </div>
  );
}
