from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import secrets

User = get_user_model()


class Workspace(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, db_index=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_workspaces")
    is_personal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workspaces"
        ordering = ["-created_at"]
        verbose_name = "Workspace"
        verbose_name_plural = "Workspaces"

    def __str__(self):
        return f"{self.name} ({self.slug})"


class WorkspaceMember(models.Model):
    ROLE_OWNER = "owner"
    ROLE_ADMIN = "admin"
    ROLE_MEMBER = "member"
    ROLE_VIEWER = "viewer"
    ROLE_CHOICES = [
        (ROLE_OWNER, "Owner"),
        (ROLE_ADMIN, "Admin"),
        (ROLE_MEMBER, "Member"),
        (ROLE_VIEWER, "Viewer"),
    ]

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="workspace_memberships")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "workspace_members"
        unique_together = ("workspace", "user")
        ordering = ["joined_at"]
        verbose_name = "Workspace Member"
        verbose_name_plural = "Workspace Members"

    def __str__(self):
        return f"{self.user.username} - {self.role} in {self.workspace.name}"


class WorkspaceInvitation(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="invitations")
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=WorkspaceMember.ROLE_CHOICES, default=WorkspaceMember.ROLE_MEMBER)
    token = models.CharField(max_length=64, unique=True, db_index=True)
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_workspace_invitations")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_accepted = models.BooleanField(default=False)

    class Meta:
        db_table = "workspace_invitations"
        ordering = ["-created_at"]
        verbose_name = "Workspace Invitation"
        verbose_name_plural = "Workspace Invitations"

    def __str__(self):
        return f"Invite for {self.email} to {self.workspace.name} ({self.role})"


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

    # Enterprise Extensions: Phase 1 (UTM), Phase 2 (Protection), Phase 3 (Deep Links), Phase 5 (Workspace)
    campaign_name = models.CharField(max_length=150, null=True, blank=True, db_index=True)
    password_hash = models.CharField(max_length=255, null=True, blank=True)
    max_clicks = models.PositiveIntegerField(null=True, blank=True)
    ios_primary_url = models.TextField(null=True, blank=True)
    android_primary_url = models.TextField(null=True, blank=True)
    workspace = models.ForeignKey(
        Workspace,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="urls"
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

    @property
    def is_password_protected(self) -> bool:
        return bool(self.password_hash)


class LinkClickQuerySet(models.QuerySet):
    def human(self):
        """Clicks from real visitors, excluding crawlers, preview bots and scripts."""
        return self.filter(is_bot=False)


class LinkClick(models.Model):
    id = models.BigAutoField(primary_key=True)
    short_code = models.CharField(max_length=50, db_index=True)
    clicked_at = models.DateTimeField(auto_now_add=True, db_index=True)
    referrer = models.CharField(max_length=500, null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    country_code = models.CharField(max_length=10, null=True, blank=True)
    is_bot = models.BooleanField(default=False, db_index=True)

    objects = LinkClickQuerySet.as_manager()

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
    TIER_ENTERPRISE = "enterprise"
    TIER_CHOICES = [
        (TIER_FREE, "Free"),
        (TIER_PRO, "Pro"),
        (TIER_ENTERPRISE, "Enterprise"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    subscription_tier = models.CharField(max_length=20, choices=TIER_CHOICES, default=TIER_FREE)
    plan = models.ForeignKey(
        "Plan",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="subscribers",
        help_text="Active dynamic subscription plan"
    )
    is_subscribed = models.BooleanField(default=False)
    stripe_customer_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    stripe_subscription_id = models.CharField(max_length=255, null=True, blank=True)
    google_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    avatar_url = models.URLField(max_length=1024, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_profiles"
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        tier_name = self.plan.name if self.plan else self.subscription_tier
        return f"{self.user.username} [{tier_name}]"

    @property
    def is_pro(self) -> bool:
        if self.user.is_superuser:
            return True
        if self.plan:
            return self.plan.slug in ("growth", "pro", "premium", "enterprise") or self.plan.price_monthly > 0
        return self.is_subscribed or self.subscription_tier in (self.TIER_PRO, self.TIER_ENTERPRISE)


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


# ==========================================
# Phase 1: Public Link-in-Bio Models
# ==========================================
class BioPage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bio_pages")
    workspace = models.ForeignKey(
        Workspace,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="bio_pages"
    )
    slug = models.CharField(max_length=100, unique=True, db_index=True)
    title = models.CharField(max_length=255, default="My Bio Hub")
    bio = models.TextField(blank=True, default="")
    theme_config = models.JSONField(default=dict, blank=True)
    avatar_url = models.CharField(max_length=1024, null=True, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bio_pages"
        ordering = ["-updated_at"]
        verbose_name = "Bio Page"
        verbose_name_plural = "Bio Pages"

    def __str__(self):
        return f"@{self.slug} - {self.title}"


class BioPageLink(models.Model):
    page = models.ForeignKey(BioPage, on_delete=models.CASCADE, related_name="links")
    title = models.CharField(max_length=255)
    url = models.TextField()
    icon_name = models.CharField(max_length=50, blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    click_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    badge = models.CharField(max_length=50, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "bio_page_links"
        ordering = ["order", "id"]
        verbose_name = "Bio Page Link"
        verbose_name_plural = "Bio Page Links"

    def __str__(self):
        return f"{self.title} ({self.page.slug}) [{self.click_count} clicks]"


# ==========================================
# Phase 4: Custom Branded Domains
# ==========================================
class CustomDomain(models.Model):
    STATUS_PENDING = "pending"
    STATUS_ACTIVE = "active"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_FAILED, "Failed"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="custom_domains")
    domain = models.CharField(max_length=255, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    ssl_active = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "custom_domains"
        ordering = ["-created_at"]
        verbose_name = "Custom Domain"
        verbose_name_plural = "Custom Domains"

    def save(self, *args, **kwargs):
        if not self.verification_token:
            self.verification_token = secrets.token_hex(16)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.domain} [{self.status}]"


# ==========================================
# Phase 5: Outgoing Click Webhooks
# ==========================================
class ClickWebhook(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="click_webhooks")
    target_url = models.URLField(max_length=1024)
    secret_key = models.CharField(max_length=64, blank=True)
    is_active = models.BooleanField(default=True)
    events = models.JSONField(default=list, blank=True)  # e.g., ["click.created"]
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "click_webhooks"
        ordering = ["-created_at"]
        verbose_name = "Click Webhook"
        verbose_name_plural = "Click Webhooks"

    def save(self, *args, **kwargs):
        if not self.secret_key:
            self.secret_key = f"whsec_{secrets.token_hex(24)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} -> {self.target_url} ({'Active' if self.is_active else 'Disabled'})"


# ==========================================
# Phase 6: Dynamic Subscription Plans & Features
# ==========================================
class Plan(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    tagline = models.CharField(max_length=255, blank=True, default="")
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    price_annual = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stripe_price_id_monthly = models.CharField(max_length=100, blank=True, default="")
    stripe_price_id_annual = models.CharField(max_length=100, blank=True, default="")

    # Resource quotas
    links_limit = models.IntegerField(default=100, help_text="Monthly short links limit (-1 for unlimited)")
    custom_domains_limit = models.IntegerField(default=0, help_text="Number of custom domains included")
    qr_codes_limit = models.IntegerField(default=5, help_text="Dynamic QR codes limit")
    bio_pages_limit = models.IntegerField(default=1, help_text="Link-in-bio pages limit")

    is_popular = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "plans"
        ordering = ["display_order", "id"]
        verbose_name = "Subscription Plan"
        verbose_name_plural = "Subscription Plans"

    def __str__(self):
        return f"{self.name} (${self.price_monthly}/mo)"


class PlanFeature(models.Model):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="features")
    text = models.CharField(max_length=255)
    is_included = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "plan_features"
        ordering = ["display_order", "id"]
        verbose_name = "Plan Feature"
        verbose_name_plural = "Plan Features"

    def __str__(self):
        return f"{self.plan.name} - {self.text}"


from django.db.models.signals import post_save
from django.dispatch import receiver


def get_or_create_personal_workspace(user):
    """
    Ensures every user has a default personal workspace.
    Migrates any existing unassociated links and bio pages to this workspace.
    """
    personal = Workspace.objects.filter(owner=user, is_personal=True).first()
    if not personal:
        slug_base = f"{user.username}-personal".lower().replace(" ", "-")
        slug = slug_base
        counter = 1
        while Workspace.objects.filter(slug=slug).exists():
            slug = f"{slug_base}-{counter}"
            counter += 1
        personal = Workspace.objects.create(
            name=f"{user.username}'s Workspace",
            slug=slug,
            owner=user,
            is_personal=True,
        )
    WorkspaceMember.objects.get_or_create(
        workspace=personal,
        user=user,
        defaults={"role": WorkspaceMember.ROLE_OWNER},
    )
    # Associate any orphaned URLs and BioPages
    URL.objects.filter(created_by=user, workspace__isnull=True).update(workspace=personal)
    BioPage.objects.filter(user=user, workspace__isnull=True).update(workspace=personal)
    return personal


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
        get_or_create_personal_workspace(instance)
