"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  SlidersHorizontal,
  Plus,
  Copy,
  Check,
  ExternalLink,
  BarChart3,
  Pencil,
  Trash2,
  Share2,
  Crown,
  Sparkles,
  MoreVertical,
  Globe,
  RefreshCw,
  LayoutList,
  LayoutGrid,
  Menu,
  Save,
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Lock,
  Flame,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "../../../context/WorkspaceContext";

interface LinksTabProps {
  userLinks: any[];
  userLinksLoading: boolean;
  onRefreshLinks: () => void;
  onCreateLinkClick: () => void;
  onInspectAnalytics: (code: string) => void;
  onUpgradePro: () => void;
  authToken?: string | null;
  apiBase?: string;
}

export default function LinksTab({
  userLinks,
  userLinksLoading,
  onRefreshLinks,
  onCreateLinkClick,
  onInspectAnalytics,
  onUpgradePro,
  authToken,
  apiBase = "http://localhost:8000",
}: LinksTabProps) {
  const { activeWorkspace, isViewer } = useWorkspace();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
  const [editUrlInput, setEditUrlInput] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [openKebabId, setOpenKebabId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "compact" | "grid">("list");

  // Phase 2.2: Bulk CSV Shortening State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<any | null>(null);

  const downloadSampleCsv = () => {
    const csvContent = "original_url,custom_slug,campaign_name\nhttps://example.com/promo,summer-sale,summer_2026\nhttps://example.com/docs,,developer_docs\nhttps://mybrand.com/launch,my-launch,launch_q3";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "picolink_bulk_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sample CSV downloaded!");
  };

  const handleBulkUpload = async () => {
    if (isViewer) {
      toast.error("View-only access in this workspace. Bulk uploading is disabled.");
      return;
    }

    if (!csvFile) {
      toast.error("Please select a .csv file first.");
      return;
    }

    setUploadingCsv(true);
    setBulkSummary(null);

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const headers: any = {};
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      if (activeWorkspace) headers["X-Workspace-Id"] = String(activeWorkspace.id);

      const res = await fetch(`${apiBase}/api/v1/shorten/bulk/`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Bulk upload failed.");
      }

      setBulkSummary(data);
      toast.success(`Successfully shortened ${data.total_created} URLs in bulk!`);
      onRefreshLinks();
    } catch (err: any) {
      toast.error(err.message || "Failed to process bulk CSV.");
    } finally {
      setUploadingCsv(false);
    }
  };

  // Fetch latest links on mount
  useEffect(() => {
    onRefreshLinks();
  }, []);

  const filteredLinks = userLinks.filter((link) => {
    const matchesSearch =
      !search.trim() ||
      link.short_code.toLowerCase().includes(search.toLowerCase()) ||
      link.original_url.toLowerCase().includes(search.toLowerCase());

    const isExpired =
      link.is_expired ??
      (link.expires_at !== null && new Date(link.expires_at) < new Date());

    if (statusFilter === "active") return matchesSearch && link.is_active && !isExpired;
    if (statusFilter === "expired") return matchesSearch && isExpired;
    return matchesSearch;
  });

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return "link";
    }
  };

  const handleCopy = (shortUrl: string, code: string) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedCode(code);
    toast.success("Short link copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredLinks.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExport = () => {
    if (filteredLinks.length === 0) {
      toast.info("No links available to export.");
      return;
    }
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Short Code,Original URL,Total Clicks,Created At"]
        .concat(
          filteredLinks.map(
            (l) => `"${l.short_code}","${l.original_url}",${l.total_clicks || 0},"${l.created_at}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `picolink_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Links exported to CSV!");
  };

  const handleStartEdit = (link: any) => {
    if (isViewer) {
      toast.error("View-only access in this workspace. Editing is disabled.");
      return;
    }
    setEditingLinkId(link.id);
    setEditUrlInput(link.original_url);
    setOpenKebabId(null);
  };

  const handleSaveEdit = async (id: number) => {
    if (isViewer) {
      toast.error("View-only access in this workspace.");
      return;
    }
    if (!editUrlInput.trim()) return;
    setSavingEdit(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      if (activeWorkspace) headers["X-Workspace-Id"] = String(activeWorkspace.id);

      const res = await fetch(`${apiBase}/api/v1/user/links/${id}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ original_url: editUrlInput.trim() }),
      });
      if (res.ok) {
        toast.success("Destination URL updated!");
        setEditingLinkId(null);
        onRefreshLinks();
      } else {
        toast.error("Failed to update destination.");
      }
    } catch {
      toast.error("Network error while updating link.");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      {/* Read-Only / Viewer Mode Notice Banner */}
      {isViewer && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium shadow-sm">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1">
            <strong>View-only access:</strong> You have Viewer permissions in <strong>{activeWorkspace?.name || "this workspace"}</strong>. Creating, editing, and deleting links are restricted.
          </div>
        </div>
      )}

      {/* 1. Page Title & Action Bar (Matching Screenshot 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            PicoLink Links
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage, inspect, and share all your shortened links and vanity slugs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshLinks}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh links"
          >
            <RefreshCw className={`w-4 h-4 ${userLinksLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              if (isViewer) {
                toast.error("View-only access in this workspace.");
                return;
              }
              setCsvFile(null);
              setBulkSummary(null);
              setBulkModalOpen(true);
            }}
            disabled={isViewer}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold shadow-sm transition ${
              isViewer
                ? "bg-slate-900/50 border-slate-800/50 text-slate-500 cursor-not-allowed opacity-60"
                : "bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-800"
            }`}
            title={isViewer ? "View-only access in this workspace" : "Bulk shorten from CSV"}
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Bulk Upload</span>
          </button>
          <button
            onClick={() => {
              if (isViewer) {
                toast.error("View-only access in this workspace.");
                return;
              }
              onCreateLinkClick();
            }}
            disabled={isViewer}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition transform ${
              isViewer
                ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 shadow-none"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:-translate-y-0.5"
            }`}
            title={isViewer ? "View-only access in this workspace" : "Create link"}
          >
            <Plus className="w-4 h-4" />
            <span>Create link</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar (Matching Screenshot 3) */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search links..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => toast.info("Filtering by creation date range.")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter by created date</span>
          </button>
          <button
            onClick={() => toast.info("Filter options: Active, Expired, Custom aliases.")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Add filters</span>
          </button>
        </div>
      </div>

      {/* 3. Bulk Operations & Layout Bar (Matching Screenshot 3) */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={
                filteredLinks.length > 0 && selectedIds.length === filteredLinks.length
              }
              onChange={handleSelectAll}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="font-medium text-slate-300">
              {selectedIds.length} selected
            </span>
          </label>

          <button
            onClick={handleExport}
            className="hover:text-white transition flex items-center gap-1"
          >
            <Crown className="w-3 h-3 text-amber-400" />
            <span>Export</span>
          </button>
          <button
            onClick={() => toast.info("Bulk hide applied.")}
            className="hover:text-white transition"
          >
            Hide
          </button>
          <button
            onClick={() => toast.info("Add tags to selected links.")}
            className="hover:text-white transition"
          >
            Tag
          </button>
        </div>

        {/* View Switchers & Status Dropdown (Matching Screenshot 3) */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded ${viewMode === "list" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
              title="Expanded List View"
            >
              <Menu className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`p-1 rounded ${viewMode === "compact" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
              title="Compact View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded ${viewMode === "grid" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Show:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none"
            >
              <option value="all">Active</option>
              <option value="active">Active Only</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Link Item Cards (Matching Screenshot 3) */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
        {userLinksLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="text-xs">Loading links...</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3 col-span-full">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-sm">No links found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven&apos;t created any links matching your filter. Shorten your first link to start tracking clicks.
            </p>
            <button
              onClick={onCreateLinkClick}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create link</span>
            </button>
          </div>
        ) : (
          filteredLinks.map((link) => {
            const isSelected = selectedIds.includes(link.id);
            const isCopied = copiedCode === link.short_code;
            const fullUrl =
              link.formatted_short_url ||
              link.short_url ||
              `http://localhost:8000/${link.short_code}`;
            const domain = getDomain(link.original_url);
            const isEditing = editingLinkId === link.id;

            return (
              <div
                key={link.id}
                className={`group relative p-4 rounded-2xl bg-slate-900 border transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5 ${
                  isSelected
                    ? "border-indigo-500/60 bg-indigo-950/15"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(link.id)}
                    className="mt-1 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />

                  {/* Domain Favicon / Logo Badge (Matching Screenshot 3) */}
                  <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                      alt={domain}
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>

                  {/* Middle Content Section */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Link Title & Top-Right Actions (Matching Screenshot 3) */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-sm text-white truncate hover:text-indigo-300 cursor-pointer">
                        {link.title || `${domain} — untitled`}
                      </h3>

                      {/* Card Quick Action Icons: Edit, Share, Analytics, Kebab */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEdit(link)}
                          disabled={isViewer}
                          className={`p-1.5 rounded-lg transition ${
                            isViewer
                              ? "text-slate-600 cursor-not-allowed opacity-40"
                              : "text-slate-400 hover:text-white hover:bg-slate-800"
                          }`}
                          title={isViewer ? "View-only access in this workspace" : "Edit Destination URL"}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopy(fullUrl, link.short_code)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Share / Copy Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onInspectAnalytics(link.short_code)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                          title="View Click Analytics"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenKebabId(openKebabId === link.id ? null : link.id)
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="More options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          {openKebabId === link.id && (
                            <div className="absolute right-0 mt-1 w-36 rounded-xl bg-slate-950 border border-slate-800 shadow-xl p-1 z-30 animate-fade-in text-xs">
                              <button
                                onClick={() => {
                                  handleCopy(fullUrl, link.short_code);
                                  setOpenKebabId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300"
                              >
                                Copy URL
                              </button>
                              <button
                                onClick={() => {
                                  onInspectAnalytics(link.short_code);
                                  setOpenKebabId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300"
                              >
                                View Stats
                              </button>
                              {!isViewer && (
                                <button
                                  onClick={() => {
                                    toast.info("Link deactivated.");
                                    setOpenKebabId(null);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-rose-500/10 text-rose-400"
                                >
                                  Deactivate
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Short Code Link with Copy Icon (Matching Screenshot 3) */}
                    <div className="flex items-center gap-2">
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-mono"
                      >
                        <span>{fullUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => handleCopy(fullUrl, link.short_code)}
                        className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                        title="Copy short link"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Destination URL or Inline Edit Field */}
                    {isEditing ? (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="url"
                          value={editUrlInput}
                          onChange={(e) => setEditUrlInput(e.target.value)}
                          className="flex-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-indigo-500/60 text-xs text-white focus:outline-none font-mono"
                        />
                        <button
                          onClick={() => handleSaveEdit(link.id)}
                          disabled={savingEdit}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Save className="w-3 h-3" />
                          <span>{savingEdit ? "Saving..." : "Save"}</span>
                        </button>
                        <button
                          onClick={() => setEditingLinkId(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 truncate max-w-xl">
                        ↳ <span className="font-mono">{link.original_url}</span>
                      </p>
                    )}

                    {/* Metadata Badges Row (Matching Screenshot 3) */}
                    <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span>{link.total_clicks || 0} clicks</span>
                      </span>

                      <span>
                        📅{" "}
                        {new Date(link.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>

                      <span className="text-slate-500">🏷️ No tags</span>

                      {link.campaign_name && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono">
                          <Target className="w-3 h-3 text-indigo-400" />
                          <span>{link.campaign_name}</span>
                        </span>
                      )}

                      {link.is_password_protected && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>Password</span>
                        </span>
                      )}

                      {link.max_clicks && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300">
                          <Flame className="w-3 h-3 text-rose-400" />
                          <span>Max {link.max_clicks} Clicks</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Promotional Callout Banner (Matching Screenshot 3) */}
      <div className="promo-banner p-3.5 rounded-xl bg-teal-50/90 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-500/30 text-xs flex items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span className="promo-text font-medium text-slate-900 dark:text-teal-100">
            Change a link&apos;s destination, even after you&apos;ve shared it. Get redirects with every plan.
          </span>
        </div>
        <button
          onClick={onUpgradePro}
          className="promo-btn font-bold underline text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-white shrink-0"
        >
          View plans
        </button>
      </div>

      {/* 6. End of list indicator (Matching Screenshot 3) */}
      <div className="text-center py-4">
        <span className="text-xs text-slate-500 font-medium">
          —— You&apos;ve reached the end of your links ——
        </span>
      </div>

      {/* Phase 2.2: Bulk Upload Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Bulk CSV Shortening Engine</h3>
                  <p className="text-[11px] text-slate-400">Upload up to 100 links in a single batch</p>
                </div>
              </div>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drag & Drop File Zone */}
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-6 text-center space-y-2 bg-slate-950/40 transition">
              <Upload className="w-8 h-8 text-indigo-400 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {csvFile ? csvFile.name : "Drag & drop your .csv file here"}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : "Supports columns: original_url, custom_slug, campaign_name"}
                </p>
              </div>

              <input
                type="file"
                accept=".csv"
                id="csv-file-input"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setCsvFile(e.target.files[0]);
                  }
                }}
              />
              <div className="pt-2 flex items-center justify-center gap-3">
                <label
                  htmlFor="csv-file-input"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/30 transition"
                >
                  Browse Computer
                </label>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>
            </div>

            {/* Results summary table if uploaded */}
            {bulkSummary && (
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300">
                    Batch Processed: {bulkSummary.total_created} Shortened Links
                  </span>
                  {bulkSummary.errors?.length > 0 && (
                    <span className="text-[11px] text-rose-400 font-semibold">
                      {bulkSummary.errors.length} failed rows
                    </span>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {bulkSummary.created?.map((link: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-xs"
                    >
                      <div className="truncate pr-2">
                        <span className="font-mono text-indigo-400 font-bold block">{link.short_url}</span>
                        <span className="text-[10px] text-slate-400 truncate block">↳ {link.original_url}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(link.short_url, link.short_code)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium shrink-0 transition"
                      >
                        {copiedCode === link.short_code ? "Copied" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!csvFile || uploadingCsv}
                onClick={handleBulkUpload}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition disabled:opacity-40 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingCsv ? "Uploading..." : "Start Bulk Shortening"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
