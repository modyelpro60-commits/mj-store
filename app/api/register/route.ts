import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { consumeVerification, isEmailVerified, normalizeEmail } from "../../lib/email/otp";

/* ─── POST /api/register ─────────────────────────────────────────────────────
 * Creates an account ONLY after the email has been verified (OTP).
 * body: { name, email, password }
 * ─────────────────────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  const raw = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    password?: string;
  };

  const name = (raw.name ?? "").trim();
  const email = normalizeEmail(raw.email ?? "");
  const password = String(raw.password ?? "");

  if (!name) return NextResponse.json({ success: false, error: "الاسم مطلوب" }, { status: 400 });
  if (!email) return NextResponse.json({ success: false, error: "إيميل غير صحيح" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ success: false, error: "كلمة السر لازم 6 أحرف على الأقل" }, { status: 400 });

  // The email MUST be verified (OTP) before we create the account.
  const verified = await isEmailVerified(email);
  if (!verified) {
    return NextResponse.json({ success: false, error: "لازم تأكّد الإيميل بالكود الأول" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (createErr || !created?.user) {
    const msg = createErr?.message ?? "";
    if (/already|exists|registered/i.test(msg)) {
      return NextResponse.json({ success: false, error: "الإيميل ده مسجّل بالفعل" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: msg || "تعذّر إنشاء الحساب" }, { status: 500 });
  }

  const userId = created.user.id;

  // The DB trigger creates the profile row; fill in the name.
  await supabase.from("profiles").update({ full_name: name }).eq("id", userId);

  await consumeVerification(email);

  return NextResponse.json({ success: true });
}
