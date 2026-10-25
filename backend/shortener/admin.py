from django.contrib import admin
from django.utils.html import format_html
from .models import URL, LinkClick

@admin.register(URL)
class URLAdmin(admin.ModelAdmin):
    list_display = (
        "short_code",
        "display_original_url",
        "is_active",
        "created_by",
        "created_at",
        "expires_at",
        "click_count_display",
    )
    list_filter = ("is_active", "created_at", "expires_at")
    search_fields = ("short_code", "original_url", "created_by__username")
    readonly_fields = ("created_at", "click_count_display")
    actions = ["activate_urls", "deactivate_urls"]

    def display_original_url(self, obj):
        truncated = obj.original_url[:60] + ("..." if len(obj.original_url) > 60 else "")
        return format_html('<a href="{}" target="_blank">{}</a>', obj.original_url, truncated)
    display_original_url.short_description = "Original URL"

    def click_count_display(self, obj):
        count = LinkClick.objects.human().filter(short_code=obj.short_code).count()
        return format_html("<strong>{}</strong> clicks", count)
    click_count_display.short_description = "Total Clicks (excl. bots)"

    @admin.action(description="Activate selected shortened URLs")
    def activate_urls(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Deactivate selected shortened URLs (killswitch)")
    def deactivate_urls(self, request, queryset):
        queryset.update(is_active=False)


@admin.register(LinkClick)
class LinkClickAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "short_code",
        "clicked_at",
        "country_code",
        "referrer_display",
        "user_agent_truncated",
        "is_bot",
    )
    list_filter = ("is_bot", "country_code", "clicked_at")
    search_fields = ("short_code", "referrer", "user_agent")
    readonly_fields = ("id", "short_code", "clicked_at", "referrer", "user_agent", "country_code", "is_bot")

    def referrer_display(self, obj):
        return obj.referrer or "Direct / None"
    referrer_display.short_description = "Referrer"

    def user_agent_truncated(self, obj):
        if not obj.user_agent:
            return "-"
        return obj.user_agent[:45] + ("..." if len(obj.user_agent) > 45 else "")
    user_agent_truncated.short_description = "User Agent"


from .models import UserProfile, DailyQuotaRecord


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "subscription_tier", "is_subscribed", "google_id", "created_at")
    list_filter = ("plan", "subscription_tier", "is_subscribed")
    search_fields = ("user__username", "user__email", "google_id")


@admin.register(DailyQuotaRecord)
class DailyQuotaRecordAdmin(admin.ModelAdmin):
    list_display = ("key", "count", "date", "updated_at")
    list_filter = ("date",)
    search_fields = ("key",)


from .models import Plan, PlanFeature


class PlanFeatureInline(admin.TabularInline):
    model = PlanFeature
    extra = 1
    fields = ("text", "is_included", "display_order")
    ordering = ("display_order", "id")


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "price_monthly",
        "price_annual",
        "is_popular",
        "is_active",
        "display_order",
        "links_limit",
        "custom_domains_limit",
    )
    list_editable = ("is_popular", "is_active", "display_order")
    list_filter = ("is_active", "is_popular")
    search_fields = ("name", "slug", "tagline")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [PlanFeatureInline]
    ordering = ("display_order", "id")

