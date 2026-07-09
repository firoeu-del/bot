# dietie Telegram Bot

بات تلگرامی dietie با Cloudflare Workers + Telegram Webhook + D1.

## امکانات

- دریافت مرحله‌به‌مرحله اطلاعات کاربر
- محاسبه BMI، BMR، TDEE، کالری هدف و ماکروها
- ساخت برنامه غذایی روزانه فارسی
- ذخیره پروفایل و برنامه‌ها در D1
- دستورهای `/start`, `/new`, `/plan`, `/profile`, `/reset`, `/help`
- اجرای serverless روی Cloudflare Workers

## فایل‌های مهم

```text
src/index.ts                  منطق اصلی بات و webhook
src/calculator.ts             محاسبات رژیم
src/diet.ts                   ساخت متن برنامه غذایی
src/db.ts                     ارتباط با D1
src/telegram.ts               ارسال پیام به Telegram API
src/keyboards.ts              دکمه‌های تلگرام
migrations/0001_initial.sql   ساخت جدول‌های D1
wrangler.toml                 تنظیمات Cloudflare Worker و D1
```

## نکته امنیتی

توکن بات تلگرام را داخل فایل‌ها نگذار. توکن باید در Cloudflare به شکل Secret ذخیره شود:

```text
BOT_TOKEN
WEBHOOK_SECRET
```
