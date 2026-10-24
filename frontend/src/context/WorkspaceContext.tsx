"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export interface WorkspaceMember {
  id: number;
  user_id: number;
  username: string;
  email: string;
  role: WorkspaceRole;
  joined_at: string;
}

export interface WorkspaceInvitation {
  id: number;
  email: string;
  role: WorkspaceRole;
  token: string;
  invited_by_username: string;
  created_at: string;
  expires_at: string;
  is_accepted: boolean;
  is_expired: boolean;
}

export interface WorkspaceItem {
  id: number;
  name: string;
  slug: string;
  owner_id: number;
  owner_username?: string;
  is_personal: boolean;
  user_role?: WorkspaceRole;
  members_count: number;
  members?: WorkspaceMember[];
  invitations?: WorkspaceInvitation[];
  created_at: string;
  updated_at?: string;
}

interface WorkspaceContextType {
  workspaces: WorkspaceItem[];
  activeWorkspace: WorkspaceItem | null;
  userRole: WorkspaceRole;
  loading: boolean;
  isViewer: boolean;
  canEdit: boolean;
  isAdminOrOwner: boolean;
  switchWorkspace: (workspace: WorkspaceItem | null) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, slug?: string) => Promise<WorkspaceItem | null>;
  fetchWorkspaceDetails: (id: number) => Promise<WorkspaceItem | null>;
  apiBase: string;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem | null>(null);
  const [loading, setLoading] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("picolink_token");
  };

  const refreshWorkspaces = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/workspaces/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data: WorkspaceItem[] = await res.json();
        setWorkspaces(data);

        // Determine saved active workspace
        const savedWsId = localStorage.getItem("picolink_active_workspace_id");
        if (savedWsId) {
          const match = data.find((w) => String(w.id) === savedWsId);
          if (match) {
            setActiveWorkspace(match);
            return;
          }
        }

        // Fallback to personal or first workspace
        const personal = data.find((w) => w.is_personal) || data[0] || null;
        setActiveWorkspace(personal);
        if (personal) {
          localStorage.setItem("picolink_active_workspace_id", String(personal.id));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch workspaces:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  const switchWorkspace = (ws: WorkspaceItem | null) => {
    setActiveWorkspace(ws);
    if (ws) {
      localStorage.setItem("picolink_active_workspace_id", String(ws.id));
      toast.info(`Switched to "${ws.name}"`);
    } else {
      localStorage.removeItem("picolink_active_workspace_id");
      toast.info("Switched to Personal Workspace");
    }
  };

  const createWorkspace = async (name: string, slug?: string): Promise<WorkspaceItem | null> => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please login to create a team workspace.");
      return null;
    }

    try {
      const res = await fetch(`${apiBase}/api/v1/workspaces/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), slug: slug?.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create workspace.");
        return null;
      }

      toast.success(`Workspace "${data.name}" created!`);
      await refreshWorkspaces();
      switchWorkspace(data);
      return data;
    } catch (err) {
      toast.error("Network error creating workspace.");
      return null;
    }
  };

  const fetchWorkspaceDetails = async (id: number): Promise<WorkspaceItem | null> => {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const res = await fetch(`${apiBase}/api/v1/workspaces/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("Failed to fetch workspace details:", err);
    }
    return null;
  };

  // Determine current user's role in active workspace
  const userRole: WorkspaceRole = (activeWorkspace?.user_role as WorkspaceRole) || (activeWorkspace?.is_personal ? "owner" : "member");
  const isViewer = userRole === "viewer";
  const canEdit = ["owner", "admin", "member"].includes(userRole);
  const isAdminOrOwner = ["owner", "admin"].includes(userRole);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        userRole,
        loading,
        isViewer,
        canEdit,
        isAdminOrOwner,
        switchWorkspace,
        refreshWorkspaces,
        createWorkspace,
        fetchWorkspaceDetails,
        apiBase,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
