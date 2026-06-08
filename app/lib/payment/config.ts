/* ════════════════════════════════════════════════════════════════════════════
 *  Manual payment details — EDIT THESE
 *  Vodafone Cash number + InstaPay QR image. The customer transfers manually
 *  then uploads a screenshot in chat for the admin to confirm.
 * ════════════════════════════════════════════════════════════════════════════ */

export const PAYMENT = {
  vodafone: {
    // 👇 حط رقم فودافون كاش بتاعك هنا
    number: "01000000000",
  },
  instapay: {
    // 👇 حط صورة الـ QR في فولدر public/ بنفس الاسم ده (أو غيّر المسار)
    qrImage: "/instapay-qr.png",
    // (اختياري) عنوان إنستا باي بتاعك
    handle: "",
  },
};

export const PAYMENT_METHODS = [
  { id: "vodafone", label: "Vodafone Cash", labelAr: "فودافون كاش" },
  { id: "instapay", label: "InstaPay", labelAr: "إنستا باي" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];
