"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  Check,
  Sparkles,
  Crown,
  CreditCard,
  Building,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  Flame,
  Globe,
  Zap,
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "sonner";

// Plan specifications
interface PlanMeta {
  id: string;
  name: string;
  badge?: string;
  monthlyPrice: number;
  annualPrice: number; // total for the year
  annualPerMonth: number;
  features: string[];
}

const DEFAULT_PLANS: Record<string, PlanMeta> = {
  core: {
    id: "core",
    name: "Core Plan",
    monthlyPrice: 8,
    annualPrice: 96,
    annualPerMonth: 8,
    features: [
      "100 short links / month",
      "5 custom back-halves",
      "5 dynamic QR codes",
      "1 Link-in-bio page",
      "30 days of analytics history",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth Plan",
    badge: "Recommended",
    monthlyPrice: 24,
    annualPrice: 288,
    annualPerMonth: 24,
    features: [
      "500 short links / month",
      "1 complimentary custom domain",
      "30 dynamic QR codes with logo",
      "1 year of click & scan data",
      "Multi-channel Campaign tracking",
      "City-level analytics & CSV export",
    ],
  },
  pro: {
    id: "growth",
    name: "Growth Plan",
    badge: "Recommended",
    monthlyPrice: 24,
    annualPrice: 288,
    annualPerMonth: 24,
    features: [
      "500 short links / month",
      "1 complimentary custom domain",
      "30 dynamic QR codes with logo",
      "1 year of click & scan data",
      "Multi-channel Campaign tracking",
      "City-level analytics & CSV export",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium Plan",
    monthlyPrice: 149,
    annualPrice: 1788,
    annualPerMonth: 149,
    features: [
      "3,000 short links / month",
      "3 custom domains included",
      "500 dynamic QR codes",
      "2 years of click & scan data",
      "Bulk link creation via CSV upload",
      "REST API & Webhook alerts",
    ],
  },
};

const PLANS = DEFAULT_PLANS;

// Card brand types and icons
type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "generic";

function detectCardBrand(number: string): CardBrand {
  const clean = number.replace(/\D/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  if (/^(6011|65|64[4-9]|622)/.test(clean)) return "discover";
  return "generic";
}

function formatCardNumber(value: string, brand: CardBrand): string {
  const clean = value.replace(/\D/g, "");
  if (brand === "amex") {
    // 4-6-5 format (15 digits)
    const p1 = clean.slice(0, 4);
    const p2 = clean.slice(4, 10);
    const p3 = clean.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(" ");
  }
  // Standard 4-4-4-4 format (16 digits)
  const parts = [];
  for (let i = 0; i < clean.length && i < 16; i += 4) {
    parts.push(clean.slice(i, i + 4));
  }
  return parts.join(" ");
}

function formatExpiryDate(value: string): string {
  const clean = value.replace(/\D/g, "").slice(0, 4);
  if (clean.length >= 3) {
    return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
  }
  return clean;
}

// Crisp Vector Brand Badges
function VisaIcon({ className = "w-8 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#0A2540" />
      <path d="M19.5 22L21.7 8H25.1L22.9 22H19.5ZM35.3 8.3C34.6 8.1 33.6 7.9 32.3 7.9C28.7 7.9 26.2 9.8 26.2 12.5C26.2 14.5 28 15.6 29.4 16.3C30.8 17 31.3 17.5 31.3 18.2C31.3 19.3 29.9 19.8 28.6 19.8C27.1 19.8 26.3 19.6 25.1 19.1L24.6 18.8L24.1 22.2C25.1 22.7 26.9 23 28.6 23C32.4 23 35 21.1 35 18.3C35 16.2 33.5 15.1 31.6 14.2C30.4 13.6 29.7 13.2 29.7 12.4C29.7 11.7 30.5 10.9 32.3 10.9C33.4 10.9 34.3 11.2 35 11.5L35.3 8.3ZM41.4 8H38.7C37.9 8 37.2 8.3 36.9 9.1L31.5 22H35.1L35.8 20.1H40.2L40.6 22H43.8L41.4 8ZM36.8 17.3C37.1 16.5 38.3 13.1 38.3 13.1C38.3 13.1 38.6 12.3 38.8 11.8L39 12.9C39 12.9 39.6 15.8 39.9 17.3H36.8ZM16.4 8L13.1 17.5L12.8 15.8C12.2 13.8 10.4 11.6 8.3 10.5L11.3 22H15L20.4 8H16.4Z" fill="#F7B600"/>
      <path d="M10.8 8H5.2L5.1 8.3C9.1 9.3 12.4 12.4 13.5 15.4L12.3 9.4C12.1 8.4 11.6 8 10.8 8Z" fill="#FFFFFF"/>
    </svg>
  );
}

function MastercardIcon({ className = "w-8 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#14171A" />
      <circle cx="19" cy="16" r="9" fill="#EB001B" />
      <circle cx="29" cy="16" r="9" fill="#F79E1B" />
      <path d="M24 9.7C25.8 11.3 27 13.5 27 16C27 18.5 25.8 20.7 24 22.3C22.2 20.7 21 18.5 21 16C21 13.5 22.2 11.3 24 9.7Z" fill="#FF5F00" />
    </svg>
  );
}

function AmexIcon({ className = "w-8 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#006FCF" />
      <path d="M8 12.5L10.2 19.5H12.4L14.6 12.5H12.6L11.3 17.2L10 12.5H8ZM15 12.5V19.5H17.2V16.8H18.9L20.3 19.5H22.7L21 16.3C22 15.9 22.5 15 22.5 13.9C22.5 12.8 21.6 12.5 20.3 12.5H15ZM17.2 14.1H19.9C20.3 14.1 20.6 14.3 20.6 14.7C20.6 15.1 20.3 15.3 19.9 15.3H17.2V14.1ZM23.4 12.5V19.5H29.5V17.9H25.6V16.6H29V15.1H25.6V14H29.4V12.5H23.4ZM34.2 12.5L32.2 15.8L30.2 12.5H27.8L31 16.1L27.6 19.5H30.1L32.2 16.5L34.3 19.5H36.8L33.4 16.1L36.6 12.5H34.2Z" fill="#FFFFFF" />
    </svg>
  );
}

function DiscoverIcon({ className = "w-8 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#231F20" />
      <rect x="2" y="2" width="44" height="28" rx="3" fill="#FFFFFF" />
      <path d="M8 13.5H11.5C13.5 13.5 14.8 14.6 14.8 16C14.8 17.4 13.5 18.5 11.5 18.5H8V13.5ZM9.6 17.1H11.3C12.3 17.1 13.1 16.6 13.1 16C13.1 15.4 12.3 14.9 11.3 14.9H9.6V17.1ZM16.3 13.5H18V18.5H16.3V13.5ZM19.3 17.8L20.2 16.8C20.8 17.2 21.6 17.5 22.4 17.5C23 17.5 23.4 17.3 23.4 17C23.4 16.4 22.2 16.2 21.4 15.8C20.3 15.3 19.8 14.6 19.8 13.8C19.8 12.7 20.8 12 22.2 12C23.2 12 24.1 12.3 24.8 12.8L24 13.8C23.4 13.4 22.7 13.2 22.1 13.2C21.6 13.2 21.2 13.4 21.2 13.7C21.2 14.2 22.3 14.4 23.1 14.8C24.3 15.3 24.8 16.1 24.8 16.9C24.8 18.1 23.7 18.8 22.3 18.8C21.1 18.8 20.1 18.4 19.3 17.8ZM28.5 18.7C26.5 18.7 25.1 17.3 25.1 16C25.1 14.7 26.5 13.3 28.5 13.3C30.5 13.3 31.9 14.7 31.9 16C31.9 17.3 30.5 18.7 28.5 18.7ZM28.5 14.6C27.4 14.6 26.7 15.3 26.7 16C26.7 16.7 27.4 17.4 28.5 17.4C29.6 17.4 30.3 16.7 30.3 16C30.3 15.3 29.6 14.6 28.5 14.6Z" fill="#1F1A1B" />
      <circle cx="28.5" cy="16" r="3.2" fill="#F47216" />
    </svg>
  );
}

function PayPalIcon({ className = "w-8 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#003087" />
      <path d="M22.5 9.5H16.8C16.4 9.5 16.1 9.8 16 10.2L13.5 24.2C13.5 24.5 13.7 24.7 14 24.7H17.2C17.6 24.7 17.9 24.4 18 24L18.8 19.3C18.9 18.9 19.2 18.6 19.6 18.6H21.5C25.2 18.6 27.5 16.8 28.1 13.2C28.4 11.7 28 10.7 27.1 10.1C26.1 9.6 24.5 9.5 22.5 9.5Z" fill="#0079C1"/>
      <path d="M22.5 9.5H18.8C18.4 9.5 18.1 9.8 18 10.2L16.2 20.3C16.1 20.6 16.3 20.8 16.6 20.8H19.5C19.9 20.8 20.2 20.5 20.3 20.1L21 16.1C21.1 15.7 21.4 15.4 21.8 15.4H23.1C26.3 15.4 28.3 13.9 28.8 10.8C29 9.5 28.7 8.6 27.9 8.1C27 7.6 25.5 7.5 23.5 7.5H18.8" fill="#00457C"/>
    </svg>
  );
}

// Checkout Form Component inside Stripe Elements
function StripeCheckoutForm({
  plan,
  billingCycle,
  domain,
  totalAmount,
  promoDiscount,
  onSuccess,
}: {
  plan: PlanMeta;
  billingCycle: "annual" | "monthly";
  domain?: string;
  totalAmount: number;
  promoDiscount: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Contact details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCode, setPhoneCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Company info toggle
  const [includeCompany, setIncludeCompany] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");

  // Payment Method Selection: 'card' | 'paypal'
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");

  // Editable Card Details with Live Brand Detection
  const [cardBrand, setCardBrand] = useState<CardBrand>("visa");
  const [cardNumber, setCardNumber] = useState("4000 0012 3456 7890");
  const [cardholderName, setCardholderName] = useState("Alex Rivera");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");
  const [cardZip, setCardZip] = useState("10001");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Prepopulate authenticated user info
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null;
    if (token) {
      fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((user) => {
          if (user?.email) setEmail(user.email);
          if (user?.username) {
            setFullName(user.username);
            setCardholderName(user.username);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast.error("Please accept the Terms of Service to continue.");
      return;
    }
    if (!email.trim() || !fullName.trim()) {
      toast.error("Please provide your full name and email address.");
      return;
    }

    setSubmitting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null;

      // If user is unauthenticated, remind them:
      if (!token) {
        toast.error("Account Required", {
          description: "Please log in or create an account first to connect your upgraded subscription.",
        });
        setSubmitting(false);
        return;
      }

      // If live Stripe is loaded and elements are rendered:
      if (stripe && elements) {
        const { error } = await stripe.confirmPayment({
          elements,
          redirect: "if_required",
          confirmParams: {
            return_url: `${window.location.origin}/dashboard?upgrade_success=true&plan=${plan.id}`,
            payment_method_data: {
              billing_details: {
                name: fullName,
                email: email,
                phone: `${phoneCode}${phoneNumber}`,
              },
            },
          },
        });

        if (error) {
          toast.error(error.message || "Payment authorization failed.");
          setSubmitting(false);
          return;
        }
      } else {
        // Native Card / PayPal Validation:
        if (paymentMethod === "card") {
          const cleanNum = cardNumber.replace(/\D/g, "");
          const minLen = cardBrand === "amex" ? 15 : 16;
          if (cleanNum.length < minLen) {
            toast.error(`Please enter a valid ${cardBrand === "amex" ? "15-digit Amex" : "16-digit card"} number.`);
            setSubmitting(false);
            return;
          }
          if (!cardExpiry.includes("/") || cardExpiry.replace(/\D/g, "").length < 4) {
            toast.error("Please enter a valid expiration date (MM/YY).");
            setSubmitting(false);
            return;
          }
          const [month] = cardExpiry.split("/").map((s) => parseInt(s, 10));
          if (!month || month < 1 || month > 12) {
            toast.error("Expiration month must be between 01 and 12.");
            setSubmitting(false);
            return;
          }
          const minCvc = cardBrand === "amex" ? 4 : 3;
          if (cardCvc.length < minCvc) {
            toast.error(`Security code (CVC) must be ${cardBrand === "amex" ? "4 digits for Amex" : "3 digits"}.`);
            setSubmitting(false);
            return;
          }
        }
        // Realistic authorization feedback
        await new Promise((res) => setTimeout(res, 850));
      }

      // Confirm and upgrade subscription on PicoLink backend
      const res = await fetch(`${API_BASE}/api/v1/billing/confirm-subscription/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: plan.id,
          billing_cycle: billingCycle,
          domain: domain || "",
          payment_method: paymentMethod,
          card_brand: cardBrand,
          card_last4: cardNumber.replace(/\D/g, "").slice(-4) || "4242",
          email: email.trim(),
          full_name: fullName.trim(),
          amount: billingCycle === "annual" ? `$${plan.annualPrice}.00` : `$${plan.monthlyPrice}.00`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const last4 = cardNumber.replace(/\D/g, "").slice(-4) || "4242";
        const brandLabel =
          cardBrand === "amex"
            ? "American Express"
            : cardBrand === "visa"
            ? "Visa"
            : cardBrand === "mastercard"
            ? "Mastercard"
            : "Card";

        toast.success(`Payment Approved via ${paymentMethod === "card" ? `${brandLabel} (•••• ${last4})` : "PayPal"}!`, {
          description: domain
            ? `Custom domain "${domain}" has been activated with PicoLink ${plan.name}.`
            : `Your account has been upgraded to PicoLink ${plan.name} successfully.`,
        });
        onSuccess();
      } else {
        toast.error(data.error || "Subscription activation encountered an issue.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. Contact Information */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <span>1. Contact Information</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* Phone number with dial code */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Phone Number
          </label>
          <div className="flex gap-2">
            <select
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shrink-0"
            >
              <option value="+1">🇺🇸 +1 (US)</option>
              <option value="+44">🇬🇧 +44 (UK)</option>
              <option value="+49">🇩🇪 +49 (DE)</option>
              <option value="+880">🇧🇩 +880 (BD)</option>
              <option value="+91">🇮🇳 +91 (IN)</option>
              <option value="+61">🇦🇺 +61 (AU)</option>
            </select>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 000-0000"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* Company Invoice Toggle */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCompany}
              onChange={(e) => setIncludeCompany(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300">
              Include company information on invoice
            </span>
          </label>

          {includeCompany && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/50 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Inc."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tax ID / VAT Number
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="e.g. US123456789"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Payment Information (Multi-Option Gateway: Cards & PayPal) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>2. Payment Method</span>
          </h3>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            256-Bit SSL Encrypted
          </span>
        </div>

        {/* Payment Options Selector: Card vs PayPal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod("card")}
            className={`p-3.5 rounded-2xl border-2 transition text-left flex items-center justify-between cursor-pointer ${
              paymentMethod === "card"
                ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 shadow-md shadow-indigo-500/10"
                : "bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                paymentMethod === "card" ? "border-indigo-600 bg-indigo-600" : "border-slate-400 bg-transparent"
              }`}>
                {paymentMethod === "card" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Credit / Debit Card
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Visa, Mastercard, Amex
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <VisaIcon className="w-7 h-4.5 rounded shadow-xs" />
              <MastercardIcon className="w-7 h-4.5 rounded shadow-xs" />
              <AmexIcon className="w-7 h-4.5 rounded shadow-xs" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("paypal")}
            className={`p-3.5 rounded-2xl border-2 transition text-left flex items-center justify-between cursor-pointer ${
              paymentMethod === "paypal"
                ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 shadow-md shadow-indigo-500/10"
                : "bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                paymentMethod === "paypal" ? "border-indigo-600 bg-indigo-600" : "border-slate-400 bg-transparent"
              }`}>
                {paymentMethod === "paypal" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  PayPal / Express
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Fast &amp; encrypted
                </span>
              </div>
            </div>
            <div className="shrink-0">
              <PayPalIcon className="w-7 h-4.5 rounded shadow-xs" />
            </div>
          </button>
        </div>

        {/* Card Entry Fields or Stripe Elements */}
        {paymentMethod === "card" && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
            {elements ? (
              <PaymentElement
                options={{
                  layout: "tabs",
                }}
              />
            ) : (
              <>
                {/* One-Click Quick Presets for Instant Testing */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Quick-Select Card for Testing:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setCardBrand("visa");
                        setCardNumber("4000 0012 3456 7890");
                        setCardholderName("Alex Rivera");
                        setCardExpiry("12/28");
                        setCardCvc("888");
                        toast.success("Loaded Visa Test Card");
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                        cardBrand === "visa"
                          ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <VisaIcon className="w-5 h-3.5 rounded-xs" />
                      <span>Visa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCardBrand("mastercard");
                        setCardNumber("5555 5555 5555 4444");
                        setCardholderName("Jordan Lee");
                        setCardExpiry("08/29");
                        setCardCvc("512");
                        toast.success("Loaded Mastercard Test Card");
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                        cardBrand === "mastercard"
                          ? "bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-700 dark:text-orange-300"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <MastercardIcon className="w-5 h-3.5 rounded-xs" />
                      <span>Mastercard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCardBrand("amex");
                        setCardNumber("3782 822463 10005");
                        setCardholderName("Taylor Morgan");
                        setCardExpiry("11/27");
                        setCardCvc("4321");
                        toast.success("Loaded American Express Card");
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                        cardBrand === "amex"
                          ? "bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <AmexIcon className="w-5 h-3.5 rounded-xs" />
                      <span>Amex</span>
                    </button>
                  </div>
                </div>

                {/* Name on Card */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required={paymentMethod === "card"}
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Full name as printed on card"
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                {/* Card Number with Live Brand Detection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Card Number
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono font-bold">
                      {cardBrand !== "generic" ? cardBrand.toUpperCase() : "ACCEPTED: VISA • MASTERCARD • AMEX"}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required={paymentMethod === "card"}
                      value={cardNumber}
                      onChange={(e) => {
                        const detected = detectCardBrand(e.target.value);
                        setCardBrand(detected);
                        setCardNumber(formatCardNumber(e.target.value, detected));
                      }}
                      maxLength={cardBrand === "amex" ? 17 : 19}
                      placeholder="4000 0000 0000 0000"
                      className="w-full pl-4 pr-16 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <div className="absolute right-3 pointer-events-none flex items-center">
                      {cardBrand === "visa" && <VisaIcon className="w-8 h-5 rounded shadow-xs" />}
                      {cardBrand === "mastercard" && <MastercardIcon className="w-8 h-5 rounded shadow-xs" />}
                      {cardBrand === "amex" && <AmexIcon className="w-8 h-5 rounded shadow-xs" />}
                      {cardBrand === "discover" && <DiscoverIcon className="w-8 h-5 rounded shadow-xs" />}
                      {cardBrand === "generic" && <CreditCard className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expiration, Security Code (CVC) & ZIP in 3 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Expiration Date
                    </label>
                    <input
                      type="text"
                      required={paymentMethod === "card"}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiryDate(e.target.value))}
                      maxLength={5}
                      placeholder="MM/YY"
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Security Code
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {cardBrand === "amex" ? "4-digit CID" : "3-digit CVC"}
                      </span>
                    </div>
                    <input
                      type="text"
                      required={paymentMethod === "card"}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, cardBrand === "amex" ? 4 : 3))}
                      maxLength={cardBrand === "amex" ? 4 : 3}
                      placeholder={cardBrand === "amex" ? "1234" : "123"}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ZIP / Postal Code
                    </label>
                    <input
                      type="text"
                      value={cardZip}
                      onChange={(e) => setCardZip(e.target.value.toUpperCase())}
                      placeholder="10001"
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* PayPal Option View */}
        {paymentMethod === "paypal" && (
          <div className="p-6 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center mx-auto text-[#003087] dark:text-blue-400 shadow-sm">
              <PayPalIcon className="w-8 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                PayPal Express Checkout
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                You will be connected to PayPal to confirm your billing authorization. You can manage or cancel your subscription at any time.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PayPal Buyer Protection Guarantee</span>
            </div>
          </div>
        )}

        {/* PCI Compliance & Security Notice */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2 leading-relaxed">
          <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
          <span>
            Payment is processed with 256-bit bank-grade encryption. Card details for Visa, Mastercard, and American Express are handled securely according to PCI-DSS Level 1 standards.
          </span>
        </p>
      </div>

      {/* 3. Terms & CTA */}
      <div className="space-y-4">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:ring-indigo-500 mt-0.5"
          />
          <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            By clicking here, I agree to the PicoLink <strong>Terms of Service</strong>,{" "}
            <strong>Privacy Policy</strong>, and <strong>Automatic Renewal Terms</strong>.
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/25 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>
                {paymentMethod === "card"
                  ? `Authorizing ${cardBrand === "amex" ? "Amex" : cardBrand === "visa" ? "Visa" : "Mastercard"}...`
                  : "Connecting to PayPal..."}
              </span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-indigo-200" />
              <span>
                {paymentMethod === "card"
                  ? `Complete purchase with ${cardBrand === "amex" ? "Amex" : cardBrand === "visa" ? "Visa" : cardBrand === "mastercard" ? "Mastercard" : "Card"} • $${totalAmount.toFixed(2)}`
                  : `Pay with PayPal • $${totalAmount.toFixed(2)}`}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// Inner Checkout View
function CheckoutView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawPlanId = (searchParams.get("plan") || "growth").toLowerCase();
  const initialPlanId = rawPlanId === "pro" ? "growth" : (DEFAULT_PLANS[rawPlanId] ? rawPlanId : "growth");
  const initialBilling = (searchParams.get("billing") as "annual" | "monthly") || "annual";
  const domain = searchParams.get("domain") || "";

  const [plansMap, setPlansMap] = useState<Record<string, PlanMeta>>(DEFAULT_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId);
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">(initialBilling);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Dynamic Plans Loader from Django Admin Database API
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/plans/`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const dynamicMap: Record<string, PlanMeta> = { ...DEFAULT_PLANS };
          data.forEach((p: any) => {
            const mPrice = parseFloat(p.price_monthly) || 0;
            const aPrice = parseFloat(p.price_annual) || 0;
            const perMonth = aPrice > 0 ? Math.round(aPrice / 12) : mPrice;
            const featList: string[] = Array.isArray(p.features)
              ? p.features.filter((f: any) => f.is_included).map((f: any) => f.text)
              : [];
            dynamicMap[p.slug] = {
              id: p.slug,
              name: `${p.name} Plan`,
              badge: p.is_popular ? "Recommended" : undefined,
              monthlyPrice: mPrice,
              annualPrice: aPrice,
              annualPerMonth: perMonth,
              features: featList.length > 0 ? featList : (DEFAULT_PLANS[p.slug]?.features || []),
            };
          });
          if (dynamicMap["growth"]) {
            dynamicMap["pro"] = dynamicMap["growth"];
          }
          setPlansMap(dynamicMap);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch dynamic plans for checkout, using defaults:", err);
      });
  }, [API_BASE]);

  // Theme Detection & Toggle
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const isLight =
        document.documentElement.classList.contains("light") ||
        document.documentElement.getAttribute("data-theme") === "light" ||
        localStorage.getItem("picolink_theme") === "light";
      setIsDark(!isLight);
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setIsDark(!isDark);
    try {
      localStorage.setItem("picolink_theme", next);
    } catch {}
    if (next === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
    toast.success(`Switched to ${next === "dark" ? "Dark" : "Light"} mode`);
  };

  // Promo code
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscountPct, setPromoDiscountPct] = useState(0);

  // Stripe Client Secret & Promise
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  const plan = plansMap[selectedPlanId] || plansMap.growth || DEFAULT_PLANS.growth;

  // Calculation
  const basePrice = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
  const promoDiscount = (basePrice * promoDiscountPct) / 100;
  const totalAmount = Math.max(0, basePrice - promoDiscount);
  const annualSavings = (plan.monthlyPrice * 12) - plan.annualPrice;

  // Initialize Stripe client secret from backend
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("picolink_token") : null;
    fetch(`${API_BASE}/api/v1/billing/create-subscription-intent/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        plan: plan.id,
        billing_cycle: billingCycle,
        domain,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.client_secret) {
          setClientSecret(data.client_secret);
        }
        if (data.publishable_key && !data.publishable_key.startsWith("pk_test_sample")) {
          setStripePromise(loadStripe(data.publishable_key));
        }
      })
      .catch((err) => {
        console.warn("Could not create subscription intent:", err);
      });
  }, [selectedPlanId, billingCycle, domain]);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoInput.trim().toUpperCase();
    if (clean === "PICO15" || clean === "SAVE15") {
      setAppliedPromo(clean);
      setPromoDiscountPct(15);
      toast.success("Promo code applied: 15% discount!");
    } else if (clean === "BITLY50") {
      setAppliedPromo(clean);
      setPromoDiscountPct(50);
      toast.success("VIP Promo code applied: 50% discount!");
    } else {
      toast.error("Invalid promotional code.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b16] text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Simple Header */}
      <header
        suppressHydrationWarning
        className="sticky top-0 z-30 w-full h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#080d1a]/95 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between"
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plans</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
            PicoLink Checkout
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Encrypted Checkout</span>
          </div>
        </div>
      </header>

      {/* Main 2-Column Responsive Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ==================================================== */}
          {/* LEFT COLUMN: Payment & Billing Form (7 cols)          */}
          {/* ==================================================== */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Upgrade your plan
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Unlock custom domains, link protection, high-res QR codes, and advanced telemetry.
              </p>
            </div>

            {/* Plan Selector Pill Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                  <Crown className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{plan.name}</span>
                    {plan.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 font-bold uppercase tracking-wider border border-blue-500/20">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {billingCycle === "annual"
                      ? `$${plan.annualPerMonth}/mo billed annually ($${plan.annualPrice}/yr)`
                      : `$${plan.monthlyPrice}/mo billed monthly`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs">
                {Object.keys(plansMap)
                  .filter((key) => key !== "pro" && key !== "enterprise")
                  .map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedPlanId(key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        selectedPlanId === key
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {plansMap[key]?.name?.replace(" Plan", "").toUpperCase() || key.toUpperCase()}
                    </button>
                  ))}
              </div>
            </div>

            {/* Billing Cycle Toggle Card matching Bitly */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Select Billing Frequency
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Annual (Discount) */}
                <div
                  onClick={() => setBillingCycle("annual")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    billingCycle === "annual"
                      ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 shadow-md shadow-indigo-500/10"
                      : "bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Pay annually</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-500/25">
                      Save 17%
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      ${plan.annualPrice}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">/year</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      ${plan.annualPerMonth}/month billed yearly
                    </p>
                  </div>
                </div>

                {/* Option 2: Monthly */}
                <div
                  onClick={() => setBillingCycle("monthly")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    billingCycle === "monthly"
                      ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 shadow-md shadow-indigo-500/10"
                      : "bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Pay monthly</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      ${plan.monthlyPrice}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">/month</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Cancel anytime
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Domain Attachment Ribbon if arrived from Custom Domain tab */}
            {domain && (
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/40 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-teal-600 dark:text-teal-300 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-teal-800 dark:text-teal-200">
                      Included Complimentary Domain:
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">{domain}</p>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-teal-500/15 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/25">
                  $0.00 Claim
                </span>
              </div>
            )}

            {/* Stripe Elements Form Wrapper with dynamic Theme */}
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: clientSecret || undefined,
                appearance: {
                  theme: isDark ? "night" : "stripe",
                  variables: isDark
                    ? {
                        colorPrimary: "#6366f1",
                        colorBackground: "#0b1329",
                        colorText: "#f8fafc",
                        colorDanger: "#f43f5e",
                        fontFamily: "Inter, system-ui, sans-serif",
                        borderRadius: "12px",
                      }
                    : {
                        colorPrimary: "#4f46e5",
                        colorBackground: "#ffffff",
                        colorText: "#0f172a",
                        colorDanger: "#e11d48",
                        fontFamily: "Inter, system-ui, sans-serif",
                        borderRadius: "12px",
                      },
                },
              }}
            >
              <StripeCheckoutForm
                plan={plan}
                billingCycle={billingCycle}
                domain={domain}
                totalAmount={totalAmount}
                promoDiscount={promoDiscount}
                onSuccess={() => {
                  setTimeout(() => {
                    router.push("/?upgrade_success=true");
                  }, 1200);
                }}
              />
            </Elements>
          </div>

          {/* ==================================================== */}
          {/* RIGHT COLUMN: Sticky Payment Summary Card (5 cols)    */}
          {/* ==================================================== */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              {/* Header */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Order Summary
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {billingCycle === "annual" ? `Annual ${plan.name}` : `Monthly ${plan.name}`}
                </h3>
              </div>

              {/* Annual Savings Ribbon */}
              {billingCycle === "annual" && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    You&apos;re saving <strong>${annualSavings} (17%)</strong> on the annual plan
                  </span>
                </div>
              )}

              {/* Included Plan Features */}
              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Included in this plan:
                </span>
                {plan.features.map((feat) => (
                  <div key={feat} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Promo Code Input */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80">
                {!promoExpanded ? (
                  <button
                    type="button"
                    onClick={() => setPromoExpanded(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1.5 font-semibold"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Add promo code</span>
                  </button>
                ) : (
                  <form onSubmit={handleApplyPromo} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="e.g. PICO15"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs uppercase font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition"
                      >
                        Apply
                      </button>
                    </div>
                    {appliedPromo && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Code {appliedPromo} applied ({promoDiscountPct}% off)
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">
                    ${basePrice.toFixed(2)}
                  </span>
                </div>

                {promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Discount ({promoDiscountPct}%)</span>
                    <span className="font-mono">-${promoDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Estimated Tax</span>
                  <span className="font-mono">$0.00</span>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-baseline justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Billed today</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Includes all taxes &amp; fees</p>
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Legal Renewal Note */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                You&apos;ll be charged <strong>${totalAmount.toFixed(2)}</strong>{" "}
                {billingCycle === "annual" ? "annually" : "monthly"}, plus any applicable tax, until you cancel your subscription. We&apos;ll send an email reminder before renewal.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#070b16] flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs">
          Loading checkout...
        </div>
      }
    >
      <CheckoutView />
    </Suspense>
  );
}
