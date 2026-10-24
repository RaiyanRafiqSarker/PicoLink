import datetime
import logging
import uuid
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

DEFAULT_SENDER = getattr(settings, "DEFAULT_FROM_EMAIL", "Raktch Mail <raktch@raktch.com>")


def send_subscription_payment_success_email(
    user,
    plan_name: str = "Growth",
    amount: str = None,
    billing_cycle: str = "annual",
    domain: str = None,
    invoice_id: str = None,
    payment_method: str = "Card",
    recipient_email: str = None,
    customer_name: str = None,
) -> bool:
    """
    Dispatches a branded, high-fidelity receipt email to the user upon successful
    subscription purchase or Stripe invoice payment confirmation.
    
    Originates from branded sender: 'Raktch Mail <raktch@raktch.com>'
    """
    try:
        final_recipient = (recipient_email or getattr(user, "email", None) or "").strip()
        if not final_recipient:
            logger.warning("[Email] Cannot dispatch subscription receipt: user has no email address.")
            return False

        resolved_customer_name = (
            (customer_name or "").strip()
            or (user.get_full_name() if hasattr(user, "get_full_name") else None)
            or getattr(user, "username", "")
            or "Valued Customer"
        )

        # Normalize plan display name
        plan_lower = str(plan_name).lower()
        if "prem" in plan_lower:
            display_plan = "Premium Plan"
            default_amount = "$1,788.00" if billing_cycle.lower() == "annual" else "$199.00"
        elif "ent" in plan_lower:
            display_plan = "Enterprise Plan"
            default_amount = "$1,788.00" if billing_cycle.lower() == "annual" else "$199.00"
        else:
            display_plan = "Growth Plan"
            default_amount = "$348.00" if billing_cycle.lower() == "annual" else "$35.00"

        final_amount = amount or default_amount
        cycle_display = "Annual Billing (Billed Yearly)" if billing_cycle.lower() == "annual" else "Monthly Billing"

        if not invoice_id:
            invoice_id = f"INV-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        current_date = datetime.datetime.utcnow().strftime("%B %d, %Y")
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        dashboard_url = f"{frontend_url}/dashboard"
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Raktch Mail <raktch@raktch.com>")

        subject = f"Receipt & Confirmation: Your PicoLink {display_plan} Subscription"

        domain_row = ""
        if domain:
            domain_row = f"""
            <tr>
              <td style="padding: 10px 0; color: #94a3b8; font-size: 14px; border-bottom: 1px solid #334155;">Custom Domain</td>
              <td style="padding: 10px 0; color: #38bdf8; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #334155;">{domain} (Active)</td>
            </tr>
            """

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #0b0f19; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #151d2f; border-radius: 18px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);">
          
          <!-- Gradient Top Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%); padding: 36px 38px; text-align: left;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                      ⚡ PicoLink
                    </div>
                    <div style="font-size: 13px; color: rgba(255, 255, 255, 0.9); margin-top: 5px; font-weight: 500;">
                      Dispatched securely by Raktch Mail
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); color: #ffffff; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Payment Succeeded
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 38px 38px 30px 38px;">
              <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 10px 0;">
                Thank you for your purchase, {resolved_customer_name}!
              </h1>
              <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 28px 0;">
                We are thrilled to confirm that your payment for <strong style="color: #f1f5f9;">PicoLink {display_plan}</strong> has been processed successfully. Your high-performance URL shortening and branding features are active right now.
              </p>

              <!-- Receipt Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; border-radius: 14px; border: 1px solid #1e293b; margin-bottom: 28px; padding: 22px;">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px;">
                      Payment Receipt &amp; Summary
                    </div>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px; border-bottom: 1px solid #1e293b;">Subscription Tier</td>
                        <td style="padding: 8px 0; color: #f8fafc; font-size: 14px; font-weight: 700; text-align: right; border-bottom: 1px solid #1e293b;">{display_plan}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px; border-bottom: 1px solid #1e293b;">Billing Cadence</td>
                        <td style="padding: 8px 0; color: #f8fafc; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #1e293b;">{cycle_display}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px; border-bottom: 1px solid #1e293b;">Invoice Reference</td>
                        <td style="padding: 8px 0; color: #cbd5e1; font-family: monospace; font-size: 13px; text-align: right; border-bottom: 1px solid #1e293b;">{invoice_id}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px; border-bottom: 1px solid #1e293b;">Payment Date</td>
                        <td style="padding: 8px 0; color: #f8fafc; font-size: 14px; text-align: right; border-bottom: 1px solid #1e293b;">{current_date}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px; border-bottom: 1px solid #1e293b;">Payment Method</td>
                        <td style="padding: 8px 0; color: #f8fafc; font-size: 14px; text-align: right; border-bottom: 1px solid #1e293b;">{payment_method}</td>
                      </tr>
                      {domain_row}
                      <tr>
                        <td style="padding: 16px 0 0 0; color: #f8fafc; font-size: 16px; font-weight: 700;">Total Paid</td>
                        <td style="padding: 16px 0 0 0; color: #10b981; font-size: 20px; font-weight: 800; text-align: right;">{final_amount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Unlocked Features Highlights -->
              <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #6366f1;">
                <div style="font-size: 14px; font-weight: 700; color: #f8fafc; margin-bottom: 10px;">
                  🚀 Included in your subscription:
                </div>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #cbd5e1; line-height: 1.8;">
                  <li>High-speed branded links with sub-millisecond edge redirection</li>
                  <li>Real-time geo-analytics, OS/browser breakdowns, and referrer trends</li>
                  <li>Custom domain routing with zero-configuration automated SSL</li>
                  <li>Multi-member workspaces with granular permission controls</li>
                  <li>Priority technical support and SLA uptime guarantees</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="{dashboard_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 15px 36px; border-radius: 12px; box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4); text-align: center;">
                      Launch PicoLink Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0; line-height: 1.6;">
                Need to manage your subscription or download tax receipts? Visit your account settings anytime in the dashboard.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #1e293b; padding: 24px 38px; background-color: #0b0f19; text-align: center;">
              <p style="font-size: 12px; color: #64748b; margin: 0 0 6px 0; line-height: 1.5;">
                Sent with precision by <strong>Raktch Mail</strong> &bull; <a href="mailto:raktch@raktch.com" style="color: #818cf8; text-decoration: none;">raktch@raktch.com</a>
              </p>
              <p style="font-size: 11px; color: #475569; margin: 0; line-height: 1.5;">
                &copy; {datetime.datetime.utcnow().year} PicoLink Inc. &bull; Enterprise URL Shortener &amp; Link Intelligence Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

        plain_text = f"""
============================================================
PicoLink - Payment Receipt & Subscription Confirmation
============================================================

Thank you for your purchase, {resolved_customer_name}!

Your subscription payment for PicoLink {display_plan} has been confirmed.

------------------------------------------------------------
Receipt Summary:
- Plan: {display_plan}
- Cadence: {cycle_display}
- Total Paid: {final_amount}
- Invoice ID: {invoice_id}
- Date: {current_date}
- Payment Method: {payment_method}
{f"- Custom Domain: {domain}" if domain else ""}
------------------------------------------------------------

What's Unlocked:
* Branded short links with sub-millisecond edge redirection
* Real-time geo-analytics, device breakdowns, and click tracking
* Custom domain management with automated SSL
* Multi-user workspaces and team collaboration
* Priority 24/7 technical support

Access your dashboard here:
{dashboard_url}

Need help or tax invoices? Contact us at raktch@raktch.com

Sent by Raktch Mail (raktch@raktch.com)
(c) {datetime.datetime.utcnow().year} PicoLink Inc.
"""

        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text.strip(),
            from_email=from_email,
            to=[final_recipient],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)

        logger.info(f"[Email] Subscription payment success receipt sent to {final_recipient} (Invoice: {invoice_id})")
        return True

    except Exception as e:
        logger.error(f"[Email] Failed to dispatch subscription payment receipt to {final_recipient}: {e}", exc_info=True)
        return False


def send_workspace_invitation_email(invitation, inviter, workspace, join_url: str) -> bool:
    """
    Sends a beautifully formatted HTML invitation email to the recipient.
    Originates from branded sender: 'Raktch Mail <raktch@raktch.com>'
    Returns True if sent successfully, False otherwise.
    """
    try:
        recipient_email = invitation.email
        inviter_name = (
            (inviter.get_full_name() if hasattr(inviter, "get_full_name") else None)
            or getattr(inviter, "username", "")
            or "A team member"
        )
        workspace_name = workspace.name
        role_label = invitation.role.capitalize()
        expires_days = 7

        subject = f"You've been invited to join {workspace_name} on PicoLink"
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Raktch Mail <raktch@raktch.com>")

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #0b0f19; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #151d2f; border-radius: 18px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%); padding: 34px 38px; text-align: left;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      ⚡ PicoLink
                    </div>
                    <div style="font-size: 13px; color: rgba(255, 255, 255, 0.85); margin-top: 4px; font-weight: 500;">
                      Dispatched securely by Raktch Mail
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); color: #ffffff; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 9999px;">
                      Workspace Invite
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0; line-height: 1.4;">
                Join <span style="color: #818cf8;">{workspace_name}</span> on PicoLink
              </h1>
              
              <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 24px 0;">
                <strong style="color: #f1f5f9;">{inviter_name}</strong> has invited you to collaborate in the 
                <strong style="color: #f1f5f9;">{workspace_name}</strong> workspace with 
                <strong style="color: #38bdf8;">{role_label}</strong> permissions.
              </p>

              <!-- Workspace Details Callout -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; border-radius: 12px; border: 1px solid #1e293b; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 6px;">Workspace</td>
                        <td style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 6px; text-align: right;">Assigned Role</td>
                      </tr>
                      <tr>
                        <td style="font-size: 15px; color: #f8fafc; font-weight: 700;">{workspace_name}</td>
                        <td style="font-size: 14px; color: #38bdf8; font-weight: 700; text-align: right;">{role_label}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="{join_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 34px; border-radius: 12px; box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35); text-align: center;">
                      Accept Invitation &amp; Join Workspace &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct Link -->
              <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0 0 16px 0; word-break: break-all;">
                Or copy and paste this URL into your browser:<br>
                <a href="{join_url}" style="color: #818cf8; text-decoration: underline;">{join_url}</a>
              </p>

              <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5;">
                ⏰ This invitation link is valid for {expires_days} days.
              </p>
            </td>
          </tr>

          <!-- Footer Divider -->
          <tr>
            <td style="border-top: 1px solid #1e293b; padding: 22px 36px; background-color: #0b0f19; text-align: center;">
              <p style="font-size: 12px; color: #64748b; margin: 0 0 4px 0; line-height: 1.5;">
                Sent via <strong>Raktch Mail</strong> &bull; <a href="mailto:raktch@raktch.com" style="color: #818cf8; text-decoration: none;">raktch@raktch.com</a>
              </p>
              <p style="font-size: 11px; color: #475569; margin: 0; line-height: 1.5;">
                If you were not expecting this invitation, you can safely ignore this email.<br>
                &copy; {datetime.datetime.utcnow().year} PicoLink Inc. &bull; Enterprise URL Shortener &amp; Analytics
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
        plain_text = (
            f"You've been invited to join {workspace_name} on PicoLink\n\n"
            f"{inviter_name} has invited you to collaborate in {workspace_name} as a {role_label}.\n\n"
            f"To accept this invitation, open the link below in your browser:\n"
            f"{join_url}\n\n"
            f"This link will expire in {expires_days} days.\n"
            f"If you did not expect this invitation, you can ignore this email.\n\n"
            f"Sent via Raktch Mail (raktch@raktch.com)"
        )

        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text,
            from_email=from_email,
            to=[recipient_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)

        logger.info(f"[Email] Workspace invitation successfully dispatched to {recipient_email} from {from_email}")
        return True
    except Exception as e:
        logger.error(f"[Email] Failed to send workspace invitation email to {invitation.email}: {e}", exc_info=True)
        return False
