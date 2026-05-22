# دليل الإعداد - نظام قاعات الاجتماعات

## المتطلبات
- Node.js 18+ (حمّله من: https://nodejs.org)
- حساب Google Workspace مع صلاحية Admin

---

## الخطوة 1: تثبيت المتطلبات

```bash
cd meeting-rooms-dashboard
npm install
```

---

## الخطوة 2: إعداد Google Cloud

### أ) إنشاء مشروع Google Cloud
1. اذهب إلى https://console.cloud.google.com
2. أنشئ مشروعاً جديداً
3. فعّل **Google Calendar API**:  
   APIs & Services → Enable APIs → ابحث عن "Google Calendar API" → Enable

### ب) إنشاء Service Account
1. IAM & Admin → Service Accounts → Create Service Account
2. أعطه اسماً مثل `meeting-rooms-sa`
3. انقر على الـ Service Account المنشأ → Keys → Add Key → JSON
4. احفظ ملف JSON (ستحتاجه لاحقاً)

### ج) تفعيل Domain-wide Delegation
1. افتح Service Account → Edit → Show Advanced Settings
2. فعّل **Domain-wide delegation** وانسخ الـ Client ID
3. اذهب إلى Google Workspace Admin: https://admin.google.com
4. Security → API Controls → Domain-wide Delegation → Add New
5. Client ID: (ما نسخته)
6. OAuth Scopes:
   ```
   https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events
   ```

### د) إعداد OAuth للمدير
1. في Google Cloud Console: APIs & Services → Credentials → Create OAuth Client ID
2. Application type: Web application
3. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. (للإنتاج أضف: `https://your-domain.com/api/auth/callback/google`)
5. احفظ Client ID و Client Secret

---

## الخطوة 3: إعداد ملف البيئة

انسخ الملف:
```bash
cp .env.local.example .env.local
```

ثم عدّل `.env.local`:

```env
GOOGLE_CLIENT_ID=...          # من الخطوة د
GOOGLE_CLIENT_SECRET=...      # من الخطوة د
GOOGLE_SERVICE_ACCOUNT_EMAIL= # من ملف JSON (client_email)
GOOGLE_PRIVATE_KEY="..."      # من ملف JSON (private_key) - ضعه بين ""
GOOGLE_WORKSPACE_DOMAIN=your-company.com
GOOGLE_ADMIN_EMAIL=admin@your-company.com

NEXTAUTH_SECRET=              # شغّل: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_TIMEZONE=Asia/Riyadh
NEXT_PUBLIC_ORG_NAME=اسم شركتك
```

---

## الخطوة 4: تشغيل المشروع محلياً

```bash
npm run dev
```

افتح: http://localhost:3000

---

## الخطوة 5: إضافة القاعات

1. سجّل دخول بحساب Google Workspace: http://localhost:3000/admin
2. اذهب إلى "القاعات" → "إضافة قاعة"
3. **Calendar ID**: تجده في Google Calendar:
   - افتح التقويم الخاص بالقاعة
   - إعدادات التقويم ← قسم "معرّف التقويم"
   - يبدو هكذا: `room@your-company.com` أو `xxxxxxxx@group.calendar.google.com`

4. أضف PIN لكل قاعة (4-8 أرقام)

---

## الخطوة 6: إعداد التابلت

على كل تابلت:
1. افتح المتصفح واذهب إلى: `https://your-domain.com/room/{room-id}`
2. أدخل PIN القاعة
3. ستظهر شاشة القاعة مع المزامنة التلقائية كل 30 ثانية

**نصيحة**: فعّل Kiosk Mode في المتصفح لمنع الخروج من الشاشة.

---

## النشر على Vercel

```bash
npm install -g vercel
vercel
```

أضف جميع متغيرات البيئة في: Vercel Dashboard → Settings → Environment Variables

### Vercel KV (اختياري - للتخزين الدائم)
1. Vercel Dashboard → Storage → Create KV Database
2. ربطه بمشروعك (يضيف المتغيرات تلقائياً)

---

## روابط مهمة

| الصفحة | الرابط |
|--------|--------|
| لوحة المدير | `/admin` |
| إدارة القاعات | `/admin/rooms` |
| إضافة قاعة | `/admin/rooms/new` |
| شاشة القاعة (التابلت) | `/room/{id}` |
| عرض القاعة بعد PIN | `/room/{id}/display` |
