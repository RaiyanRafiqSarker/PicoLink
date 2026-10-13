from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    ShortenView,
    SlugAvailabilityView,
    StatsView,
    HealthzView,
    CurrentUserView,
    UserQuotaView,
    UserRegisterView,
    UserLoginView,
    GoogleAuthView,
    UserLinksListView,
    UserUpgradeView,
    AdminURLListView,
    AdminURLToggleView,
    AdminURLDeleteView,
)

urlpatterns = [
    # Shorten & Stats
    path("v1/shorten", ShortenView.as_view(), name="api-shorten"),
    path("v1/shorten/check-slug/", SlugAvailabilityView.as_view(), name="api-check-slug"),
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
    path("v1/user/links", UserLinksListView.as_view(), name="user-links"),
    path("v1/user/upgrade", UserUpgradeView.as_view(), name="user-upgrade"),

    # Superuser Admin Routes
    path("v1/admin/urls", AdminURLListView.as_view(), name="admin-urls-list"),
    path("v1/admin/urls/<int:pk>/toggle", AdminURLToggleView.as_view(), name="admin-urls-toggle"),
    path("v1/admin/urls/<int:pk>", AdminURLDeleteView.as_view(), name="admin-urls-delete"),
]
