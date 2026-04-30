# لوحة متابعة أنشطة النظافة — ولاية صفاقس

## نظرة عامة

تطبيق ويب ديناميكي متكامل لتتبع أنشطة النظافة والتدخلات البيئية في بلديات ولاية صفاقس. يجمع بين واجهة رسومية حديثة وقاعدة بيانات موثوقة مع API RESTful كامل.

### المميزات الأساسية

- **لوحة متابعة فورية**: عرض KPIs ورسوم بيانية تفاعلية
- **إدارة البلديات**: تصفية وترتيب الإحصائيات حسب البلدية والتاريخ
- **سجل شامل**: جدول تفصيلي لجميع التدخلات مع البحث والتصفية
- **حفظ دائم**: جميع البيانات محفوظة في قاعدة بيانات (لا يتم حذف البيانات القديمة)
- **إضافة تدخلات**: نموذج مرن لإدراج تدخلات جديدة مع التحقق التلقائي
- **الإحصائيات**: حساب تلقائي للإجماليات والمتوسطات
- **التصدير**: تصدير البيانات بصيغة JSON

## البنية المعمارية

```
project/
├── server.js              # Node.js/Express backend server
├── package.json           # Dependencies configuration
├── public/
│   └── index.html         # Single-page application (SPA)
└── .env                   # Environment variables (Supabase credentials)
```

## المتطلبات

- Node.js v18+
- حساب Supabase (قاعدة بيانات PostgreSQL مجانية)
- متصفح ويب حديث (Chrome, Firefox, Safari)

## الإعداد السريع

### 1. تثبيت الاعتماديات

```bash
npm install
```

### 2. التحقق من متغيرات البيئة

تأكد من أن ملف `.env` يحتوي على بيانات اعتماد Supabase الصحيحة:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
PORT=3000
```

### 3. بناء المشروع

```bash
npm run build
```

### 4. تشغيل الخادم

```bash
node server.js
```

سيعمل التطبيق على `http://localhost:3000`

## هيكل قاعدة البيانات

### جدول interventions

```sql
CREATE TABLE interventions (
  id uuid PRIMARY KEY,
  date date NOT NULL,
  municipalite text NOT NULL,
  quantite_ton decimal(10, 2),
  metre_lineaire integer,
  type_intervention text NOT NULL,
  lieux text NOT NULL,
  ressources_humaines text,
  equipements text,
  created_at timestamptz,
  updated_at timestamptz
);
```

**الأعمدة الرئيسية:**

- `id`: معرف فريد لكل تدخل
- `date`: تاريخ التدخل (يتم تعيينه تلقائياً من تاريخ النظام)
- `municipalite`: اسم البلدية
- `quantite_ton`: الكمية بالطن
- `metre_lineaire`: المتر الخطي المنظف
- `type_intervention`: نوع التدخل
- `lieux`: أماكن التدخل
- `ressources_humaines`: الموارد البشرية المستخدمة
- `equipements`: المعدات المستخدمة

## واجهة API

### الإندبوينتات الرئيسية

#### GET `/api/interventions`
جلب جميع التدخلات مع الفلاتر الاختيارية

**المعاملات:**
- `date`: تصفية حسب التاريخ (YYYY-MM-DD)
- `municipalite`: تصفية حسب البلدية

**مثال:**
```bash
curl http://localhost:3000/api/interventions?date=2026-04-21
```

#### POST `/api/interventions`
إنشاء تدخل جديد

**البدن (JSON):**
```json
{
  "municipalite": "صفاقس",
  "quantite_ton": 170,
  "metre_lineaire": 1000,
  "type_intervention": "كنس يدوي / رفع فضلات",
  "lieux": "شارع البيئة / حي المنتزه",
  "ressources_humaines": "12 عامل",
  "equipements": "شاحنة / جرار"
}
```

#### GET `/api/stats`
الحصول على الإحصائيات الإجمالية

**الرد:**
```json
{
  "totalTonnage": 4500.5,
  "totalLinearMeters": 45000,
  "activeMunicipalities": 23,
  "interventionDays": 8,
  "averageDailyTonnage": 562.5
}
```

#### GET `/api/stats/by-municipality`
الإحصائيات مجمعة حسب البلدية

#### GET `/api/stats/by-date`
الإحصائيات مجمعة حسب التاريخ

## استخدام الواجهة

### لوحة المتابعة
عرض الإحصائيات الرئيسية والرسوم البيانية:
- إجمالي الكميات (طن)
- عدد البلديات النشطة
- المتر الخطي الكلي
- معدل التدخل اليومي

### صفحة البلديات
عرض إحصائيات لكل بلدية:
- ترتيب حسب الكمية أو الاسم
- تصفية حسب التاريخ
- شريط بياني لكل بلدية

### الكميات اليومية
جدول تفصيلي لجميع التدخلات:
- البحث والتصفية حسب التاريخ
- عرض جميع التفاصيل
- إجمالي الكميات اليومية

### إضافة تدخل جديد
نموذج منظم لإدراج تدخل جديد:
1. اختر التاريخ والبلدية
2. أدخل الكميات والمتر الخطي
3. حدد نوع التدخل والأماكن
4. أضف الموارد والمعدات
5. احفظ التدخل

## أمان البيانات

### Row Level Security (RLS)
- المستخدمون المصرح لهم فقط يمكنهم الوصول للبيانات
- جميع الكتابات محمية
- لا يمكن حذف البيانات القديمة

### سلامة البيانات
- لا تُحذف البيانات القديمة أبداً
- كل إضافة تنشئ سجل جديد كامل
- تواريخ الإنشاء والتحديث مدارة تلقائياً

## نشر الإنتاج

### مع Vercel أو Netlify (الواجهة فقط)

1. انسخ ملف `public/index.html`
2. انشر على Vercel/Netlify
3. تأكد من نقطة الاتصال بـ API الخلفية

### مع Heroku (الخادم بالكامل)

```bash
# إنشاء تطبيق Heroku
heroku create your-app-name

# ضبط متغيرات البيئة
heroku config:set VITE_SUPABASE_URL=...
heroku config:set VITE_SUPABASE_ANON_KEY=...

# نشر
git push heroku main
```

## استكشاف الأخطاء

### لا تظهر البيانات
1. تحقق من اتصال الإنترنت
2. تحقق من صحة بيانات Supabase في `.env`
3. افتح وحدة تحكم المتصفح (F12) للتحقق من الأخطاء

### الخادم لا يستجيب
```bash
# تحقق من أن الخادم يعمل
curl http://localhost:3000/api/health
```

### خطأ في حفظ البيانات
- تحقق من قيم نموذج الإدراج
- تأكد من أن الكمية > 0
- تحقق من أن جميع الحقول المطلوبة ممتلئة

## الملفات الرئيسية

| الملف | الوصف |
|------|-------|
| `server.js` | خادم Express مع مسارات API |
| `public/index.html` | تطبيق الويب الرئيسي (SPA) |
| `package.json` | تكوين المشروع والاعتماديات |
| `.env` | متغيرات البيئة السرية |

## الاعتماديات

- **express**: إطار عمل ويب Node.js
- **@supabase/supabase-js**: عميل Supabase
- **cors**: معالجة طلبات CORS
- **dotenv**: تحميل متغيرات البيئة
- **chart.js**: مكتبة الرسوم البيانية (في الواجهة)

## الترخيص

مشروع حكومي - جميع الحقوق محفوظة لولاية صفاقس

## الدعم

للمساعدة أو الإبلاغ عن مشاكل، تواصل مع:
- فريق البرمجة بالبلديات
- قسم تكنولوجيا المعلومات
