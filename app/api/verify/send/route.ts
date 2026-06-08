import { NextResponse } from "next/server";
import { normalizeEmail, sendEmailOtp } from "../../../lib/email/otp";

/* POST /api/verify/send  { email } → send an email OTP */
export async function POST(req: Request) {
  const raw = (await req.json().catch(() => ({}))) as { email?: string };
  const email = normalizeEmail(raw.email ?? "");

  if (!email) {
    return NextResponse.json({ success: false, error: "اكتب إيميل صحيح" }, { status: 400 });
  }

  const result = await sendEmailOtp(email);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error ?? "تعذّر الإرسال" }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    testMode: result.testMode,
    devCode: result.devCode ?? null, // present only in test mode (no provider yet)
  });
}
