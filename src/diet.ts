import { activityLabel, calculateDiet, goalLabel } from "./calculator";
import type { DietResult, Profile } from "./types";

function portions(calories: number) {
  const factor = calories / 2100;
  return {
    egg: calories < 1700 ? 1 : 2,
    bread: Math.max(1, Math.round(1.5 * factor)),
    rice: Math.max(5, Math.round(10 * factor)),
    chicken: Math.max(100, Math.round(150 * factor / 10) * 10),
    yogurt: Math.max(150, Math.round(220 * factor / 10) * 10),
    nuts: calories < 1800 ? 10 : 20,
    potato: Math.max(120, Math.round(220 * factor / 10) * 10)
  };
}

function medicalNote(profile: Profile): string {
  const r = (profile.restrictions || "").trim();
  if (!r || r === "ندارم") return "";
  return `\n\n⚠️ محدودیت/توضیحی که ثبت کردی: ${escapeHtml(r)}\nاگر بیماری، دارو، دیابت، مشکل کلیه، بارداری یا حساسیت جدی داری، این برنامه باید با متخصص تغذیه/پزشک چک شود.`;
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function makePlan(profile: Profile): { result: DietResult; text: string } {
  const result = calculateDiet(profile);
  const p = portions(result.targetCalories);

  const mealCount = profile.meals;
  const snacks = mealCount >= 5
    ? `\n🍌 <b>میان‌وعده ۲</b>\nیک عدد میوه + ${p.nuts} گرم مغزها یا یک لیوان شیر کم‌چرب`
    : "";

  const dinner = profile.goal === "lose"
    ? `سالاد حجیم + ${Math.round(p.chicken * 0.8)} گرم مرغ/ماهی/تن بدون روغن + ${Math.round(p.potato * 0.7)} گرم سیب‌زمینی یا نان سبوس‌دار`
    : `${Math.round(p.chicken * 0.9)} گرم مرغ/ماهی/گوشت کم‌چرب + ${p.potato} گرم سیب‌زمینی/نان/برنج + سبزیجات`;

  const text = `🥗 <b>برنامه dietie آماده شد</b>

👤 <b>خلاصه اطلاعات</b>
هدف: ${goalLabel(profile.goal)}
سن: ${profile.age} | قد: ${profile.heightCm} cm | وزن: ${profile.weightKg} kg
فعالیت: ${activityLabel(profile.activity)} | تعداد وعده: ${profile.meals}

📊 <b>محاسبات</b>
BMI: ${result.bmi}
BMR: ${result.bmr} kcal
TDEE: ${result.tdee} kcal
کالری هدف روزانه: <b>${result.targetCalories} kcal</b>

🍗 <b>درشت‌مغذی‌ها</b>
پروتئین: ${result.proteinG} گرم
کربوهیدرات: ${result.carbsG} گرم
چربی: ${result.fatG} گرم

🍳 <b>صبحانه</b>
${p.egg} عدد تخم‌مرغ + ${p.bread} کف دست نان سبوس‌دار + پنیر/ماست یونانی + خیار و گوجه

🍎 <b>میان‌وعده ۱</b>
${p.yogurt} گرم ماست یونانی یا شیر کم‌چرب + یک عدد میوه

🍛 <b>ناهار</b>
${p.chicken} گرم مرغ/ماهی/گوشت کم‌چرب + ${p.rice} قاشق غذاخوری برنج پخته + سالاد بزرگ + یک قاشق چای‌خوری روغن زیتون

🌙 <b>شام</b>
${dinner}${snacks}

💧 <b>نکته‌های ساده</b>
• آب کافی بخور.
• سبزیجات را در ناهار و شام زیاد کن.
• اگر هدفت کاهش وزن است، نوشیدنی شیرین و تنقلات پرکالری را حذف کن.
• وزن را هفته‌ای ۱ بار، صبح ناشتا ثبت کن.${medicalNote(profile)}

برای ساخت برنامه جدید بزن /new
برای دیدن پروفایل بزن /profile`;

  return { result, text };
}
