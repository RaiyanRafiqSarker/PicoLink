from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    ShortenView,
    SlugAvailabilityView,
    VerifyLinkPasswordView,
    BulkShortenView,
    StatsView,
    HealthzView,
    CurrentUserView,
    UserQuotaView,
    UserRegisterView,
    UserLoginView,
    GoogleAuthView,
    UserLinksListView,
    UserLinkDetailView,
    UserUpgradeView,
    PublicBioPageView,
    PublicBioPageClickView,
    UserBioPageManageView,
    CreateCheckoutSessionView,
    CreateSubscriptionIntentView,
    ConfirmSubscriptionView,
    StripeWebhookView,
    CustomDomainListView,
    VerifyCustomDomainView,
    DeleteCustomDomainView,
    CaddyAskDomainView,
    WorkspaceListView,
    WorkspaceDetailView,
    WorkspaceInvitationView,
    WorkspaceInviteRevokeView,
    WorkspaceJoinView,
    WorkspaceMemberManageView,
    ClickWebhookListView,
    ClickWebhookTestView,
    ClickWebhookDeleteView,
    AdminURLListView,
    AdminURLToggleView,
    AdminURLDeleteView,
    PlanViewSet,
)

router = DefaultRouter()
router.register(r"v1/plans", PlanViewSet, basename="plans")

urlpatterns = [
    # Shorten & Verification (Phase 1 & Phase 2)
    path("v1/shorten", ShortenView.as_view(), name="api-shorten"),
    path("v1/shorten/check-slug/", SlugAvailabilityView.as_view(), name="api-check-slug"),
    path("v1/shorten/bulk/", BulkShortenView.as_view(), name="api-shorten-bulk"),
    path("v1/shorten/<str:code>/verify-password/", VerifyLinkPasswordView.as_view(), name="api-verify-password"),
    path("v1/stats/<str:code>", StatsView.as_view(), name="api-stats"),

    # Auth routes
    path("v1/auth/register", UserRegisterView.as_view(), name="user-register"),
    path("v1/auth/login", UserLoginView.as_view(), name="user-login"),
    path("v1/auth/google", GoogleAuthView.as_view(), name="user-google-auth"),
    path("v1/auth/token", TokenObtainPairView.as_view(), name="token-obtain"),
    path("v1/auth/token/refresh", TokenRefreshView.as_view(), name="token-refresh"),
    path("v1/auth/me", CurrentUserView.as_view(), name="current-user"),

    # Quota & User Link Management
    path("v1/user/quota", UserQuotaView.as_view(), name="user-quota"),
    path("v1/user/quota/", UserQuotaView.as_view(), name="user-quota-slash"),
    path("v1/user/links", UserLinksListView.as_view(), name="user-links"),
    path("v1/user/links/", UserLinksListView.as_view(), name="user-links-slash"),
    path("v1/user/links/<int:pk>/", UserLinkDetailView.as_view(), name="user-link-detail"),
    path("v1/user/upgrade", UserUpgradeView.as_view(), name="user-upgrade"),
    path("v1/user/upgrade/", UserUpgradeView.as_view(), name="user-upgrade-slash"),

    # Phase 1: Link-in-Bio
    path("v1/pages/public/<str:slug>/", PublicBioPageView.as_view(), name="public-bio-page"),
    path("v1/pages/public/<str:slug>/click/<int:link_id>/", PublicBioPageClickView.as_view(), name="public-bio-click"),
    path("v1/pages/my-page/", UserBioPageManageView.as_view(), name="user-bio-page"),
    path("v1/pages/save/", UserBioPageManageView.as_view(), name="user-bio-save"),

    # Phase 4: Billing & Stripe
    path("v1/billing/create-checkout-session/", CreateCheckoutSessionView.as_view(), name="billing-checkout"),
    path("v1/billing/create-subscription-intent/", CreateSubscriptionIntentView.as_view(), name="billing-subscription-intent"),
    path("v1/billing/confirm-subscription/", ConfirmSubscriptionView.as_view(), name="billing-confirm-subscription"),
    path("v1/billing/webhook/", StripeWebhookView.as_view(), name="billing-webhook"),

    # Phase 4: Custom Domains
    path("v1/domains/", CustomDomainListView.as_view(), name="domains-list"),
    path("v1/domains/add/", CustomDomainListView.as_view(), name="domains-add"),
    path("v1/domains/verify/<int:pk>/", VerifyCustomDomainView.as_view(), name="domains-verify"),
    path("v1/domains/<int:pk>/", DeleteCustomDomainView.as_view(), name="domains-delete"),
    path("v1/domains/ask/", CaddyAskDomainView.as_view(), name="domains-caddy-ask"),

    # Phase 5: Workspaces (RBAC)
    path("v1/workspaces/", WorkspaceListView.as_view(), name="workspaces-list"),
    path("v1/workspaces/<int:pk>/", WorkspaceDetailView.as_view(), name="workspace-detail"),
    path("v1/workspaces/<int:pk>/invites/", WorkspaceInvitationView.as_view(), name="workspace-invites"),
    path("v1/workspaces/<int:pk>/invites/<int:invite_id>/", WorkspaceInviteRevokeView.as_view(), name="workspace-invite-revoke"),
    path("v1/workspaces/join/<str:token>/", WorkspaceJoinView.as_view(), name="workspace-join"),
    path("v1/workspaces/<int:pk>/members/<int:user_id>/", WorkspaceMemberManageView.as_view(), name="workspace-member-manage"),

    # Phase 5: Outgoing Click Webhooks
    path("v1/webhooks/", ClickWebhookListView.as_view(), name="webhooks-list"),
    path("v1/webhooks/<int:pk>/test/", ClickWebhookTestView.as_view(), name="webhook-test"),
    path("v1/webhooks/<int:pk>/", ClickWebhookDeleteView.as_view(), name="webhook-delete"),

    # Superuser Admin Routes
    path("v1/admin/urls", AdminURLListView.as_view(), name="admin-urls-list"),
    path("v1/admin/urls/<int:pk>/toggle", AdminURLToggleView.as_view(), name="admin-urls-toggle"),
    path("v1/admin/urls/<int:pk>", AdminURLDeleteView.as_view(), name="admin-urls-delete"),

    # Phase 6: Dynamic Subscription Plans
    path("v1/plans", PlanViewSet.as_view({"get": "list"}), name="plans-list-noslash"),
    path("", include(router.urls)),
]

