from rest_framework import permissions
from .models import Workspace, WorkspaceMember


def get_user_workspace_role(user, workspace):
    """Returns the role of a user in a given workspace, or None if not a member."""
    if not user or not user.is_authenticated or not workspace:
        return None
    if workspace.owner_id == user.id:
        return WorkspaceMember.ROLE_OWNER
    member = WorkspaceMember.objects.filter(workspace=workspace, user=user).first()
    return member.role if member else None


def get_request_workspace(request):
    """
    Extracts the active workspace from request headers (X-Workspace-Id) or query params/body (workspace_id).
    Falls back to the user's personal workspace.
    Returns (workspace, role, error_response).
    """
    if not request.user or not request.user.is_authenticated:
        return None, None, None

    ws_id = (
        request.headers.get("X-Workspace-Id")
        or request.query_params.get("workspace_id")
        or (request.data.get("workspace_id") if hasattr(request, "data") and isinstance(request.data, dict) else None)
    )

    if ws_id:
        try:
            ws = Workspace.objects.filter(pk=int(ws_id)).first()
            if not ws:
                return None, None, {"error": "Workspace not found.", "status": 404}
            role = get_user_workspace_role(request.user, ws)
            if not role:
                return None, None, {"error": "You do not have access to this workspace.", "status": 403}
            return ws, role, None
        except (ValueError, TypeError):
            pass

    # Default to user's personal workspace
    from .models import get_or_create_personal_workspace
    ws = get_or_create_personal_workspace(request.user)
    return ws, WorkspaceMember.ROLE_OWNER, None


class HasWorkspaceAccess(permissions.BasePermission):
    """Verifies that the authenticated user is an active member or owner of the workspace."""

    def has_object_permission(self, request, view, obj):
        workspace = getattr(obj, "workspace", obj) if not isinstance(obj, Workspace) else obj
        if not workspace:
            return True
        return bool(get_user_workspace_role(request.user, workspace))


class IsWorkspaceAdminOrOwner(permissions.BasePermission):
    """Verifies that the user has Owner or Admin role in the workspace."""

    def has_object_permission(self, request, view, obj):
        workspace = getattr(obj, "workspace", obj) if not isinstance(obj, Workspace) else obj
        if not workspace:
            return True
        role = get_user_workspace_role(request.user, workspace)
        return role in [WorkspaceMember.ROLE_OWNER, WorkspaceMember.ROLE_ADMIN]


class CanEditWorkspaceLinks(permissions.BasePermission):
    """
    Blocks viewers from mutating actions (POST, PUT, PATCH, DELETE).
    Owners, Admins, and Members have full link creation and editing rights.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        ws, role, err = get_request_workspace(request)
        if err:
            return False
        return role in [WorkspaceMember.ROLE_OWNER, WorkspaceMember.ROLE_ADMIN, WorkspaceMember.ROLE_MEMBER]

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        workspace = getattr(obj, "workspace", None)
        if not workspace:
            return True
        role = get_user_workspace_role(request.user, workspace)
        return role in [WorkspaceMember.ROLE_OWNER, WorkspaceMember.ROLE_ADMIN, WorkspaceMember.ROLE_MEMBER]
