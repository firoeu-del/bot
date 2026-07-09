# راه‌اندازی dietie روی Telegram Webhook + Cloudflare Workers + D1

این راهنما برای حالتی است که فایل‌ها را در GitHub آپلود می‌کنی و Cloudflare از روی GitHub deploy می‌کند.

---

## 1) ساخت بات تلگرام

1. در تلگرام برو به `@BotFather`.
2. دستور `/newbot` را بزن.
3. اسم بده: `dietie`.
4. یوزرنیم بده، مثلاً `dietie_yourname_bot`.
5. BotFather یک Token می‌دهد. این را جایی امن نگه دار.

توکن را داخل GitHub نگذار.

---

## 2) ساخت GitHub repo و آپلود فایل‌ها

1. در GitHub یک repo جدید بساز، مثلاً:

```text
dietie-telegram-bot
```

2. فایل zip پروژه را Extract کن.
3. محتویات پوشه را آپلود کن، نه خود zip را.
4. در ریشه repo باید این‌ها را ببینی:

```text
src/
migrations/
package.json
wrangler.toml
tsconfig.json
README.md
SETUP_FA.md
```

---

## 3) ساخت D1 Database در Cloudflare

1. وارد Cloudflare Dashboard شو.
2. از منو برو به:

```text
Workers & Pages → D1 SQL Database
```

3. یک Database بساز با اسم دقیق:

```text
dietie_bot_db
```

4. بعد از ساخته شدن، Database ID را کپی کن.
5. برو GitHub و فایل زیر را باز کن:

```text
wrangler.toml
```

6. مقدار زیر را پیدا کن:

```toml
database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"
```

7. به جای آن، Database ID واقعی را بگذار و Commit کن.

---

## 4) ساخت جدول‌های دیتابیس

داخل Cloudflare همان D1 database را باز کن و قسمت Console / Query را پیدا کن.

محتوای فایل زیر را کپی کن:

```text
migrations/0001_initial.sql
```

بعد داخل D1 Console اجرا کن.

اگر جدول‌ها ساخته شدند، این مرحله تمام است.

---

## 5) اتصال GitHub repo به Cloudflare Worker

1. در Cloudflare برو به:

```text
Workers & Pages → Create application
```

2. گزینه Import a repository را انتخاب کن.
3. GitHub را وصل کن.
4. repo پروژه را انتخاب کن.
5. تنظیمات build:

```text
Project name: dietie-telegram-bot
Root directory: /
Build command: npm install
Deploy command: npx wrangler deploy
```

6. Save and Deploy را بزن.

بعد از deploy، یک آدرس شبیه این می‌گیری:

```text
https://dietie-telegram-bot.YOUR-SUBDOMAIN.workers.dev
```

این آدرس را نگه دار.

---

## 6) گذاشتن Secretها در Cloudflare

بعد از ساخت Worker، برو به:

```text
Worker → Settings → Variables and Secrets
```

دو Secret بساز:

```text
BOT_TOKEN
```

مقدارش همان توکن BotFather است.

```text
WEBHOOK_SECRET
```

یک متن طولانی ساده و امن بگذار، مثلاً:

```text
dietie-secret-CHANGE-THIS-123456789
```

همین مقدار را برای مرحله webhook لازم داری.

---

## 7) ثبت Webhook تلگرام

این لینک را در مرورگر باز کن. فقط مقدارها را عوض کن:

```text
https://api.telegram.org/botBOT_TOKEN/setWebhook?url=WORKER_URL/telegram&secret_token=WEBHOOK_SECRET
```

مثال:

```text
https://api.telegram.org/bot123456:ABC/setWebhook?url=https://dietie-telegram-bot.example.workers.dev/telegram&secret_token=dietie-secret-CHANGE-THIS-123456789
```

اگر جواب `ok: true` دیدی، webhook فعال شده.

برای چک کردن وضعیت webhook:

```text
https://api.telegram.org/botBOT_TOKEN/getWebhookInfo
```

---

## 8) تست بات

در تلگرام وارد باتت شو و بزن:

```text
/start
```

بات باید مرحله‌به‌مرحله سوال بپرسد و در آخر برنامه غذایی بدهد.

---

## خطاهای رایج

### خطا: D1 binding not found

در `wrangler.toml` مقدار `database_id` را درست جایگزین نکردی یا database را نساختی.

### بات جواب نمی‌دهد

این‌ها را چک کن:

- webhook درست ثبت شده باشد.
- BOT_TOKEN در Cloudflare Secret درست باشد.
- WEBHOOK_SECRET در Cloudflare با secret_token لینک webhook یکی باشد.
- آدرس webhook آخرش `/telegram` داشته باشد.

### جدول وجود ندارد

SQL فایل `migrations/0001_initial.sql` را داخل D1 Console اجرا نکردی.

---

## دستورهای بات

```text
/start   شروع
/new     برنامه جدید
/plan    ساخت برنامه با پروفایل ذخیره‌شده
/profile دیدن پروفایل
/reset   پاک کردن اطلاعات
/help    راهنما
```
