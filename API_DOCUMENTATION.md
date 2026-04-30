# API Documentation — لوحة متابعة النظافة

## الملخص العام

API RESTful لإدارة التدخلات البيئية في بلديات صفاقس. يوفر عمليات CRUD كاملة مع الإحصائيات المتقدمة.

## معلومات الخادم

- **URL الأساسي:** `http://localhost:3000` (محلي) أو `https://your-domain.com` (الإنتاج)
- **الإصدار:** 1.0.0
- **الترميز:** JSON

## الالتزامات العامة

### أكواد الحالة

- `200` - نجاح العملية
- `201` - تم الإنشاء بنجاح
- `400` - خطأ في الطلب (بيانات غير صحيحة)
- `404` - المورد غير موجود
- `500` - خطأ في الخادم

### رؤوس الطلب

```
Content-Type: application/json
```

### صيغة الرد

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

## المسارات (Endpoints)

### 1. جلب جميع التدخلات

```http
GET /api/interventions
```

**المعاملات (Query Parameters):**

| المعامل | النوع | الوصف | مثال |
|--------|------|-------|------|
| `date` | string | تصفية حسب التاريخ (YYYY-MM-DD) | `2026-04-21` |
| `municipalite` | string | تصفية حسب اسم البلدية | `صفاقس` |

**مثال طلب:**

```bash
GET /api/interventions?date=2026-04-21&municipalite=صفاقس
```

**مثال الرد (200 OK):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-04-21",
    "municipalite": "صفاقس",
    "quantite_ton": 170,
    "metre_lineaire": 1000,
    "type_intervention": "كنس يدوي / رفع فضلات",
    "lieux": "شارع البيئة",
    "ressources_humaines": "12 عامل",
    "equipements": "شاحنة / جرار",
    "created_at": "2026-04-21T09:30:00Z",
    "updated_at": "2026-04-21T09:30:00Z"
  }
]
```

---

### 2. جلب التاريخ المتاحة

```http
GET /api/interventions/dates
```

**مثال الرد:**

```json
[
  "2026-04-21",
  "2026-04-22",
  "2026-04-23",
  "2026-04-24"
]
```

---

### 3. إنشاء تدخل جديد

```http
POST /api/interventions
```

**الحقول المطلوبة:**

| الحقل | النوع | الوصف |
|------|------|-------|
| `municipalite` | string | اسم البلدية (إلزامي) |
| `quantite_ton` | number | الكمية بالطن ≥ 0 (إلزامي) |
| `type_intervention` | string | نوع التدخل (إلزامي) |
| `lieux` | string | أماكن التدخل (إلزامي) |

**الحقول الاختيارية:**

| الحقل | النوع | القيمة الافتراضية |
|------|------|-------------------|
| `date` | string (YYYY-MM-DD) | التاريخ الحالي |
| `metre_lineaire` | number | 0 |
| `ressources_humaines` | string | "أعوان البلدية" |
| `equipements` | string | "—" |

**مثال طلب:**

```bash
curl -X POST http://localhost:3000/api/interventions \
  -H "Content-Type: application/json" \
  -d '{
    "municipalite": "صفاقس",
    "quantite_ton": 200,
    "metre_lineaire": 1500,
    "type_intervention": "معالجة نقاط سوداء / كنس الأتربة",
    "lieux": "طريق العين / سيدي منصور",
    "ressources_humaines": "51 عون",
    "equipements": "شاحنة ثقيلة"
  }'
```

**مثال الرد (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "date": "2026-04-21",
  "municipalite": "صفاقس",
  "quantite_ton": 200,
  "metre_lineaire": 1500,
  "type_intervention": "معالجة نقاط سوداء / كنس الأتربة",
  "lieux": "طريق العين / سيدي منصور",
  "ressources_humaines": "51 عون",
  "equipements": "شاحنة ثقيلة",
  "created_at": "2026-04-21T10:00:00Z",
  "updated_at": "2026-04-21T10:00:00Z"
}
```

**رسائل الخطأ:**

```json
{
  "error": "Missing required fields"
}
```

---

### 4. الإحصائيات العامة

```http
GET /api/stats
```

**مثال الرد:**

```json
{
  "totalTonnage": 4523.5,
  "totalLinearMeters": 45000,
  "activeMunicipalities": 23,
  "interventionDays": 8,
  "averageDailyTonnage": 565.4
}
```

---

### 5. الإحصائيات حسب البلدية

```http
GET /api/stats/by-municipality
```

**المعاملات:**

| المعامل | النوع | الوصف |
|--------|------|-------|
| `date` | string | تصفية حسب يوم معين |

**مثال الرد:**

```json
[
  {
    "municipalite": "صفاقس",
    "quantite_ton": 1200.5,
    "metre_lineaire": 5000,
    "days": 5,
    "count": 12
  },
  {
    "municipalite": "المحرس",
    "quantite_ton": 950.0,
    "metre_lineaire": 3000,
    "days": 3,
    "count": 8
  }
]
```

**الحقول:**

- `municipalite`: اسم البلدية
- `quantite_ton`: إجمالي الكمية
- `metre_lineaire`: إجمالي المتر الخطي
- `days`: عدد الأيام النشطة
- `count`: عدد التدخلات

---

### 6. الإحصائيات حسب التاريخ

```http
GET /api/stats/by-date
```

**مثال الرد:**

```json
[
  {
    "date": "2026-04-21",
    "tonnage": 456.5
  },
  {
    "date": "2026-04-22",
    "tonnage": 523.0
  }
]
```

---

### 7. فحص صحة الخادم

```http
GET /api/health
```

**مثال الرد:**

```json
{
  "status": "ok",
  "timestamp": "2026-04-21T10:30:00Z"
}
```

---

## أمثلة عملية

### Python

```python
import requests
import json

BASE_URL = "http://localhost:3000/api"

# جلب جميع التدخلات
response = requests.get(f"{BASE_URL}/interventions")
interventions = response.json()

# إنشاء تدخل جديد
new_intervention = {
    "municipalite": "صفاقس",
    "quantite_ton": 175,
    "metre_lineaire": 800,
    "type_intervention": "كنس يدوي",
    "lieux": "شارع البيئة"
}
response = requests.post(
    f"{BASE_URL}/interventions",
    json=new_intervention
)
print(response.json())

# الحصول على الإحصائيات
stats = requests.get(f"{BASE_URL}/stats").json()
print(f"Total tonnage: {stats['totalTonnage']}")
```

### JavaScript

```javascript
const API_URL = 'http://localhost:3000/api';

// جلب جميع التدخلات
async function getInterventions() {
  const response = await fetch(`${API_URL}/interventions`);
  return await response.json();
}

// إنشاء تدخل جديد
async function createIntervention(data) {
  const response = await fetch(`${API_URL}/interventions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await response.json();
}

// الإحصائيات
async function getStats() {
  const response = await fetch(`${API_URL}/stats`);
  return await response.json();
}
```

### cURL

```bash
# جلب البيانات
curl -X GET "http://localhost:3000/api/interventions?date=2026-04-21"

# إنشاء تدخل
curl -X POST http://localhost:3000/api/interventions \
  -H "Content-Type: application/json" \
  -d '{"municipalite":"صفاقس","quantite_ton":100,"type_intervention":"كنس","lieux":"شارع البيئة"}'

# الإحصائيات
curl -X GET "http://localhost:3000/api/stats"
```

---

## هياكل البيانات

### Intervention Object

```typescript
interface Intervention {
  id: string;                 // UUID
  date: string;              // YYYY-MM-DD
  municipalite: string;
  quantite_ton: number;
  metre_lineaire: number;
  type_intervention: string;
  lieux: string;
  ressources_humaines?: string;
  equipements?: string;
  created_at: string;        // ISO 8601
  updated_at: string;        // ISO 8601
}
```

### Statistics Object

```typescript
interface Statistics {
  totalTonnage: number;
  totalLinearMeters: number;
  activeMunicipalities: number;
  interventionDays: number;
  averageDailyTonnage: number;
}
```

---

## معالجة الأخطاء

### أمثلة على رسائل الخطأ

**400 Bad Request:**
```json
{
  "error": "Missing required fields"
}
```

**400 Invalid Data:**
```json
{
  "error": "Invalid tonnage"
}
```

**500 Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## معايير التطوير

### تجنب الأخطاء الشائعة

1. **التاريخ يجب أن يكون بصيغة YYYY-MM-DD**
2. **الكمية يجب أن تكون رقم موجب > 0**
3. **جميع الحقول المطلوبة يجب ملؤها**
4. **التاريخ يُعين تلقائياً من النظام إن لم يُحدد**

### الأداء

- استخدم الفلاتر (date, municipalite) للحد من حجم البيانات
- لا تصلب الحد من عدد السجلات (يُعاد تحديثه ديناميكياً)

---

## الملاحظات الأمنية

- جميع البيانات محمية برسالة تأكيد البيانات
- لا يمكن تعديل أو حذف البيانات المُدخلة
- جميع الطلبات مُسجلة على خادم Supabase
