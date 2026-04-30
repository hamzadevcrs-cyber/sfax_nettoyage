# دليل النشر (Deployment Guide)

## المقدمة

يشرح هذا الدليل كيفية نشر تطبيق لوحة متابعة النظافة على خوادم الإنتاج المختلفة.

---

## 1. النشر المحلي (Local Development)

### المتطلبات

- Node.js v18+
- npm أو yarn
- حساب Supabase نشط

### الخطوات

```bash
# 1. نسخ المشروع
git clone <repo-url>
cd nettoyage-dashboard

# 2. تثبيت الاعتماديات
npm install

# 3. إعداد متغيرات البيئة
# عدّل ملف .env بالبيانات الصحيحة
nano .env

# 4. بناء المشروع
npm run build

# 5. تشغيل الخادم
node server.js

# 6. الوصول للتطبيق
# افتح المتصفح على: http://localhost:3000
```

---

## 2. النشر على Vercel (الواجهة الأمامية فقط)

### الخطوات

#### أ. إنشاء repository على GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-user/nettoyage-dashboard.git
git push -u origin main
```

#### ب. نشر الواجهة على Vercel

1. اذهب إلى https://vercel.com
2. اختر "New Project"
3. استورد مستودع GitHub الخاص بك
4. في الإعدادات:
   - **Build Command:** (لا توجد - ملفات ثابتة)
   - **Output Directory:** `public`
5. أضف متغيرات البيئة
6. انقر "Deploy"

---

## 3. النشر على Render (الخادم كامل)

### الخطوات

#### أ. إعداد المشروع

```bash
# تأكد من وجود ملف package.json صحيح
# تأكد من وجود ملف .env.example
```

#### ب. نشر على Render

1. اذهب إلى https://render.com
2. اختر "New +" > "Web Service"
3. استورد مستودع GitHub
4. في الإعدادات:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** تحديد الخطة المناسبة
5. أضف متغيرات البيئة:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   PORT=3000
   ```
6. انقر "Create Web Service"

---

## 4. النشر على Heroku

### المتطلبات

- Heroku CLI مثبت
- حساب Heroku نشط

### الخطوات

```bash
# 1. تسجيل الدخول
heroku login

# 2. إنشاء تطبيق
heroku create nettoyage-dashboard

# 3. ضبط متغيرات البيئة
heroku config:set VITE_SUPABASE_URL="your-url"
heroku config:set VITE_SUPABASE_ANON_KEY="your-key"

# 4. نشر الكود
git push heroku main

# 5. عرض السجلات
heroku logs --tail

# 6. الوصول للتطبيق
heroku open
```

---

## 5. النشر على Docker

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# نسخ package.json
COPY package*.json ./

# تثبيت الاعتماديات
RUN npm install --only=production

# نسخ الملفات
COPY . .

# تعيين المنفذ
EXPOSE 3000

# تشغيل الخادم
CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
      VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY}
      PORT: 3000
    volumes:
      - ./public:/app/public:ro
```

### التشغيل

```bash
# بناء الصورة
docker build -t nettoyage-dashboard .

# تشغيل الحاوية
docker run -p 3000:3000 \
  -e VITE_SUPABASE_URL="..." \
  -e VITE_SUPABASE_ANON_KEY="..." \
  nettoyage-dashboard

# أو استخدم docker-compose
docker-compose up
```

---

## 6. النشر على خادم Linux (VPS)

### المتطلبات

- خادم Linux (Ubuntu 20.04+)
- ssh access
- Node.js مثبت

### الخطوات

#### أ. الاتصال بالخادم

```bash
ssh user@your-server-ip
```

#### ب. تثبيت Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### ج. نسخ المشروع

```bash
cd /var/www
git clone <repo-url> nettoyage-dashboard
cd nettoyage-dashboard
npm install
```

#### د. إعداد متغيرات البيئة

```bash
sudo nano .env
# أضف البيانات الصحيحة
```

#### هـ. إعداد PM2 (مدير العمليات)

```bash
sudo npm install -g pm2

# تشغيل التطبيق
pm2 start server.js --name "nettoyage-dashboard"

# حفظ الإعدادات
pm2 save

# إعادة التشغيل التلقائي عند إعادة تمهيد الخادم
pm2 startup
```

#### و. إعداد Nginx (كخادم وكيل)

```bash
sudo apt-get install nginx

# إنشاء ملف config
sudo nano /etc/nginx/sites-available/nettoyage-dashboard
```

**محتوى الملف:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/nettoyage-dashboard \
  /etc/nginx/sites-enabled/

# اختبار الإعدادات
sudo nginx -t

# إعادة تشغيل Nginx
sudo systemctl restart nginx
```

#### ز. SSL مع Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 7. النشر على AWS

### EC2 Instance

#### الخطوات

1. أنشئ instance EC2 (Ubuntu 20.04)
2. حمّل key pair
3. اتصل عبر SSH
4. اتبع نفس خطوات VPS أعلاه

### RDS (استبدال Supabase)

1. أنشئ instance RDS PostgreSQL
2. حدّث متغيرات البيئة
3. أعد تشغيل الخادم

---

## 8. النشر على DigitalOcean

### App Platform

1. اذهب إلى DigitalOcean
2. اختر "App Platform"
3. استورد مستودع GitHub
4. اختر البرنامج الأساسي
5. أضف متغيرات البيئة
6. انقر "Deploy"

### Droplet

اتبع نفس خطوات VPS Linux أعلاه

---

## 9. متطلبات ما قبل النشر

### قائمة التحقق

- [ ] تم اختبار جميع الميزات محلياً
- [ ] جميع الأخطاء تم إصلاحها
- [ ] تم تحديث ملف `.env.example`
- [ ] تم إضافة ملف `.gitignore` (لا تنشر البيانات الحساسة)
- [ ] تم كتابة README.md
- [ ] تم اختبار API على البيانات الحقيقية
- [ ] تم إعداد قاعدة البيانات (migrations تم تطبيقها)
- [ ] تم اختبار الأداء تحت الحمل

---

## 10. المراقبة والصيانة

### السجلات

```bash
# Heroku
heroku logs --tail

# PM2
pm2 logs

# Docker
docker logs <container-id>
```

### النسخ الاحتياطية

```bash
# Supabase - تلقائي (يومي)
# ويمكنك تحميل نسخة يدوياً من لوحة التحكم

# قاعدة البيانات المحلية
pg_dump -U user -h localhost dbname > backup.sql
```

### التحديثات

```bash
# تحديث الاعتماديات
npm update

# تحديث Node.js
nvm install node

# إعادة تشغيل الخادم
pm2 restart all
```

---

## 11. استكشاف الأخطاء

### الخادم لا يستجيب

```bash
# تحقق من حالة الخادم
curl http://localhost:3000/api/health

# تحقق من السجلات
pm2 logs
```

### مشاكل قاعدة البيانات

```bash
# اختبر الاتصال
psql -U user -h host -d database

# تحقق من migrations
# من لوحة تحكم Supabase
```

### مشاكل الأداء

```bash
# استخدم nginx amplify للمراقبة
# أضف caching headers
# استخدم CDN للملفات الثابتة
```

---

## 12. جدول المقارنة

| المنصة | السعر | التعقيد | التحكم |
|--------|------|--------|--------|
| Vercel | مجاني | منخفض | منخفض |
| Render | مجاني | منخفض | متوسط |
| Heroku | مجاني* | منخفض | متوسط |
| VPS | $5-20 | عالي | عالي |
| AWS | الدفع بالاستخدام | عالي | عالي |
| Docker | مجاني | عالي | عالي |

*Heroku أوقف الخطة المجانية في نوفمبر 2022

---

## الدعم

للمساعدة في النشر، تواصل مع:
- مهندسي DevOps
- فريق الدعم الفني
- قسم البنية التحتية
