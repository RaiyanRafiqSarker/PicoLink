from django.contrib import admin
from django.urls import path, include
from shortener.views import RedirectView, HealthzView

urlpatterns = [
    # Django Admin Panel (for superusers)
    path("admin/", admin.site.urls),
    
    # Liveness probe
    path("healthz", HealthzView.as_view(), name="healthz"),
    
    # REST API routes
    path("api/", include("shortener.urls")),
    
    # Root redirect route for short codes (e.g., http://localhost:8000/6LAze)
    path("<str:code>", RedirectView.as_view(), name="redirect-short-code"),
]
