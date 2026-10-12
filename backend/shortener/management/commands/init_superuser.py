import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = "Creates a default superuser if none exists"

    def handle(self, *args, **options):
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@picolink.dev")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "admin123456")

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Superuser "{username}" created successfully with password "{password}".'))
        else:
            self.stdout.write(self.style.WARNING(f'Superuser "{username}" already exists.'))
