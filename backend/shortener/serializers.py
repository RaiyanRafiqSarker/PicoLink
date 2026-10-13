import re
from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import URL, LinkClick
from .utils.ssrf import validate_url_safety, is_slug_reserved

SLUG_REGEX = re.compile(r"^[a-zA-Z0-9_-]{3,50}$")

class ShortenRequestSerializer(serializers.Serializer):
    original_url = serializers.CharField(max_length=2048)
    custom_slug = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    expires_in_days = serializers.IntegerField(required=False, min_value=1, max_value=365, allow_null=True, default=None)

    def validate_original_url(self, value):
        is_safe, err_msg = validate_url_safety(value)
        if not is_safe:
            raise serializers.ValidationError(err_msg)
        return value.strip()

    def validate_custom_slug(self, value):
        if not value:
            return ""
        val = value.strip()
        if not SLUG_REGEX.match(val):
            raise serializers.ValidationError("Slug must be 3-50 characters long and contain only letters, numbers, hyphens, or underscores.")
        if is_slug_reserved(val):
            raise serializers.ValidationError(f'The custom slug "{val}" is reserved for system routes.')
        if URL.objects.filter(short_code=val).exists():
            raise serializers.ValidationError(f'The custom slug "{val}" is already taken.')
        return val


class URLResponseSerializer(serializers.ModelSerializer):
    short_url = serializers.SerializerMethodField()
    formatted_short_url = serializers.SerializerMethodField()

    class Meta:
        model = URL
        fields = ["short_code", "short_url", "formatted_short_url", "original_url", "created_at", "expires_at", "is_active"]

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
