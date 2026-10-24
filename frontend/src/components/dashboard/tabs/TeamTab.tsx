"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Copy,
  Check,
  Crown,
  Eye,
  Edit2,
  AlertTriangle,
  Clock,
  X,
  ExternalLink,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkspace, WorkspaceItem, WorkspaceMember, WorkspaceInvitation } from "../../../context/WorkspaceContext";

export default function TeamTab() {
  const {
    activeWorkspace,
    workspaces,
    switchWorkspace,
    refreshWorkspaces,
    createWorkspace,
    fetchWorkspaceDetails,
    apiBase,
  } = useWorkspace();

  const [workspaceDetails, setWorkspaceDetails] = useState<WorkspaceItem | null>(null);
  const [loading, setLoading] = useState(false);

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [lastGeneratedJoinUrl, setLastGeneratedJoinUrl] = useState<string | null>(null);
  const [copiedJoinUrl, setCopiedJoinUrl] = useState(false);

  // Edit Workspace Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Create Workspace Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null;

  const loadDetails = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const details = await fetchWorkspaceDetails(activeWorkspace.id);
      if (details) {
        setWorkspaceDetails(details);
        setEditName(details.name);
        setEditSlug(details.slug);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [activeWorkspace?.id]);

  const userRole = workspaceDetails?.user_role || (activeWorkspace?.is_personal ? "owner" : "member");
  const isOwner = userRole === "owner";
  const isAdminOrOwner = ["owner", "admin"].includes(userRole);
  const isViewer = userRole === "viewer";

  // Handle Invite Member
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeWorkspace || !token) return;

    setInviteLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/workspaces/${activeWorkspace.id}/invites/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        toast.error(
          (data && (data.error || data.detail || data.message)) ||
          `Server returned status ${res.status}. Failed to invite member.`
        );
        return;
      }

      toast.success(data.message || `Invitation sent to ${inviteEmail}`);
      setLastGeneratedJoinUrl(data.join_url);
      setInviteEmail("");
      loadDetails();
    } catch (err: any) {
      toast.error(err?.message || "Network error sending invite.");
    } finally {
      setInviteLoading(false);
    }
  };

  // Copy Direct Join Link
  const copyInviteLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedJoinUrl(true);
      setTimeout(() => setCopiedJoinUrl(false), 2000);
      toast.success("Invitation link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  // Handle Revoke Invite
  const handleRevokeInvite = async (inviteId: number) => {
    if (!activeWorkspace || !token) return;
    try {
      const res = await fetch(`${apiBase}/api/v1/workspaces/${activeWorkspace.id}/invites/${inviteId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Invitation revoked.");
        loadDetails();
      } else {
        toast.error("Failed to revoke invitation.");
      }
    } catch {
      toast.error("Network error revoking invitation.");
    }
  };

  // Handle Remove Member
  const handleRemoveMember = async (userId: number, username: string) => {
    if (!activeWorkspace || !token) return;
    if (!confirm(`Are you sure you want to remove ${username} from ${activeWorkspace.name}?`)) return;

    try {
      const res = await fetch(`${apiBase}/api/v1/workspaces/${activeWorkspace.id}/members/${userId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Removed ${username} from workspace.`);
        loadDetails();
      } else {
        toast.error(data.error || "Failed to remove member.");
      }
    } catch {
      toast.error("Network error removing member.");
    }
  };

  // Handle Change Member Role
  const handleChangeRole = async (userId: number, newRole: string) => {
    if (!activeWorkspace || !token) return;

    try {
      const res = await fetch(`${apiBase}/api/v1/workspaces/${activeWorkspace.id}/members/${userId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Role updated.");
        loadDetails();
      } else {
        toast.error(data.error || "Failed to update role.");
      }
    } catch {
      toast.error("Network error updating role.");
    }
  };

  // Handle Save Workspace Settings
  const handleEditWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !activeWorkspace || !token) return;

    setEditLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/workspaces/${activeWorkspace.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName.trim(), slug: editSlug.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Workspace updated successfully.");
        setEditModalOpen(false);
        await refreshWorkspaces();
        loadDetails();
      } else {
        toast.error(data.error || "Failed to update workspace.");
      }
    } catch {
      toast.error("Network error updating workspace.");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Delete Workspace
  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace || !token) return;
    if (activeWorkspace.is_personal) {
      toast.error("You cannot delete your personal workspace.");
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete workspace "${activeWorkspace.name}" and all its links?`)) return;

    try {
      const res = await fetch(`${apiBase}/api/v1/workspaces/${activeWorkspace.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Workspace deleted.");
        await refreshWorkspaces();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete workspace.");
      }
    } catch {
      toast.error("Network error deleting workspace.");
    }
  };

  // Role Badge Helper
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
            <Crown className="w-3 h-3" />
            Owner
          </span>
        );
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Shield className="w-3 h-3" />
            Admin
          </span>
        );
      case "viewer":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Eye className="w-3 h-3" />
            Viewer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <Users className="w-3 h-3" />
            Member
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* 1. Header Banner & Actions */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {workspaceDetails?.name || activeWorkspace?.name || "Workspace"}
                </h1>
                {renderRoleBadge(userRole)}
                {activeWorkspace?.is_personal && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Default Personal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Slug: <span className="font-mono text-indigo-600 dark:text-indigo-400">@{workspaceDetails?.slug || activeWorkspace?.slug}</span>
                {" • "}
                Owner: <span className="font-semibold text-slate-700 dark:text-slate-300">{workspaceDetails?.owner_username || "You"}</span>
                {" • "}
                {workspaceDetails?.members?.length || 1} team members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {isAdminOrOwner && (
              <>
                <button
                  onClick={() => {
                    setLastGeneratedJoinUrl(null);
                    setInviteModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite Member</span>
                </button>
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </button>
              </>
            )}
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Workspace</span>
            </button>
          </div>
        </div>

        {/* Viewer Read-Only Warning Banner */}
        {isViewer && (
          <div className="mt-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-amber-700 dark:text-amber-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>View-only access:</strong> You are a Viewer in this workspace. You can inspect shortened links and view live analytics, but cannot create or edit links or manage team settings.
            </span>
          </div>
        )}
      </div>

      {/* 2. Workspace Selector Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Workspaces:
        </span>
        {workspaces.map((ws) => (
          <button
            key={ws.id}
            onClick={() => switchWorkspace(ws)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              activeWorkspace?.id === ws.id
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{ws.name}</span>
            {ws.is_personal && <span className="opacity-70 text-[10px]">(Personal)</span>}
          </button>
        ))}
      </div>

      {/* 3. Team Members Roster */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Team Members</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage member roles and workspace collaboration access.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {workspaceDetails?.members?.length || 1} Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined</th>
                {isOwner && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {workspaceDetails?.members?.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                        {m.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {m.username}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">
                    {m.email || "—"}
                  </td>
                  <td className="py-3 px-4">
                    {isOwner && m.role !== "owner" ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleChangeRole(m.user_id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      renderRoleBadge(m.role)
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </td>
                  {isOwner && (
                    <td className="py-3 px-4 text-right">
                      {m.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveMember(m.user_id, m.username)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Pending Invitations Table */}
      {isAdminOrOwner && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Pending Invitations</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invitations waiting to be accepted. Direct join links expire after 7 days.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {workspaceDetails?.invitations?.length || 0} Pending
            </span>
          </div>

          {!workspaceDetails?.invitations || workspaceDetails.invitations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No pending invitations for this workspace.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Invited Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Expires</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {workspaceDetails.invitations.map((inv) => {
                    const joinUrl = `${window?.location?.origin || "http://localhost:3000"}/workspaces/join/${inv.token}`;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{inv.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{renderRoleBadge(inv.role)}</td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {new Date(inv.expires_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => copyInviteLink(joinUrl)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold transition"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy Link</span>
                            </button>
                            <button
                              onClick={() => handleRevokeInvite(inv.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                              title="Revoke Invitation"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl transition-colors">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Invite Team Member</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Add a collaborator to {activeWorkspace?.name}
                </p>
              </div>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Role &amp; Permissions
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
                >
                  <option value="admin">Admin — Full control over links, bio pages, and team invites</option>
                  <option value="member">Member — Can create, edit, and manage links and QR codes</option>
                  <option value="viewer">Viewer — Read-only access to links and analytics</option>
                </select>
              </div>

              {lastGeneratedJoinUrl && (
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Direct Join Link Ready
                    </span>
                    <button
                      type="button"
                      onClick={() => copyInviteLink(lastGeneratedJoinUrl)}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {copiedJoinUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedJoinUrl ? "Copied!" : "Copy Link"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 break-all select-all">
                    {lastGeneratedJoinUrl}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading || !inviteEmail.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 !text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {inviteLoading ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Workspace Settings Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl transition-colors">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Workspace Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Update workspace name and vanity identifier.
            </p>

            <form onSubmit={handleEditWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Workspace Slug
                </label>
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-xs font-mono text-indigo-600 dark:text-indigo-300 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {isOwner && !activeWorkspace?.is_personal ? (
                  <button
                    type="button"
                    onClick={handleDeleteWorkspace}
                    className="text-xs font-bold text-red-500 hover:text-red-600 transition"
                  >
                    Delete Workspace
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading || !editName.trim()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 !text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
                  >
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Create New Workspace Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl transition-colors">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Create Team Workspace
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Set up a separate shared workspace for team links and analytics.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!createName.trim()) return;
                setCreateLoading(true);
                const res = await createWorkspace(createName, createSlug);
                setCreateLoading(false);
                if (res) {
                  setCreateModalOpen(false);
                  setCreateName("");
                  setCreateSlug("");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Acme Marketing"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Custom Slug (Optional)
                </label>
                <input
                  type="text"
                  value={createSlug}
                  onChange={(e) => setCreateSlug(e.target.value)}
                  placeholder="acme-marketing"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-xs font-mono text-indigo-600 dark:text-indigo-300 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !createName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 !text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {createLoading ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
