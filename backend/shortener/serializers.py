import re
from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import (
    URL,
    LinkClick,
    BioPage,
    BioPageLink,
    CustomDomain,
    ClickWebhook,
    Workspace,
    WorkspaceMember,
    WorkspaceInvitation,
)
from .utils.ssrf import validate_url_safety, is_slug_reserved

SLUG_REGEX = re.compile(r"^[a-zA-Z0-9_-]{3,50}$")


def get_slug_unavailable_reason(slug: str) -> str | None:
    """Return why a custom slug can't be used ("invalid", "reserved", "taken"), or None if it's free."""
    if not SLUG_REGEX.match(slug):
        return "invalid"
    if is_slug_reserved(slug):
        return "reserved"
    if URL.objects.filter(short_code=slug).exists():
        return "taken"
    return None


class ShortenRequestSerializer(serializers.Serializer):
    original_url = serializers.CharField(max_length=2048)
    custom_slug = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    expires_in_days = serializers.IntegerField(required=False, min_value=1, max_value=365, allow_null=True, default=None)
    
    # Phase 1: UTM Campaign Tracking
    campaign_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    
    # Phase 2: Password & Max Clicks
    password = serializers.CharField(max_length=128, required=False, allow_blank=True, default="")
    max_clicks = serializers.IntegerField(required=False, min_value=1, allow_null=True, default=None)
    
    # Phase 3: Mobile Deep Linking
    ios_primary_url = serializers.CharField(max_length=2048, required=False, allow_blank=True, default="")
    android_primary_url = serializers.CharField(max_length=2048, required=False, allow_blank=True, default="")
    
    # Phase 5: Workspace Scoping
    workspace_id = serializers.IntegerField(required=False, allow_null=True, default=None)

    def validate_original_url(self, value):
        is_safe, err_msg = validate_url_safety(value)
        if not is_safe:
            raise serializers.ValidationError(err_msg)
        return value.strip()

    def validate_custom_slug(self, value):
        if not value:
            return ""
        val = value.strip()
        reason = get_slug_unavailable_reason(val)
        if reason == "invalid":
            raise serializers.ValidationError("Slug must be 3-50 characters long and contain only letters, numbers, hyphens, or underscores.")
        if reason == "reserved":
            raise serializers.ValidationError(f'The custom slug "{val}" is reserved for system routes.')
        if reason == "taken":
            raise serializers.ValidationError(f'The custom slug "{val}" is already taken.')
        return val


class UpdateLinkDestinationSerializer(serializers.Serializer):
    original_url = serializers.CharField(max_length=2048)

    def validate_original_url(self, value):
        is_safe, err_msg = validate_url_safety(value)
        if not is_safe:
            raise serializers.ValidationError(err_msg)
        return value.strip()


class URLResponseSerializer(serializers.ModelSerializer):
    short_url = serializers.SerializerMethodField()
    formatted_short_url = serializers.SerializerMethodField()
    is_password_protected = serializers.BooleanField(read_only=True)

    class Meta:
        model = URL
        fields = [
            "id",
            "short_code",
            "short_url",
            "formatted_short_url",
            "original_url",
            "campaign_name",
            "is_password_protected",
            "max_clicks",
            "ios_primary_url",
            "android_primary_url",
            "workspace_id",
            "created_at",
            "expires_at",
            "is_active",
        ]

    def get_short_url(self, obj):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(f"/{obj.short_code}")
        return f"http://localhost:8000/{obj.short_code}"

    def get_formatted_short_url(self, obj):
        return self.get_short_url(obj)


class StatsResponseSerializer(serializers.Serializer):
    short_code = serializers.CharField()
    original_url = serializers.CharField()
    created_at = serializers.DateTimeField()
    expires_at = serializers.DateTimeField(allow_null=True)
    is_active = serializers.BooleanField()
    total_clicks = serializers.IntegerField()
    top_referrers = serializers.ListField(child=serializers.DictField())
    country_breakdown = serializers.ListField(child=serializers.DictField())
    clicks_over_time = serializers.ListField(child=serializers.DictField())
    recent_clicks = serializers.ListField(child=serializers.DictField())


class UserMeSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.CharField()
    is_superuser = serializers.BooleanField()
    is_staff = serializers.BooleanField()
    subscription_tier = serializers.SerializerMethodField()
    is_subscribed = serializers.SerializerMethodField()
    is_pro = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    def get_subscription_tier(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.subscription_tier if profile else ("pro" if obj.is_superuser else "free")

    def get_is_subscribed(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.is_subscribed if profile else obj.is_superuser

    def get_is_pro(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.is_pro if profile else obj.is_superuser

    def get_avatar_url(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.avatar_url if profile and profile.avatar_url else ""


class UserRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, min_length=6, write_only=True)
    username = serializers.CharField(required=False, allow_blank=True, max_length=150)


class UserLoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class GoogleAuthSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    name = serializers.CharField(required=False, allow_blank=True, default="")
    google_id = serializers.CharField(required=False, allow_blank=True, default="")
    avatar_url = serializers.URLField(required=False, allow_blank=True, default="")
    credential = serializers.CharField(required=False, allow_blank=True, default="")


# ==========================================
# BioPage Serializers (Phase 1)
# ==========================================
class BioPageLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = BioPageLink
        fields = ["id", "title", "url", "icon_name", "order", "click_count", "is_active", "badge"]


class BioPageSerializer(serializers.ModelSerializer):
    links = BioPageLinkSerializer(many=True, read_only=True)
    public_url = serializers.SerializerMethodField()

    class Meta:
        model = BioPage
        fields = [
            "id",
            "slug",
            "title",
            "bio",
            "theme_config",
            "avatar_url",
            "is_published",
            "links",
            "public_url",
            "created_at",
            "updated_at",
        ]

    def get_public_url(self, obj):
        return f"http://localhost:3000/p/{obj.slug}"


# ==========================================
# Custom Domain Serializer (Phase 4)
# ==========================================
class CustomDomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomDomain
        fields = ["id", "domain", "status", "ssl_active", "verification_token", "created_at", "updated_at"]


# ==========================================
# Webhook Serializer (Phase 5)
# ==========================================
class ClickWebhookSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClickWebhook
        fields = ["id", "target_url", "secret_key", "is_active", "events", "created_at"]
        read_only_fields = ["secret_key", "created_at"]


# ==========================================
# Workspace Serializers (Phase 5 - RBAC)
# ==========================================
class WorkspaceMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = ["id", "user_id", "username", "email", "role", "joined_at"]


class WorkspaceInvitationSerializer(serializers.ModelSerializer):
    invited_by_username = serializers.CharField(source="invited_by.username", read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = WorkspaceInvitation
        fields = [
            "id",
            "email",
            "role",
            "token",
            "invited_by_id",
            "invited_by_username",
            "created_at",
            "expires_at",
            "is_accepted",
            "is_expired",
        ]

    def get_is_expired(self, obj):
        return obj.expires_at < timezone.now()


class WorkspaceSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    members_count = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = [
            "id",
            "name",
            "slug",
            "owner_id",
            "owner_username",
            "is_personal",
            "user_role",
            "members_count",
            "created_at",
            "updated_at",
        ]

    def get_members_count(self, obj):
        return obj.members.count()

    def get_user_role(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return None
        if obj.owner_id == request.user.id:
            return "owner"
        member = obj.members.filter(user=request.user).first()
        return member.role if member else None


class WorkspaceDetailSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    members = WorkspaceMemberSerializer(many=True, read_only=True)
    invitations = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = [
            "id",
            "name",
            "slug",
            "owner_id",
            "owner_username",
            "is_personal",
            "user_role",
            "members",
            "invitations",
            "created_at",
            "updated_at",
        ]

    def get_user_role(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return None
        if obj.owner_id == request.user.id:
            return "owner"
        member = obj.members.filter(user=request.user).first()
        return member.role if member else None

    def get_invitations(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return []
        role = self.get_user_role(obj)
        if role in ["owner", "admin"]:
            pending = obj.invitations.filter(is_accepted=False, expires_at__gte=timezone.now())
            return WorkspaceInvitationSerializer(pending, many=True).data
        return []
