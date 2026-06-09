# MJ Store — Handoff Summary
> Date: 2026-06-09 | Based on: current codebase only

---

## ما تم إنجازه ✅

### البنية الأساسية
- Next.js 16 App Router مع TypeScript strict mode
- Supabase (PostgreSQL) كـ database وauth
- 21 migration مطبقة على قاعدة البيانات
- نظام auth كامل (OTP تسجيل + login + status enforcement)
- Role system: admin / moderator / user

### الواجهة الأمامية (Storefront)
- الصفحة الرئيسية مع hero، إحصائيات حية، منتجات مميزة
- صفحة تفاصيل المنتج مع features ومراجعات
- سلة التسوق مع CRUD كامل
- صفحة checkout مع نموذج الدفع
- صفحة الحساب (profile + orders)
- شريط تنقل متكامل (CommandBar) مع cart badge وlanguage picker
- دعم 3 لغات: العربية، الإنجليزية، الفرنسية (~389 مفتاح ترجمة)

### لوحة الإدارة (Admin Panel)
- Dashboard بـ KPIs (منتجات، طلبات، إيرادات، أفضل مبيع)
- إدارة المنتجات (إنشاء، تعديل، حذف، صور، features)
- إدارة الطلبات (تغيير الحالة، حذف)
- إدارة المستخدمين (بحث، تغيير الدور والحالة)
- نظام chat دعم متكامل
- سجل النشاطات (activity logs)

### API
- 30+ endpoint مكتمل يغطي: auth، products، cart، orders، chat، admin
- حماية كاملة (Bearer token + role check + status check)
- audit logging على جميع عمليات الإدارة

### Chat
- غرف chat للعملاء
- واجهة admin للرد
- ربط الدفع بالـ chat room
- badge عدد الرسائل غير المقروءة

---

## ما المتبقي ⏳

### مؤكد غير مكتمل (من الكود)
1. **Payment Integration** — `app/api/checkout/route.ts` هو stub فارغ، لا يوجد Stripe أو أي بوابة دفع حقيقية مربوطة
2. **Phone Verification** — الجدول والحقول موجودة (`phone`, `phone_verified`) لكن لا يوجد API أو UI لإرسال/التحقق من رقم الهاتف
3. **Product Images Upload** — `/api/upload-image` موجود لكن يحتاج التحقق أن Supabase Storage bucket مضبوط ومفعّل

### محتمل ناقص
4. **French Translations (fr.ts)** — الملف مذكور في الكود لكن لم يتأكد اكتماله مقارنة بـ en.ts (389 مفتاح)
5. **Arabic RTL** — RTL مطبق على register page فقط، بقية الصفحات تحتاج مراجعة عند اختيار العربية
6. **Email Templates** — النظام يدعم Resend أو Brevo لكن يعمل بـ "test mode" إذا لم يكن RESEND_API_KEY صالحاً

---

## المشاكل الحالية 🔴

### مؤكدة من الكود
1. **مكتبتان للـ Toast** — `sonner` و`react-hot-toast` كلاهما مثبّت ومستخدم، يسبب عدم تناسق في واجهة الإشعارات
2. **مكوّن MJLogo مكرر** — موجود في `components/branding/MJLogo.tsx` و`components/brand/MJLogo.tsx` معاً
3. **StorefrontNavbar غير مستخدم** — `components/auth/StorefrontNavbar.tsx` موجود لكن CommandBar هو المستخدم الفعلي (ملف قديم)
4. **Payment stub** — `POST /api/checkout` لا ينفذ شيئاً حقيقياً، أي طلب checkout لن يُعالج مالياً

### محتملة
5. **cart_items + orders consistency** — لا يوجد منطق واضح يحذف cart بعد إنشاء الـ order تلقائياً (يحتاج تحقق)
6. **Supabase RLS** — لم يُتحقق من وجود Row Level Security policies على الجداول الحساسة

---

## الخطوة التالية المقترحة 🎯

### أولوية قصوى: Payment Integration
الـ checkout موجود بالكامل (UI + cart + order creation) لكن بوابة الدفع الحقيقية غائبة تماماً. هذا هو الـ blocker الرئيسي قبل أي إطلاق.

**الخيارات**:
- **Stripe** — الأسرع للتكامل، يدعم عملات متعددة
- **PayPal** — أوسع قبولاً في بعض المناطق
- **Manual/Chat-based** — المتجر يدعم `confirm-payment` في الـ chat كـ workaround مؤقت

**المسار المقترح**:
1. ربط Stripe في `app/api/checkout/route.ts`
2. إضافة webhook لتحديث حالة الـ order إلى Completed
3. إرسال email تأكيد للعميل بعد الدفع

### أولوية ثانية: Phone Verification
الجدول والحقول جاهزة، يحتاج فقط:
- API route لإرسال OTP على الهاتف (Twilio أو مزود SMS)
- UI في صفحة الـ checkout أو الـ account

### تنظيف (غير حرج)
- حذف `StorefrontNavbar.tsx` القديم
- دمج ملفات MJLogo المكررة
- توحيد مكتبة الـ Toast (اختر sonner أو react-hot-toast وأزل الآخر)

---

## ملاحظات للمطوّر القادم

- **مصدر الحقيقة للـ auth**: `app/lib/auth/requireAuthContext.ts` — كل API route يمر من هنا
- **إضافة جدول جديد**: أضف migration في `supabase/migrations/` بالتاريخ كاسم ملف
- **ترجمة جديدة**: أضف المفتاح في `lib/i18n/en.ts` + `ar.ts` + `fr.ts` + استخدمه عبر `useLanguage()`
- **حذف product_features**: الكود يتحمل غيابه (graceful degradation) — يمكن إضافة features أو تجاهلها
- **Admin access**: أضف البريد في جدول `admin_allowlist` ليحصل المستخدم على دور admin تلقائياً عند التسجيل
