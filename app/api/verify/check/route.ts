import { NextResponse } from "next/server";
import { checkEmailOtp, normalizeEmail } from "../../../lib/email/otp";

/* POST /api/verify/check  { email, code } → verify the email OTP */
export async function POST(req: Request) {
  const raw = (await req.json().catch(() => ({}))) as { email?: string; code?: string };
  const email = normalizeEmail(raw.email ?? "");
  const code = (raw.code ?? "").trim();

  if (!email) {
    return NextResponse.json({ success: false, error: "إيميل غير صحيح" }, { status: 400 });
  }
  if (!/^\d{4,8}$/.test(code)) {
    return NextResponse.json({ success: false, error: "اكتب الكود" }, { status: 400 });
  }

  const result = await checkEmailOtp(email, code);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error ?? "الكود غير صحيح" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
