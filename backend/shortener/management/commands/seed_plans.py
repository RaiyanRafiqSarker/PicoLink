from decimal import Decimal
from django.core.management.base import BaseCommand
from shortener.models import Plan, PlanFeature


class Command(BaseCommand):
    help = "Seeds default subscription plans (Core, Growth, Premium, Enterprise) with features into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing plans and re-seed from scratch.",
        )

    def handle(self, *args, **options):
        if options.get("reset"):
            self.stdout.write(self.style.WARNING("Resetting existing plans and features..."))
            PlanFeature.objects.all().delete()
            Plan.objects.all().delete()

        plans_data = [
            {
                "name": "Core",
                "slug": "core",
                "tagline": "For individuals and creators who need custom links and essential QR codes.",
                "price_monthly": Decimal("8.00"),
                "price_annual": Decimal("96.00"),
                "stripe_price_id_monthly": "price_core_monthly",
                "stripe_price_id_annual": "price_core_annual",
                "links_limit": 100,
                "custom_domains_limit": 0,
                "qr_codes_limit": 5,
                "bio_pages_limit": 1,
                "is_popular": False,
                "is_active": True,
                "display_order": 1,
                "features": [
                    ("100 short links / month", True),
                    ("5 custom back-halves", True),
                    ("30 days of analytics history", True),
                    ("5 dynamic QR codes", True),
                    ("1 Link-in-bio page", True),
                ],
            },
            {
                "name": "Growth",
                "slug": "growth",
                "tagline": "For small businesses and growing teams looking to engage audiences.",
                "price_monthly": Decimal("24.00"),
                "price_annual": Decimal("288.00"),
                "stripe_price_id_monthly": "price_growth_monthly",
                "stripe_price_id_annual": "price_growth_annual",
                "links_limit": 500,
                "custom_domains_limit": 1,
                "qr_codes_limit": 30,
                "bio_pages_limit": 5,
                "is_popular": True,
                "is_active": True,
                "display_order": 2,
                "features": [
                    ("Everything in Core, plus:", True),
                    ("500 short links / month", True),
                    ("1 complimentary custom domain", True),
                    ("1 year of click & scan data", True),
                    ("30 dynamic QR codes with logo", True),
                    ("Multi-channel Campaign tracking", True),
                    ("City-level analytics & CSV export", True),
                ],
            },
            {
                "name": "Premium",
                "slug": "premium",
                "tagline": "For scaling brands and marketing agencies needing campaign-level tracking.",
                "price_monthly": Decimal("149.00"),
                "price_annual": Decimal("1788.00"),
                "stripe_price_id_monthly": "price_premium_monthly",
                "stripe_price_id_annual": "price_premium_annual",
                "links_limit": 3000,
                "custom_domains_limit": 3,
                "qr_codes_limit": 500,
                "bio_pages_limit": 20,
                "is_popular": False,
                "is_active": True,
                "display_order": 3,
                "features": [
                    ("Everything in Growth, plus:", True),
                    ("3,000 short links / month", True),
                    ("3 custom domains included", True),
                    ("2 years of click & scan data", True),
                    ("500 dynamic QR codes", True),
                    ("Bulk link creation via CSV upload", True),
                    ("REST API & Webhook alerts", True),
                ],
            },
            {
                "name": "Enterprise",
                "slug": "enterprise",
                "tagline": "For large organizations requiring custom scale, security, and dedicated support.",
                "price_monthly": Decimal("0.00"),
                "price_annual": Decimal("0.00"),
                "stripe_price_id_monthly": "",
                "stripe_price_id_annual": "",
                "links_limit": 10000,
                "custom_domains_limit": 10,
                "qr_codes_limit": 1000,
                "bio_pages_limit": 50,
                "is_popular": False,
                "is_active": True,
                "display_order": 4,
                "features": [
                    ("Enterprise highlights:", True),
                    ("10,000+ links / month", True),
                    ("Single Sign-On (SSO / SAML / SCIM)", True),
                    ("Team collaboration & RBAC roles", True),
                    ("99.99% uptime guarantee SLA", True),
                    ("Dedicated Customer Success Manager", True),
                ],
            },
        ]

        for p_data in plans_data:
            features = p_data.pop("features")
            plan, created = Plan.objects.update_or_create(
                slug=p_data["slug"],
                defaults=p_data,
            )
            action = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{action} plan: {plan.name} (${plan.price_monthly}/mo)"))

            # Update or create feature bullets
            # If not reset, remove old features and replace with defined set
            plan.features.all().delete()
            for idx, (feat_text, is_inc) in enumerate(features, start=1):
                PlanFeature.objects.create(
                    plan=plan,
                    text=feat_text,
                    is_included=is_inc,
                    display_order=idx,
                )
            self.stdout.write(f"  -> {len(features)} feature bullets synced.")

        self.stdout.write(self.style.SUCCESS("All 4 subscription plans successfully seeded!"))
