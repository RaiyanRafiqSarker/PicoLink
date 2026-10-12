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

    class Meta:
        model = URL
        fields = ["short_code", "short_url", "original_url", "created_at", "expires_at", "is_active"]

    def get_short_url(self, obj):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(f"/{obj.short_code}")
        return f"http://localhost:8000/{obj.short_code}"


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
