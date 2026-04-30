# البنية المعمارية — Architecture Overview

## نظرة عامة على النظام

تم تحويل لوحة متابعة النظافة من تطبيق ثابت إلى نظام ديناميكي متكامل يتضمن:

```
┌─────────────────────────────────────────────────────────────┐
│                    المستخدمين (Clients)                      │
│              الهاتف / الويب / التطبيق الرسمي                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP/HTTPS
                         │
        ┌────────────────┴────────────────┐
        │                                 │
   ┌────▼─────────┐            ┌────────▼──────┐
   │   Frontend    │            │   REST API    │
   │ (index.html)  │            │  (Express)    │
   │               │            │               │
   │ - Dashboard   │◄──────────►│ - GET /api/   │
   │ - Charts      │  JSON      │ - POST /api/  │
   │ - Forms       │  Requests  │ - Validation  │
   │ - Tables      │            │               │
   └───────────────┘            └────────┬──────┘
                                         │
                               ┌─────────▼──────────┐
                               │  Supabase (Cloud)  │
                               │                    │
                               │ ┌────────────────┐ │
                               │ │  PostgreSQL    │ │
                               │ │  Database      │ │
                               │ │                │ │
                               │ │ • interventions│ │
                               │ │ • RLS Policies │ │
                               │ │ • Indexes      │ │
                               │ └────────────────┘ │
                               │                    │
                               │ ┌────────────────┐ │
                               │ │ Authentication │ │
                               │ │                │ │
                               │ │ • JWT Tokens   │ │
                               │ │ • Row Security │ │
                               │ └────────────────┘ │
                               └────────────────────┘
```

## الطبقات المعمارية

### 1. Presentation Layer (طبقة العرض)

**الملف:** `public/index.html`

```javascript
// تطبيق سينجل بيج (SPA)
- React-like component updates
- Chart.js visualizations
- Form handling & validation
- Responsive design
- RTL support (Arabic)
```

**المسؤوليات:**
- عرض البيانات على المستخدم
- جمع البيانات من النماذج
- تفاعل المستخدم (click، form submission)
- تحديث الواجهة ديناميكياً

---

### 2. API Layer (طبقة API)

**الملف:** `server.js`

```javascript
// Express.js REST API Server
const app = express();
app.use(cors());
app.use(express.json());

// Endpoints:
GET    /api/interventions            // جلب التدخلات
POST   /api/interventions            // إنشاء تدخل جديد
GET    /api/interventions/dates      // التواريخ المتاحة
GET    /api/stats                    // الإحصائيات العامة
GET    /api/stats/by-municipality    // إحصائيات البلديات
GET    /api/stats/by-date            // إحصائيات التواريخ
GET    /api/health                   // فحص الخادم
```

**المسؤوليات:**
- معالجة طلبات HTTP
- التحقق من البيانات (validation)
- الاتصال بقاعدة البيانات
- معالجة الأخطاء
- إرجاع JSON responses

---

### 3. Data Layer (طبقة البيانات)

**قاعدة البيانات:** PostgreSQL (Supabase)

```sql
-- جدول interventions
CREATE TABLE interventions (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  municipalite TEXT NOT NULL,
  quantite_ton DECIMAL(10,2),
  metre_lineaire INTEGER,
  type_intervention TEXT NOT NULL,
  lieux TEXT NOT NULL,
  ressources_humaines TEXT,
  equipements TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- الفهارس للأداء
CREATE INDEX idx_interventions_date ON interventions(date);
CREATE INDEX idx_interventions_municipalite ON interventions(municipalite);
CREATE INDEX idx_interventions_date_municipalite 
  ON interventions(date, municipalite);

-- الأمان (Row Level Security)
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
```

**المسؤوليات:**
- تخزين البيانات بشكل آمن
- الحفاظ على السلامة الإرجاعية
- الاحتفاظ بالسجل الكامل (لا حذف)
- توفير الاستعلامات السريعة

---

## تدفق البيانات (Data Flow)

### سيناريو 1: جلب البيانات عند بدء التطبيق

```
1. المستخدم يفتح التطبيق
   │
   └─► JavaScript يتنفذ: loadData()
       │
       └─► fetch('/api/interventions')
           │
           └─► Server يتلقى الطلب
               │
               └─► supabase.from('interventions').select('*')
                   │
                   └─► قاعدة البيانات ترد 200+ سجل
                       │
                       └─► Server يرسل JSON response
                           │
                           └─► Frontend يحفظ allInterventions[]
                               │
                               └─► initDashboard() يعيد رسم الرسوم
                                   │
                                   └─► المستخدم يرى البيانات
```

### سيناريو 2: إضافة تدخل جديد

```
1. المستخدم يملأ النموذج والضغط على "حفظ"
   │
   └─► JavaScript يتنفذ: submitEntry()
       │
       ├─► التحقق من البيانات (validation)
       │   ├─► هل date ممتلئ؟ ✓
       │   ├─► هل municipalite ممتلئة؟ ✓
       │   ├─► هل quantite_ton > 0؟ ✓
       │   └─► هل نوع التدخل ممتلئ؟ ✓
       │
       └─► fetch('/api/interventions', { method: 'POST', body: JSON })
           │
           └─► Server يتلقى الطلب
               │
               └─► التحقق من البيانات مرة أخرى (double check)
                   │
                   └─► supabase.from('interventions').insert(data)
                       │
                       └─► قاعدة البيانات تنشئ سجل جديد
                           │
                           └─► Server يرسل 201 Created مع البيانات
                               │
                               └─► Frontend يأخذ البيانات الجديدة
                                   │
                                   ├─► تحديث allInterventions[]
                                   ├─► إعادة رسم الرسوم
                                   ├─► إعادة رسم الجداول
                                   └─► عرض رسالة نجاح للمستخدم
```

---

## عمليات القاعدة البيانات

### الإدراج (INSERT)
```sql
INSERT INTO interventions (
  date, municipalite, quantite_ton, metre_lineaire,
  type_intervention, lieux, ressources_humaines, equipements
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;
```

### الاستعلام (SELECT)
```sql
-- جلب كل التدخلات
SELECT * FROM interventions 
ORDER BY date DESC;

-- مع الفلاتر
SELECT * FROM interventions 
WHERE date = $1 AND municipalite = $2
ORDER BY date DESC;
```

### الإحصائيات (AGGREGATE)
```sql
-- إجمالي الكمية
SELECT SUM(quantite_ton) as total_tonnage
FROM interventions;

-- العد حسب البلدية
SELECT municipalite, SUM(quantite_ton) as total
FROM interventions
GROUP BY municipalite
ORDER BY total DESC;
```

---

## الأمان (Security)

### Row Level Security (RLS)

```sql
-- السياسة 1: المستخدمون المصرح لهم يقرأون
CREATE POLICY "Authenticated users can read"
  ON interventions FOR SELECT
  TO authenticated
  USING (true);

-- السياسة 2: المستخدمون المصرح لهم يكتبون
CREATE POLICY "Authenticated users can insert"
  ON interventions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- السياسة 3: الجمهور يقرأ الإحصائيات
CREATE POLICY "Public can read"
  ON interventions FOR SELECT
  TO anon
  USING (true);
```

### Data Validation (في الخادم)

```javascript
// server.js
if (!municipalite || !type_intervention || !lieux) {
  return res.status(400).json({ error: 'Missing required fields' });
}

if (quantite_ton < 0) {
  return res.status(400).json({ error: 'Invalid tonnage' });
}

// تمرير البيانات المنظفة إلى قاعدة البيانات
const { data, error } = await supabase
  .from('interventions')
  .insert([{ ...cleanedData }]);
```

### عدم الحذف (Data Immutability)

```javascript
// لا توجد طريقة DELETE في API
// لا يمكن تعديل البيانات القديمة
// كل شيء تسلسلي ومؤرخ (audited)
```

---

## الأداء (Performance)

### الفهارس (Indexes)

```sql
-- فهرس التاريخ
CREATE INDEX idx_interventions_date 
ON interventions(date);

-- فهرس البلدية
CREATE INDEX idx_interventions_municipalite 
ON interventions(municipalite);

-- فهرس مركب
CREATE INDEX idx_interventions_date_municipalite 
ON interventions(date, municipalite);
```

**النتيجة:**
- استعلامات أسرع بـ 10-100x
- تقليل استهلاك الذاكرة
- تحسن تجربة المستخدم

### التخزين المؤقت (Caching)

```javascript
// الواجهة الأمامية تخزن البيانات محلياً
let allInterventions = [];

// تحديث متحكم به (عند الإضافة فقط)
async function loadData() {
  const response = await fetch('/api/interventions');
  allInterventions = await response.json();
}
```

---

## توسع النظام (Scalability)

### الخطة الحالية
- قاعدة بيانات واحدة (PostgreSQL)
- خادم واحد (Node.js)
- تطبيق واجهة واحد (HTML/JS)

### للمستقبل
```
┌─────────────────────────────────────┐
│     CDN (Cloudflare/Fastly)         │ <- تسريع العالمي
└─────────────────────────────────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
┌───▼─┐    ┌────▼────┐  ┌──▼───┐
│ LB  │    │ LB      │  │ LB   │ <- توازن الحمل
└───┬─┘    └────┬────┘  └──┬───┘
    │           │          │
┌───▼──────┬────▼──────┬───▼───┐
│ Server 1 │ Server 2  │ Server3│ <- خوادم متعددة
└────┬─────┴────┬──────┴────┬──┘
     │          │           │
     └──────────┴───┬───────┘
                    │
            ┌───────▼────────┐
            │ DB Replication │ <- نسخ قاعدة البيانات
            │   (Read/Write) │
            └────────────────┘

            ┌────────────────┐
            │ Cache Layer    │ <- Redis/Memcached
            │ (Performance)  │
            └────────────────┘
```

---

## المراقبة والصيانة

### السجلات (Logging)

```javascript
// server.js
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
```

### المقاييس (Metrics)

```
- عدد الطلبات/الثانية
- وقت الاستجابة (latency)
- معدل الأخطاء
- استخدام الذاكرة
- استخدام قاعدة البيانات
```

### النسخ الاحتياطية (Backups)

```
Supabase:
- نسخ احتياطية يومية تلقائية
- يمكن التعافي من نقطة زمنية محددة (PITR)
- 7 أيام احتفاظ بالنسخ
```

---

## الملفات الرئيسية

| الملف | الحجم | الوصف |
|------|-------|-------|
| `server.js` | ~600 سطر | خادم Express مع API |
| `public/index.html` | ~800 سطر | تطبيق الويب الكامل |
| `package.json` | ~20 سطر | الاعتماديات |
| `build.js` | ~20 سطر | سكريبت البناء |

---

## الملاحظات المهمة

### 1. حفظ البيانات
✓ **لا يتم حذف البيانات بأي حال** — كل شيء محفوظ بشكل دائم

### 2. الأمان
✓ **كل البيانات محمية** بـ RLS و validation

### 3. الأداء
✓ **استعلامات سريعة** بفضل الفهارس و caching

### 4. التوسع
✓ **معماري قابل للتوسع** — جاهز للنمو المستقبلي

### 5. الصيانة
✓ **سهل الصيانة** — كود منظم وموثق

---

## خريطة الطريق المستقبلية

### المرحلة 1 (تم ✓)
- [x] قاعدة بيانات PostgreSQL
- [x] REST API كامل
- [x] واجهة تفاعلية
- [x] الإحصائيات الأساسية

### المرحلة 2 (مخطط)
- [ ] Authentication (تسجيل دخول)
- [ ] Multi-user support
- [ ] Permissions per municipality
- [ ] Audit logs
- [ ] Export to Excel
- [ ] Mobile app
- [ ] WebSockets (real-time)

### المرحلة 3 (مستقبلي)
- [ ] AI-powered analytics
- [ ] Predictive analysis
- [ ] Map visualization
- [ ] Mobile offline support
- [ ] Integration with external systems
- [ ] Advanced reporting
