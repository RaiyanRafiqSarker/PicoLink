from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    ShortenView,
    StatsView,
    HealthzView,
    CurrentUserView,
    AdminURLListView,
    AdminURLToggleView,
    AdminURLDeleteView,
)

urlpatterns = [
    path("v1/shorten", ShortenView.as_view(), name="api-shorten"),
    path("v1/stats/<str:code>", StatsView.as_view(), name="api-stats"),
    path("v1/auth/token", TokenObtainPairView.as_view(), name="token-obtain"),
    path("v1/auth/token/refresh", TokenRefreshView.as_view(), name="token-refresh"),
    path("v1/auth/me", CurrentUserView.as_view(), name="current-user"),
    path("v1/admin/urls", AdminURLListView.as_view(), name="admin-urls-list"),
    path("v1/admin/urls/<int:pk>/toggle", AdminURLToggleView.as_view(), name="admin-urls-toggle"),
    path("v1/admin/urls/<int:pk>", AdminURLDeleteView.as_view(), name="admin-urls-delete"),
]
