from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class URL(models.Model):
    id = models.BigAutoField(primary_key=True)
    short_code = models.CharField(max_length=50, unique=True, db_index=True)
    original_url = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="short_urls"
    )

    class Meta:
        db_table = "urls"
        ordering = ["-created_at"]
        verbose_name = "Shortened URL"
        verbose_name_plural = "Shortened URLs"

    def __str__(self):
        return f"{self.short_code} -> {self.original_url[:40]}"

    @property
    def is_expired(self) -> bool:
        if self.expires_at and self.expires_at < timezone.now():
            return True
        return False


class LinkClick(models.Model):
    id = models.BigAutoField(primary_key=True)
    short_code = models.CharField(max_length=50, db_index=True)
    clicked_at = models.DateTimeField(auto_now_add=True, db_index=True)
    referrer = models.CharField(max_length=500, null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    country_code = models.CharField(max_length=10, null=True, blank=True)

    class Meta:
        db_table = "link_clicks"
        ordering = ["-clicked_at"]
        verbose_name = "Link Click"
        verbose_name_plural = "Link Clicks"
        indexes = [
            models.Index(fields=["short_code", "-clicked_at"]),
        ]

    def __str__(self):
        return f"Click on {self.short_code} at {self.clicked_at}"


class UserProfile(models.Model):
    TIER_FREE = "free"
    TIER_PRO = "pro"
    TIER_CHOICES = [
        (TIER_FREE, "Free"),
        (TIER_PRO, "Pro"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    subscription_tier = models.CharField(max_length=20, choices=TIER_CHOICES, default=TIER_FREE)
    is_subscribed = models.BooleanField(default=False)
    google_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    avatar_url = models.URLField(max_length=1024, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_profiles"
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"{self.user.username} [{self.subscription_tier}]"

    @property
    def is_pro(self) -> bool:
        return self.is_subscribed or self.subscription_tier == self.TIER_PRO or self.user.is_superuser


class DailyQuotaRecord(models.Model):
    key = models.CharField(max_length=255, unique=True, db_index=True)
    count = models.PositiveIntegerField(default=0)
    date = models.DateField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "daily_quota_records"
        verbose_name = "Daily Quota Record"
        verbose_name_plural = "Daily Quota Records"

    def __str__(self):
        return f"{self.key}: {self.count}"


from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=User)
def create_or_save_user_profile(sender, instance, created, **kwargs):
    if created:
        tier = UserProfile.TIER_PRO if instance.is_superuser else UserProfile.TIER_FREE
        UserProfile.objects.get_or_create(
            user=instance,
            defaults={
                "subscription_tier": tier,
                "is_subscribed": instance.is_superuser,
            }
        )
