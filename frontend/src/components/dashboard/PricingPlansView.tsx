"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Flame,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface PricingPlansViewProps {
  onBack: () => void;
  onUpgradePro?: () => void;
  backLabel?: string;
  targetDomain?: string;
  onPlanSelected?: (planName: string, domain?: string) => void;
}

type BillingCycle = "annual" | "monthly";

export interface DynamicPlanFeature {
  id: number;
  text: string;
  is_included: boolean;
  display_order: number;
}

export interface DynamicPlan {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  price_monthly: string;
  price_annual: string;
  stripe_price_id_monthly: string;
  stripe_price_id_annual: string;
  links_limit: number;
  custom_domains_limit: number;
  qr_codes_limit: number;
  bio_pages_limit: number;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
  features: DynamicPlanFeature[];
}

interface PlanFeatureRow {
  name: string;
  tooltip?: string;
  core: string | boolean;
  growth: string | boolean;
  premium: string | boolean;
  enterprise: string | boolean;
}

interface FeatureCategory {
  id: string;
  title: string;
  features: PlanFeatureRow[];
}

export default function PricingPlansView({
  onBack,
  onUpgradePro,
  backLabel,
  targetDomain,
  onPlanSelected,
}: PricingPlansViewProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [dynamicPlans, setDynamicPlans] = useState<DynamicPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
        const res = await fetch(`${apiBase}/api/v1/plans/`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDynamicPlans(data);
          }
        }
      } catch (err) {
        console.warn("Could not load dynamic plans, using resilient fallbacks:", err);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handlePlanSelect = (planName: string) => {
    if (planName.toLowerCase() === "enterprise") {
      toast.info("Enterprise Consultation", {
        description: "Our enterprise solutions team will contact you shortly.",
      });
      return;
    }

    const tierMap: Record<string, string> = {
      Core: "core",
      Growth: "growth",
      Premium: "premium",
      Pro: "pro",
    };
    const tier = tierMap[planName] || planName.toLowerCase();

    let checkoutUrl = `/checkout?plan=${tier}&billing=${billingCycle}`;
    if (targetDomain) {
      checkoutUrl += `&domain=${encodeURIComponent(targetDomain)}`;
    }

    if (onPlanSelected) {
      onPlanSelected(planName, targetDomain);
    }
    toast.success(`Proceeding to checkout for ${planName} Plan...`);
    window.location.href = checkoutUrl;
  };

  // Feature Comparison Table Data matching Bitly/PicoLink enterprise plan breakdown
  const featureCategories: FeatureCategory[] = [
    {
      id: "link-management",
      title: "Link Management",
      features: [
        {
          name: "Short links included",
          tooltip: "Number of branded or standard short links generated each month",
          core: billingCycle === "annual" ? "100 / mo" : "100 / mo",
          growth: billingCycle === "annual" ? "500 / mo" : "500 / mo",
          premium: billingCycle === "annual" ? "3,000 / mo" : "3,000 / mo",
          enterprise: "10,000+ / mo",
        },
        {
          name: "Custom back-halves (vanity slugs)",
          tooltip: "Custom slug path at the end of links (e.g. picolink.dev/summer-sale)",
          core: "5 / mo",
          growth: "10 / mo",
          premium: "Unlimited",
          enterprise: "Unlimited",
        },
        {
          name: "Custom branded domains",
          tooltip: "Use your own custom domain (e.g. go.brand.com)",
          core: "Add-on",
          growth: "1 included",
          premium: "3 included",
          enterprise: "Custom (10+)",
        },
        {
          name: "Link expiration dates & killswitch",
          tooltip: "Automatically deactivate links on a schedule or toggle immediately",
          core: false,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "Redirect destination editing",
          tooltip: "Change where a short link points after publication without breaking the link",
          core: false,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "Bulk link creation (CSV upload)",
          tooltip: "Shorten hundreds of links simultaneously with a spreadsheet",
          core: false,
          growth: false,
          premium: true,
          enterprise: true,
        },
        {
          name: "UTM campaign parameter builder",
          tooltip: "Automatically append standard Google Analytics UTM tags",
          core: false,
          growth: true,
          premium: true,
          enterprise: true,
        },
      ],
    },
    {
      id: "qr-codes",
      title: "QR Codes",
      features: [
        {
          name: "Dynamic QR codes",
          tooltip: "QR codes that can have their destination URL updated any time",
          core: "5 / mo",
          growth: "30 / mo",
          premium: "500 / mo",
          enterprise: "Unlimited",
        },
        {
          name: "Custom QR colors & corner styling",
          core: true,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "Embedded brand logo in QR center",
          core: false,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "High-resolution download (SVG, PNG, PDF)",
          core: true,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "QR scan tracking & analytics",
          core: true,
          growth: true,
          premium: true,
          enterprise: true,
        },
      ],
    },
    {
      id: "analytics",
      title: "Analytics & Reporting",
      features: [
        {
          name: "Click & scan data history",
          tooltip: "Duration click metrics are stored and retrievable",
          core: "30 days",
          growth: "1 year",
          premium: "2 years",
          enterprise: "Custom (5+ yrs)",
        },
        {
          name: "Real-time click tracking stream",
          core: true,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "Geographic location (Country-level)",
          core: true,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "City-level location data",
          tooltip: "Pinpoint clicks down to specific metropolitan areas",
          core: false,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "Referring domains & social channels",
          core: true,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "Device, browser & OS breakdown",
          core: true,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "CSV & PDF report exporting",
          core: false,
          growth: true,
          premium: true,
          enterprise: true,
        },
      ],
    },
    {
      id: "campaigns",
      title: "Campaigns & Multi-Channel Tracking",
      features: [
        {
          name: "Multi-channel Campaign grouping",
          tooltip: "Group related links together across email, social, and print channels",
          core: false,
          growth: "1 active",
          premium: "Unlimited",
          enterprise: "Unlimited",
        },
        {
          name: "Cross-channel performance comparison",
          core: false,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "Channel attribution reporting",
          core: false,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "Shared campaign dashboards",
          core: false,
          growth: false,
          premium: true,
          enterprise: true,
        },
      ],
    },
    {
      id: "pages",
      title: "Pages (Link-in-bio)",
      features: [
        {
          name: "Custom mobile Bio Pages",
          core: "1 page",
          growth: "3 pages",
          premium: "10 pages",
          enterprise: "Custom",
        },
        {
          name: "Interactive link blocks & video embeds",
          core: true,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "Custom domain for Bio Page",
          core: false,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "Click tracking per button",
          core: true,
          growth: true,
          premium: true,
          enterprise: true,
        },
      ],
    },
    {
      id: "security-api",
      title: "Integrations, API & Security",
      features: [
        {
          name: "REST API Access",
          core: false,
          growth: "1,000 req/hr",
          premium: "10,000 req/hr",
          enterprise: "Custom SLA",
        },
        {
          name: "Webhook notifications",
          core: false,
          growth: false,
          premium: true,
          enterprise: true,
        },
        {
          name: "Two-factor authentication (2FA)",
          core: true,
          growth: true,
          premium: true,
          enterprise: true,
        },
        {
          name: "Single Sign-On (SSO / SAML / SCIM)",
          tooltip: "Integrate with Okta, Azure AD, Google Workspace",
          core: false,
          growth: false,
          premium: false,
          enterprise: true,
        },
        {
          name: "Role-based access control (RBAC)",
          core: false,
          growth: false,
          premium: true,
          enterprise: true,
        },
        {
          name: "99.99% Uptime SLA",
          core: false,
          growth: false,
          premium: false,
          enterprise: true,
        },
        {
          name: "Dedicated Account Manager & Priority Support",
          core: "Standard",
          growth: "Priority Email",
          premium: "Priority Email + Chat",
          enterprise: "Dedicated Manager",
        },
      ],
    },
  ];

  const renderCell = (value: string | boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-xs">
          <Check className="w-4 h-4 stroke-[2.5]" />
        </span>
      ) : (
        <span className="pricing-cell-dash text-slate-400 dark:text-slate-600 text-sm font-semibold">—</span>
      );
    }
    return (
      <span className="pricing-cell-value text-xs font-bold text-slate-900 dark:text-slate-100">
        {value}
      </span>
    );
  };

  const corePlan = dynamicPlans.find((p) => p.slug === "core");
  const growthPlan = dynamicPlans.find((p) => p.slug === "growth");
  const premiumPlan = dynamicPlans.find((p) => p.slug === "premium");

  const coreTablePrice = corePlan
    ? billingCycle === "annual"
      ? `$${Math.round(parseFloat(corePlan.price_annual) / 12) || Math.round(parseFloat(corePlan.price_monthly))}/mo`
      : `$${Math.round(parseFloat(corePlan.price_monthly))}/mo`
    : billingCycle === "annual" ? "$8/mo" : "$10/mo";

  const growthTablePrice = growthPlan
    ? billingCycle === "annual"
      ? `$${Math.round(parseFloat(growthPlan.price_annual) / 12) || Math.round(parseFloat(growthPlan.price_monthly))}/mo`
      : `$${Math.round(parseFloat(growthPlan.price_monthly))}/mo`
    : billingCycle === "annual" ? "$24/mo" : "$29/mo";

  const premiumTablePrice = premiumPlan
    ? billingCycle === "annual"
      ? `$${Math.round(parseFloat(premiumPlan.price_annual) / 12) || Math.round(parseFloat(premiumPlan.price_monthly))}/mo`
      : `$${Math.round(parseFloat(premiumPlan.price_monthly))}/mo`
    : billingCycle === "annual" ? "$149/mo" : "$199/mo";

  return (
    <div className="pricing-plans-page w-full min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-white pb-24 transition-colors">
      {/* Top Header / Nav Bar (relative so it stays at the top and doesn't move with scrolling) */}
      <div className="pricing-header relative z-10 bg-white/95 dark:bg-[#080d1a]/95 border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-transparent transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel || (targetDomain ? "Back to Custom Domains" : "Back to Campaigns")}</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
            Pico<span className="text-indigo-600 dark:text-indigo-400">Link</span> Plans
          </span>
        </div>

        <button
          onClick={() => handlePlanSelect("Growth")}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
        >
          <span>Get Started Free</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-6 text-center space-y-4">
        <h1 className="pricing-title text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight">
          Create more meaningful, measurable experiences with PicoLink
        </h1>
        <p className="pricing-subtitle text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Explore plans below to find the right fit for your business, campaigns, and audience engagement.
        </p>

        {/* Annual / Monthly Billing Switcher matching Screenshot */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <div className="pricing-toggle-wrap inline-flex items-center p-1 rounded-2xl bg-slate-200/90 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 shadow-inner">
            <button
              onClick={() => setBillingCycle("annual")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                billingCycle === "annual"
                  ? "pricing-toggle-active bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "pricing-toggle-inactive text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Annual</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold tracking-wide">
                Save up to 33%
              </span>
            </button>

            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                billingCycle === "monthly"
                  ? "pricing-toggle-active bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "pricing-toggle-inactive text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Blue Promotion Callout Ribbon matching Screenshot */}
        <div className="pt-2 max-w-2xl mx-auto space-y-3">
          {targetDomain && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/70 via-indigo-950/60 to-slate-900 border border-teal-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-300">Ready to Claim:</span>
                    <span className="text-sm font-mono font-bold text-teal-200 bg-teal-950/80 px-2.5 py-0.5 rounded-lg border border-teal-500/40">
                      {targetDomain}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      Available
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Choose any plan below to buy, claim, and activate <strong className="text-slate-200">{targetDomain}</strong> for your links.
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-teal-300 font-medium whitespace-nowrap bg-teal-500/10 px-3 py-1.5 rounded-xl border border-teal-500/20">
                1 Complimentary on Growth
              </span>
            </div>
          )}

          <div className="pricing-banner p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-200 text-xs font-medium flex items-center justify-center gap-2 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              Special Offer: Get <strong>15% off</strong> any annual subscription when you activate today. Code: <strong>PICO15</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 4 Primary Plan Cards (Core, Growth, Premium, Enterprise) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {dynamicPlans.length > 0 ? (
            dynamicPlans.map((plan) => {
              const isEnterprise = plan.slug === "enterprise" || parseFloat(plan.price_monthly) === 0;
              const monthlyRate = parseFloat(plan.price_monthly);
              const annualRate = parseFloat(plan.price_annual);

              const displayPrice = isEnterprise
                ? "Custom"
                : billingCycle === "annual"
                ? `$${Math.round(annualRate > 0 ? annualRate / 12 : monthlyRate)}`
                : `$${Math.round(monthlyRate)}`;

              const displayPeriod = isEnterprise
                ? "Tailored volume & multi-year agreement"
                : billingCycle === "annual"
                ? `Billed annually ($${Math.round(annualRate > 0 ? annualRate : monthlyRate * 12)}/yr)`
                : "Billed monthly";

              return (
                <div
                  key={plan.id}
                  className={`pricing-card relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl transition ${
                    plan.is_popular
                      ? "pricing-card-growth bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-xl shadow-blue-500/10 transform lg:-translate-y-2"
                      : "bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
                  }`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold tracking-wider uppercase shadow-md flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      <span>Recommended</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="pricing-card-title text-xl font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{plan.name}</span>
                      </h3>
                      <p className="pricing-card-desc text-sm text-slate-500 dark:text-slate-400 mt-1 min-h-[36px]">
                        {plan.tagline}
                      </p>
                    </div>

                    <div className="py-2">
                      <div className="flex items-baseline gap-1">
                        <span className={`pricing-card-price ${isEnterprise ? "text-3xl" : "text-4xl"} font-black text-slate-900 dark:text-white`}>
                          {displayPrice}
                        </span>
                        {!isEnterprise && <span className="text-sm font-medium text-slate-500">/month</span>}
                      </div>
                      <p className="pricing-card-period text-xs text-slate-400 mt-0.5">
                        {displayPeriod}
                      </p>
                    </div>

                    <button
                      onClick={() => handlePlanSelect(plan.name)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition shadow-sm ${
                        isEnterprise
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                          : plan.is_popular
                          ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transform hover:-translate-y-0.5"
                          : "border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      }`}
                    >
                      {isEnterprise ? "Contact Sales" : "Get Started"}
                    </button>

                    {plan.features && plan.features.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 text-sm text-slate-900 dark:text-slate-200">
                        <p className="pricing-card-feature-header font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                          {plan.name === "Growth"
                            ? "Everything in Core, plus:"
                            : plan.name === "Premium"
                            ? "Everything in Growth, plus:"
                            : plan.name === "Enterprise"
                            ? "Enterprise highlights:"
                            : `${plan.name} includes:`}
                        </p>
                        {plan.features
                          .filter((f) => f.is_included)
                          .sort((a, b) => a.display_order - b.display_order)
                          .map((feat) => (
                            <div key={feat.id} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                              <span className="pricing-card-feature">{feat.text}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <>
              {/* 1. Core Plan */}
              <div className="pricing-card relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                <div className="space-y-4">
                  <div>
                    <h3 className="pricing-card-title text-xl font-extrabold text-slate-900 dark:text-white">Core</h3>
                    <p className="pricing-card-desc text-sm text-slate-500 dark:text-slate-400 mt-1 min-h-[36px]">
                      For individuals and creators who need custom links and essential QR codes.
                    </p>
                  </div>

                  <div className="py-2">
                    <div className="flex items-baseline gap-1">
                      <span className="pricing-card-price text-4xl font-black text-slate-900 dark:text-white">
                        ${billingCycle === "annual" ? "8" : "10"}
                      </span>
                      <span className="text-sm font-medium text-slate-500">/month</span>
                    </div>
                    <p className="pricing-card-period text-xs text-slate-400 mt-0.5">
                      {billingCycle === "annual" ? "Billed annually ($96/yr)" : "Billed monthly"}
                    </p>
                  </div>

                  <button
                    onClick={() => handlePlanSelect("Core")}
                    className="w-full py-2.5 px-4 rounded-xl border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold text-sm transition shadow-sm"
                  >
                    Get Started
                  </button>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 text-sm text-slate-900 dark:text-slate-200">
                    <p className="pricing-card-feature-header font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      Core includes:
                    </p>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature"><strong>100</strong> short links / month</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature"><strong>5</strong> custom back-halves</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature"><strong>30 days</strong> of analytics history</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature"><strong>5</strong> dynamic QR codes</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature">1 Link-in-bio page</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Growth Plan */}
              <div className="pricing-card pricing-card-growth relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-xl shadow-blue-500/10 transition transform lg:-translate-y-2">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold tracking-wider uppercase shadow-md flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>Recommended</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="pricing-card-title text-xl font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>Growth</span>
                    </h3>
                    <p className="pricing-card-desc text-sm text-slate-500 dark:text-slate-400 mt-1 min-h-[36px]">
                      For small businesses and growing teams looking to engage audiences.
                    </p>
                  </div>

                  <div className="py-2">
                    <div className="flex items-baseline gap-1">
                      <span className="pricing-card-price text-4xl font-black text-slate-900 dark:text-white">
                        ${billingCycle === "annual" ? "24" : "29"}
                      </span>
                      <span className="text-sm font-medium text-slate-500">/month</span>
                    </div>
                    <p className="pricing-card-period text-xs text-slate-400 mt-0.5">
                      {billingCycle === "annual" ? "Billed annually ($288/yr)" : "Billed monthly"}
                    </p>
                  </div>

                  <button
                    onClick={() => handlePlanSelect("Growth")}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-lg shadow-blue-600/30 transform hover:-translate-y-0.5"
                  >
                    Get Started
                  </button>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 text-sm text-slate-900 dark:text-slate-200">
                    <p className="pricing-card-feature-header font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      Everything in Core, plus:
                    </p>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature"><strong>500</strong> short links / month</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature"><strong>1 complimentary</strong> custom domain</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature"><strong>1 year</strong> of click &amp; scan data</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature"><strong>30</strong> dynamic QR codes with logo</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature">Multi-channel Campaign tracking</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature">City-level analytics &amp; CSV export</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Premium Plan */}
              <div className="pricing-card relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                <div className="space-y-4">
                  <div>
                    <h3 className="pricing-card-title text-xl font-extrabold text-slate-900 dark:text-white">Premium</h3>
                    <p className="pricing-card-desc text-sm text-slate-500 dark:text-slate-400 mt-1 min-h-[36px]">
                      For scaling brands and marketing agencies needing campaign-level tracking.
                    </p>
                  </div>

                  <div className="py-2">
                    <div className="flex items-baseline gap-1">
                      <span className="pricing-card-price text-4xl font-black text-slate-900 dark:text-white">
                        ${billingCycle === "annual" ? "149" : "199"}
                      </span>
                      <span className="text-sm font-medium text-slate-500">/month</span>
                    </div>
                    <p className="pricing-card-period text-xs text-slate-400 mt-0.5">
                      {billingCycle === "annual" ? "Billed annually ($1,788/yr)" : "Billed monthly"}
                    </p>
                  </div>

                  <button
                    onClick={() => handlePlanSelect("Premium")}
                    className="w-full py-2.5 px-4 rounded-xl border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold text-sm transition shadow-sm"
                  >
                    Get Started
                  </button>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 text-sm text-slate-900 dark:text-slate-200">
                    <p className="pricing-card-feature-header font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      Everything in Growth, plus:
                    </p>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature"><strong>3,000</strong> short links / month</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature"><strong>3</strong> custom domains included</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature"><strong>2 years</strong> of click &amp; scan data</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature"><strong>500</strong> dynamic QR codes</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature">Bulk link creation via CSV upload</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature">REST API &amp; Webhook alerts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Enterprise Plan */}
              <div className="pricing-card relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                <div className="space-y-4">
                  <div>
                    <h3 className="pricing-card-title text-xl font-extrabold text-slate-900 dark:text-white">Enterprise</h3>
                    <p className="pricing-card-desc text-sm text-slate-500 dark:text-slate-400 mt-1 min-h-[36px]">
                      For large organizations requiring custom scale, security, and dedicated support.
                    </p>
                  </div>

                  <div className="py-2">
                    <div className="flex items-baseline gap-1">
                      <span className="pricing-card-price text-3xl font-black text-slate-900 dark:text-white">
                        Custom
                      </span>
                    </div>
                    <p className="pricing-card-period text-xs text-slate-400 mt-0.5">
                      Tailored volume &amp; multi-year agreement
                    </p>
                  </div>

                  <button
                    onClick={() => handlePlanSelect("Enterprise")}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-sm transition shadow-sm"
                  >
                    Contact Sales
                  </button>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 text-sm text-slate-900 dark:text-slate-200">
                    <p className="pricing-card-feature-header font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      Enterprise highlights:
                    </p>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature"><strong>10,000+</strong> links / month</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature">Single Sign-On (SSO / SAML / SCIM)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature">Team collaboration &amp; RBAC roles</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature">99.99% uptime guarantee SLA</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="pricing-card-feature">Dedicated Customer Success Manager</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Comprehensive Feature Comparison Matrix matching the tall table in Screenshot */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center mb-8">
          <h2 className="pricing-title text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Compare all plan features
          </h2>
          <p className="pricing-subtitle text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Detailed breakdown of capabilities, quotas, and analytics across all PicoLink tiers.
          </p>
        </div>

        {/* Feature Comparison Table */}
        <div className="pricing-table overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-md">
          <table className="w-full text-left border-collapse min-w-[700px]">
            {/* Sticky Table Header */}
            <thead>
              <tr className="pricing-table-header border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
                <th className="py-5 px-6 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 w-2/5">
                  Plan Features
                </th>
                <th className="py-5 px-4 text-center w-[15%]">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">Core</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                    {coreTablePrice}
                  </div>
                  <button
                    onClick={() => handlePlanSelect("Core")}
                    className="mt-2 text-[11px] font-bold px-3 py-1 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                  >
                    Select
                  </button>
                </th>
                <th className="pricing-table-growth-col py-5 px-4 text-center w-[15%] bg-blue-50/50 dark:bg-blue-950/20 border-x border-blue-200/60 dark:border-blue-900/40">
                  <div className="inline-block px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider mb-1">
                    Popular
                  </div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">Growth</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                    {growthTablePrice}
                  </div>
                  <button
                    onClick={() => handlePlanSelect("Growth")}
                    className="mt-2 text-[11px] font-bold px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
                  >
                    Select
                  </button>
                </th>
                <th className="py-5 px-4 text-center w-[15%]">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">Premium</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                    {premiumTablePrice}
                  </div>
                  <button
                    onClick={() => handlePlanSelect("Premium")}
                    className="mt-2 text-[11px] font-bold px-3 py-1 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                  >
                    Select
                  </button>
                </th>
                <th className="py-5 px-4 text-center w-[15%]">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">Enterprise</div>
                  <div className="text-xs text-slate-500 font-bold mt-0.5">Custom</div>
                  <button
                    onClick={() => handlePlanSelect("Enterprise")}
                    className="mt-2 text-[11px] font-bold px-3 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition"
                  >
                    Talk to Sales
                  </button>
                </th>
              </tr>
            </thead>

            {/* Categorized Rows matching Screenshot */}
            <tbody>
              {featureCategories.map((category) => {
                const isCollapsed = collapsedCategories[category.id];
                return (
                  <React.Fragment key={category.id}>
                    {/* Category Header Row */}
                    <tr
                      onClick={() => toggleCategory(category.id)}
                      className="pricing-category-row cursor-pointer bg-slate-100/70 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 border-t border-b border-slate-200 dark:border-slate-800 transition"
                    >
                      <td
                        colSpan={5}
                        className="py-3 px-6 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span>{category.title}</span>
                            <span className="text-[10px] font-normal text-slate-500 normal-case">
                              ({category.features.length} features)
                            </span>
                          </span>
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Features within Category */}
                    {!isCollapsed &&
                      category.features.map((feature, idx) => (
                        <tr
                          key={feature.name}
                          className={`border-b border-slate-100 dark:border-slate-800/60 transition ${
                            idx % 2 === 0
                              ? "pricing-feature-row bg-white dark:bg-slate-900/60"
                              : "pricing-feature-row-alt bg-slate-50/50 dark:bg-slate-900/90"
                          } hover:bg-blue-50/30 dark:hover:bg-blue-950/20`}
                        >
                          <td className="py-3.5 px-6 text-xs font-semibold text-slate-900 dark:text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span>{feature.name}</span>
                              {feature.tooltip && (
                                <span
                                  title={feature.tooltip}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help"
                                >
                                  <HelpCircle className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {renderCell(feature.core)}
                          </td>
                          <td className="pricing-table-growth-col py-3.5 px-4 text-center bg-blue-50/30 dark:bg-blue-950/15 border-x border-blue-100 dark:border-blue-900/30">
                            {renderCell(feature.growth)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {renderCell(feature.premium)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {renderCell(feature.enterprise)}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Call to Action Banner */}
        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-center shadow-xl space-y-4">
          <h3 className="text-2xl font-black tracking-tight">
            Ready to supercharge your links and audience engagement?
          </h3>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto">
            Join thousands of marketers, brands, and creators using PicoLink to drive more clicks and analyze performance.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handlePlanSelect("Growth")}
              className="px-6 py-3 rounded-xl bg-white text-blue-600 font-extrabold text-xs shadow-lg hover:bg-slate-50 transition transform hover:-translate-y-0.5"
            >
              Get Started with Growth
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/20"
            >
              Back to Campaigns
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
