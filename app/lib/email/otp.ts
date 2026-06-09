import { createClient } from "@supabase/supabase-js";

/* ════════════════════════════════════════════════════════════════════════════
 *  Email OTP — free verification code by email.
 *
 *  Providers (pick whichever you set up — both have free tiers):
 *    • Resend  → RESEND_API_KEY   (+ EMAIL_FROM on a verified domain)
 *    • Brevo   → BREVO_API_KEY    (+ EMAIL_FROM = a verified sender email)
 *
 *  Test mode (no provider configured): the 6-digit code is returned to the
 *  client and shown on screen, so the whole flow works before you connect a
 *  provider.
 * ════════════════════════════════════════════════════════════════════════════ */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "MJ Store <onboarding@resend.dev>";

export const emailConfigured = Boolean(RESEND_API_KEY || BREVO_API_KEY);

const OTP_TTL_MS = 10 * 60 * 1000; // 10 min
const VERIFIED_FRESH_MS = 20 * 60 * 1000; // verified flag valid 20 min

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export function normalizeEmail(input: string): string | null {
  const e = (input ?? "").trim().toLowerCase();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return e;
  return null;
}

function parseFrom(from: string): { email: string; name: string } {
  const m = from.match(/^(.*?)\s*<(.+?)>$/);
  if (m) return { name: m[1].trim() || "MJ Store", email: m[2].trim() };
  return { name: "MJ Store", email: from.trim() };
}

async function upsert(identifier: string, fields: { verified?: boolean; code?: string | null }) {
  const supabase = svc();
  const patch: Record<string, unknown> = { identifier, updated_at: new Date().toISOString() };
  if (fields.code !== undefined) patch.code = fields.code;
  if (fields.verified !== undefined) patch.verified = fields.verified;
  if (fields.verified === false) {
    patch.expires_at = new Date(Date.now() + OTP_TTL_MS).toISOString();
    patch.attempts = 0;
  }
  await supabase.from("otp_verifications").upsert(patch, { onConflict: "identifier" });
}

function otpEmailHtml(code: string) {
  return `
  <div style="background:#0A0A14;padding:32px;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:440px;margin:auto;background:#0F0F22;border:1px solid #2A2A45;border-radius:18px;padding:32px;text-align:center">
      <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:2px">MJ <span style="color:#c084fc">STORE</span></div>
      <p style="color:#9aa;margin:18px 0 6px">كود التحقق الخاص بك</p>
      <div style="font-size:38px;font-weight:900;letter-spacing:10px;color:#fff;background:linear-gradient(135deg,#7c3aed,#c026d3);padding:14px;border-radius:14px;margin:8px 0">${code}</div>
      <p style="color:#778;font-size:12px;margin-top:18px">الكود صالح لمدة 10 دقائق. لو مش إنت اللي طلبته، تجاهل الرسالة.</p>
    </div>
  </div>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    if (RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
      });
      if (!res.ok) {
        // Server-side only — never exposed to the client.
        console.error("[email/otp] Resend send failed:", res.status, await res.text().catch(() => ""));
      }
      return res.ok;
    }
    if (BREVO_API_KEY) {
      const sender = parseFrom(EMAIL_FROM);
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html }),
      });
      if (!res.ok) {
        console.error("[email/otp] Brevo send failed:", res.status, await res.text().catch(() => ""));
      }
      return res.ok;
    }
  } catch (err) {
    console.error("[email/otp] send error:", err instanceof Error ? err.message : err);
    return false;
  }
  return false;
}

/* ─── Send OTP ─────────────────────────────────────────────────────────────── */
export async function sendEmailOtp(email: string): Promise<{ ok: boolean; error?: string }> {
  // No provider configured → fail (never reveal a code). Configure RESEND_API_KEY
  // (or BREVO_API_KEY) + EMAIL_FROM to send real verification emails.
  if (!emailConfigured) {
    console.error("[email/otp] No email provider configured — set RESEND_API_KEY (or BREVO_API_KEY) + EMAIL_FROM.");
    return { ok: false, error: "خدمة إرسال الإيميل غير متاحة حالياً، حاول لاحقاً" };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await upsert(email, { verified: false, code });

  const ok = await sendEmail(email, "كود التحقق - MJ Store", otpEmailHtml(code));
  if (!ok) return { ok: false, error: "تعذّر إرسال الإيميل، تأكد من بريدك وحاول مجدداً" };
  return { ok: true };
}

/* ─── Check OTP ────────────────────────────────────────────────────────────── */
export async function checkEmailOtp(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = svc();
  const { data: row } = await supabase
    .from("otp_verifications")
    .select("code, expires_at, attempts")
    .eq("identifier", email)
    .maybeSingle();

  if (!row) return { ok: false, error: "اطلب كود جديد" };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "انتهت صلاحية الكود، اطلب كود جديد" };
  }
  if ((row.attempts ?? 0) > 6) return { ok: false, error: "محاولات كتير، اطلب كود جديد" };
  if (row.code !== code) {
    await supabase
      .from("otp_verifications")
      .update({ attempts: (row.attempts ?? 0) + 1 })
      .eq("identifier", email);
    return { ok: false, error: "الكود غير صحيح" };
  }
  await upsert(email, { verified: true });
  return { ok: true };
}

export async function isEmailVerified(email: string): Promise<boolean> {
  const supabase = svc();
  const { data } = await supabase
    .from("otp_verifications")
    .select("verified, updated_at")
    .eq("identifier", email)
    .maybeSingle();
  if (!data || !data.verified) return false;
  if (data.updated_at && Date.now() - new Date(data.updated_at).getTime() > VERIFIED_FRESH_MS) return false;
  return true;
}

export async function consumeVerification(email: string) {
  const supabase = svc();
  await supabase.from("otp_verifications").delete().eq("identifier", email);
}
