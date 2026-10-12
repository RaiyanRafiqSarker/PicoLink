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
